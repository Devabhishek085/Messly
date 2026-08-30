import { ResolvedMenu, MealTimingsMap } from '../types';
import {
  saveCachedTodayMenu,
  getCachedTodayMenu,
  saveCachedWeekMenu,
  getCachedWeekMenu,
  saveCachedTimings,
  getCachedTimings
} from './storage';

// API Base URL - uses environment variable EXPO_PUBLIC_API_URL if set, or defaults to localhost
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface FetchResult<T> {
  data: T;
  isOffline: boolean;
}

export const fetchTodayMenu = async (): Promise<FetchResult<ResolvedMenu>> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}/menu/today`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: ResolvedMenu = await res.json();
    await saveCachedTodayMenu(data);
    return { data, isOffline: false };
  } catch (err) {
    console.warn('[API] Today menu fetch failed, serving from offline cache:', err);
    const cached = await getCachedTodayMenu();
    if (cached) {
      return { data: cached, isOffline: true };
    }
    
    // Accurate seed fallback matching actual KIET Boys Hostel menu photo
    const todayIndex = new Date().getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[todayIndex];

    const fallback: ResolvedMenu = {
      date: new Date().toISOString().split('T')[0],
      dayOfWeek: todayName,
      breakfast: { items: ["Idli Sambhar", "Nariyal Chutney / Plain Parantha with Aloo Tamatar Sabji (alt)", "Tea"] },
      lunch: { items: ["Chole Bhature", "Fried Aloo", "Jeera Rice", "Boondi Raita", "Fried Mirchi", "Salad", "Pickle"] },
      snacks: { items: ["Aloo Sandwich / Bhelpuri (alt)", "Sauce", "Roohafza"] },
      dinner: { items: ["Dal Makhani", "Aloo Beans", "Roti", "Rice", "Salad", "Pickle"] },
    };
    return { data: fallback, isOffline: true };
  }
};

export const fetchWeekMenu = async (): Promise<FetchResult<ResolvedMenu[]>> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}/menu/week`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: ResolvedMenu[] = await res.json();
    await saveCachedWeekMenu(data);
    return { data, isOffline: false };
  } catch (err) {
    console.warn('[API] Week menu fetch failed, serving from offline cache:', err);
    const cached = await getCachedWeekMenu();
    return { data: cached || [], isOffline: true };
  }
};

export const fetchMealTimings = async (): Promise<FetchResult<MealTimingsMap>> => {
  const defaultTimings: MealTimingsMap = {
    breakfast: { startTime: '08:00', endTime: '09:30' },
    lunch: { startTime: '12:30', endTime: '14:00' },
    snacks: { startTime: '17:00', endTime: '18:00' },
    dinner: { startTime: '20:00', endTime: '21:30' },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}/timings`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: MealTimingsMap = await res.json();
    await saveCachedTimings(data);
    return { data, isOffline: false };
  } catch (err) {
    console.warn('[API] Timings fetch failed, serving from offline cache:', err);
    const cached = await getCachedTimings();
    return { data: cached || defaultTimings, isOffline: true };
  }
};
