import { WeeklyMenu, DayOfWeek } from '../models/WeeklyMenu.js';
import { SpecialMenu } from '../models/SpecialMenu.js';

const DAYS_MAP: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export interface ResolvedMenu {
  date: string;
  dayOfWeek: DayOfWeek;
  isOverride: boolean;
  breakfast: { items: string[] };
  lunch: { items: string[] };
  snacks: { items: string[] };
  dinner: { items: string[] };
}

export const getDayOfWeekFromDateStr = (dateStr: string): DayOfWeek => {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayIndex = dateObj.getDay();
  return DAYS_MAP[dayIndex];
};

export const getTodayDateStr = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const resolveMenuForDate = async (dateStr: string): Promise<ResolvedMenu> => {
  const dayOfWeek = getDayOfWeekFromDateStr(dateStr);

  const [weekly, special] = await Promise.all([
    WeeklyMenu.findOne({ dayOfWeek }),
    SpecialMenu.findOne({ date: dateStr })
  ]);

  const defaultWeeklyItems = { items: [] };

  const weeklyBreakfast = weekly?.breakfast || defaultWeeklyItems;
  const weeklyLunch = weekly?.lunch || defaultWeeklyItems;
  const weeklySnacks = weekly?.snacks || defaultWeeklyItems;
  const weeklyDinner = weekly?.dinner || defaultWeeklyItems;

  const isOverride = !!special;

  return {
    date: dateStr,
    dayOfWeek,
    isOverride,
    breakfast: (special?.breakfast?.items && special.breakfast.items.length > 0) 
      ? special.breakfast 
      : weeklyBreakfast,
    lunch: (special?.lunch?.items && special.lunch.items.length > 0) 
      ? special.lunch 
      : weeklyLunch,
    snacks: (special?.snacks?.items && special.snacks.items.length > 0) 
      ? special.snacks 
      : weeklySnacks,
    dinner: (special?.dinner?.items && special.dinner.items.length > 0) 
      ? special.dinner 
      : weeklyDinner,
  };
};
