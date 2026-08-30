import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Platform,
  StatusBar
} from 'react-native';
import { COLORS } from './src/theme/colors';
import { ResolvedMenu, MealTimingsMap, RemindersMap, MealKey } from './src/types';
import { fetchTodayMenu, fetchWeekMenu, fetchMealTimings } from './src/services/api';
import { getRemindersMap, saveRemindersMap } from './src/services/storage';
import { logAnalyticsEvent } from './src/services/analytics';
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  syncScheduledMealNotifications
} from './src/services/notifications';
import { OfflineBanner } from './src/components/OfflineBanner';
import { HeroNextMeal } from './src/components/HeroNextMeal';
import { TodayMealsList } from './src/components/TodayMealsList';
import { Utensils, Calendar, Bell, Settings, RefreshCw, CheckCircle2, ShieldAlert, FileText, Info } from 'lucide-react-native';

type TabName = 'home' | 'weekly' | 'reminders' | 'settings';

const DAYS_LIST = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const MESS_GUIDELINES = [
  { id: 1, title: "Fruit Policy", text: "ONE fruit served during lunch on alternate days (Seasonal fruit, no repetition in a week)." },
  { id: 2, title: "Strict Compliance", text: "No use of Azinomoto, artificial colours, minimal Arrarot, and zero Vanaspati Ghee." },
  { id: 3, title: "Sauces", text: "Tomato and Green Chilly Sauce served wherever sauce is mentioned in the menu." },
  { id: 4, title: "Daily Salad Mix", text: "Includes Onion, Cucumber, Carrot, Beetroot, Lemon slices & Green chilly everyday." },
  { id: 5, title: "Vegetable Ratio", text: "Wherever Potato (aloo) is mixed with green veggies, ratio is 75% Veg + 25% Potato." },
  { id: 6, title: "On-Demand Condiments", text: "Salt and Sugar are available during lunch and dinner on demand." },
  { id: 7, title: "Ice Cream Brands", text: "Amul / Mother Dairy / Cream-Bell (Vanilla & Strawberry alternate)." },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Data states
  const [todayMenu, setTodayMenu] = useState<ResolvedMenu | null>(null);
  const [weekMenu, setWeekMenu] = useState<ResolvedMenu[]>([]);
  const [timings, setTimings] = useState<MealTimingsMap>({
    breakfast: { startTime: '08:00', endTime: '09:30' },
    lunch: { startTime: '12:30', endTime: '14:00' },
    snacks: { startTime: '17:00', endTime: '18:00' },
    dinner: { startTime: '20:00', endTime: '21:30' },
  });
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Weekly screen selected day
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>('sunday');

  // Reminders & Permission states
  const [reminders, setReminders] = useState<RemindersMap>({
    breakfast: { meal: 'breakfast', enabled: false, leadMinutes: 15 },
    lunch: { meal: 'lunch', enabled: false, leadMinutes: 15 },
    snacks: { meal: 'snacks', enabled: false, leadMinutes: 15 },
    dinner: { meal: 'dinner', enabled: false, leadMinutes: 15 },
  });
  const [notifPermission, setNotifPermission] = useState<string>('undetermined');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    logAnalyticsEvent('app_open');

    const todayRes = await fetchTodayMenu();
    setTodayMenu(todayRes.data);
    setIsOffline(todayRes.isOffline);

    if (todayRes.data?.dayOfWeek) {
      setSelectedWeekDay(todayRes.data.dayOfWeek.toLowerCase());
    }

    const timingsRes = await fetchMealTimings();
    setTimings(timingsRes.data);

    const weekRes = await fetchWeekMenu();
    setWeekMenu(weekRes.data);

    const savedReminders = await getRemindersMap();
    setReminders(savedReminders);

    const permStatus = await getNotificationPermissionStatus();
    setNotifPermission(permStatus);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'weekly') {
      logAnalyticsEvent('menu_view', { day: selectedWeekDay });
    }
  };

  const handleToggleReminder = async (meal: MealKey, value: boolean) => {
    if (value && notifPermission !== 'granted') {
      const granted = await requestNotificationPermissions();
      const updatedStatus = await getNotificationPermissionStatus();
      setNotifPermission(updatedStatus);
      if (!granted) return;
    }

    const updated = {
      ...reminders,
      [meal]: { ...reminders[meal], enabled: value }
    };
    setReminders(updated);
    await saveRemindersMap(updated);

    if (value) {
      logAnalyticsEvent('reminder_enabled', { meal, leadMinutes: reminders[meal].leadMinutes });
    }

    if (todayMenu) {
      syncScheduledMealNotifications(updated, timings, todayMenu);
    }
  };

  const handleLeadTimeChange = async (meal: MealKey, leadMinutes: 0 | 15 | 30) => {
    const updated = {
      ...reminders,
      [meal]: { ...reminders[meal], leadMinutes }
    };
    setReminders(updated);
    await saveRemindersMap(updated);

    if (todayMenu && reminders[meal].enabled) {
      syncScheduledMealNotifications(updated, timings, todayMenu);
    }
  };

  const formatHeaderDate = (d: Date): string => {
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dateNum = d.getDate();
    return `${dayName}, ${dateNum} ${monthName}`;
  };

  const formatHeaderTime = (d: Date): string => {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatTime12h = (timeStr: string = '00:00'): string => {
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr || '0', 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const selectedDayMenuObj = weekMenu.find(m => m.dayOfWeek.toLowerCase() === selectedWeekDay) || (
    selectedWeekDay === todayMenu?.dayOfWeek.toLowerCase() ? todayMenu : null
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgPaper} />

      {/* App Header */}
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.hostelLabel}>KIET BOYS HOSTEL</Text>
          <Text style={styles.headerDate}>{formatHeaderDate(currentTime)}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.headerClock}>{formatHeaderTime(currentTime)}</Text>
          <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
            <RefreshCw size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Banner */}
      <OfflineBanner visible={isOffline} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accentForest} />
            <Text style={styles.loadingText}>Fetching Messly Menu...</Text>
          </View>
        ) : (
          <>
            {/* TAB 1: HOME */}
            {activeTab === 'home' && (
              <View>
                <HeroNextMeal todayMenu={todayMenu} timings={timings} />
                <TodayMealsList todayMenu={todayMenu} timings={timings} />
              </View>
            )}

            {/* TAB 2: WEEKLY MENU */}
            {activeTab === 'weekly' && (
              <View>
                <Text style={styles.screenTitle}>Weekly Mess Schedule</Text>
                <Text style={styles.screenSubtitle}>WEF - 27/07/2026 · KIET Boys Hostel Official Schedule</Text>

                {/* Day selector horizontal bar */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelectorScroll}>
                  {DAYS_LIST.map(d => {
                    const isSelected = selectedWeekDay === d.key;
                    const isToday = todayMenu?.dayOfWeek.toLowerCase() === d.key;
                    return (
                      <TouchableOpacity
                        key={d.key}
                        onPress={() => {
                          setSelectedWeekDay(d.key);
                          logAnalyticsEvent('menu_view', { day: d.key });
                        }}
                        style={[
                          styles.dayTabPill,
                          isSelected && styles.dayTabPillSelected,
                        ]}
                      >
                        <Text style={[styles.dayTabLabel, isSelected && styles.dayTabLabelSelected]}>
                          {d.label}
                        </Text>
                        {isToday && (
                          <View style={[styles.todayIndicator, isSelected && styles.todayIndicatorSelected]} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Day Menu Card */}
                {selectedDayMenuObj ? (
                  <View style={{ marginTop: 8 }}>
                    {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealKey[]).map(meal => {
                      const timing = timings[meal] || { startTime: '00:00', endTime: '00:00' };
                      const items = selectedDayMenuObj[meal]?.items || [];
                      return (
                        <View key={meal} style={styles.weeklyMealCard}>
                          <View style={styles.weeklyMealHeader}>
                            <Text style={styles.weeklyMealTitle}>
                              {meal.charAt(0).toUpperCase() + meal.slice(1)}
                            </Text>
                            <Text style={styles.weeklyMealTiming}>
                              {formatTime12h(timing.startTime)} – {formatTime12h(timing.endTime)}
                            </Text>
                          </View>
                          {items.length === 0 ? (
                            <Text style={styles.emptyItemsText}>No menu items listed</Text>
                          ) : (
                            items.map((item, idx) => (
                              <View key={idx} style={styles.weeklyItemRowContainer}>
                                <Text style={styles.weeklyItemBullet}>•</Text>
                                <Text style={styles.weeklyItemRowText}>{item}</Text>
                              </View>
                            ))
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.emptyItemsText}>No menu data available for this day.</Text>
                )}
              </View>
            )}

            {/* TAB 3: REMINDERS */}
            {activeTab === 'reminders' && (
              <View>
                <Text style={styles.screenTitle}>Meal Reminders</Text>
                <Text style={styles.screenSubtitle}>
                  Schedule local notifications on your device so you never miss mess hours
                </Text>

                {notifPermission !== 'granted' && (
                  <View style={styles.permissionAlert}>
                    <ShieldAlert size={20} color={COLORS.terracotta} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.permissionTitle}>Notifications Permission Needed</Text>
                      <Text style={styles.permissionBody}>
                        To receive scheduled meal reminders, please enable notifications in your system settings.
                      </Text>
                      <TouchableOpacity
                        onPress={async () => {
                          await requestNotificationPermissions();
                          const updated = await getNotificationPermissionStatus();
                          setNotifPermission(updated);
                        }}
                        style={styles.enableBtn}
                      >
                        <Text style={styles.enableBtnText}>Enable Notifications</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {(['breakfast', 'lunch', 'snacks', 'dinner'] as MealKey[]).map(meal => {
                  const rem = reminders[meal];
                  const timing = timings[meal];

                  return (
                    <View key={meal} style={styles.reminderCard}>
                      <View style={styles.reminderHeader}>
                        <View>
                          <Text style={styles.reminderMealTitle}>
                            {meal.charAt(0).toUpperCase() + meal.slice(1)}
                          </Text>
                          <Text style={styles.reminderTimingText}>
                            Serves at {formatTime12h(timing?.startTime)}
                          </Text>
                        </View>

                        <Switch
                          value={rem.enabled}
                          onValueChange={val => handleToggleReminder(meal, val)}
                          trackColor={{ false: '#E5E0D8', true: COLORS.accentForest }}
                          thumbColor="#FFFFFF"
                        />
                      </View>

                      {rem.enabled && (
                        <View style={styles.leadTimeSection}>
                          <Text style={styles.leadTimeLabel}>Notify me:</Text>
                          <View style={styles.leadTimeOptions}>
                            {([0, 15, 30] as (0 | 15 | 30)[]).map(mins => (
                              <TouchableOpacity
                                key={mins}
                                onPress={() => handleLeadTimeChange(meal, mins)}
                                style={[
                                  styles.leadPill,
                                  rem.leadMinutes === mins && styles.leadPillSelected
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.leadPillText,
                                    rem.leadMinutes === mins && styles.leadPillTextSelected
                                  ]}
                                >
                                  {mins === 0 ? 'At meal time' : `${mins}m before`}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* TAB 4: SETTINGS */}
            {activeTab === 'settings' && (
              <View>
                <Text style={styles.screenTitle}>Settings & Guidelines</Text>

                <View style={styles.settingsCard}>
                  <Text style={styles.settingsLabel}>Hostel Facility</Text>
                  <Text style={styles.settingsVal}>KIET Group of Institutions, Boys Hostel</Text>
                  <Text style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 2 }}>Official Schedule WEF - 27/07/2026</Text>
                </View>

                {/* Mess Rules & Compliance Card */}
                <View style={styles.settingsCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Info size={16} color={COLORS.accentForest} />
                    <Text style={[styles.settingsLabel, { color: COLORS.accentForest }]}>Official Mess Guidelines</Text>
                  </View>

                  <View style={{ gap: 8 }}>
                    {MESS_GUIDELINES.map(g => (
                      <View key={g.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.accentForest }}>{g.id}.</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12.5, fontWeight: '700', color: COLORS.textInk }}>{g.title}</Text>
                          <Text style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 16 }}>{g.text}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.settingsCard}>
                  <Text style={styles.settingsLabel}>App Version</Text>
                  <Text style={styles.settingsVal}>v1.0.0 (Production Build)</Text>
                </View>

                <View style={styles.settingsCard}>
                  <Text style={styles.settingsLabel}>Notification System Status</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {notifPermission === 'granted' ? (
                      <>
                        <CheckCircle2 size={16} color={COLORS.accentForest} />
                        <Text style={{ color: COLORS.accentForest, fontWeight: '600', fontSize: 13 }}>
                          Notifications Authorized & Scheduled
                        </Text>
                      </>
                    ) : (
                      <>
                        <ShieldAlert size={16} color={COLORS.terracotta} />
                        <Text style={{ color: COLORS.terracotta, fontWeight: '600', fontSize: 13 }}>
                          Notifications Not Enabled ({notifPermission})
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => handleTabChange('home')}
          style={[styles.tabItem, activeTab === 'home' && styles.tabItemActive]}
        >
          <Utensils size={20} color={activeTab === 'home' ? COLORS.accentForest : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('weekly')}
          style={[styles.tabItem, activeTab === 'weekly' && styles.tabItemActive]}
        >
          <Calendar size={20} color={activeTab === 'weekly' ? COLORS.accentForest : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>Weekly</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('reminders')}
          style={[styles.tabItem, activeTab === 'reminders' && styles.tabItemActive]}
        >
          <Bell size={20} color={activeTab === 'reminders' ? COLORS.accentForest : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'reminders' && styles.tabTextActive]}>Reminders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange('settings')}
          style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
        >
          <Settings size={20} color={activeTab === 'settings' ? COLORS.accentForest : COLORS.textMuted} />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgPaper,
  },
  appHeader: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.cardSurface,
  },
  hostelLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  headerDate: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textInk,
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerClock: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accentForest,
  },
  refreshBtn: {
    padding: 4,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13.5,
    color: COLORS.textMuted,
  },
  screenTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textInk,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginBottom: 12,
    lineHeight: 17,
  },
  daySelectorScroll: {
    marginVertical: 10,
  },
  dayTabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardSurface,
    marginRight: 8,
    alignItems: 'center',
  },
  dayTabPillSelected: {
    backgroundColor: COLORS.accentForest,
    borderColor: COLORS.accentForest,
  },
  dayTabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textInk,
  },
  dayTabLabelSelected: {
    color: '#FFFFFF',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accentForest,
    marginTop: 3,
  },
  todayIndicatorSelected: {
    backgroundColor: '#FFFFFF',
  },
  weeklyMealCard: {
    backgroundColor: COLORS.cardSurface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  weeklyMealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  weeklyMealTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textInk,
  },
  weeklyMealTiming: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  weeklyItemRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  weeklyItemBullet: {
    fontSize: 13,
    color: COLORS.accentForest,
    lineHeight: 18,
  },
  weeklyItemRowText: {
    fontSize: 13.5,
    color: COLORS.textInk,
    flexShrink: 1,
    lineHeight: 18,
  },
  emptyItemsText: {
    fontSize: 13,
    color: COLORS.textDim,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  reminderCard: {
    backgroundColor: COLORS.cardSurface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderMealTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textInk,
  },
  reminderTimingText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  leadTimeSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  leadTimeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  leadTimeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  leadPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgPaper,
  },
  leadPillSelected: {
    backgroundColor: COLORS.accentTint,
    borderColor: COLORS.accentForest,
  },
  leadPillText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  leadPillTextSelected: {
    color: COLORS.accentForest,
    fontWeight: '600',
  },
  permissionAlert: {
    backgroundColor: COLORS.terracottaTint,
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.terracotta,
    marginBottom: 2,
  },
  permissionBody: {
    fontSize: 12,
    color: COLORS.textInk,
    lineHeight: 16,
  },
  enableBtn: {
    marginTop: 8,
    backgroundColor: COLORS.terracotta,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  enableBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: COLORS.cardSurface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  settingsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  settingsVal: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textInk,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabItemActive: {},
  tabText: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.accentForest,
    fontWeight: '700',
  },
});
