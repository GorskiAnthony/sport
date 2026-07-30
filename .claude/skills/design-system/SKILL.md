---
name: design-system
description: Tournoi Center's visual design language (colors, typography, shape, components) as extracted from the Angular web frontend. Load before styling or building any new UI surface — a new web page, a shared UI component, or a screen in the future Ionic mobile app — to keep the same look across platforms. Trigger on "design", "UI", "style", "theme", "composant", "écran mobile", "cohérence visuelle".
---

# Design system — Tournoi Center

Source of truth is the web app (`frontend/src/app`). This file is a snapshot extracted from
it — if the web design changes, update this file to match, don't let it drift.

## Theme

Dark-only interface, no light mode.

## Colors

- Page background: `#0D1117`
- Surface / card background: `#161B22`
- Primary / brand / "live" accent: Tailwind `green-400` / `green-500` (`#4ade80` / `#22c55e`) —
  CTAs, live indicators, success
- Danger (forfeit, errors): Tailwind `red-400` / `red-500`
- Warning (pending): Tailwind `amber-400` / `amber-500`
- Secondary accents (charts, occasional badges): `purple-500`, `blue-500` — used sparingly
- Neutral text/borders: Tailwind `slate` scale — `slate-300`/`slate-400` for secondary text,
  white/`slate-200` for headings
- Text on a primary (green) button is **black**, not white

## Typography

- Default font: Tailwind's default sans stack (no custom webfont loaded)
- `font-mono` for scores, numbers, live stats — visually separates data from prose

## Shape & elevation

- Cards/panels: `rounded-xl` or `rounded-2xl`
- Badges/chips: `rounded-full` or `rounded-lg`
- Buttons: `rounded` (small radius — buttons are the one exception to the xl/2xl card look)
- Shadows used sparingly (`shadow-lg` on elevated cards/modals); borders are preferred over
  shadow for separating surfaces

## Status colors (from `shared/ui/status-badge`)

Pattern: 20%-opacity tinted background + full-opacity text of the same hue.

- ONGOING (live): `bg-green-500/20 text-green-400`
- FINISHED: `bg-slate-500/20 text-slate-300`
- FORFEIT: `bg-red-500/20 text-red-400`
- default/pending: `bg-amber-500/20 text-amber-400`

## Buttons (from `shared/ui/button`)

Base: `inline-flex items-center gap-2 px-5 py-2.5 rounded font-medium text-sm transition-colors`

- `primary`: `bg-green-500 hover:bg-green-600 text-black`
- `outline`: `border border-slate-400 text-slate-300 hover:bg-[#161B22]`
- `ghost`: `text-slate-300 hover:bg-[#161B22]`

## Existing web component inventory

`frontend/src/app/shared/ui/`: button, status-badge, sport-icon, form-input, form-select,
password-input, auth-card, confirm-modal, share-modal, toast-container, page-header,
bracket-tree, group-standings, ranked-bars, round-planning, growth-chart, tournament-map,
format-picker.

When building a new screen (web or mobile), check here first for an equivalent — port the
visual language (colors, radius, status mapping) and behavior, not necessarily the markup
1:1.

## Applying this to the Ionic mobile app

Ionic ships its own components (`ion-button`, `ion-badge`, `ion-card`...) themed through CSS
custom properties in `variables.scss`. Inject the palette there instead of overriding Ionic's
generated classes:

```scss
:root {
  --ion-color-primary: #22c55e;
  --ion-color-primary-contrast: #000000;
  --ion-background-color: #0d1117;
  --ion-card-background: #161b22;
  --ion-color-danger: #ef4444;   /* red-500 */
  --ion-color-warning: #f59e0b; /* amber-500 */
}
```

- Recreate the ONGOING/FINISHED/FORFEIT/default badge color mapping for match/tournament
  status chips (`ion-badge` or a custom chip component).
- Keep a `font-mono` utility class for score/number displays — Ionic has no built-in concept
  for this.
- Default to Ionic's rounded card shape; align button corner radius down to match the web
  app's `rounded` (not `rounded-xl`) buttons if it diverges noticeably.

## Source files (web)

- Global styles / keyframes: `frontend/src/styles.css`
- Shared UI kit: `frontend/src/app/shared/ui/*`
- Tailwind v4 via `@import "tailwindcss"`, no `tailwind.config` theme override — the palette
  above is default Tailwind colors plus two custom surface hexes (`#0D1117`, `#161B22`)
