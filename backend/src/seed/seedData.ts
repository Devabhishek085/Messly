import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, closeDB } from '../config/db.js';
import { Admin } from '../models/Admin.js';
import { MealTiming } from '../models/MealTiming.js';
import { WeeklyMenu } from '../models/WeeklyMenu.js';
import { DeviceEvent } from '../models/DeviceEvent.js';

dotenv.config();

const SEED_WEEKLY_MENU = [
  {
    dayOfWeek: 'monday',
    breakfast: { items: ["Veg Cutlet", "Boiled Egg", "Brown Bread with Butter", "Jam", "Sauce", "Tea/Milk"] },
    lunch: { items: ["Rajma", "Kundru/Aloo Beans (alt)", "Boondi Raita", "Roti", "Rice", "Salad", "Pickle"] },
    snacks: { items: ["Bread Pakoda/Burger (alt)", "Sauce", "Lemon Shikanji"] },
    dinner: { items: ["Matar Paneer/Kadhai Paneer (alt)", "Mix Veg", "Vegetable Pulao", "Roti", "Salad", "Pickle", "Custard"] }
  },
  {
    dayOfWeek: 'tuesday',
    breakfast: { items: ["Pav Bhaji", "Tea/Milk"] },
    lunch: { items: ["Kali Masoor/Mix Dal (alt)", "Seasonal Veg", "Jeera Rice", "Fruit Raita", "Roti", "Salad", "Pickle"] },
    snacks: { items: ["French Fries with Sauce", "Tea"] },
    dinner: { items: ["Puri", "Pindi Chole", "Petha", "Green Peas Pulao", "Salad", "Pickle"] }
  },
  {
    dayOfWeek: 'wednesday',
    breakfast: { items: ["Chana (onion-tomato-green chilly) & Halwa", "Poha with Besan Bhujia & Daliya (alt)", "Tea/Milk"] },
    lunch: { items: ["Arhar Dal (fry)", "Mix Veg", "Boondi Raita", "Roti", "Rice", "Salad", "Pickle"] },
    snacks: { items: ["Vada Pav/Veg Pasta (alt)", "Sauce", "Tea"] },
    dinner: { items: ["Udad Chana (fry)", "Bhindi/Veg Kofta (alt)", "Roti", "Fried Rice", "Salad", "Pickle", "Sponge Rasgulla"] }
  },
  {
    dayOfWeek: 'thursday',
    breakfast: { items: ["Stuffed Puri", "Aloo Sabji (Gravy)", "Pickle", "Tea/Milk"] },
    lunch: { items: ["Kadhi Pakoda", "Jeera Aloo", "Roti", "Rice", "Salad", "Pickle"] },
    snacks: { items: ["Mix Veg Pakodi with Green Chutney & Sauce", "Aloo Tikki with Matar/Green & Red Chutney (alt)", "Shikanji"] },
    dinner: { items: ["Kali Masoor/Lauki Chana Dal (alt)", "Arbi/Aloo-Soyabean (alt)", "Roti", "Veg Pulao", "Salad", "Pickle"] }
  },
  {
    dayOfWeek: 'friday',
    breakfast: { items: ["Cornflakes/Sprouts", "Boiled Egg", "Bread Roll", "Bread Butter", "Sauce", "Tea/Milk"] },
    lunch: { items: ["Kala Chana (gravy)", "Aloo Pyaz Bhujia", "Roti", "Jeera Rice", "Veg Raita", "Salad", "Pickle"] },
    snacks: { items: ["Samosa", "Chole", "Meethi Chatni", "Green Chutney", "Tea"] },
    dinner: { items: ["Shahi Paneer/Paneer 2 Pyaja (alt)", "Egg Curry", "Aloo-Shimla Mirch", "Jeera Rice", "Roti", "Salad", "Pickle", "Ice Cream"] }
  },
  {
    dayOfWeek: 'saturday',
    breakfast: { items: ["Aloo-Pyaz Parantha", "Pickle", "Plain Dahi", "Sauce", "Tea"] },
    lunch: { items: ["Veg Biryani/Tehri (Veg Pulao) (alt)", "Papad", "Green Chutney", "Salad", "Raita", "Pickle"] },
    snacks: { items: ["Fried Idli/Jave (alt)", "Sauce", "Tea"] },
    dinner: { items: ["Dal Panch-mel", "Mix Veg", "Jeera Rice", "Roti", "Salad", "Pickle"] }
  },
  {
    dayOfWeek: 'sunday',
    breakfast: { items: ["Idli Sambhar", "Plain Parantha with Aloo Tamatar Sabji (alt)", "Nariyal Chutney", "Tea"] },
    lunch: { items: ["Chole Bhature", "Fried Aloo", "Jeera Rice", "Boondi Raita", "Fried Mirchi", "Salad", "Pickle"] },
    snacks: { items: ["Aloo Sandwich/Bhelpuri (alt)", "Sauce", "Roohafza"] },
    dinner: { items: ["Dal Makhani", "Aloo Beans", "Roti", "Rice", "Salad", "Pickle"] }
  }
];

