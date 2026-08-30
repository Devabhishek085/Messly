import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../theme/colors';
import { MealKey, MealTimingsMap, ResolvedMenu } from '../types';
import { Coffee, Utensils, Cookie, Moon, Check } from 'lucide-react-native';

interface TodayMealsListProps {
  todayMenu: ResolvedMenu | null;
  timings: MealTimingsMap;
}

export const TodayMealsList: React.FC<TodayMealsListProps> = ({ todayMenu, timings }) => {
  const now = new Date();
  const mealKeys: MealKey[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

  const formatTimeStr = (timeStr: string = '00:00'): string => {
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr || '0', 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const getMealIcon = (meal: MealKey, color: string) => {
    switch (meal) {
      case 'breakfast': return <Coffee size={18} strokeWidth={2} color={color} />;
      case 'lunch': return <Utensils size={18} strokeWidth={2} color={color} />;
      case 'snacks': return <Cookie size={18} strokeWidth={2} color={color} />;
      case 'dinner': return <Moon size={18} strokeWidth={2} color={color} />;
    }
  };

  const getMealStatus = (mealKey: MealKey): 'completed' | 'current' | 'upcoming' => {
    const timing = timings[mealKey];
    if (!timing) return 'upcoming';

    const [sh, sm] = timing.startTime.split(':').map(Number);
    const [eh, em] = timing.endTime.split(':').map(Number);

    const startDate = new Date(now);
    startDate.setHours(sh, sm, 0, 0);

    const endDate = new Date(now);
    endDate.setHours(eh, em, 0, 0);

    if (now > endDate) return 'completed';
    if (now >= startDate && now <= endDate) return 'current';
    return 'upcoming';
  };

  if (!todayMenu) {
    return <Text style={styles.loadingText}>Loading today's menu schedule...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>TODAY'S FULL SCHEDULE</Text>

      {mealKeys.map(meal => {
        const status = getMealStatus(meal);
        const timing = timings[meal] || { startTime: '00:00', endTime: '00:00' };
        const items = todayMenu[meal]?.items || [];
        const formattedTiming = `${formatTimeStr(timing.startTime)} – ${formatTimeStr(timing.endTime)}`;

        const isCompleted = status === 'completed';
        const isCurrent = status === 'current';

        const iconColor = isCurrent
          ? COLORS.accentForest
          : isCompleted
          ? '#78746C'
          : '#1C1B1A';

        return (
          <View
            key={meal}
            style={[
              styles.mealCard,
              isCurrent && styles.mealCardCurrent,
              isCompleted && styles.mealCardCompleted,
            ]}
          >
            {/* Header */}
            <View style={styles.mealHeader}>
              <View style={styles.titleWithMarker}>
                <View style={styles.iconContainer}>
                  {getMealIcon(meal, iconColor)}
                </View>

                <View style={styles.titleContainer}>
                  <Text
                    style={[
                      styles.mealTitle,
                      isCompleted && styles.mealTitleCompleted,
                      isCurrent && styles.mealTitleCurrent,
                    ]}
                  >
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </Text>
                  <Text style={[styles.timingText, isCompleted && styles.timingTextCompleted]}>
                    {formattedTiming}
                  </Text>
                </View>
              </View>

              {/* Status Indicators */}
              {isCompleted && (
                <View style={styles.servedInlineBadge}>
                  <Check size={14} strokeWidth={2.5} color="#5C665D" />
                  <Text style={styles.servedInlineText}>Served</Text>
                </View>
              )}
              {isCurrent && (
                <View style={styles.statusBadgeCurrent}>
                  <View style={styles.dotCurrent} />
                  <Text style={styles.statusTextCurrent}>Serving Now</Text>
                </View>
              )}
              {!isCompleted && !isCurrent && (
                <View style={styles.statusBadgeUpcoming}>
                  <Text style={styles.statusTextUpcoming}>Upcoming</Text>
                </View>
              )}
            </View>

            {/* Food items list */}
            <View style={styles.itemsList}>
              {items.length === 0 ? (
                <Text style={styles.emptyText}>No menu items listed</Text>
              ) : (
                items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={[styles.itemBullet, isCompleted && styles.itemBulletCompleted]}>•</Text>
                    <Text style={[styles.itemText, isCompleted && styles.itemTextCompleted]}>
                      {item}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#686259',
    letterSpacing: 0.9,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#686259',
    textAlign: 'center',
    paddingVertical: 12,
  },
  mealCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#1A1918',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  mealCardCurrent: {
    borderColor: COLORS.accentForest,
    backgroundColor: '#F4F8F5',
    borderWidth: 2.5,
  },
  mealCardCompleted: {
    backgroundColor: '#F8F6F0',
    borderColor: '#EAE5DC',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE5DC',
  },
  titleWithMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  mealTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 19,
    fontWeight: '800',
    color: '#181716',
    letterSpacing: -0.2,
  },
  mealTitleCurrent: {
    color: COLORS.accentForest,
  },
  mealTitleCompleted: {
    color: '#6B655C',
    fontWeight: '700',
  },
  timingText: {
    fontSize: 12.5,
    color: '#686259',
    fontWeight: '600',
    marginTop: 2,
  },
  timingTextCompleted: {
    color: '#78746C',
  },
  servedInlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servedInlineText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#5C665D',
  },
  statusBadgeCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accentTint,
    borderColor: COLORS.accentTintStrong,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  dotCurrent: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentForest,
  },
  statusTextCurrent: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentForest,
  },
  statusBadgeUpcoming: {
    backgroundColor: '#FAF8F4',
    borderColor: '#E8E3DA',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusTextUpcoming: {
    fontSize: 11,
    fontWeight: '600',
    color: '#686259',
  },
  itemsList: {
    flexDirection: 'column',
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemBullet: {
    fontSize: 14,
    color: COLORS.accentForest,
    lineHeight: 20,
  },
  itemBulletCompleted: {
    color: '#78746C',
  },
  itemText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#181716',
    flexShrink: 1,
    lineHeight: 21,
  },
  itemTextCompleted: {
    color: '#423F3A',
  },
  emptyText: {
    fontSize: 13,
    color: '#78746C',
    fontStyle: 'italic',
  },
});
