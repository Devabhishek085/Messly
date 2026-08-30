import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { Admin } from '../models/Admin.js';
import { WeeklyMenu, DayOfWeek } from '../models/WeeklyMenu.js';
import { SpecialMenu } from '../models/SpecialMenu.js';
import { MealTiming, MealKey } from '../models/MealTiming.js';
import { DeviceEvent } from '../models/DeviceEvent.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per IP
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' }
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /api/admin/login
router.post('/login', loginLimiter, validateRequest(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });

    if (!admin) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'messly_secret_jwt_key_2026_kiet_hostel';
    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        username: admin.username,
        role: admin.role,
      }
    });
  } catch (err) {
    console.error('Error during admin login:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Zod Schema for updating weekly menu
const mealItemsSchema = z.object({
  items: z.array(z.string())
});

const weeklyMenuUpdateSchema = z.object({
  breakfast: mealItemsSchema.optional(),
  lunch: mealItemsSchema.optional(),
  snacks: mealItemsSchema.optional(),
  dinner: mealItemsSchema.optional(),
});

// PUT /api/admin/menu/:day (monday..sunday)
router.put('/menu/:day', authenticateJWT, validateRequest(weeklyMenuUpdateSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { day } = req.params;
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day.toLowerCase())) {
      res.status(400).json({ error: 'Invalid day of week.' });
      return;
    }

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const menu = await WeeklyMenu.findOneAndUpdate(
      { dayOfWeek: day.toLowerCase() },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({ success: true, menu });
  } catch (err) {
    console.error('Error updating weekly menu:', err);
    res.status(500).json({ error: 'Failed to update weekly menu' });
  }
});

// PUT /api/admin/menu/date/:date (YYYY-MM-DD special override)
router.put('/menu/date/:date', authenticateJWT, validateRequest(weeklyMenuUpdateSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
      return;
    }

    const updateData = req.body;
    updateData.updatedAt = new Date();

    const specialMenu = await SpecialMenu.findOneAndUpdate(
      { date },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json({ success: true, specialMenu });
  } catch (err) {
    console.error('Error updating special date override:', err);
    res.status(500).json({ error: 'Failed to update special date override' });
  }
});

// GET /api/admin/menu/overrides
router.get('/menu/overrides', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const overrides = await SpecialMenu.find().sort({ date: 1 }).lean();
    res.json(overrides);
  } catch (err) {
    console.error('Error fetching special date overrides:', err);
    res.status(500).json({ error: 'Failed to fetch overrides' });
  }
});

// DELETE /api/admin/menu/date/:date
router.delete('/menu/date/:date', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    await SpecialMenu.deleteOne({ date });
    res.json({ success: true, message: `Override for ${date} deleted.` });
  } catch (err) {
    console.error('Error deleting override:', err);
    res.status(500).json({ error: 'Failed to delete override' });
  }
});

// Zod Schema for updating meal timings
const timingItemSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm'),
});

const timingsUpdateSchema = z.object({
  breakfast: timingItemSchema.optional(),
  lunch: timingItemSchema.optional(),
  snacks: timingItemSchema.optional(),
  dinner: timingItemSchema.optional(),
});

// PUT /api/admin/timings
router.put('/timings', authenticateJWT, validateRequest(timingsUpdateSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const timingsData = req.body as Record<string, { startTime: string; endTime: string }>;

    const promises = Object.entries(timingsData).map(([mealKey, times]) => {
      return MealTiming.findOneAndUpdate(
        { mealKey },
        { startTime: times.startTime, endTime: times.endTime },
        { new: true, upsert: true }
      );
    });

    await Promise.all(promises);

    const updated = await MealTiming.find().lean();
    res.json({ success: true, timings: updated });
  } catch (err) {
    console.error('Error updating meal timings:', err);
    res.status(500).json({ error: 'Failed to update meal timings' });
  }
});

// GET /api/admin/analytics
router.get('/analytics', authenticateJWT, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregations
    const [
      totalUniqueDevicesResult,
      activeTodayResult,
      activeWeekResult,
      activeMonthResult,
      menuViewsTodayCount,
      remindersEnabledCountResult,
      mostViewedMealResult,
      mostViewedDayResult,
      trendDataResult
    ] = await Promise.all([
      // Total unique devices
      DeviceEvent.distinct('deviceId'),

      // Active today
      DeviceEvent.distinct('deviceId', { createdAt: { $gte: startOfToday } }),

      // Active week
      DeviceEvent.distinct('deviceId', { createdAt: { $gte: startOfWeek } }),

      // Active month
      DeviceEvent.distinct('deviceId', { createdAt: { $gte: startOfMonth } }),

      // Total menu views today
      DeviceEvent.countDocuments({ eventType: 'menu_view', createdAt: { $gte: startOfToday } }),

      // Distinct devices with reminder enabled
      DeviceEvent.distinct('deviceId', { eventType: 'reminder_enabled' }),

      // Most viewed meal
      DeviceEvent.aggregate([
        { $match: { eventType: 'menu_view', 'meta.meal': { $exists: true } } },
        { $group: { _id: '$meta.meal', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),

      // Most viewed day
      DeviceEvent.aggregate([
        { $match: { eventType: 'menu_view', 'meta.day': { $exists: true } } },
        { $group: { _id: '$meta.day', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),

      // 7-day daily active users trend
      DeviceEvent.aggregate([
        { $match: { createdAt: { $gte: startOfWeek } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              deviceId: '$deviceId'
            }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            activeCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    // Build 7-day complete trend array
    const trendMap = new Map<string, number>();
    trendDataResult.forEach(item => trendMap.set(item._id, item.activeCount));

    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      dailyTrend.push({
        date: dateStr,
        activeUsers: trendMap.get(dateStr) || 0
      });
    }

    res.json({
      totalUniqueDevices: totalUniqueDevicesResult.length,
      activeToday: activeTodayResult.length,
      activeThisWeek: activeWeekResult.length,
      activeThisMonth: activeMonthResult.length,
      menuViewsToday: menuViewsTodayCount,
      remindersEnabledCount: remindersEnabledCountResult.length,
      mostViewedMeal: mostViewedMealResult[0] ? mostViewedMealResult[0]._id : 'N/A',
      mostViewedDay: mostViewedDayResult[0] ? mostViewedDayResult[0]._id : 'N/A',
      dailyTrend,
    });
  } catch (err) {
    console.error('Error computing analytics:', err);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

export default router;
