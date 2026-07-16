/** Cosmetic-only slug appended to a tournament's public link (e.g. /t/18-coupe-de-printemps).
 *  The numeric id stays authoritative for routing -- this never needs to be unique. */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function tournamentShareSlug(id: number, name: string): string {
  const slug = slugify(name);
  return slug ? `${id}-${slug}` : String(id);
}
