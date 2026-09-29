import { CATEGORIES } from './categories';

export const TOURNAMENT_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category.label]),
);
