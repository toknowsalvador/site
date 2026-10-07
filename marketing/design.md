# Design direction — Salvador Trip Concierge landing

Approved by the team on 2026-10-07: **A — Fitas do Bonfim**. Independent of `toknowsalvador.com` (see `decisions.md`).

## Idea

The colored ribbons of Senhor do Bonfim — the most recognizable small object of Salvador, tied on wrists and church railings for good luck — hang from the top of the page. Everything else is clean, white and bold, so the photos and the CTA carry the page. Energetic and festive, but disciplined.

## Tokens

| Token | Hex | Use |
|---|---|---|
| `--paper` | #FFFFFF | page background |
| `--mist` | #F3F4F6 | alternate section background, form section |
| `--ink` | #141821 | headings, body text |
| `--ink-2` | #454B57 | secondary text (≥ 7:1 on white) |
| `--cta` | #1D4ED8 | **CTA only** (white text) |
| ribbons | #E63946 red · #FFD23F yellow · #2A9D8F teal · #F472B6 pink · #8B5CF6 violet · #F97316 orange | ribbons and category tabs only — never text, never buttons |

## Type

- Headings: **Bricolage Grotesque 800**, tight leading (≈1.02), slight negative tracking.
- Body/UI: **Figtree** 400 / 600 / 700.
- Sentence case everywhere. No all-caps labels, no eyebrows, no arrows in buttons.

## Signature (use only here)

1. Six ribbons of uneven length hanging from the top edge of the hero.
2. Each "What we handle" category card carries a hanging ribbon tab in one ribbon color.

Nowhere else. Numbers only in "How it works" (a real sequence).

## Layout (v2)

- Mobile: ribbons → photo (16:9, ≤ 32svh) → headline → rating strip → form card (step 1: month buttons in a horizontal scroll row, trip length buttons, travelers − / +). First action visible on a 375×667 screen.
- Desktop: ribbons across the top; copy + form card left (7fr), photo right (5fr, sticky); all of step 1 above the fold at 1440×900.
- After the FAQ, a final CTA scrolls back to the form. The sticky mobile CTA shows only when the hero/form is off screen.
- Cookie bar: one line at the bottom on mobile; small card bottom-right on desktop.
- Grid children that contain scrolling rows need `min-width: 0` (a nowrap row otherwise widens the whole page).
- Radii: photos 22px, cards 16–20px, buttons 12–14px.
