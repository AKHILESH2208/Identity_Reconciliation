import { Router, Request, Response } from 'express';
import { identifyContact } from '../services/identityService';

const router = Router();

interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber }: IdentifyRequest = req.body;

    // Validation: at least one of email or phoneNumber must be provided
    if (!email && !phoneNumber) {
      return res.status(400).json({ 
        error: 'At least one of email or phoneNumber must be provided' 
      });
    }

    const result = await identifyContact(email, phoneNumber);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /identify endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
