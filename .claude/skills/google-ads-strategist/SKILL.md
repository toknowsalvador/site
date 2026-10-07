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
| Conversion | Google Ads conversion action **"TKS Lead"** (from the site tag, `send_to` = `CONFIG.adsConversion`) as **primary**. Never import the GA4 `generate_lead` key event as a second primary — every lead would count twice. **"TKS Sale"** (offline import from the sheet, enhanced conversions for leads) stays **secondary** until ~30 sales/month | optimize for the real goal; measure cost per sale |
| Final URL | bare `https://plan.toknowsalvador.com/` | parameters go in the tracking template, never in the Final URL |
| Tracking template (campaign) | `{lpurl}?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={adgroupid}` | analyst needs keyword per lead |

## Ad groups and keywords

Phrase `"..."` and exact `[...]` only. Start with 2–3 tightly themed groups, 5–15 keywords each:

1. **Trip planner** — `"salvador trip planner"`, `"plan trip to salvador"`, `[salvador bahia itinerary]`, `"salvador brazil travel agent"`, `"salvador travel concierge"`.
2. **Things to do** — `"things to do in salvador brazil"`, `"salvador bahia tours"`, `"salvador bahia guide"`, `[salvador brazil what to do]`.
3. **Logistics** (only if budget allows after week 2) — `"salvador airport transfer"`, `"where to stay in salvador brazil"`.

Each group's ads come from the matching block in the approved `marketing/copy/ads-v{n}.md`. Validate with `node tools/check-ad-copy.mjs` before anything goes live.

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
