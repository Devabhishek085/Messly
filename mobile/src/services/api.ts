import { ResolvedMenu, MealTimingsMap } from '../types';
import {
  saveCachedTodayMenu,
  getCachedTodayMenu,
  saveCachedWeekMenu,
  getCachedWeekMenu,
  saveCachedTimings,
  getCachedTimings
} from './storage';

// Direct production backend API URL for standalone mobile builds
const PROD_URL = 'https://messly.onrender.com/api';
const API_BASE = process.env.EXPO_PUBLIC_API_URL || PROD_URL;

export interface FetchResult<T> {
  data: T;
  isOffline: boolean;
}

// Complete 7-Day Exact KIET Noticeboard Menu Fallback
export const EXACT_KIET_WEEKLY_FALLBACK: ResolvedMenu[] = [
  {
    date: '2026-08-24',
    dayOfWeek: 'monday',
    breakfast: { items: ["Veg Cutlet", "Boiled Egg", "Brown Bread with Butter", "Jam", "Sauce", "Tea", "Milk"] },
    lunch: { items: ["Rajma", "Kundru / Aloo Beans (alt)", "Boondi Raita", "Roti", "Rice", "Salad", "Pickle"] },
    snacks: { items: ["Bread Pakoda / Burger (alt)", "Sauce", "Lemon Shikanji"] },
    dinner: { items: ["Matar Paneer / Kadhai Paneer (alt)", "Mix Veg", "Vegetable Pulao", "Roti", "Salad", "Pickle", "Custard"] }
  },
  {
    date: '2026-08-25',
    dayOfWeek: 'tuesday',
    breakfast: { items: ["Pav Bhaji", "Tea", "Milk"] },
    lunch: { items: ["Kali Masoor / Mix Dal (alt)", "Seasonal Veg", "Jeera Rice", "Fruit Raita", "Roti", "Salad", "Pickle"] },
    snacks: { items: ["French Fries with Sauce", "Tea"] },
    dinner: { items: ["Puri", "Pindi Chole", "Petha", "Green Peas Pulao", "Salad", "Pickle"] }
  },
  {
    date: '2026-08-26',
    dayOfWeek: 'wednesday',
    breakfast: { items: ["Chana (onion-tomato-green chilly) & Halwa", "Tea", "Milk", "Poha with besan bhujia & Daliya (alt) + Tea"] },
    lunch: { items: ["Arhar Dal (fry)", "Mix-Veg", "Bundi Raita", "Roti", "Rice", "Salad", "Pickle"] },
    snacks: { items: ["Vada-pav / Veg Pasta (alt)", "Sauce", "Tea"] },
    dinner: { items: ["Udad Chana (Fry)", "Bhindi / Veg. Kofta (alt)", "Roti", "Fried Rice", "Salad", "Pickle", "Sponge Rasgulla"] }
  },
  {
    date: '2026-08-27',
    dayOfWeek: 'thursday',
    breakfast: { items: ["Stuffed Puri", "Aloo Sabji (Gravy)", "Pickle", "Tea", "Milk"] },
    lunch: { items: ["Kadhi Pakoda", "Jeera Aloo", "Roti", "Rice", "Salad", "Pickle"] },
    snacks: { items: ["Mix-Veg Pakodi with Green Chutney + Sauce", "Aloo Tikki with matar + Green & Red Chutney (alt)", "Shikanji"] },
    dinner: { items: ["Kali Masoor / Lauki Chana dal", "Arbi / Aloo-Soyabean (alt)", "Roti", "Veg Pulao", "Salad", "Pickle"] }
  },
  {
    date: '2026-08-28',
    dayOfWeek: 'friday',
    breakfast: { items: ["Cornflakes / Sprouts", "Boiled Egg / Bread Roll", "Bread Butter", "Sauce", "Tea", "Milk"] },
    lunch: { items: ["Kala Chana (gravy)", "Aloo Pyaz Bhujiya", "Roti", "Jeera Rice", "Veg Raita", "Salad", "Pickle"] },
    snacks: { items: ["Samosa", "Chole", "Meethi Chatni", "Green Chutney", "Tea"] },
    dinner: { items: ["Shahi Paneer / Paneer 2 Pyaja (alt)", "Egg Curry", "Aloo Shimla Mirch", "Jeera Rice", "Roti", "Salad", "Pickle", "Ice Cream"] }
  },
  {
    date: '2026-08-29',
    dayOfWeek: 'saturday',
    breakfast: { items: ["Aloo-Pyaz Paratha", "Pickle", "Plain Dahi", "Sauce", "Tea"] },
    lunch: { items: ["Veg Biryani / Tehari (Veg.Pulao)", "Papad", "Green Chutney", "Salad", "Bundi Raita", "Pickle"] },
    snacks: { items: ["Fried Idli / Jave (alt)", "Sauce", "Tea"] },
    dinner: { items: ["Dal Panch-mel", "Mix Veg", "Jeera Rice", "Roti", "Salad", "Pickle"] }
  },
  {
    date: '2026-08-30',
    dayOfWeek: 'sunday',
    breakfast: { items: ["Idli Sambhar", "Nariyal Chutney", "Plain Parantha with Aloo Tamatar Sabji (alt)", "Tea"] },
    lunch: { items: ["Chole Bhature", "Fried Aloo", "Jeera Rice", "Boondi Raita", "Fried Mirchi", "Salad", "Pickle"] },
    snacks: { items: ["Aloo Sandwich / Bhelpuri (alt)", "Sauce", "Roohafza"] },
    dinner: { items: ["Dal Makhani", "Aloo Beans", "Roti", "Rice", "Salad", "Pickle"] }
  }
];

export const fetchTodayMenu = async (): Promise<FetchResult<ResolvedMenu>> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_BASE}/menu/today`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: ResolvedMenu = await res.json();
    await saveCachedTodayMenu(data);
    return { data, isOffline: false };
  } catch (err) {
    console.warn('[API] Today menu fetch failed, serving cached menu:', err);
    const cached = await getCachedTodayMenu();
    if (cached) {
      return { data: cached, isOffline: false }; // Treat cached as valid without showing alert banner
    }
    
    const todayIndex = new Date().getDay();
    const fallbackIndex = todayIndex === 0 ? 6 : todayIndex - 1;
    const fallback = EXACT_KIET_WEEKLY_FALLBACK[fallbackIndex] || EXACT_KIET_WEEKLY_FALLBACK[6];
    return { data: fallback, isOffline: false };
  }
};

export const fetchWeekMenu = async (): Promise<FetchResult<ResolvedMenu[]>> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_BASE}/menu/week`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: ResolvedMenu[] = await res.json();
    if (Array.isArray(data) && data.length >= 7) {
      await saveCachedWeekMenu(data);
      return { data, isOffline: false };
    }
    throw new Error('Incomplete week data array');
  } catch (err) {
    console.warn('[API] Week menu fetch failed, serving noticeboard menu:', err);
    const cached = await getCachedWeekMenu();
    if (cached && Array.isArray(cached) && cached.length >= 7) {
      return { data: cached, isOffline: false };
    }
    return { data: EXACT_KIET_WEEKLY_FALLBACK, isOffline: false };
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
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_BASE}/timings`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: MealTimingsMap = await res.json();
    await saveCachedTimings(data);
    return { data, isOffline: false };
  } catch (err) {
    console.warn('[API] Timings fetch failed, serving offline timings:', err);
    const cached = await getCachedTimings();
    return { data: cached || defaultTimings, isOffline: false };
  }
};
