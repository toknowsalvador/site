---
name: sales-page-builder
description: Use when building or changing the campaign landing page in plan/, its form, tracking or performance, or when applying an approved experiment to the page.
---

# Sales Page Builder

Sole owner of `plan/`. Turns approved copy into a fast, focused page whose only job is getting qualified visitors to submit the form and land in WhatsApp.

## Before touching code

1. Read the latest `marketing/copy/landing-v*.md` with `Status: approved`. Copy is not yours to change: if a text is too long, unclear or does not fit, write the problem down and hand it to `offer-copywriter`.
2. Read `marketing/experiments.md`. If this change is a test, add the `EXP` entry first (hypothesis, change, start date).
3. Read `references/tracking-contract.md`. Do not rename events, CONFIG keys or payload fields without updating every file it lists.

## CRO checklist (every change must keep all items true)

- [ ] Hero headline mirrors the main ad group search intent.
- [ ] Primary CTA visible above the fold at 390×844; sticky CTA on mobile after the hero.
- [ ] No navigation menu, no links out except WhatsApp and `privacy.html`.
- [ ] Proof sits within one scroll of every CTA; proof is real (from brief) or the section is absent.
- [ ] Form is 2 steps; step 1 asks the easy questions; only people, name and WhatsApp are required.
- [ ] Errors are inline, specific, announced (`role="alert"`).
- [ ] One relevant change per release, so results can be attributed.
- [ ] `<meta name="copy-version">` equals the copy version used.

## Visual design

The landing page has its **own visual identity, independent of `toknowsalvador.com`** — never reuse the main site's colors, fonts or layout as a base. The approved direction lives in `marketing/design.md`; follow it. If it does not exist or a change goes beyond it, invoke `frontend-design:frontend-design`, show the team 2–3 rendered options (screenshots) and get approval **before** building. Conversion beats ornament: contrast ≥ 4.5:1, tap targets ≥ 44px, CTA color used for nothing else.

## Performance

- Images: run `tools/optimize-images.mjs` (WebP, max 1600px, quality 72) and use `width`/`height`, `loading="lazy"` except the hero image (`fetchpriority="high"`).
- No frameworks, no CSS/JS libraries. Critical CSS inline in `<head>`.
- Fonts: `display=swap`, only the weights used.
- Videos: never autoplay above the fold; poster image + click to load.

## Verify before claiming done

1. `node --test 'tests/*.test.mjs'` → all pass.
2. Serve: `npx --yes http-server plan -p 4173 -c-1` and run Lighthouse (mobile) via chrome-devtools MCP → performance ≥ 90, accessibility ≥ 90.
3. Screenshots at 390×844 and 1440×900; check hero, sticky CTA, form both steps.
4. Submit the form with `leadEndpoint` pointed at an unreachable URL → WhatsApp URL still opens with `Ref: TKS-XXXX`.
5. Record the release in `marketing/experiments.md` (or `decisions.md` if not a test).
