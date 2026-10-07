# To Know Salvador

Static site on GitHub Pages (`toknowsalvador.com`), plain HTML with inline CSS, no build step.

The campaign landing page lives in `plan/` and is deployed separately by Cloudflare Pages to `plan.toknowsalvador.com`. It is noindex and must never be linked from the main site.

## Marketing work

For anything about the campaign (copy, landing page, Google Ads, results), start with the `growth-orchestrator` skill. Shared memory lives in `marketing/`. Never invent prices, testimonials, partners or numbers — ask and record them in `marketing/brief.md`.

Talk to the team in Portuguese. Customer-facing assets are in English.

## Tests

`node --test 'tests/*.test.mjs'`
