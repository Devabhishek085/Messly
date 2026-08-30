import { Router, Request, Response } from 'express';
import { resolveMenuForDate, getTodayDateStr, getDayOfWeekFromDateStr } from '../services/menuResolver.js';
import { MealTiming } from '../models/MealTiming.js';
import { WeeklyMenu } from '../models/WeeklyMenu.js';
import { SpecialMenu } from '../models/SpecialMenu.js';

const router = Router();

// GET /api/menu/today
router.get('/today', async (req: Request, res: Response): Promise<void> => {
  try {
    const todayStr = getTodayDateStr();
    const resolved = await resolveMenuForDate(todayStr);
    res.json(resolved);
  } catch (err) {
    console.error('Error fetching today menu:', err);
    res.status(500).json({ error: 'Failed to fetch today menu' });
  }
});

// GET /api/menu/week
router.get('/week', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get current Monday date
    const today = new Date();
    const day = today.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diffToMon));

    const weekPromises = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const dayStr = String(current.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      weekPromises.push(resolveMenuForDate(dateStr));
    }

    const weekMenus = await Promise.all(weekPromises);
    res.json(weekMenus);
  } catch (err) {
    console.error('Error fetching week menu:', err);
    res.status(500).json({ error: 'Failed to fetch weekly menu' });
  }
});

// GET /api/menu/:date (YYYY-MM-DD)
router.get('/date/:date', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
      return;
    }
    const resolved = await resolveMenuForDate(date);
    res.json(resolved);
  } catch (err) {
    console.error('Error fetching menu for date:', err);
    res.status(500).json({ error: 'Failed to fetch menu for specified date' });
  }
});

// GET /api/timings
router.get('/timings', async (req: Request, res: Response): Promise<void> => {
  try {
    const timings = await MealTiming.find().lean();
    
    // Format into clean key-value dictionary
    const formatted: Record<string, { startTime: string; endTime: string }> = {};
    const defaultTimings = {
      breakfast: { startTime: '08:00', endTime: '09:30' },
      lunch: { startTime: '12:30', endTime: '14:00' },
      snacks: { startTime: '17:00', endTime: '18:00' },
      dinner: { startTime: '20:00', endTime: '21:30' },
    };

    ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(key => {
      const item = timings.find(t => t.mealKey === key);
      formatted[key] = item 
        ? { startTime: item.startTime, endTime: item.endTime } 
        : defaultTimings[key as keyof typeof defaultTimings];
    });

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching timings:', err);
    res.status(500).json({ error: 'Failed to fetch meal timings' });
  }
});

export default router;
