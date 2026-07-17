/** Mirrors the backend's Integer.MAX_VALUE sentinel for "unlimited" (PlanLimits.java). */
export const UNLIMITED_PLAN_LIMIT = 2147483647;

/** Percentage of a plan limit used, clamped to [0, 100] — or `null` when the limit is
 *  unlimited (nothing meaningful to show as a usage bar in that case). */
export function planUsagePercent(used: number, max: number): number | null {
  if (max >= UNLIMITED_PLAN_LIMIT) return null;
  if (max <= 0) return 0;
  return Math.min(100, Math.round((used / max) * 100));
}
