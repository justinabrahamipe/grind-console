// Shared helpers for task and schedule mutations used by REST and MCP handlers.

const TASK_FIELDS = [
  'name', 'pillarId', 'completionType', 'target', 'unit', 'basePoints',
  'goalId', 'periodId', 'date', 'flexibilityRule', 'limitValue', 'description',
] as const;

const SCHEDULE_FIELDS = [
  'name', 'pillarId', 'completionType', 'target', 'unit', 'flexibilityRule',
  'frequency', 'customDays', 'repeatInterval', 'basePoints', 'limitValue',
  'goalId', 'periodId', 'startDate', 'endDate', 'description',
] as const;

// Fields propagated from a schedule edit (or goal edit) onto its uncompleted future task instances.
const TASK_PROPAGATION_FIELDS = [
  'name', 'pillarId', 'completionType', 'target', 'unit', 'basePoints',
  'flexibilityRule', 'limitValue',
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickDefined(src: any, fields: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (src[f] !== undefined) out[f] = src[f];
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapTaskUpdateFields(src: any): Record<string, unknown> {
  const u = pickDefined(src, TASK_FIELDS);
  // Normalize nullables consistently with prior behavior
  if (src.pillarId !== undefined) u.pillarId = src.pillarId || null;
  if (src.unit !== undefined) u.unit = src.unit || null;
  if (src.goalId !== undefined) u.goalId = src.goalId === 0 ? null : (src.goalId || null);
  if (src.periodId !== undefined) u.periodId = src.periodId === 0 ? null : (src.periodId || null);
  if (src.limitValue !== undefined) u.limitValue = src.limitValue ?? null;
  if (src.description !== undefined) u.description = src.description || null;
  if (src.date === '' || src.date === null) u.isHighlighted = false;
  return u;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapScheduleUpdateFields(src: any): Record<string, unknown> {
  const u = pickDefined(src, SCHEDULE_FIELDS);
  if (src.pillarId !== undefined) u.pillarId = src.pillarId || null;
  if (src.unit !== undefined) u.unit = src.unit || null;
  if (src.goalId !== undefined) u.goalId = src.goalId === 0 ? null : (src.goalId || null);
  if (src.periodId !== undefined) u.periodId = src.periodId === 0 ? null : (src.periodId || null);
  if (src.limitValue !== undefined) u.limitValue = src.limitValue ?? null;
  if (src.description !== undefined) u.description = src.description || null;
  if (src.endDate !== undefined) u.endDate = src.endDate || null;
  return u;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildTaskPropagationFields(src: any): Record<string, unknown> {
  const u = pickDefined(src, TASK_PROPAGATION_FIELDS);
  if (src.pillarId !== undefined) u.pillarId = src.pillarId || null;
  if (src.unit !== undefined) u.unit = src.unit || null;
  if (src.limitValue !== undefined) u.limitValue = src.limitValue ?? null;
  return u;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPillarUpdateFields(src: any): Record<string, unknown> {
  const u: Record<string, unknown> = {};
  if (src.name !== undefined) u.name = src.name;
  if (src.emoji !== undefined) u.emoji = src.emoji;
  if (src.color !== undefined) u.color = src.color;
  if (src.defaultBasePoints !== undefined) u.defaultBasePoints = src.defaultBasePoints;
  if (src.description !== undefined) u.description = src.description || null;
  return u;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapCycleUpdateFields(src: any): Record<string, unknown> {
  const u: Record<string, unknown> = {};
  if (src.name !== undefined) u.name = src.name;
  if (src.startDate !== undefined) u.startDate = src.startDate;
  if (src.endDate !== undefined) u.endDate = src.endDate;
  if (src.vision !== undefined) u.vision = src.vision || null;
  if (src.theme !== undefined) u.theme = src.theme || null;
  return u;
}
