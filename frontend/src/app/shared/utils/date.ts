/** Formats an ISO date-only string ("2026-11-01") in French, parsed as a local calendar
 *  date (not UTC) so it can't shift by a day depending on the visitor's timezone. */
export function formatDateFr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
