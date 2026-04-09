import { countScheduledDaysInRange } from './effort-calculations';
import { parseScheduleDays } from './format';

export interface GoalBadge {
  value: number;   // e.g. 1.5
  label: string;   // e.g. "Ahead"
  color: string;   // hex color
}

/**
 * Compute a consistent momentum/trajectory badge for any goal type.
 * Uses schedule-aware calculations matching effort-calculations.ts.
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
  const effectiveToday = today > goal.targetDate ? goal.targetDate : today;

  // Use scheduled days if available, otherwise calendar days
  let totalDays: number;
  let elapsedDays: number;
  if (sched.length > 0) {
    totalDays = countScheduledDaysInRange(goal.startDate, goal.targetDate, sched);
    elapsedDays = countScheduledDaysInRange(goal.startDate, effectiveToday, sched);
  } else {
    totalDays = Math.max(1, Math.round((new Date(goal.targetDate).getTime() - new Date(goal.startDate).getTime()) / 86400000) + 1);
    elapsedDays = Math.max(1, Math.round((new Date(effectiveToday).getTime() - new Date(goal.startDate).getTime()) / 86400000) + 1);
  }

  if (totalDays <= 0 || elapsedDays <= 0) return null;

  const timeProgress = elapsedDays / totalDays;
  const isDecrease = goal.targetValue < goal.startValue;
  const totalDelta = Math.abs(range);
  const actualDelta = isDecrease
    ? Math.max(0, goal.startValue - goal.currentValue)
    : Math.max(0, goal.currentValue - goal.startValue);
  const expectedDelta = timeProgress * totalDelta;

  const isLimit = goal.flexibilityRule === 'limit_avoid';
  let momentum: number;
  if (isLimit) {
    momentum = actualDelta > 0 ? expectedDelta / actualDelta : (expectedDelta > 0 ? 2.0 : 1.0);
  } else {
    momentum = expectedDelta > 0 ? actualDelta / expectedDelta : (actualDelta > 0 ? 2.0 : 1.0);
  }

  const val = Math.round(momentum * 10) / 10;
  const label = val >= 1.05 ? 'Ahead' : val >= 0.95 ? 'On track' : val >= 0.8 ? 'Slightly behind' : 'Behind';
  const color = val >= 0.95 ? '#22C55E' : '#EF4444';

  return { value: val, label, color };
}