const SEED_TIMINGS = [
  { mealKey: 'breakfast', startTime: '08:00', endTime: '09:30' },
  { mealKey: 'lunch', startTime: '12:30', endTime: '14:00' },
  { mealKey: 'snacks', startTime: '17:00', endTime: '18:00' },
  { mealKey: 'dinner', startTime: '20:00', endTime: '21:30' },
];

export const seedDatabase = async (): Promise<void> => {
  console.log('Seeding Database...');

  // Seed Admin
  const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existingAdmin = await Admin.findOne({});
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await Admin.create({
      username: adminUsername,
      passwordHash,
      role: 'admin'
    });
    console.log(`✓ Created admin user: ${adminUsername}`);
  } else {
    console.log(`✓ Admin user exists: ${existingAdmin.username}`);
  }

  // Seed Timings
  for (const t of SEED_TIMINGS) {
    await MealTiming.findOneAndUpdate(
      { mealKey: t.mealKey },
      { startTime: t.startTime, endTime: t.endTime },
      { upsert: true, new: true }
    );
  }
  console.log('✓ Seeded default meal timings');

  // Seed Weekly Menu
  for (const m of SEED_WEEKLY_MENU) {
    await WeeklyMenu.findOneAndUpdate(
      { dayOfWeek: m.dayOfWeek },
      {
        breakfast: m.breakfast,
        lunch: m.lunch,
        snacks: m.snacks,
        dinner: m.dinner,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }
  console.log('✓ Seeded 7-day weekly mess menu for KIET Boys Hostel');

  // Seed sample telemetry events so analytics dashboard shows initial data
  const sampleDeviceIds = ['dev-kiet-001', 'dev-kiet-002', 'dev-kiet-003', 'dev-kiet-004', 'dev-kiet-005'];
  const eventCount = await DeviceEvent.countDocuments();
  if (eventCount === 0) {
    const events = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      for (const devId of sampleDeviceIds) {
        events.push({
          deviceId: devId,
          eventType: 'app_open',
          meta: {},
          createdAt: dayDate
        });
        events.push({
          deviceId: devId,
          eventType: 'menu_view',
          meta: { day: 'monday', meal: 'lunch' },
          createdAt: dayDate
        });
        if (i === 0) {
          events.push({
            deviceId: devId,
            eventType: 'reminder_enabled',
            meta: { meal: 'lunch', leadTime: 15 },
            createdAt: dayDate
          });
        }
      }
    }
    await DeviceEvent.insertMany(events);
    console.log('✓ Seeded initial anonymous telemetry events for analytics demonstration');
  }

  console.log('Seed completed successfully!');
};

if (process.argv[1] && process.argv[1].endsWith('seedData.ts')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await closeDB();
    process.exit(0);
  })();
}
