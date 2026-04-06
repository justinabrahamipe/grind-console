import { NextResponse } from "next/server";
import { db, goals, taskSchedules } from "@/lib/db";
import { eq, isNotNull } from "drizzle-orm";

const DAY_MAP: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

function fixJsonDays(raw: string): string | null {
  // Already valid JSON array of numbers
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(n => typeof n === "number")) return null; // already fine
  } catch { /* not valid JSON */ }

  // Try comma-separated day names: "mon,tue,wed" or "\"mon\"" etc
  const cleaned = raw.replace(/["\[\]]/g, "");
  const days = cleaned.split(",").map(s => DAY_MAP[s.trim().toLowerCase()]).filter(n => n !== undefined);
  if (days.length > 0) return JSON.stringify(days);

  // Try as single day name
  const single = DAY_MAP[cleaned.trim().toLowerCase()];
  if (single !== undefined) return JSON.stringify([single]);

  return "[]";
}

export async function POST() {
  const fixed: string[] = [];

  // Fix goals.scheduleDays
  const allGoals = await db.select({ id: goals.id, name: goals.name, scheduleDays: goals.scheduleDays })
    .from(goals).where(isNotNull(goals.scheduleDays));

  for (const g of allGoals) {
    if (!g.scheduleDays) continue;
    const newVal = fixJsonDays(g.scheduleDays);
    if (newVal !== null) {
      await db.update(goals).set({ scheduleDays: newVal }).where(eq(goals.id, g.id));
      fixed.push(`Goal ${g.id} "${g.name}": "${g.scheduleDays}" -> ${newVal}`);
    }
  }

  // Fix taskSchedules.customDays
  const allSchedules = await db.select({ id: taskSchedules.id, name: taskSchedules.name, customDays: taskSchedules.customDays })
    .from(taskSchedules).where(isNotNull(taskSchedules.customDays));

  for (const s of allSchedules) {
    if (!s.customDays) continue;
    const newVal = fixJsonDays(s.customDays);
    if (newVal !== null) {
      await db.update(taskSchedules).set({ customDays: newVal }).where(eq(taskSchedules.id, s.id));
      fixed.push(`Schedule ${s.id} "${s.name}": "${s.customDays}" -> ${newVal}`);
    }
  }

  return NextResponse.json({ fixed, count: fixed.length });
}
