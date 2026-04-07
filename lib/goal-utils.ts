// Shared helpers for goal mutations used by REST and MCP handlers.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapGoalUpdateFields(src: any): Record<string, unknown> {
  const u: Record<string, unknown> = {};
  if (src.name !== undefined) u.name = src.name;
  if (src.pillarId !== undefined) u.pillarId = src.pillarId || null;
  if (src.startValue !== undefined) u.startValue = src.startValue;
  if (src.targetValue !== undefined) u.targetValue = src.targetValue;
  if (src.unit !== undefined) u.unit = src.unit;
  if (src.startDate !== undefined) u.startDate = src.startDate || null;
  if (src.targetDate !== undefined) u.targetDate = src.targetDate || null;
  if (src.periodId !== undefined) u.periodId = src.periodId === 0 ? null : (src.periodId || null);
  if (src.goalType !== undefined) u.goalType = src.goalType;
  if (src.scheduleDays !== undefined) {
    u.scheduleDays = Array.isArray(src.scheduleDays) ? JSON.stringify(src.scheduleDays) : null;
  }
  if (src.autoCreateTasks !== undefined) u.autoCreateTasks = src.autoCreateTasks;
  if (src.completionType !== undefined) u.completionType = src.completionType;
  if (src.dailyTarget !== undefined) u.dailyTarget = src.dailyTarget ?? null;
  if (src.flexibilityRule !== undefined) u.flexibilityRule = src.flexibilityRule;
  if (src.limitValue !== undefined) u.limitValue = src.limitValue ?? null;
  if (src.basePoints !== undefined) u.basePoints = src.basePoints ?? 10;
  if (src.status !== undefined) u.status = src.status;
  return u;
}

// Build the (tasks, schedules) propagation pair for a goal edit.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildGoalPropagationPair(src: any): { tasks: Record<string, unknown>; schedules: Record<string, unknown> } {
  const t: Record<string, unknown> = {};
  const s: Record<string, unknown> = {};
  const set = (key: string, val: unknown, scheduleKey: string = key) => { t[key] = val; s[scheduleKey] = val; };
  if (src.name !== undefined) set('name', src.name);
  if (src.pillarId !== undefined) set('pillarId', src.pillarId || null);
  if (src.completionType !== undefined) set('completionType', src.completionType);
  if (src.unit !== undefined) set('unit', src.unit || null);
  if (src.flexibilityRule !== undefined) set('flexibilityRule', src.flexibilityRule);
  if (src.limitValue !== undefined) set('limitValue', src.limitValue ?? null);
  // dailyTarget on the goal maps to "target" on tasks/schedules
  if (src.dailyTarget !== undefined) { t.target = src.dailyTarget; s.target = src.dailyTarget; }
  if (src.basePoints !== undefined) set('basePoints', src.basePoints ?? 10);
  if (src.periodId !== undefined) set('periodId', src.periodId || null);
  return { tasks: t, schedules: s };
}
