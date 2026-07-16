/** Guards against open-redirect: only same-origin, path-relative URLs from a query
 *  param (e.g. ?returnUrl=/t/18-mon-tournoi) are ever followed after auth. */
export function sanitizeReturnUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return null;
  }
  return url;
}
