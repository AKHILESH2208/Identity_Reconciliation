import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import identifyRouter from './routes/identify';
import testRouter from './routes/test';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Bitespeed Identity Reconciliation Service',
    endpoints: {
      identify: 'POST /identify - Reconcile customer identity',
      addContact: 'POST /add-contact - Add test contact data'
    }
  });
});

app.use('/', identifyRouter);
app.use('/', testRouter);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
