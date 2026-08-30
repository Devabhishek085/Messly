import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../theme/colors';
import { MealKey, MealTimingsMap, ResolvedMenu } from '../types';
import { Coffee, Utensils, Cookie, Moon, Clock, Sparkles } from 'lucide-react-native';

interface HeroNextMealProps {
  todayMenu: ResolvedMenu | null;
  timings: MealTimingsMap;
}

export const HeroNextMeal: React.FC<HeroNextMealProps> = ({ todayMenu, timings }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!todayMenu) {
    return (
      <View style={styles.card}>
        <Text style={styles.badgeText}>LOADING MEAL DATA...</Text>
      </View>
    );
  }

  const mealKeys: MealKey[] = ['breakfast', 'lunch', 'snacks', 'dinner'];

  const getMealDate = (timeStr: string, isTomorrow = false): Date => {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    const d = new Date(now);
    if (isTomorrow) d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const getMealIcon = (meal: MealKey, color: string = COLORS.accentForest) => {
    switch (meal) {
      case 'breakfast': return <Coffee size={20} strokeWidth={2} color={color} />;
      case 'lunch': return <Utensils size={20} strokeWidth={2} color={color} />;
      case 'snacks': return <Cookie size={20} strokeWidth={2} color={color} />;
      case 'dinner': return <Moon size={20} strokeWidth={2} color={color} />;
    }
  };

  let currentServingMeal: MealKey | null = null;
  let nextUpcomingMeal: MealKey | null = null;
  let timeRemainingSec = 0;
  let timeUntilStartSec = 0;

  for (const meal of mealKeys) {
    const timing = timings[meal];
    if (!timing) continue;

    const startDate = getMealDate(timing.startTime);
    const endDate = getMealDate(timing.endTime);

    if (now >= startDate && now <= endDate) {
      currentServingMeal = meal;
      timeRemainingSec = Math.floor((endDate.getTime() - now.getTime()) / 1000);
      break;
    } else if (now < startDate && !nextUpcomingMeal) {
      nextUpcomingMeal = meal;
      timeUntilStartSec = Math.floor((startDate.getTime() - now.getTime()) / 1000);
    }
  }

  const formatCountdown = (totalSec: number): string => {
    if (totalSec <= 0) return '0m 0s';
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  // State 1: NOW SERVING
  if (currentServingMeal) {
    const mealName = currentServingMeal.charAt(0).toUpperCase() + currentServingMeal.slice(1);
    const itemsList = todayMenu[currentServingMeal]?.items || [];

    return (
      <View style={[styles.card, styles.cardNowServing]}>
        <View style={styles.accentBarServing} />

        <View style={styles.cardInner}>
          <View style={styles.headerRow}>
            <View style={styles.nowBadge}>
              <View style={styles.livePulseOuter}>
                <View style={styles.livePulseDot} />
              </View>
              <Text style={styles.nowBadgeText}>NOW SERVING</Text>
            </View>

            <View style={styles.timerCapsuleServing}>
              <Clock size={12} color={COLORS.accentForest} />
              <Text style={styles.timerTextServing}>Ends in {formatCountdown(timeRemainingSec)}</Text>
            </View>
          </View>

          <View style={styles.titleRow}>
            <View style={styles.iconCircleServing}>
              {getMealIcon(currentServingMeal, COLORS.accentForest)}
            </View>
            <Text style={styles.mealTitleHero}>{mealName}</Text>
          </View>

          <View style={styles.itemsPillContainer}>
            {itemsList.map((item, idx) => (
              <View key={idx} style={styles.foodChipServing}>
                <Text style={styles.foodChipTextServing}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // State 2: UPCOMING MEAL
  if (nextUpcomingMeal) {
    const mealName = nextUpcomingMeal.charAt(0).toUpperCase() + nextUpcomingMeal.slice(1);
    const itemsList = todayMenu[nextUpcomingMeal]?.items || [];

    return (
      <View style={styles.card}>
        <View style={styles.accentBarUpcoming} />

        <View style={styles.cardInner}>
          <View style={styles.headerRow}>
            <View style={styles.upcomingBadge}>
              <Sparkles size={12} color={COLORS.textMuted} />
              <Text style={styles.badgeText}>NEXT UPCOMING</Text>
            </View>

            <View style={styles.timerCapsuleUpcoming}>
              <Clock size={12} color="#FFFFFF" />
              <Text style={styles.timerTextUpcoming}>Starts in {formatCountdown(timeUntilStartSec)}</Text>
            </View>
          </View>

          <View style={styles.titleRow}>
            <View style={styles.iconCircleUpcoming}>
              {getMealIcon(nextUpcomingMeal, '#181716')}
            </View>
            <Text style={styles.mealTitleHero}>{mealName}</Text>
          </View>

          <View style={styles.itemsPillContainer}>
            {itemsList.map((item, idx) => (
              <View key={idx} style={styles.foodChipUpcoming}>
                <Text style={styles.foodChipTextUpcoming}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // State 3: ALL MEALS COMPLETED
  const tomorrowBreakfastStart = getMealDate(timings.breakfast?.startTime || '08:00', true);
  const secToTomorrowBreakfast = Math.floor((tomorrowBreakfastStart.getTime() - now.getTime()) / 1000);

  return (
    <View style={styles.card}>
      <View style={styles.accentBarCompleted} />
      
      <View style={styles.cardInner}>
        <View style={styles.headerRow}>
          <Text style={styles.badgeText}>TODAY'S MEALS COMPLETE</Text>
          <Text style={styles.timeLabel}>Rest & recharge</Text>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.iconCircleUpcoming}>
            <Coffee size={20} strokeWidth={2} color="#181716" />
          </View>
          <Text style={styles.mealTitleHero}>Tomorrow's Breakfast</Text>
        </View>

        <Text style={styles.foodPreview}>
          Starts in {formatCountdown(secToTomorrowBreakfast)} at {timings.breakfast?.startTime || '08:00 AM'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E3DA',
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#1A1918',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardNowServing: {
    backgroundColor: '#F4F8F5',
    borderColor: COLORS.accentForest,
    borderWidth: 2,
  },
  accentBarServing: {
    height: 4,
    backgroundColor: COLORS.accentForest,
    width: '100%',
  },
  accentBarUpcoming: {
    height: 4,
    backgroundColor: '#181716',
    width: '100%',
  },
  accentBarCompleted: {
    height: 4,
    backgroundColor: COLORS.terracotta,
    width: '100%',
  },
  cardInner: {
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#686259',
    letterSpacing: 0.8,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentForest,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
    gap: 6,
  },
  livePulseOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(74, 222, 128, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ADE80',
  },
  nowBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  timerCapsuleServing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.accentTintStrong,
  },
  timerTextServing: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.accentForest,
  },
  timerCapsuleUpcoming: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accentForest,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  timerTextUpcoming: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timeLabel: {
    fontSize: 12,
    color: '#686259',
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconCircleServing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accentTintStrong,
  },
  iconCircleUpcoming: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF8F4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E3DA',
  },
  mealTitleHero: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontSize: 28,
    fontWeight: '800',
    color: '#181716',
    letterSpacing: -0.5,
  },
  itemsPillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  foodChipServing: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.accentTintStrong,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  foodChipTextServing: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accentForest,
  },
  foodChipUpcoming: {
    backgroundColor: '#FAF8F4',
    borderColor: '#E8E3DA',
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  foodChipTextUpcoming: {
    fontSize: 13,
    fontWeight: '500',
    color: '#181716',
  },
  foodPreview: {
    fontSize: 14,
    color: '#686259',
    fontWeight: '500',
    lineHeight: 20,
  },
});
