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
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  const dayIndex = dateObj.getUTCDay();
  return DAYS_MAP[dayIndex];
};

export const getTodayDateStr = (): string => {
  // Always resolve date according to Indian Standard Time (IST UTC+5:30)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
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
