# Decisions

Newest first. To reverse a decision, add a new entry citing the evidence.

## 2026-10-07 — No budget question
- Removed "Budget per person" from the form and the `budget` sheet column; budget is discussed on WhatsApp. Copy `landing-v3.md`. **Why:** the team found asking about money right after name and WhatsApp too invasive; a shorter step 2 also lowers friction. **Cost:** no spend signal before the first conversation.

## 2026-10-07 — Landing v2 (pre-launch CRO audit)
- Form moves into the hero; step 1 asks month + trip length (buttons) + travelers instead of exact dates; confirmation state after submit; compact cookie bar; copy `landing-v2.md` approved with the design. Sheet columns `arrival`/`departure`/`dates_unknown` become `month`/`duration`. **Why:** the form sat 8.3 screens down; date pickers were the main friction; the cookie banner hid the CTA on small phones. Applied before launch, so no EXP entry.

## 2026-10-07 — Landing has its own visual identity
- The campaign page must not use `toknowsalvador.com` as a base for anything (colors, fonts, layout). It gets a new identity aimed at top conversion and visual quality; direction approved by the team is recorded in `marketing/design.md`. **Why:** the page is separate on purpose. **Supersedes:** first build, which reused the main site's dark base and DM Sans + Playfair.

## 2026-10-07 — Copy v1 approved
- `marketing/copy/landing-v1.md` and `marketing/copy/ads-v1.md` approved by the team. "Who we are" is provisional and will be revisited. **Why:** brief complete enough to launch; all claims verified.

## 2026-10-07 — Partners stay anonymous
- Partners are never named or linked on the page or in ads; the client deals only with To Know Salvador. Restaurants/events may be named later (on hold). **Why:** keep the relationship centralized with us.

## 2026-10-07 — Pricing: custom quote, no fixed fee
- No fixed planning fee. Price depends on what each traveler needs; the quote is built on WhatsApp and covers the services we provide (we deliver the trip, not only a plan). Page and ads never show a price; the offer is "free custom quote, pay only after you approve". **Why:** needs vary too much for a fixed price; understanding them requires a conversation. **Supersedes:** spec assumption of a separate planning fee.

## 2026-10-07 — Initial campaign setup
- Conversion = 2-step qualification form → Google Sheets → WhatsApp with prefilled text. Sales (quote + payment) happen on WhatsApp. **Why:** quote before charging; reliable Lead event for Google Ads; filters bad leads.
- English only. **Why:** validate the offer before multiplying cost.
- Google Search only, ≤ R$ 1.000/month. **Why:** budget; captures high intent.
- Leads stored in Google Sheets via Apps Script. **Why:** free, works on a static site.
- Landing in `plan/` of this repo, deployed by Cloudflare Pages to `plan.toknowsalvador.com`, noindex. **Why:** GitHub Pages allows one domain per repo; keeps page, skills and history together.
- Expected volume ~100–300 clicks and ~5–25 leads/month → no statistical A/B tests; use practical rules. **Why:** sample too small.
