import { calculateMomentum, calculateTrajectory } from './momentum';
import type { GoalForMomentum } from './types';

export interface GoalBadge {
  value: number;   // e.g. 1.5
  label: string;   // e.g. "Ahead"
  color: string;   // hex color
}

/**
 * Compute a consistent momentum/trajectory badge for any goal type.
 * Uses schedule-aware calculations from lib/momentum.ts.
 * Returns null for project goals or goals without dates.
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
  pillarId?: number | null;
  flexibilityRule?: string;
}, today: string): GoalBadge | null {
  if (goal.goalType === 'project' || goal.goalType === 'habitual') return null;
  if (!goal.startDate || !goal.targetDate) return null;
  const range = goal.targetValue - goal.startValue;
  if (range === 0) return null;

  const g: GoalForMomentum = {
    id: goal.id,
    goalType: goal.goalType,
    pillarId: goal.pillarId ?? null,
    targetValue: goal.targetValue,
    startValue: goal.startValue,
    currentValue: goal.currentValue,
    startDate: goal.startDate,
    targetDate: goal.targetDate,
    scheduleDays: goal.scheduleDays,
    flexibilityRule: goal.flexibilityRule,
  };

  if (goal.goalType === 'target') {
    const result = calculateMomentum([g], [], today);
    if (result.goals.length === 0) return null;
    const m = result.goals[0];
    const val = Math.round(m.momentum * 10) / 10;
    const label = val >= 1.05 ? 'Ahead' : val >= 0.95 ? 'On track' : 'Behind';
    return { value: val, label, color: val >= 0.95 ? '#22C55E' : '#EF4444' };
  }

  // outcome goals
  const result = calculateTrajectory([g], today);
  if (result.goals.length === 0) return null;
  const t = result.goals[0];
  const val = Math.round(t.trajectory * 10) / 10;
  const label = val >= 1.05 ? 'Ahead' : val >= 0.95 ? 'On track' : val >= 0.8 ? 'Slightly behind' : 'Behind';
  return { value: val, label, color: val >= 0.95 ? '#22C55E' : '#EF4444' };
}
