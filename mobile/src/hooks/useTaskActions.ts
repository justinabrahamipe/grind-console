import { useState } from "react";
import { api, ApiRequestError } from "../api/client";
import { Task } from "../api/types";
import { addDays, todayString } from "../utils/date";

/** Shared task-mutation logic for any screen rendering tasks (TaskListView, goal detail, etc). Mirrors app/tasks/hooks/useTasksPage.ts on the web. */
export function useTaskActions(
  applyPatch: (taskId: number, patch: Partial<Task>) => void,
  onError?: (message: string) => void,
  onRemoved?: (taskId: number) => void,
) {
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());

  const setBusy = (taskId: number, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  };

  const complete = async (task: Task, completed: boolean, value: number) => {
    setBusy(task.id, true);
    applyPatch(task.id, { completed, value });
    try {
      await api.post("/api/tasks/complete", { taskId: task.id, date: task.date, completed, value });
    } catch (err) {
      applyPatch(task.id, { completed: task.completed, value: task.value });
      onError?.(err instanceof ApiRequestError ? err.message : "Couldn't update task.");
    } finally {
      setBusy(task.id, false);
    }
  };

  const checkboxToggle = (task: Task) => {
    const nextCompleted = !task.completed;
    complete(task, nextCompleted, nextCompleted ? 1 : 0);
  };

  const countChange = (task: Task, delta: number) => {
    const newValue = Math.max(0, task.value + delta);
    const isLimit = task.flexibilityRule === "limit_avoid";
    const completed = isLimit ? task.completed : task.target ? newValue >= task.target : newValue > 0;
    complete(task, completed, newValue);
  };

  const toggleSkip = async (task: Task) => {
    const nextSkipped = !task.skipped;
    setBusy(task.id, true);
    applyPatch(task.id, { skipped: nextSkipped });
    try {
      await api.post("/api/tasks/skip", { taskId: task.id, skipped: nextSkipped, date: task.date });
    } catch (err) {
      applyPatch(task.id, { skipped: task.skipped });
      onError?.(err instanceof ApiRequestError ? err.message : "Couldn't update task.");
    } finally {
      setBusy(task.id, false);
    }
  };

  const reschedule = async (task: Task, deltaDays: number) => {
    if (!task.date) return;
    const newDate = addDays(task.date, deltaDays);
    setBusy(task.id, true);
    try {
      await api.put(`/api/tasks/${task.id}`, { startDate: newDate });
      onRemoved?.(task.id);
    } catch (err) {
      onError?.(err instanceof ApiRequestError ? err.message : "Couldn't reschedule task.");
    } finally {
      setBusy(task.id, false);
    }
  };

  const scheduleToday = async (task: Task) => {
    setBusy(task.id, true);
    try {
      await api.put(`/api/tasks/${task.id}`, { startDate: todayString() });
      onRemoved?.(task.id);
    } catch (err) {
      onError?.(err instanceof ApiRequestError ? err.message : "Couldn't schedule task.");
    } finally {
      setBusy(task.id, false);
    }
  };

  const remove = async (task: Task) => {
    setBusy(task.id, true);
    try {
      await api.delete(`/api/tasks/${task.id}`);
      onRemoved?.(task.id);
    } catch (err) {
      onError?.(err instanceof ApiRequestError ? err.message : "Couldn't delete task.");
    } finally {
      setBusy(task.id, false);
    }
  };

  return { busyIds, checkboxToggle, countChange, toggleSkip, reschedule, scheduleToday, remove };
}
