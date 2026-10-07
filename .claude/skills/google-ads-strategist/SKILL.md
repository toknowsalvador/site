---
name: google-ads-strategist
description: Use when planning, setting up or changing the To Know Salvador Google Ads campaign — keywords, negatives, ad groups, bids, budget, locations, conversion setup — or when turning analyst recommendations into campaign changes.
---

# Google Ads Strategist

Small budget, high intent. With ≤ R$ 1.000/month (~R$ 33/day) every wasted click hurts, so the campaign is narrow, exact and full of negatives. The team applies changes manually in the Google Ads UI; this skill writes exactly what to click.

## Campaign settings (v1)

| Setting | Value | Why |
|---|---|---|
| Type | Search, goal "Leads" | intent |
| Networks | Google Search only — **untick Search Partners and Display** | partners/display waste small budgets |
| Locations | Brazil, option **"Presence or interest"** | reaches foreigners researching Brazil from abroad and those already here |
| Languages | English | filters to English-speaking users |
| Budget | R$ 33/day | ≤ R$ 1.000/month |
| Bidding | Maximize Clicks with max CPC cap R$ 6,00 → switch to Maximize Conversions after 15–30 recorded conversions | no conversion history at start; English travel searches usually cost R$ 3–8 per click — confirm in Keyword Planner and lower the cap only if impressions are not limited |
| Ad schedule | all hours at first; revisit after 4 weeks of data | not enough data to cut |
| Auto-apply recommendations | **off** | Google's suggestions widen targeting |
| Final URL expansion / automatically created assets | **off** | keeps traffic on the page and copy under our control |
| Conversion | **"TKS Lead"** = the GA4 key event `generate_lead`, used as the Google Ads **primary** conversion through the linked GA4 property (Google Ads' current setup flow forces GA4-based web conversions). `adsId`/`adsConversion` in `plan/js/config.mjs` stay **empty** so the page never sends a second, tag-based lead conversion. **"TKS Sale"** (offline import from the sheet, enhanced conversions for leads) stays **secondary** until ~30 sales/month | optimize for the real goal; measure cost per sale |
| Final URL | bare `https://plan.toknowsalvador.com/` | parameters go in the Final URL suffix, never in the Final URL |
| Final URL suffix (campaign) | `utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={adgroupid}` | analyst needs keyword per lead. Do **not** use a `{lpurl}?…` tracking template: it breaks URLs with `?audience=`. An ad group suffix overrides the campaign one, so it must repeat the UTMs |

## Ad groups and keywords

Phrase `"..."` and exact `[...]` only. Start with 2–3 tightly themed groups, 5–15 keywords each:

1. **Trip planner** — `"salvador trip planner"`, `"plan trip to salvador"`, `[salvador bahia itinerary]`, `"salvador brazil travel agent"`, `"salvador travel concierge"`.
2. **Things to do** — `"things to do in salvador brazil"`, `"salvador bahia tours"`, `"salvador bahia guide"`, `[salvador brazil what to do]`.
3. **Logistics** (only if budget allows after week 2) — `"salvador airport transfer"`, `"where to stay in salvador brazil"`.

Each group's ads come from the matching block in the approved `marketing/copy/ads-v{n}.md`. Validate with `node tools/check-ad-copy.mjs` before anything goes live.

4. **Family & group trips** — family/group keywords (`"salvador brazil family vacation"`, `"salvador with kids"`, `"salvador group tour"`…). Ad group Final URL suffix = campaign suffix + `&audience=family` (the page shows a family subtitle). Pricing is per person, so groups of 3+ are the profitable sales — see the unit economics in `marketing/brief.md` before shifting budget away from this group.

Demographics: keep **Parental status** in **Observation** until ≥ 300 clicks; adjust bids only with data.

## Negative keywords (campaign level, from day one)

- **El Salvador / other Salvadors:** el salvador, san salvador, salvadoran, bukele, santa ana, san miguel, el tunco, salvador dali, dali, salvador sobral.
- **Low intent:** free, jobs, job, salary, work, map, maps, weather, flight, flights, cheap flights, airline, pdf, wikipedia, history of, crime, news, portuguese, translation, real estate, apartment for sale, university, bahia fc.
- Plus every irrelevant term found by `campaign-analyst`.

Review the search terms report every 2–3 days in weeks 1–3, then weekly: at this budget a few junk clicks a day are a large share of spend.

## Assets

- Sitelinks to page anchors: How it works (`#how`), What we handle (`#handle`), FAQ (`#faq`), Get a free quote (`#plan`).
- Callouts: Free quote, Reply on WhatsApp, Local partners, English support (only claims true per brief).
- Structured snippet "Services": tours, airport transfers, hotels, restaurants, cultural shows.

## Output: `marketing/ads/campaign-plan.md`

```
Status: draft | approved | live
Version: v{n}
Copy: ads-v{n}
## Settings        (table above with final values)
## Ad groups       (name, keywords with match type, final URL)
## Negatives       (list)
## Setup steps     (numbered clicks in the Google Ads UI)
## Expectations    (clicks/month = budget / CPC at R$ 3, 5 and 8; leads at 5% and 10% CVR — never present the optimistic case alone)
## Change log      (date — change — reason — EXP id)
```

## Changes after launch

- Wait ≥ 7 days between structural changes; Google's learning resets.
- Every change gets a line in the Change log and, if it is a test, an `EXP` entry.
- Adding negatives from search terms is always allowed and does not count as a structural change.
