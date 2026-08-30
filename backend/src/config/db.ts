import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import path from 'path';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  // Always ensure .env is loaded inside connectDB
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/messly';
  console.log(`[MongoDB] Attempting connection to: ${uri.replace(/:([^@]+)@/, ':****@')}`);
  
  try {
    // Attempt connection with 10s timeout for cloud Atlas connections
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected successfully to database!`);
  } catch (err: any) {
    console.warn(`[MongoDB] Connection failed:`, err.message || err);
    console.warn('[MongoDB] Falling back to MongoDB Memory Server...');
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const memUri = mongoMemoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[MongoDB Memory Server] Connected successfully at ${memUri}`);
    } catch (memErr) {
      console.error('[MongoDB] Failed to start MongoMemoryServer:', memErr);
      process.exit(1);
    }
  }
};

export const closeDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
