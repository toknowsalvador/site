Status: draft
Version: v2
Copy: ads-v2

# Google Ads campaign plan v2 — Salvador Trip Concierge

## Settings

| Setting | Value |
|---|---|
| Campaign name | TKS – Search – EN – v1 |
| Type / goal | Search, goal "Leads" |
| Networks | Google Search only — untick Search Partners and Display Network |
| Locations | Brazil, location option **"Presence or interest"** |
| Languages | English only |
| Budget | R$ 33,00/day (≤ R$ 1.000/month) |
| Bidding | Maximize Clicks, max CPC limit R$ 6,00 → Maximize Conversions after 15–30 conversions |
| Ad schedule | All days and hours (review after 4 weeks) |
| Auto-apply recommendations | Off (all items) |
| Final URL expansion | Off |
| Automatically created assets | Off |
| Primary conversion | "TKS Lead" (Google Ads conversion from the site tag); every other action Secondary — never import GA4 `generate_lead` as primary |
| Final URL | `https://plan.toknowsalvador.com/` |
| Final URL suffix (campaign level) | `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={adgroupid}` — no tracking template (a `{lpurl}?…` template breaks URLs that already have `?audience=`) |

## Ad groups

Final URL for all: `https://plan.toknowsalvador.com/`. Ads: the matching block in `marketing/copy/ads-v2.md`.

### 1. Trip planner — live from day 1
- "salvador trip planner"
- "plan trip to salvador"
- "salvador brazil travel agent"
- "salvador travel concierge"
- "salvador trip concierge"
- [salvador bahia itinerary]
- [salvador brazil itinerary]

### 2. Things to do — live from day 1 (lower intent: watch lead quality)
- "things to do in salvador brazil"
- "things to do in salvador bahia"
- "salvador bahia tours"
- "salvador bahia guide"
- [salvador brazil what to do]

### 3. Tours & transfers — created **paused**; enable only if groups 1–2 don't spend the daily budget after week 2
- "salvador airport transfer"
- "salvador bahia day trips"
- "day trip from salvador brazil"
- "where to stay in salvador brazil"

### 4. Family & group trips — live from day 1
Priority audience: per-person pricing makes groups of 3+ profitable (see brief, unit economics).
- "salvador brazil family vacation"
- "family trip to salvador brazil"
- "family vacation salvador bahia"
- "salvador bahia with kids"
- "salvador with kids"
- "salvador group tour"
- "group trip to salvador brazil"
- "salvador bahia group travel"

Ad group **Final URL suffix** (overrides the campaign one, so it repeats the UTMs): `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={adgroupid}&audience=family` — the page then shows the family/group subtitle.

### Audience observation (campaign level)
Audiences, keywords and content → Demographics → **Parental status: Parents** → **Observation** (no targeting). After ≥ 300 clicks, compare CVR and lead size; only then consider a bid adjustment.

## Negatives

Campaign-level list "TKS negatives", broad match, from day 1:

- **Other Salvadors:** el salvador, san salvador, salvadoran, bukele, santa ana, san miguel, el tunco, salvador dali, dali, salvador sobral
- **Low intent:** free, jobs, job, salary, work, map, maps, weather, flight, flights, cheap flights, airline, pdf, wikipedia, history of, crime, news, portuguese, translation, real estate, apartment for sale, university, bahia fc

Search terms review: every 2–3 days in weeks 1–3, then weekly (via `campaign-analyst`).

## Assets

- **Sitelinks:** How it works → `https://plan.toknowsalvador.com/#how` · What we handle → `#handle` · Questions → `#faq` · Get a free quote → `#plan`
- **Callouts:** Free custom quote · Reply on WhatsApp · Local team · English & Spanish · Airport pickup available
- **Structured snippet — Services:** Tours, Airport transfers, Hotels, Restaurants, Cultural shows

## Setup steps

1. Goals → Conversions: confirm the "TKS Lead" action shows "Recording conversions" (after the launch-checklist test). Set it Primary; set any other action Secondary.
2. Tools → Shared library → Negative keyword lists → + → name "TKS negatives" → paste the list above → Save.
3. Campaigns → + New campaign → Objective **Leads** → Type **Search** → select the `generate_lead` goal → Continue.
4. Name: `TKS – Search – EN – v1`. Untick **Google Search Partners** and **Google Display Network**.
5. Locations → Enter another location → **Brazil**. Location options → **Presence or interest**.
6. Languages → remove all → add **English**.
7. Turn off **Final URL expansion** / **Automatically created assets** if offered.
8. Budget: **R$ 33,00** daily.
9. Bidding: **Clicks** → tick "Set a maximum cost per click bid limit" → **R$ 6,00**.
10. Campaign URL options → **Final URL suffix** → paste `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={adgroupid}` → leave Tracking template empty → Save.
11. Ad group "Trip planner": paste its keywords exactly (with quotes/brackets) → RSA: final URL, the 12 headlines, 4 descriptions and 2 paths from `ads-v2.md`.
12. Ad group "Things to do": same with its block.
13. Ad group "Tours & transfers": same, then **pause** the ad group.
13b. Ad group "Family & group trips": keywords, RSA from `ads-v2.md`, then Ad group settings → Ad group URL options → **Final URL suffix** → `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={adgroupid}&audience=family`.
13c. Audiences → Demographics → Parental status → Parents → **Observation**.
14. Campaign → Keywords → Negative keywords → apply list "TKS negatives".
15. Assets: add the sitelinks, callouts and structured snippet above at campaign level.
16. Recommendations → Auto-apply → turn every item **off**.
17. Publish. Ads go to review (usually < 1 business day).

## Expectations

R$ 1.000/month. CPC must be confirmed in Keyword Planner; plan around the middle row, not the first.

| CPC | Clicks/month | Leads at 5% | Leads at 10% |
|---|---|---|---|
| R$ 3 | ~333 | ~17 | ~33 |
| R$ 5 | ~200 | ~10 | ~20 |
| R$ 8 | ~125 | ~6 | ~13 |

At ~10 leads/month, the 15–30 conversions needed to switch bidding arrive in month 2–3.

## Change log

- 2026-10-07 — v1 drafted from ads-v1 — initial setup — no EXP
- 2026-10-07 — v2: Family & group trips ad group, parental-status observation, UTMs moved from tracking template to Final URL suffix — groups of 3+ are the profitable sales (brief unit economics); template broke `?audience=` URLs — no EXP (pre-launch)
