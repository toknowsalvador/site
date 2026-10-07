---
name: campaign-analyst
description: Use when reviewing To Know Salvador campaign performance — "como está a campanha?", the weekly review, after exporting Google Ads or leads data, or before deciding any optimization.
---

# Campaign Analyst

Turns small, noisy data into a few safe decisions. With ~5–25 leads/month, statistics cannot pick winners; this skill uses waste removal, lead quality and sales, and says "inconclusive" when that is the truth.

## Inputs

Ask the team (Portuguese) to drop these into `marketing/data/` (git-ignored), named `YYYY-MM-DD-<type>.csv`:

1. Google Ads → Campaigns report (date range = since last report).
2. Google Ads → Search terms report.
3. Google Ads → Keywords report.
4. Leads sheet → File → Download → CSV. Before exporting, the team must update `status` (`novo`, `respondeu`, `orçamento enviado`, `fechou`, `perdido`) for every lead, plus `valor` (R$) and `data_venda` for every `fechou`.
5. Google Ads → Conversions report segmented by conversion action (shows "TKS Sale" imported from the sheet).

Google Ads CSVs start with 2 title lines; skip them. Compute numbers with a short script (node or python), never by eye, and show the table. First check that totals reconcile across exports (same date range, same spend/clicks); if they do not, say so and ask for matching exports before concluding.

## 1. Funnel table

| Stage | Count | Rate |
|---|---|---|
| Impressions | | |
| Clicks | | CTR |
| Leads (sheet rows with utm_source=google OR a non-empty gclid) | | CVR = leads / clicks |
| Responded | | |
| Quotes sent | | |
| Sales (`fechou`) | | close rate = sales / quotes |

Then: spend, CPC, **cost per lead**, **cost per sale**, revenue (`valor` sum), ROAS. Name the weakest stage.

## 2. Sales reaching Google Ads

- Every `fechou` row with `valor` and `data_venda` should appear as a "TKS Sale" conversion in Google Ads (by conversion date). Fewer in Ads than in the sheet → check the "Google Ads import" tab, the upload schedule history and the conversion's Diagnostics (match rate). Missing `data_venda`/`valor` rows are never exported — list them for the team by `lead_id`.
- Use "TKS Sale" by keyword/search term for cost per sale; keep bidding on "TKS Lead" until there are ~30 sales/month.

## 3. Waste (always actionable)

- Search terms irrelevant to the offer → negative keywords list (exact text).
- Keyword with spend > R$ 60 and 0 leads → pause.
- Keyword with leads but 0 responses after ≥ 5 leads → lead quality problem → flag for `offer-copywriter` (expectation mismatch).

## 4. Decision rules for small samples

| Situation | Verdict |
|---|---|
| Fewer than 100 clicks per variant | inconclusive — keep running |
| CTR difference between ads | ignore unless ≥ 1.000 impressions each and difference ≥ 50% relative |
| Landing change | compare CVR over ≥ 2 weeks and ≥ 150 clicks per period; otherwise inconclusive |
| Zero leads after 150 clicks | page/offer problem → `sales-page-builder` + `offer-copywriter` |
| Leads arrive but close rate < 20% with ≥ 10 quotes | sales problem → check `whatsapp-closer` trigger in `marketing/skill-backlog.md` |

Always say how many clicks/leads a verdict is based on.

## 5. Output

Write `marketing/reports/YYYY-MM-DD.md`: funnel table, waste list, verdicts, and **max 3 actions**, each with owner skill (`google-ads-strategist`, `offer-copywriter`, `sales-page-builder`) or person. Close or update `EXP` entries in `marketing/experiments.md`. Check backlog triggers in `marketing/skill-backlog.md` and report any that are met to `growth-orchestrator`.

Reports are committed to a public repo: **never write names, phone numbers or any lead text into them** — refer to leads by `lead_id` (Ref) only. Exports in `marketing/data/` stay git-ignored; open them with a script, not Excel/LibreOffice (cells from the public endpoint may contain formulas).

Summarize to the team in Portuguese, in 5 lines or fewer, before the details.
