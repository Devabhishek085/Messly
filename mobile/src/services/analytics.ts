import { getOrCreateDeviceId } from './storage';

const PROD_URL = 'https://messly.onrender.com/api';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || PROD_URL;

export type EventType = 'app_open' | 'menu_view' | 'reminder_enabled' | 'notification_permission_granted';

export const logAnalyticsEvent = async (eventType: EventType, meta?: Record<string, any>): Promise<void> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    
    // Fire-and-forget request to server
    fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        eventType,
        meta: meta || {},
      }),
    }).catch(err => {
      // Quietly ignore analytics errors when offline
    });
  } catch (err) {
    // Ignore error
  }
};
