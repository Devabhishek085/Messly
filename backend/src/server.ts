import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { seedDatabase } from './seed/seedData.js';
import publicMenuRoutes from './routes/publicMenu.js';
import publicAnalyticsRoutes from './routes/publicAnalytics.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: '*', // Allow mobile & admin apps
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'messly-backend', timestamp: new Date().toISOString() });
});

// Register routes
app.use('/api/menu', publicMenuRoutes);
app.use('/api/analytics', publicAnalyticsRoutes);
app.use('/api/admin', adminRoutes);

// Generic error handler (does not leak sensitive error stacks to client)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error. Please try again later.' });
});

// Start Server
const startServer = async () => {
  await connectDB();
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Messly Backend API running on http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
};

startServer();
