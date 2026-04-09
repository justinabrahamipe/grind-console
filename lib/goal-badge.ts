import { countScheduledDaysInRange, calculateEffortMetrics } from './effort-calculations';
import { parseScheduleDays } from './format';

export interface GoalBadge {
  value: number;   // e.g. 1.5
  label: string;   // e.g. "Ahead"
  color: string;   // hex color
}

/**
 * Compute a consistent momentum/trajectory badge for any goal type.
 * - Target goals: uses calculateEffortMetrics (currentRate / requiredRate) for exact match with detail page.
 * - Outcome goals: uses schedule-aware time-based trajectory.
 * Returns null for project goals, habitual goals, or goals without dates.
 */
export function getGoalBadge(goal: {
  id: number;
  goalType: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  startDate: string | null;
  targetDate: string | null;
  scheduleDays: string | null;
  flexibilityRule?: string;
}, today: string): GoalBadge | null {
  if (goal.goalType === 'project' || goal.goalType === 'habitual') return null;
  if (!goal.startDate || !goal.targetDate) return null;
  if (today < goal.startDate) return null;

  const range = goal.targetValue - goal.startValue;
  if (range === 0) return null;

  const sched = parseScheduleDays(goal.scheduleDays);
  const effectiveSched = sched.length > 0 ? sched : [0, 1, 2, 3, 4, 5, 6];

  // For target goals, use calculateEffortMetrics for exact consistency
  if (goal.goalType === 'target') {
    const metrics = calculateEffortMetrics(
      goal.startDate, goal.targetDate, effectiveSched,
      goal.targetValue, goal.currentValue, today, goal.startValue
    );
    const isLimit = goal.flexibilityRule === 'limit_avoid';
    let val: number;
    if (isLimit) {
      val = metrics.currentRate > 0 ? metrics.requiredRate / metrics.currentRate : (metrics.requiredRate > 0 ? 2.0 : 1.0);
    } else {
      val = metrics.requiredRate > 0 ? metrics.currentRate / metrics.requiredRate : (metrics.currentRate > 0 ? 2.0 : 1.0);
    }
    val = Math.round(val * 10) / 10;
    const label = val >= 1.05 ? 'Ahead' : val >= 0.95 ? 'On track' : val >= 0.8 ? 'Slightly behind' : 'Behind';
    const color = val >= 0.95 ? '#22C55E' : '#EF4444';
    return { value: val, label, color };
  }

  // Outcome goals: schedule-aware trajectory using yesterday as elapsed end
  const effectiveToday = today > goal.targetDate ? goal.targetDate : today;
  const yd = new Date(effectiveToday + 'T12:00:00');
  yd.setDate(yd.getDate() - 1);
  const ydStr = yd.toISOString().split('T')[0];
  const elapsedEnd = ydStr >= goal.startDate ? ydStr : goal.startDate;

  let totalDays: number;
  let elapsedDays: number;
  if (sched.length > 0) {
    totalDays = countScheduledDaysInRange(goal.startDate, goal.targetDate, sched);
    elapsedDays = countScheduledDaysInRange(goal.startDate, elapsedEnd, sched);
  } else {
    totalDays = Math.max(1, Math.round((new Date(goal.targetDate).getTime() - new Date(goal.startDate).getTime()) / 86400000) + 1);
    elapsedDays = Math.max(0, Math.round((new Date(elapsedEnd).getTime() - new Date(goal.startDate).getTime()) / 86400000) + 1);
  }

  if (totalDays <= 0 || elapsedDays <= 0) return { value: 1.0, label: 'On track', color: '#22C55E' };

  const timeProgress = elapsedDays / totalDays;
  const isDecrease = goal.targetValue < goal.startValue;
  const totalDelta = Math.abs(range);
  const actualDelta = isDecrease
    ? Math.max(0, goal.startValue - goal.currentValue)
    : Math.max(0, goal.currentValue - goal.startValue);
  const expectedDelta = timeProgress * totalDelta;

  const momentum = expectedDelta > 0 ? actualDelta / expectedDelta : (actualDelta > 0 ? 2.0 : 1.0);
  const val = Math.round(momentum * 10) / 10;
  const label = val >= 1.05 ? 'Ahead' : val >= 0.95 ? 'On track' : val >= 0.8 ? 'Slightly behind' : 'Behind';
  const color = val >= 0.95 ? '#22C55E' : '#EF4444';

  return { value: val, label, color };
}
