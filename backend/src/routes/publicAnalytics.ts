import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { DeviceEvent } from '../models/DeviceEvent.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute
  message: { error: 'Too many analytics events submitted. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const eventSchema = z.object({
  deviceId: z.string().min(5),
  eventType: z.enum(['app_open', 'menu_view', 'reminder_enabled', 'notification_permission_granted']),
  meta: z.record(z.any()).optional(),
});

router.post('/event', analyticsLimiter, validateRequest(eventSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId, eventType, meta } = req.body;

    await DeviceEvent.create({
      deviceId,
      eventType,
      meta: meta || {},
      createdAt: new Date(),
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Error recording device event:', err);
    res.status(500).json({ error: 'Failed to record event' });
  }
});

export default router;
