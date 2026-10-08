# Decisions

Newest first. To reverse a decision, add a new entry citing the evidence.

## 2026-10-08 — Proof section: group photo wall + Viator (copy v6)
- Proof opens with 7 real group photos (option A of 3 rendered; team chose it), then the ratings. TripAdvisor and Viator are one rating, "5.0 · TripAdvisor & Viator, 161 reviews", because Viator labels its 161 as combined Viator + Tripadvisor totals; "800+" stays the total (Viator never added). **Why:** the team found the proof weak (numbers and one quote, no faces); families and groups are the priority audience. Pre-launch, so no EXP.
- Same day: proof moved to right after the hero (mist background) and the wall's last photo replaced with the current hero photo (the hero gets a new photo). **Why:** visitors who scroll past the form are deciding whether to trust us; faces and ratings answer that before the explanation sections.
- Hero photo: the team's own photo of drummers in front of São Francisco Church (source `public/tambores-pelourinho.png`, 1100px), cropped to leave out the "Carnaval da Bahia 2026 · Governo do Estado" sign; separate mobile (16:9) and desktop (4:5) crops via `<picture>`. **Why:** the hero now sells Salvador itself while the proof wall right below shows the travelers; the sign could suggest an official partnership and dates the photo.
- Google Ads: payment method added to take the R$ 1.200 → R$ 2.400 credit offer; tax info accepted (2026-10-07).

## 2026-10-07 — Phone validation with libphonenumber-js
- The WhatsApp field validates with Google's libphonenumber rules (libphonenumber-js 1.13.14, min bundle, ~43 KB gzipped, vendored, MIT), loaded lazily on the first form interaction; full country list (246) with the browser's country preselected; live preview "We'll message you at +1 415 555 0100"; fallback to calling-code rules if it fails to load. First JS library on the page — exception recorded in the sales-page-builder skill. **Why:** wrong numbers make a lead unreachable when the visitor doesn't send the WhatsApp message.
- Fix found while testing: the first form interaction is now detected on tap/click/change too (Safari doesn't focus radios on tap), so `form_start` is no longer undercounted on iPhone.

## 2026-10-07 — Lead conversion comes from GA4
- Google Ads "TKS Lead" is the GA4 key event `generate_lead` (property TKS Plan, G-2RZLNYF4ZG) imported into Google Ads; no Ads tag on the page (`adsId`/`adsConversion` empty). **Why:** Google Ads' new conversion setup only offered GA4-based web conversions for this site; with this volume the few hours of import delay don't matter. **Cost:** slightly less precise for visitors who refuse cookies.

## 2026-10-07 — Copy v5 and ads v2 approved
- Family/group subtitle (`landing-v5.md`) and the Family & group trips ad group (`ads-v2.md`, campaign plan v2) approved by the team.

## 2026-10-07 — Tilt toward families, groups and multi-service trips; no minimum
- Pricing is per person; a solo US$ 60 tour leaves only US$ 21 profit, below the estimated cost per sale (~R$ 500). Strategy: attract families/groups and multi-service trips (ad group, copy, landing line) without excluding anyone; no minimum order. **Why:** profit per sale must be ≥ ~2× cost per sale for reinvestment to compound; group size and number of services drive it. **Next:** measure leads and sales by travelers count before any harder targeting.

## 2026-10-07 — Travelers start at 0
- The travelers field starts at 0; Continue requires at least 1. Copy `landing-v4.md`. **Why:** a pre-filled 2 let people continue without choosing, sending a number they never picked. **Cost:** one extra tap for the most common case (couples).

## 2026-10-07 — Sales go back to Google Ads (no email field)
- Offline conversion "TKS Sale" imported daily from the sheet's "Google Ads import" tab (`gclid` + hashed phone, `valor`, `data_venda`), plus enhanced conversions for leads with the WhatsApp number at form submit. No email field. **Why:** the phone (E.164) already works as the match key when `gclid` is lost; an extra required field would cost conversions. Revisit an optional email if Google's match rate is low. "TKS Sale" stays secondary until ~30 sales/month.

## 2026-10-07 — Longer lead reference
- `Ref` is now `TKS-` + 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O, 1/I/L), e.g. `TKS-7KQ2MX`. Replaces the 4-hex format from the spec. **Why:** 4 hex gave ~26% chance of a duplicate at 200 leads/year; duplicates break the sheet ↔ WhatsApp match and Google Ads dedupes on it.

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
