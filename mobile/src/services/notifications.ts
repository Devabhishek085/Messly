import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { MealKey, MealTimingsMap, RemindersMap, ResolvedMenu } from '../types';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return false;
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

export const getNotificationPermissionStatus = async (): Promise<string> => {
  if (Platform.OS === 'web') return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

export const syncScheduledMealNotifications = async (
  reminders: RemindersMap,
  timings: MealTimingsMap,
  todayMenu: ResolvedMenu
): Promise<void> => {
  if (Platform.OS === 'web') return;

  const isGranted = await requestNotificationPermissions();
  if (!isGranted) return;

  // Cancel all existing Messly notifications before rescheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  const mealKeys: MealKey[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

  for (const meal of mealKeys) {
    const remConfig = reminders[meal];
    if (!remConfig || !remConfig.enabled) continue;

    const timing = timings[meal];
    if (!timing) continue;

    const [startHour, startMin] = timing.startTime.split(':').map(Number);
    const mealTime = new Date();
    mealTime.setHours(startHour, startMin, 0, 0);

    // Subtract lead time in minutes
    const triggerTime = new Date(mealTime.getTime() - remConfig.leadMinutes * 60 * 1000);

    // Only schedule if trigger time is in the future
    if (triggerTime > now) {
      const itemsList = todayMenu[meal]?.items?.slice(0, 4).join(', ') || 'Mess Menu';
      
      const leadText = remConfig.leadMinutes === 0
        ? 'is starting NOW'
        : `starts in ${remConfig.leadMinutes} minutes`;

      const title = `${meal.charAt(0).toUpperCase() + meal.slice(1)} ${leadText}!`;
      const body = `Today's menu: ${itemsList}`;

      const secondsUntil = Math.max(1, Math.floor((triggerTime.getTime() - now.getTime()) / 1000));

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          data: { meal },
        },
        trigger: {
          seconds: secondsUntil,
        },
      });
    }
  }
};
