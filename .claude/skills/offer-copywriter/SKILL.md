---
name: offer-copywriter
description: Use when creating or revising the offer, landing page copy, Google Ads headlines/descriptions, or the WhatsApp prefilled message for the To Know Salvador trip-planning campaign.
---

# Offer Copywriter

Writes the words that sell the trip-planning service — on the landing page and in the ads — so that the ad promise and the page match. English, written natively, never translated.

## Inputs (read first)

`marketing/brief.md`, `marketing/experiments.md` (what already won or lost), `marketing/decisions.md`, the latest `marketing/copy/*` files, and search terms from the latest `campaign-analyst` report if one exists.

If a fact the copy needs is `[MISSING]` (price, partner count, testimonial, rating), **stop and ask the team in Portuguese**, record the answer in `marketing/brief.md`, then continue. Never write a placeholder testimonial, number or price — placeholders ship.

## 1. Offer before copy

Write this block at the top of the copy file and get it right before writing sections:

- **Dream outcome:** land in Salvador with everything ready; only enjoy.
- **Specifics:** exactly what will be booked (from brief).
- **Risk reversal:** free quote on WhatsApp; pay only after approving the plan (plus anything in brief).
- **Effort removed:** research hours, language, negotiating, logistics.
- **Why us:** local team, partner network, Afro Tour credential (only what the brief proves).

## 2. Landing copy

File: `marketing/copy/landing-v{n}.md` (next n). First lines:

```
Status: draft
Version: v{n}
Based on: brief.md @ YYYY-MM-DD, experiments up to EXP-NNN
```

Sections, in this order, each with `**Hypothesis:**` (one line, why this choice should convert):

1. **Hero** — headline (≤ 10 words, mirrors the main search intent), subheadline (outcome + mechanism), CTA button text (verb + outcome, e.g. "Plan my Salvador trip"), microcopy under CTA (risk reversal), one proof line.
2. **Problem** — 3–4 pains in the traveler's words (PAS: problem, agitate gently, no fear-mongering about safety).
3. **How it works** — exactly 3 steps: tell us your trip → get your plan and quote on WhatsApp → arrive and enjoy.
4. **What we handle** — one line per category: tours, transfers, hotels, rentals, restaurants, cultural shows.
5. **Who we are** — 2–3 sentences, human, local.
6. **Proof** — only items in brief `## Proof`. If empty, write `PROOF GAP: <what is needed>` and omit the section from the page.
7. **Offer & risk reversal** — price framing per brief.
8. **FAQ** — 5–7 objections (price, safety, language, what if I change dates, how fast is the quote, do I pay partners directly).
9. **Form** — step titles, field labels, helper text, submit text, error messages.
10. **WhatsApp prefill** — template using `{name}`, `{people}`, `{dates}`, `{interests}`, `{lead_id}`; must end with `Ref: {lead_id}`.

Rules: one idea per sentence; "you" over "we"; concrete nouns; no "best/#1/cheapest" without proof in brief.

## 3. Ad copy

File: `marketing/copy/ads-v{n}.md`, one block per ad group, matching the ad groups in `marketing/ads/campaign-plan.md` if it exists (otherwise propose: trip planner, things to do in Salvador, Salvador tours/transfers):

```
## Ad group: <name>
### Headlines
- <≤ 30 chars, 8–15 items, at least 3 containing the group's main keyword>
### Descriptions
- <≤ 90 chars, 2–4 items, one must state the risk reversal>
### Paths
- <≤ 15 chars, max 2>
```

Validate before finishing:

`node tools/check-ad-copy.mjs marketing/copy/ads-v{n}.md` → must print `OK`.

## 4. Approval

Show the team a short Portuguese summary of the main choices and the full copy file. On approval, change the first line to `Status: approved` and add a `marketing/decisions.md` entry. Only approved copy goes to `sales-page-builder` or into ads.

## Iterating

When a `campaign-analyst` report recommends a copy change, write a new version (never edit an approved one), change only what the report targets, and log the hypothesis as a new `EXP` entry in `marketing/experiments.md`.
