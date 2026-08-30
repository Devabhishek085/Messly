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
      case 'breakfast': return <Coffee size={16} color={color} />;
      case 'lunch': return <Utensils size={16} color={color} />;
      case 'snacks': return <Cookie size={16} color={color} />;
      case 'dinner': return <Moon size={16} color={color} />;
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
    return <Text style={styles.loadingText}>Loading today's menu items...</Text>;
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
          ? COLORS.textDim
          : COLORS.textInk;

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
                <View
                  style={[
                    styles.iconBox,
                    isCurrent && styles.iconBoxCurrent,
                    isCompleted && styles.iconBoxCompleted,
                  ]}
                >
                  {getMealIcon(meal, iconColor)}
                </View>

                <View style={styles.titleContainer}>
                  <Text
                    style={[
                      styles.mealTitle,
                      isCompleted && styles.textDimmed,
                      isCurrent && styles.textCurrentTitle,
                    ]}
                  >
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </Text>
                  <Text style={[styles.timingText, isCompleted && styles.textDimmed]}>
                    {formattedTiming}
                  </Text>
                </View>
              </View>

              {/* Status Marker Badge */}
              {isCompleted && (
                <View style={styles.statusBadgeCompleted}>
                  <Check size={12} color={COLORS.textMuted} />
                  <Text style={styles.statusTextCompleted}>Served</Text>
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
                <Text style={[styles.itemText, styles.textDimmed]}>No items specified</Text>
              ) : (
                items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={[styles.itemBullet, isCompleted && styles.textDimmed]}>•</Text>
                    <Text style={[styles.itemText, isCompleted && styles.textDimmed]}>
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
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  mealCard: {
    backgroundColor: COLORS.cardSurface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1A1918',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  mealCardCurrent: {
    borderColor: COLORS.accentForest,
    backgroundColor: '#FAFCF9',
    borderWidth: 1.5,
  },
  mealCardCompleted: {
    backgroundColor: COLORS.completedBg,
    borderColor: '#EAE5DC',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleWithMarker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: COLORS.bgPaper,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBoxCurrent: {
    backgroundColor: COLORS.accentTint,
    borderColor: COLORS.accentTintStrong,
  },
  iconBoxCompleted: {
    backgroundColor: '#EBE7DF',
    borderColor: '#DED8CC',
  },
  titleContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  mealTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textInk,
  },
  textCurrentTitle: {
    color: COLORS.accentForest,
  },
  timingText: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  statusBadgeCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EBE7DF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusTextCompleted: {
    fontSize: 10.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  statusBadgeCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.accentTint,
    borderColor: COLORS.accentTintStrong,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  dotCurrent: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accentForest,
  },
  statusTextCurrent: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.accentForest,
  },
  statusBadgeUpcoming: {
    backgroundColor: COLORS.bgPaper,
    borderColor: COLORS.border,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusTextUpcoming: {
    fontSize: 10.5,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  itemsList: {
    flexDirection: 'column',
    gap: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  itemBullet: {
    fontSize: 13,
    color: COLORS.accentForest,
    lineHeight: 18,
  },
  itemText: {
    fontSize: 13.5,
    color: COLORS.textInk,
    flexShrink: 1,
    lineHeight: 19,
  },
  textDimmed: {
    color: COLORS.textDim,
  },
});
