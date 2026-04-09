"use client";

import { motion } from "framer-motion";
import { FaBullseye } from "react-icons/fa";
import Link from "next/link";
import { getProgressColor } from "@/lib/scoring";
import type { OutcomeData } from "@/lib/types";

interface GoalProgressProps {
  outcomesData: OutcomeData[];
  completionDates: Record<number, { date: string; value: number; completed: boolean }[]>;
  today: string;
}

export default function GoalProgress({ outcomesData, completionDates, today }: GoalProgressProps) {
  if (outcomesData.length === 0) return null;

  // Hide habitual goals (shown in HabitTracker) and goals that haven't started
  const visibleGoals = outcomesData.filter((o) => {
    if (o.goalType === 'habitual') return false;
    const start = o.startDate || today;
    if (start > today) return false;
    return true;
  });

  if (visibleGoals.length === 0) return null;

  const totalProgress = visibleGoals.reduce((sum, o) => {
    const range = o.targetValue - o.startValue;
    if (range === 0) return sum;
    const p = (o.currentValue - o.startValue) / range * 100;
    return sum + Math.min(p, 100);
  }, 0);
  const overallPct = Math.round(totalProgress / visibleGoals.length);

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 mb-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <FaBullseye className="text-lg text-emerald-500" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Targets & Outcomes</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-emerald-500">{overallPct}%</span>
          <Link href="/goals">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">View All</span>
          </Link>
        </div>
      </div>
      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(overallPct, 100))}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-emerald-500"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {visibleGoals.map((goal) => {
          const isHabitual = goal.goalType === 'habitual';
          const range = goal.targetValue - goal.startValue;

          const progress = range === 0 ? 0 : Math.round(Math.min(
            (goal.currentValue - goal.startValue) / range * 100, 100
          ));
          const subtitle = goal.goalType === 'project' && goal.targetValue === 0
            ? 'No steps yet'
            : `${goal.currentValue} / ${goal.targetValue} ${goal.unit}`;
          const progressColor = getProgressColor(progress);

          // Compute trajectory: compare current vs expected based on time elapsed
          let trajectory: { label: string; color: string } | null = null;
          if (goal.startDate && goal.targetDate && range !== 0) {
            const totalMs = new Date(goal.targetDate).getTime() - new Date(goal.startDate).getTime();
            const elapsedMs = new Date(today > goal.targetDate ? goal.targetDate : today).getTime() - new Date(goal.startDate).getTime();
            if (totalMs > 0 && elapsedMs >= 0) {
              const timeProgress = elapsedMs / totalMs;
              const expectedValue = goal.startValue + range * timeProgress;
              const isDecrease = goal.targetValue < goal.startValue;
              const onTrack = isDecrease ? goal.currentValue <= expectedValue : goal.currentValue >= expectedValue;
              const deviation = Math.abs(goal.currentValue - expectedValue) / Math.abs(range);
              if (progress >= 100) {
                trajectory = { label: 'Done', color: '#22C55E' };
              } else if (onTrack) {
                trajectory = { label: deviation > 0.15 ? 'Ahead' : 'On track', color: '#22C55E' };
              } else {
                trajectory = { label: deviation > 0.15 ? 'Behind' : 'Slightly behind', color: '#EF4444' };
              }
            }
          }

          return (
            <div
              key={goal.id}
              className="relative rounded-xl p-3 overflow-hidden border border-zinc-200 dark:border-zinc-700"
            >
              <div
                className="absolute inset-0 opacity-15 dark:opacity-20"
                style={{
                  background: progressColor,
                  width: `${Math.max(0, progress)}%`,
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{goal.name}</div>
                  {trajectory && (
                    <span className="text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: trajectory.color + '18', color: trajectory.color }}>
                      {trajectory.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-bold" style={{ color: progressColor }}>{progress}%</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
