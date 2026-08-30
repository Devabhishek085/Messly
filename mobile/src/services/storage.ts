import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { ResolvedMenu, MealTimingsMap, RemindersMap } from '../types';

const DEVICE_ID_KEY = 'messly_anonymous_device_id';
const CACHED_TODAY_MENU_KEY = 'messly_cached_today_menu';
const CACHED_WEEK_MENU_KEY = 'messly_cached_week_menu';
const CACHED_TIMINGS_KEY = 'messly_cached_timings';
const REMINDERS_KEY = 'messly_user_reminders';

// Anonymous Device ID
export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (err) {
    // Fallback to AsyncStorage if SecureStore fails on web/unsupported platforms
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = Crypto.randomUUID();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  }
};

// Cache Today Menu
export const saveCachedTodayMenu = async (menu: ResolvedMenu): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHED_TODAY_MENU_KEY, JSON.stringify(menu));
  } catch (err) {
    console.warn('Failed to cache today menu:', err);
  }
};

export const getCachedTodayMenu = async (): Promise<ResolvedMenu | null> => {
  try {
    const raw = await AsyncStorage.getItem(CACHED_TODAY_MENU_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

// Cache Weekly Menu
export const saveCachedWeekMenu = async (weekMenu: ResolvedMenu[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHED_WEEK_MENU_KEY, JSON.stringify(weekMenu));
  } catch (err) {
    console.warn('Failed to cache week menu:', err);
  }
};

export const getCachedWeekMenu = async (): Promise<ResolvedMenu[] | null> => {
  try {
    const raw = await AsyncStorage.getItem(CACHED_WEEK_MENU_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

// Cache Timings
export const saveCachedTimings = async (timings: MealTimingsMap): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHED_TIMINGS_KEY, JSON.stringify(timings));
  } catch (err) {
    console.warn('Failed to cache timings:', err);
  }
};

export const getCachedTimings = async (): Promise<MealTimingsMap | null> => {
  try {
    const raw = await AsyncStorage.getItem(CACHED_TIMINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

// Reminders Configuration
const DEFAULT_REMINDERS: RemindersMap = {
  breakfast: { meal: 'breakfast', enabled: false, leadMinutes: 15 },
  lunch: { meal: 'lunch', enabled: false, leadMinutes: 15 },
  snacks: { meal: 'snacks', enabled: false, leadMinutes: 15 },
  dinner: { meal: 'dinner', enabled: false, leadMinutes: 15 },
};

export const saveRemindersMap = async (reminders: RemindersMap): Promise<void> => {
  try {
    await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  } catch (err) {
    console.warn('Failed to save reminders:', err);
  }
};

export const getRemindersMap = async (): Promise<RemindersMap> => {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    return raw ? { ...DEFAULT_REMINDERS, ...JSON.parse(raw) } : DEFAULT_REMINDERS;
  } catch (err) {
    return DEFAULT_REMINDERS;
  }
};
