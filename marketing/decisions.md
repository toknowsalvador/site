# Decisions

Newest first. To reverse a decision, add a new entry citing the evidence.

## 2026-10-07 — Initial campaign setup
- Conversion = 2-step qualification form → Google Sheets → WhatsApp with prefilled text. Sales (quote + payment) happen on WhatsApp. **Why:** quote before charging; reliable Lead event for Google Ads; filters bad leads.
- English only. **Why:** validate the offer before multiplying cost.
- Google Search only, ≤ R$ 1.000/month. **Why:** budget; captures high intent.
- Leads stored in Google Sheets via Apps Script. **Why:** free, works on a static site.
- Landing in `plan/` of this repo, deployed by Cloudflare Pages to `plan.toknowsalvador.com`, noindex. **Why:** GitHub Pages allows one domain per repo; keeps page, skills and history together.
- Expected volume ~100–300 clicks and ~5–25 leads/month → no statistical A/B tests; use practical rules. **Why:** sample too small.
