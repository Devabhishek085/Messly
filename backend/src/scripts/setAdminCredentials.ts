import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';

dotenv.config();

export const setAdminCredentials = async (newUsername?: string, newPassword?: string) => {
  const username = (newUsername || process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
  const password = newPassword || process.env.ADMIN_PASSWORD || 'admin123';

  if (!username || !password) {
    console.error('Error: Both username and password must be provided.');
    process.exit(1);
  }

  await connectDB();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Clear old admin entries if username changed or update existing
    await Admin.deleteMany({});
    
    const admin = await Admin.create({
      username,
      passwordHash,
      role: 'admin'
    });

    console.log(`✓ Admin credentials successfully updated! Username: "${admin.username}"`);
  } catch (error) {
    console.error('Failed to set admin credentials:', error);
  } finally {
    await closeDB();
  }
};

if (process.argv[1] && process.argv[1].endsWith('setAdminCredentials.ts')) {
  const args = process.argv.slice(2);
  const argUser = args[0];
  const argPass = args[1];

  setAdminCredentials(argUser, argPass).then(() => process.exit(0));
}
