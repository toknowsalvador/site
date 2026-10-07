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
| Bidding | Maximize Clicks with max CPC cap R$ 3,00 → switch to Maximize Conversions after 15–30 recorded conversions | no conversion history at start |
| Ad schedule | all hours at first; revisit after 4 weeks of data | not enough data to cut |
| Auto-apply recommendations | **off** | Google's suggestions widen targeting |
| Conversion | `generate_lead` (Ads conversion from the site tag) as **primary**; nothing else primary | optimize for the real goal |
| Final URL | `https://plan.toknowsalvador.com/?utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}&utm_content={adgroupid}` via tracking template | analyst needs keyword per lead |

## Ad groups and keywords

Phrase `"..."` and exact `[...]` only. Start with 2–3 tightly themed groups, 5–15 keywords each:

1. **Trip planner** — `"salvador trip planner"`, `"plan trip to salvador"`, `[salvador bahia itinerary]`, `"salvador brazil travel agent"`, `"salvador travel concierge"`.
2. **Things to do** — `"things to do in salvador brazil"`, `"salvador bahia tours"`, `"salvador bahia guide"`, `[salvador brazil what to do]`.
3. **Logistics** (only if budget allows after week 2) — `"salvador airport transfer"`, `"where to stay in salvador brazil"`.

Each group's ads come from the matching block in the approved `marketing/copy/ads-v{n}.md`. Validate with `node tools/check-ad-copy.mjs` before anything goes live.

## Negative keywords (campaign level, from day one)

free, jobs, job, salary, work, map, maps, weather, flight, flights, cheap flights, airline, pdf, wikipedia, history of, el salvador, san salvador, salvador dali, salvador sobral, crime, news, portuguese, translation, real estate, apartment for sale, university, carnival 20xx dates (add the current year), plus every irrelevant term found by `campaign-analyst`.

## Output: `marketing/ads/campaign-plan.md`

```
Status: draft | approved | live
Version: v{n}
Copy: ads-v{n}
## Settings        (table above with final values)
## Ad groups       (name, keywords with match type, final URL)
## Negatives       (list)
## Setup steps     (numbered clicks in the Google Ads UI)
## Expectations    (clicks/month = budget / expected CPC; leads at 5% and 10% CVR)
## Change log      (date — change — reason — EXP id)
```

## Changes after launch

- Wait ≥ 7 days between structural changes; Google's learning resets.
- Every change gets a line in the Change log and, if it is a test, an `EXP` entry.
- Adding negatives from search terms is always allowed and does not count as a structural change.
