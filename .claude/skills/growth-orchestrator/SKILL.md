---
name: growth-orchestrator
description: Use when working on the To Know Salvador trip-planning campaign and the next step is unclear — "o que fazemos agora?", starting a marketing session, the weekly review, or any request that touches more than one of copy, landing page, Google Ads, or results.
---

# Growth Orchestrator

Decides the next move for the campaign funnel and hands the work to the right specialist. It does not write copy, HTML, ads or reports itself.

**Funnel:** Google Search ad → `plan.toknowsalvador.com` → 2-step form → lead row in Google Sheets → WhatsApp chat (quote) → payment → trip → review.

| Specialist skill | Owns |
|---|---|
| `offer-copywriter` | offer, landing copy, ad text, WhatsApp prefill text |
| `sales-page-builder` | everything in `plan/`, tracking, CRO |
| `google-ads-strategist` | campaign structure, keywords, negatives, bids, budget |
| `campaign-analyst` | exported data, funnel metrics, next actions |

## 1. Read memory

Read `marketing/brief.md`, `marketing/experiments.md`, `marketing/decisions.md`, `marketing/skill-backlog.md`. List `marketing/copy/`, `marketing/ads/`, `marketing/data/`, `plan/`, and read `plan/js/config.mjs` if it exists.

## 2. Identify the phase (first match wins)

| Phase | Condition | Hand off to |
|---|---|---|
| Setup | `marketing/brief.md` still contains `[MISSING]` | Interview (step 3) |
| Copy | no `marketing/copy/landing-v*.md` containing `Status: approved` | `offer-copywriter` |
| Build | `plan/index.html` missing, or it does not declare the latest approved copy version in `<meta name="copy-version">` | `sales-page-builder` |
| Launch | `marketing/ads/campaign-plan.md` missing, or any empty value in `plan/js/config.mjs` | `google-ads-strategist`, then the team follows `docs/setup/launch-checklist.md` |
| Optimize | campaign live | `campaign-analyst` when `marketing/data/` has exports newer than the latest `EXP` entry; otherwise say when to export next (minimum 7 days of data) |

## 3. Setup interview

Ask in Portuguese, **one question per message**, for each `[MISSING]` field, in brief order. Write each answer into `marketing/brief.md` right away. If the team does not know, write `[UNKNOWN — decide by YYYY-MM-DD]` (7 days ahead) and move on. Never fill a field yourself, even with "placeholder" values — invented prices or testimonials end up live in ads and break Google Ads policy and customer trust.

## 4. Gap check (every run)

Walk each funnel stage and ask: who owns it, and which metric shows it works? For a stage with no owner and evidence of a problem, add or update an entry in `marketing/skill-backlog.md` (`**Gap:**`, `**Trigger:**`, `**Status:** waiting`). For each existing entry, compare its trigger against the data. Trigger met → propose creating that skill with superpowers:writing-skills and set `**Status:** proposed`. Create it only after the team agrees.

## 5. Output

Always end with:

**Fase:** <phase>
**Próximas ações (máx. 3):**
1. <action> — <skill or person>

Then, with the team's OK, invoke the first specialist skill.

## Rules

- Respect `marketing/decisions.md`; reversing a decision requires new evidence, recorded as a new entry.
- Media is Google Search only, ≤ R$ 1.000/month. Do not propose new channels unless a backlog trigger is met.
- Customer-facing assets are English; conversation with the team is Portuguese.
- One relevant change at a time on the live funnel, so results can be attributed.
