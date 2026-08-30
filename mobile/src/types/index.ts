export type MealKey = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

export interface MealContent {
  items: string[];
}

export interface ResolvedMenu {
  date: string;
  dayOfWeek: string;
  isOverride?: boolean;
  breakfast: MealContent;
  lunch: MealContent;
  snacks: MealContent;
  dinner: MealContent;
}

export interface MealTimingItem {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export type MealTimingsMap = Record<MealKey, MealTimingItem>;

export interface ReminderConfig {
  meal: MealKey;
  enabled: boolean;
  leadMinutes: 0 | 15 | 30; // 0 = at meal time, 15 = 15m before, 30 = 30m before
}

export type RemindersMap = Record<MealKey, ReminderConfig>;
