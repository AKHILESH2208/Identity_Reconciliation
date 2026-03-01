import { Router, Request, Response } from 'express';
import prisma from '../db';

const router = Router();

interface AddContactRequest {
  email?: string;
  phoneNumber?: string;
}

router.post('/add-contact', async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber }: AddContactRequest = req.body;

    // Validation
    if (!email && !phoneNumber) {
      return res.status(400).json({ 
        error: 'At least one of email or phoneNumber must be provided' 
      });
    }

    // Create a new primary contact for testing purposes
    const contact = await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: 'primary',
        linkedId: null,
      },
    });

    res.status(201).json({ 
      message: 'Contact added successfully',
      contact 
    });
  } catch (error) {
    console.error('Error in /add-contact endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all contacts for debugging
router.get('/contacts', async (req: Request, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all contacts (for testing)
router.delete('/contacts', async (req: Request, res: Response) => {
  try {
    await prisma.contact.deleteMany({});
    res.status(200).json({ message: 'All contacts deleted' });
  } catch (error) {
    console.error('Error deleting contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
