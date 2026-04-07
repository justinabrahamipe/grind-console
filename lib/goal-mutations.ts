import { db, tasks, goals } from "@/lib/db";
import { eq, and, or, gt } from "drizzle-orm";
import { getTodayString } from "@/lib/format";
import { deleteTasksByIds, getOwnedGoal } from "@/lib/db-utils";
import { generateGoalTasks, cleanupStaleGoalTasks } from "@/lib/ensure-upcoming-tasks";

// Recompute a goal's currentValue from its remaining (non-dismissed, completed-or-positive-value) tasks.
// No-op for outcome goals (their currentValue is set explicitly). Errors are logged, not thrown.
export async function recalculateGoalCurrentValue(goalId: number, userId: string): Promise<void> {
  try {
    const linkedGoal = await getOwnedGoal(goalId, userId);
    if (!linkedGoal || linkedGoal.goalType === 'outcome') return;
    const remaining = await db
      .select({ value: tasks.value })
      .from(tasks)
      .where(and(
        eq(tasks.goalId, goalId),
        eq(tasks.dismissed, false),
        or(eq(tasks.completed, true), gt(tasks.value, 0)),
      ));
    const newTotal = remaining.reduce((sum, t) => sum + (t.value ?? 0), 0);
    await db.update(goals).set({ currentValue: newTotal }).where(eq(goals.id, goalId));
  } catch (err) {
    console.error("Failed to recalculate goal currentValue:", err);
  }
}

export async function deleteFutureUncompletedTasks(goalId: number, userId: string): Promise<void> {
  const todayStr = getTodayString();
  const futureTasks = await db
    .select({ id: tasks.id, date: tasks.date })
    .from(tasks)
    .where(and(
      eq(tasks.goalId, goalId),
      eq(tasks.userId, userId),
      eq(tasks.completed, false),
    ));
  const futureIds = futureTasks.filter(t => t.date > todayStr).map(t => t.id);
  await deleteTasksByIds(futureIds);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function regenerateGoalTasksIfNeeded(goalId: number, userId: string, existing: any, body: any, updated: any): Promise<void> {
  const rangeOrScheduleChanged = (
    body.targetDate !== undefined ||
    body.startDate !== undefined ||
    body.scheduleDays !== undefined ||
    (body.autoCreateTasks === true && !existing.autoCreateTasks)
  );
  if (!rangeOrScheduleChanged) return;

  const autoCreate = updated?.autoCreateTasks ?? (body.autoCreateTasks !== undefined ? body.autoCreateTasks : existing.autoCreateTasks);
  const status = updated?.status ?? (body.status || existing.status);

  if (autoCreate && status === 'active') {
    // generateGoalTasks runs cleanup + creation in one pass
    await generateGoalTasks(userId, goalId);
  } else {
    // autoCreate off or goal inactive: still prune tasks that no longer fit the goal
    await cleanupStaleGoalTasks(userId, goalId);
  }
}
