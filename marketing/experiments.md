# Experiments

One entry per change that could move a metric. Low volume is expected: "inconclusive" is a valid verdict.

Entry format:

## EXP-NNN — <short title>
- **Owner skill:** <skill>
- **Hypothesis:** If we <change>, then <metric> will <direction> because <reason>.
- **Change:** <what exactly changed, file/campaign element, version>
- **Start / end:** YYYY-MM-DD / YYYY-MM-DD
- **Before:** <metric values + period>
- **After:** <metric values + period>
- **Verdict:** won | lost | inconclusive — <one sentence; sample size>
- **Next:** <follow-up or "none">

<!-- entries below, newest first -->

## EXP-001 — Things to do ads: tour first, less "free" (ads v5)
- **Owner skill:** offer-copywriter
- **Hypothesis:** If the Things to do ads drop the "free list/guide" headlines and the "free" quote line and lead with tours (the rest as add-ons), then more quotes get an answer, because travelers arrive expecting a paid guided tour instead of free planning and the quote no longer breaks their expectation.
- **Change:** `marketing/copy/ads-v5.md`, Things to do block only (headlines, descriptions, path). Other groups unchanged. Goes live with the WhatsApp quote opening with the tour (decision 2026-10-24).
- **Start / end:** 2026-10-31 (planned) / 2026-11-14 (≥ 2 weeks)
- **Before:** 2026-10-10 – 2026-10-23: 173 clicks, CTR 5,51%, 5 leads (CVR 2,9%), cost per lead R$ 93,93, 4 quotes, 0 answered after the quote, 0 sales.
- **After:** —
- **Verdict:** —
- **Next:** —
