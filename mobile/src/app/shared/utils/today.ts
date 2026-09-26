/** Today's date as a local YYYY-MM-DD string, matching what a native <input type="date"> expects.
 *  Built from local getters (not toISOString) so it can't shift a day off near midnight in UTC-offset timezones. */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
