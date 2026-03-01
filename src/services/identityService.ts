import prisma from '../db';

interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ConsolidatedContact {
  primaryContatctId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export async function identifyContact(
  email?: string,
  phoneNumber?: string
): Promise<{ contact: ConsolidatedContact }> {
  
  // Find all contacts matching the email or phoneNumber
  const matchingContacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : {},
        phoneNumber ? { phoneNumber } : {},
      ].filter(condition => Object.keys(condition).length > 0),
    },
    orderBy: { createdAt: 'asc' },
  });

  // If no matching contacts, create a new primary contact
  if (matchingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: 'primary',
        linkedId: null,
      },
    });

    return {
      contact: {
        primaryContatctId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }

  // Get all linked contacts (primary and all their secondaries)
  const allLinkedContacts = await getAllLinkedContacts(matchingContacts);
  
  // Check if we need to link two separate primary contacts
  const primaryContacts = allLinkedContacts.filter(c => c.linkPrecedence === 'primary');
  
  if (primaryContacts.length > 1) {
    // Multiple primary contacts found - need to merge them
    // Keep the oldest primary, turn others into secondary
    const oldestPrimary = primaryContacts[0]; // Already sorted by createdAt
    
    for (let i = 1; i < primaryContacts.length; i++) {
      const contactToUpdate = primaryContacts[i];
      await prisma.contact.update({
        where: { id: contactToUpdate.id },
        data: {
          linkedId: oldestPrimary.id,
          linkPrecedence: 'secondary',
          updatedAt: new Date(),
        },
      });
      
      // Update all contacts that were linked to this old primary
      await prisma.contact.updateMany({
        where: { linkedId: contactToUpdate.id },
        data: {
          linkedId: oldestPrimary.id,
          updatedAt: new Date(),
        },
      });
    }
    
    // Refresh the linked contacts after updates
    const refreshedContacts = await getAllLinkedContacts([oldestPrimary]);
    allLinkedContacts.length = 0;
    allLinkedContacts.push(...refreshedContacts);
  }

  // Check if we need to create a new secondary contact
  const primaryContact = allLinkedContacts.find(c => c.linkPrecedence === 'primary') || allLinkedContacts[0];
  const needsNewContact = shouldCreateNewContact(allLinkedContacts, email, phoneNumber);

  if (needsNewContact) {
    const newSecondaryContact = await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: 'secondary',
        linkedId: primaryContact.linkPrecedence === 'primary' ? primaryContact.id : primaryContact.linkedId,
      },
    });
    allLinkedContacts.push(newSecondaryContact as Contact);
  }

  // Build the consolidated response
  return buildConsolidatedResponse(allLinkedContacts);
}

async function getAllLinkedContacts(initialContacts: Contact[]): Promise<Contact[]> {
  const contactIds = new Set<number>();
  const allContacts: Contact[] = [];

  // Collect all unique contact IDs
  for (const contact of initialContacts) {
    contactIds.add(contact.id);
    if (contact.linkedId) {
      contactIds.add(contact.linkedId);
    }
  }

  // Find all contacts that are either:
  // 1. In our initial set
  // 2. Linked to any contact in our set (as primary)
  // 3. Have linkedId pointing to any contact in our set
  const linkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: Array.from(contactIds) } },
        { linkedId: { in: Array.from(contactIds) } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  // Add all primary contacts and their linked IDs to the set
  for (const contact of linkedContacts) {
    contactIds.add(contact.id);
    if (contact.linkedId) {
      contactIds.add(contact.linkedId);
    }
  }

  // Fetch all contacts one more time to ensure we have everything
  const finalContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: Array.from(contactIds) } },
        { linkedId: { in: Array.from(contactIds) } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  return finalContacts as Contact[];
}

function shouldCreateNewContact(
  existingContacts: Contact[],
  email?: string,
  phoneNumber?: string
): boolean {
  // Check if the exact combination already exists
  const exactMatch = existingContacts.some(contact => {
    const emailMatches = !email || contact.email === email;
    const phoneMatches = !phoneNumber || contact.phoneNumber === phoneNumber;
    return emailMatches && phoneMatches;
  });

  if (exactMatch) {
    return false;
  }

  // Check if both email and phone are provided and at least one is new
  if (email && phoneNumber) {
    const hasEmail = existingContacts.some(c => c.email === email);
    const hasPhone = existingContacts.some(c => c.phoneNumber === phoneNumber);
    
    // Create new contact if we have both values and at least one is new information
    return hasEmail || hasPhone;
  }

  return false;
}

function buildConsolidatedResponse(contacts: Contact[]): { contact: ConsolidatedContact } {
  // Find the primary contact
  const primaryContact = contacts.find(c => c.linkPrecedence === 'primary') || contacts[0];
  
  // Collect all unique emails and phone numbers
  const emailSet = new Set<string>();
  const phoneSet = new Set<string>();
  const secondaryIds: number[] = [];

  // Add primary contact data first
  if (primaryContact.email) emailSet.add(primaryContact.email);
  if (primaryContact.phoneNumber) phoneSet.add(primaryContact.phoneNumber);

  // Add secondary contact data
  for (const contact of contacts) {
    if (contact.id !== primaryContact.id) {
      if (contact.email) emailSet.add(contact.email);
      if (contact.phoneNumber) phoneSet.add(contact.phoneNumber);
      secondaryIds.push(contact.id);
    }
  }

  // Ensure primary contact's email and phone are first in arrays
  const emails: string[] = [];
  const phoneNumbers: string[] = [];

  if (primaryContact.email) emails.push(primaryContact.email);
  if (primaryContact.phoneNumber) phoneNumbers.push(primaryContact.phoneNumber);

  // Add remaining emails and phones
  emailSet.forEach(email => {
    if (email !== primaryContact.email) {
      emails.push(email);
    }
  });

  phoneSet.forEach(phone => {
    if (phone !== primaryContact.phoneNumber) {
      phoneNumbers.push(phone);
    }
  });

  return {
    contact: {
      primaryContatctId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryIds.sort((a, b) => a - b),
    },
  };
}
