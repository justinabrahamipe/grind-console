"use client";

import { useMemo } from "react";
import { FaFire } from "react-icons/fa";
import type { OutcomeData } from "@/lib/types";
import { parseScheduleDays } from "@/lib/format";

interface HabitTrackerProps {
  outcomesData: OutcomeData[];
  completionDates: Record<number, { date: string; value: number; completed: boolean }[]>;
  today: string;
}

export default function HabitTracker({ outcomesData, completionDates, today }: HabitTrackerProps) {
  const habitGoals = outcomesData.filter(o => o.goalType === 'habitual');
  if (habitGoals.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FaFire className="text-lg text-orange-500" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Habits</h2>
      </div>
      <div className="space-y-4">
        {habitGoals.map(goal => (
          <HabitRow key={goal.id} goal={goal} completionDates={completionDates} today={today} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-zinc-400 dark:text-zinc-500">
        <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> <span>Hit</span>
        <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block ml-1" /> <span>Partial</span>
        <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block ml-1" /> <span>Today</span>
        <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block ml-1" /> <span>Miss</span>
        <span className="w-2.5 h-2.5 rounded-sm bg-zinc-200 dark:bg-zinc-700 inline-block ml-1" /> <span>Off</span>
      </div>
    </div>
  );
}

function HabitRow({ goal, completionDates, today }: { goal: OutcomeData; completionDates: Record<number, { date: string; value: number; completed: boolean }[]>; today: string }) {
  const scheduleDays: number[] = parseScheduleDays(goal.scheduleDays);
  const entries = completionDates[goal.id] || [];

  const { weeks, adherence } = useMemo(() => {
    // Build value map
    const dateValues = new Map<string, number>();
    const postponedSet = new Set<string>();
    for (const e of entries) {
      if (e.value === -1) {
        postponedSet.add(e.date);
      } else {
        dateValues.set(e.date, (dateValues.get(e.date) || 0) + e.value);
      }
    }

    // Build days array — last 8 weeks (56 days)
    const todayDate = new Date(today + 'T12:00:00');
    const startDate = new Date(todayDate);
    startDate.setDate(startDate.getDate() - 55);
    // Align to Monday
    const startDow = startDate.getDay();
    const mondayOffset = startDow === 0 ? 6 : startDow - 1;
    startDate.setDate(startDate.getDate() - mondayOffset);

    type DayInfo = { date: string; status: 'done' | 'partial' | 'missed' | 'today' | 'future' | 'off' | 'postponed' | 'before'; dayOfWeek: number };
    const weeksArr: DayInfo[][] = [];
    let currentWeek: DayInfo[] = [];

    const d = new Date(startDate);
    while (d <= todayDate || currentWeek.length > 0 && currentWeek.length < 7) {
      const dateStr = d.toISOString().split('T')[0];
      const dow = d.getDay();
      const mondayDow = dow === 0 ? 6 : dow - 1;
      const isScheduled = scheduleDays.length === 0 || scheduleDays.includes(dow);
      const isBeforeStart = goal.startDate && dateStr < goal.startDate;
      const isFuture = dateStr > today;

      let status: DayInfo['status'];
      if (isBeforeStart || isFuture) {
        status = isFuture ? 'future' : 'before';
      } else if (!isScheduled) {
        status = 'off';
      } else if (dateValues.has(dateStr)) {
        const val = dateValues.get(dateStr) || 0;
        if (goal.dailyTarget && goal.completionType !== 'checkbox' && val < goal.dailyTarget) {
          status = 'partial';
        } else {
          status = 'done';
        }
      } else if (postponedSet.has(dateStr)) {
        status = 'postponed';
      } else if (dateStr === today) {
        status = 'today';
      } else {
        status = 'missed';
      }

      if (mondayDow === 0 && currentWeek.length > 0) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push({ date: dateStr, status, dayOfWeek: dow });
      d.setDate(d.getDate() + 1);
      if (d > todayDate && currentWeek.length === 7) break;
    }
    if (currentWeek.length > 0) weeksArr.push(currentWeek);

    // Calculate adherence
    const adhStart = goal.startDate && goal.startDate <= today ? goal.startDate : today;
    let exp = 0;
    const iter = new Date(adhStart + 'T00:00:00');
    const endD = new Date(today + 'T00:00:00');
    while (iter <= endD) {
      if (scheduleDays.length === 0 || scheduleDays.includes(iter.getDay())) exp++;
      iter.setDate(iter.getDate() + 1);
    }
    let h = 0;
    if (!goal.dailyTarget || goal.completionType === 'checkbox') {
      const uniqueDone = new Set([...dateValues.keys()].filter(dd => dd >= adhStart && dd <= today));
      h = Math.min(uniqueDone.size, exp);
    } else {
      for (const [dd, val] of dateValues) {
        if (dd >= adhStart && dd <= today) h += Math.min(val / goal.dailyTarget, 1);
      }
      h = Math.min(h, exp);
    }
    const adh = exp > 0 ? Math.round((h / exp) * 100) : 0;

    return { weeks: weeksArr, adherence: adh };
  }, [entries, today, goal.startDate, goal.dailyTarget, goal.completionType, scheduleDays]);

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getCellClass = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500 dark:bg-green-400';
      case 'partial': return 'bg-amber-400';
      case 'today': return 'bg-blue-400 dark:bg-blue-500 ring-1 ring-blue-500/50';
      case 'missed': return 'bg-red-400 dark:bg-red-500/70';
      case 'off': case 'postponed': return 'bg-zinc-200 dark:bg-zinc-700';
      default: return 'bg-zinc-100 dark:bg-zinc-800 opacity-30';
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {goal.pillarEmoji && <span className="text-xs">{goal.pillarEmoji}</span>}
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{goal.name}</span>
        <span className={`text-xs font-semibold ml-auto ${
          adherence >= 80 ? 'text-green-500' : adherence >= 50 ? 'text-amber-500' : 'text-red-500'
        }`}>{adherence}%</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-0.5">
          <div className="flex flex-col gap-0.5 mr-1">
            {dayLabels.map((label, i) => (
              <div key={i} className="w-3 h-3 text-[9px] text-zinc-400 dark:text-zinc-500 flex items-center justify-center">
                {i % 2 === 0 ? label : ''}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${
                    day.status === 'done' ? 'Done' : day.status === 'partial' ? 'Partial' : day.status === 'today' ? 'In progress' : day.status === 'missed' ? 'Missed' : day.status === 'off' ? 'Off day' : day.status === 'postponed' ? 'Postponed' : 'Upcoming'
                  }`}
                  className={`w-3 h-3 rounded-sm ${getCellClass(day.status)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
