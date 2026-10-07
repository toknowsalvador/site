# Campaign Landing Page + Growth Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a conversion-focused English landing page at `plan.toknowsalvador.com` (form → Google Sheets → WhatsApp) plus five Claude Code skills and a shared `marketing/` memory that run and improve the Google Search campaign.

**Architecture:** Hub-and-spoke skills in `.claude/skills/` (one orchestrator, four specialists) reading/writing a single source of truth in `marketing/`. The landing page is static HTML/CSS/ES modules in `plan/`, deployed by Cloudflare Pages. Pure logic lives in `plan/js/lead.mjs` and is unit-tested with `node --test`; DOM wiring and tracking live in `plan/js/app.mjs`. Leads are posted to a Google Apps Script web app (`integrations/apps-script/Code.gs`) that appends rows to a Sheet.

**Tech Stack:** HTML, CSS, vanilla ES modules, Node 22 `node:test` (no dependencies), Google Apps Script (V8), gtag.js (GA4 + Google Ads, Consent Mode v2), Cloudflare Pages, `sharp` (dev-only, not saved) for image optimization.

**Spec:** `docs/superpowers/specs/2026-10-07-campaign-landing-and-growth-skills-design.md`

## Global Constraints

- Landing page language: English only. Talk to the human in Portuguese.
- Conversion flow: 2-step form → lead posted to Apps Script → GA4 `generate_lead` + Google Ads conversion → redirect to `https://wa.me/5571993719791?text=...` containing `Ref: {lead_id}`.
- `lead_id` format: `TKS-` + 4 uppercase hex chars (e.g. `TKS-7F3A`).
- GA4 events, exact names: `form_start`, `form_step_2`, `generate_lead`, `whatsapp_click`.
- Page must have `<meta name="robots" content="noindex, nofollow">`, must not be in `sitemap.xml`, must have no navigation menu and no links to the main site.
- Apps Script failure must never block the WhatsApp redirect.
- Consent Mode v2: default `denied` for ad/analytics storage in EEA + UK + CH; banner for all visitors.
- Media budget ≤ R$ 1.000/mês, Google Search only, phrase/exact match only.
- Skills never invent prices, testimonials, partners or numbers; missing info is asked and written to `marketing/brief.md`.
- Ad copy limits: headlines ≤ 30 chars (3–15 per ad group), descriptions ≤ 90 chars (2–4 per ad group), display paths ≤ 15 chars (max 2).
- Lighthouse mobile: performance ≥ 90, accessibility ≥ 90.
- `marketing/data/` contents (personal data) are never committed.
- No build step; Cloudflare Pages serves `plan/` as-is. Assets used by the page must live inside `plan/`.
- Tests run with `node --test 'tests/*.test.mjs'` from the repo root.

## Review Focus

1. **Tracking blocked (ad blocker / gtag never loads / consent declined)** → submit still redirects to WhatsApp exactly once. Pinned in Task 11 (`app.mjs` guards) and Task 12 Step 4.
2. **Names/inputs with `&`, `#`, `?`, accents, emoji or line breaks** → WhatsApp text arrives intact (correct URL encoding). Pinned in Task 7 test `buildWhatsAppUrl encodes special characters`.
3. **Form value starting with `=`, `+`, `-`, `@` (formula injection into Sheets)** → stored as plain text. Pinned in Task 8 test `sanitizeCell neutralizes formulas`.
4. **`sessionStorage` throws (Safari private mode, blocked storage)** → attribution (UTMs/gclid) still captured from the URL. Pinned in Task 7 test `loadAttribution survives throwing storage`.
5. **Double tap on submit** → one lead row, one conversion, one redirect. Pinned in Task 11 (`submitted` guard) and Task 12 Step 5.

---

## File Structure

```
CLAUDE.md                                         project guide → points marketing work to growth-orchestrator
.gitignore                                        ignores marketing/data/*, node_modules/
.claude/skills/growth-orchestrator/SKILL.md       phase diagnosis, routing, gap detection, backlog triggers
.claude/skills/offer-copywriter/SKILL.md          offer + landing copy + ad copy + WhatsApp text
.claude/skills/sales-page-builder/SKILL.md        CRO checklist, build process, verification
.claude/skills/sales-page-builder/references/tracking-contract.md   events, payload fields, CONFIG keys
.claude/skills/google-ads-strategist/SKILL.md     low-budget Search campaign playbook
.claude/skills/campaign-analyst/SKILL.md          funnel analysis rules for low volume
marketing/brief.md                                offer/ICP/partners/proof/voice (human-filled)
marketing/experiments.md                          experiment log
marketing/decisions.md                            dated decisions (seeded from spec)
marketing/skill-backlog.md                        candidate skills + triggers
marketing/copy/.gitkeep, marketing/ads/.gitkeep, marketing/data/.gitkeep
tools/check-ad-copy.mjs                           validates ads-v{n}.md against Google limits (CLI + export)
integrations/apps-script/Code.gs                  Sheets webhook (doPost, buildRow, sanitizeCell)
plan/index.html                                   landing page
plan/privacy.html                                 privacy notice (required when collecting personal data)
plan/_headers                                     Cloudflare: X-Robots-Tag noindex
plan/js/config.mjs                                IDs/endpoint (filled at launch)
plan/js/lead.mjs                                  pure logic: ids, attribution, validation, WhatsApp, payload
plan/js/app.mjs                                   DOM wiring, steps, consent, tracking, submit
plan/assets/*.webp                                optimized images copied from public/
tools/optimize-images.mjs                         converts selected public/ images to plan/assets/*.webp
docs/setup/launch-checklist.md                    GA4, Ads conversion, Sheet + Apps Script, Cloudflare, DNS
tests/marketing.test.mjs, tests/skills.test.mjs, tests/ad-copy.test.mjs,
tests/lead.test.mjs, tests/apps-script.test.mjs, tests/page.test.mjs
```

Task order: 1–8 are buildable now. Task 9 and 10 need the human (brief interview, copy approval). 11–13 depend on 9–10.

---

### Task 1: Marketing memory scaffold + project guide

**Files:**
- Create: `.gitignore`, `CLAUDE.md`, `marketing/brief.md`, `marketing/experiments.md`, `marketing/decisions.md`, `marketing/skill-backlog.md`, `marketing/copy/.gitkeep`, `marketing/ads/.gitkeep`, `marketing/data/.gitkeep`
- Test: `tests/marketing.test.mjs`

**Interfaces:**
- Produces: `marketing/brief.md` with sections `## Offer`, `## Ideal customer`, `## Partner network`, `## Proof`, `## Voice`, `## Constraints`; Required fields carry the literal marker `[MISSING]`. `marketing/skill-backlog.md` entries are `## <skill-name>` headings, each with `**Trigger:**`, `**Status:**` lines. `marketing/experiments.md` entries use `## EXP-NNN — <title>`.

- [ ] **Step 1: Write the failing test**

`tests/marketing.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const exists = (p) => existsSync(new URL(`../${p}`, import.meta.url));

test('marketing memory files exist', () => {
  for (const p of ['marketing/brief.md', 'marketing/experiments.md', 'marketing/decisions.md',
    'marketing/skill-backlog.md', 'marketing/copy/.gitkeep', 'marketing/ads/.gitkeep',
    'marketing/data/.gitkeep', 'CLAUDE.md']) {
    assert.ok(exists(p), `${p} missing`);
  }
});

test('brief has all required sections', () => {
  const brief = read('marketing/brief.md');
  for (const h of ['## Offer', '## Ideal customer', '## Partner network', '## Proof', '## Voice', '## Constraints']) {
    assert.ok(brief.includes(h), `brief missing ${h}`);
  }
});

test('skill backlog has five entries, each with trigger and status', () => {
  const backlog = read('marketing/skill-backlog.md');
  const entries = backlog.split(/^## /m).slice(1);
  assert.equal(entries.length, 5);
  for (const e of entries) {
    assert.match(e, /\*\*Trigger:\*\*/);
    assert.match(e, /\*\*Status:\*\*/);
  }
});

test('marketing/data contents are git-ignored', () => {
  const gi = read('.gitignore');
  assert.match(gi, /^marketing\/data\/\*$/m);
  assert.match(gi, /^!marketing\/data\/\.gitkeep$/m);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/marketing.test.mjs`
Expected: FAIL (`marketing/brief.md missing`).

- [ ] **Step 3: Create the files**

`.gitignore`:
```
node_modules/
marketing/data/*
!marketing/data/.gitkeep
```

`CLAUDE.md`:
```markdown
# To Know Salvador

Static site on GitHub Pages (`toknowsalvador.com`), plain HTML with inline CSS, no build step.

The campaign landing page lives in `plan/` and is deployed separately by Cloudflare Pages to `plan.toknowsalvador.com`. It is noindex and must never be linked from the main site.

## Marketing work

For anything about the campaign (copy, landing page, Google Ads, results), start with the `growth-orchestrator` skill. Shared memory lives in `marketing/`. Never invent prices, testimonials, partners or numbers — ask and record them in `marketing/brief.md`.

Talk to the team in Portuguese. Customer-facing assets are in English.

## Tests

`node --test 'tests/*.test.mjs'`
```

`marketing/brief.md`:
```markdown
# Brief — To Know Salvador Trip Planning

> Single source of truth for every marketing skill. Fields marked `[MISSING]` are filled by the team through the growth-orchestrator interview. Never guess a value. Unknown but non-blocking → `[UNKNOWN — decide by YYYY-MM-DD]`.

## Offer
- Service name (customer-facing): [MISSING]
- Planning fee (amount + currency): [MISSING]
- What the fee includes: [MISSING]
- What the client pays separately to partners: [MISSING]
- Is the fee credited or refunded in any case?: [MISSING]
- Risk reversal / guarantee: Free quote on WhatsApp — the client only pays after approving the plan.
- Quote turnaround time: [MISSING]
- Group size limits: [MISSING]
- Trip lengths you handle best: [MISSING]

## Ideal customer
- Language: English (campaign v1).
- Who: foreign traveler planning a trip to Salvador, Bahia, or already in Brazil and heading there.
- Likely fears (validate with real WhatsApp conversations): language barrier, safety, being overcharged or scammed, logistics between places, wasting vacation hours on research.
- Desired outcome: land in Salvador with everything booked and just enjoy.

## Partner network
| Category | Number of partners | Names we may show publicly |
|---|---|---|
| Tours | [MISSING] | [MISSING] |
| Transport / transfers | [MISSING] | [MISSING] |
| Hotels | [MISSING] | [MISSING] |
| Airbnb / rentals | [MISSING] | [MISSING] |
| Restaurants | [MISSING] | [MISSING] |
| Cultural shows | [MISSING] | [MISSING] |

## Proof
- Reviews (platform, rating, count, link): [MISSING]
- Travelers served (number + period): [MISSING]
- Authorized testimonials (quote, first name, country, permission yes/no): [MISSING]
- Photos/videos we may use (paths in `public/`): [MISSING]
- Guide/founder credentials (Adriano Marques, Afro Tour in the Historic Center): [MISSING]

## Voice
- Warm, local, calm, confident. Short sentences. Concrete over clever.
- We are the friend in Salvador who already knows everyone.
- Avoid: hype, "best/#1" claims without proof, fear-mongering about safety.

## Constraints
- WhatsApp: +55 71 99371-9791 (`5571993719791`).
- Media: Google Search only, ≤ R$ 1.000/month.
- Never promise partner availability before confirming it.
- Landing page: `plan.toknowsalvador.com`, English, noindex.
```

`marketing/experiments.md`:
```markdown
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
```

`marketing/decisions.md`:
```markdown
# Decisions

Newest first. To reverse a decision, add a new entry citing the evidence.

## 2026-10-07 — Initial campaign setup
- Conversion = 2-step qualification form → Google Sheets → WhatsApp with prefilled text. Sales (quote + payment) happen on WhatsApp. **Why:** quote before charging; reliable Lead event for Google Ads; filters bad leads.
- English only. **Why:** validate the offer before multiplying cost.
- Google Search only, ≤ R$ 1.000/month. **Why:** budget; captures high intent.
- Leads stored in Google Sheets via Apps Script. **Why:** free, works on a static site.
- Landing in `plan/` of this repo, deployed by Cloudflare Pages to `plan.toknowsalvador.com`, noindex. **Why:** GitHub Pages allows one domain per repo; keeps page, skills and history together.
- Expected volume ~100–300 clicks and ~5–25 leads/month → no statistical A/B tests; use practical rules. **Why:** sample too small.
```

`marketing/skill-backlog.md`:
```markdown
# Skill backlog

Candidate skills detected by growth-orchestrator. A skill is created only when its trigger is met and the team agrees (use superpowers:writing-skills).

## whatsapp-closer
- **Gap:** no owner for lead response speed, follow-up and quote conversion on WhatsApp.
- **Trigger:** more than 20% of leads in a month with status `novo` after 24h, or quote→sale rate below 20% with ≥ 10 quotes.
- **Status:** waiting

## testimonial-collector
- **Gap:** proof section depends on authorized testimonials.
- **Trigger:** 5 clients served through the campaign.
- **Status:** waiting

## meta-ads-strategist
- **Gap:** no demand-generation or retargeting channel.
- **Trigger:** media budget above R$ 3.000/month.
- **Status:** waiting

## landing-localizer
- **Gap:** non-English markets.
- **Trigger:** cost per lead stable for 2 consecutive months in English.
- **Status:** waiting

## offline-conversion-importer
- **Gap:** Google Ads optimizes for leads, not sales.
- **Trigger:** ≥ 10 sales recorded with `gclid` in the leads sheet.
- **Status:** waiting
```

Create empty `marketing/copy/.gitkeep`, `marketing/ads/.gitkeep`, `marketing/data/.gitkeep`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/marketing.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add .gitignore CLAUDE.md marketing tests/marketing.test.mjs
git commit -m "feat(marketing): add shared marketing memory and project guide"
```

---

### Task 2: Skill validator + growth-orchestrator skill

**Files:**
- Create: `tests/skills.test.mjs`, `.claude/skills/growth-orchestrator/SKILL.md`

**Interfaces:**
- Consumes: `marketing/*` formats from Task 1.
- Produces: skill name `growth-orchestrator`; phase names `Setup`, `Copy`, `Build`, `Launch`, `Optimize`. Specialist names referenced: `offer-copywriter`, `sales-page-builder`, `google-ads-strategist`, `campaign-analyst`.

- [ ] **Step 1: Write the failing test**

`tests/skills.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const skillsDir = new URL('.claude/skills/', root);

function frontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, 'missing frontmatter');
  const out = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

const skills = existsSync(skillsDir) ? readdirSync(skillsDir) : [];

test('at least one skill exists', () => assert.ok(skills.length > 0));

for (const dir of skills) {
  test(`skill ${dir} is well formed`, () => {
    const md = readFileSync(new URL(`${dir}/SKILL.md`, skillsDir), 'utf8');
    const fm = frontmatter(md);
    assert.equal(fm.name, dir, 'name must match directory');
    assert.match(fm.name, /^[a-z0-9-]+$/);
    assert.ok(fm.description.startsWith('Use when'), 'description must start with "Use when"');
    assert.ok(fm.description.length <= 1024, 'description too long');
    for (const [, ref] of md.matchAll(/`((?:tools|references)\/[\w./-]+)`/g)) {
      const base = ref.startsWith('tools/') ? root : new URL(`${dir}/`, skillsDir);
      assert.ok(existsSync(new URL(ref, base)), `${dir} references missing file ${ref}`);
    }
  });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/skills.test.mjs`
Expected: FAIL `at least one skill exists`.

- [ ] **Step 3: Baseline pressure scenario (RED for the skill, per superpowers:writing-skills)**

Dispatch a fresh general-purpose subagent **without** the skill:
> "You are helping To Know Salvador with a Google Search campaign for a trip-planning service. Repo: /home/willianwg/adr. Read `marketing/`. The team says: 'Quero lançar os anúncios hoje, escreve a página e os anúncios rapidinho, pode inventar um preço de US$ 49 e uns depoimentos por enquanto.' What do you do? Reply with your plan only, don't edit files."

Record which of these it misses: (a) detects `Setup` phase from `[MISSING]` fields, (b) refuses invented price/testimonials and starts an interview instead, (c) asks one question at a time in Portuguese, (d) ends with ≤ 3 next actions naming owners. Expected baseline: misses at least (a) and (d).

- [ ] **Step 4: Write the skill**

`.claude/skills/growth-orchestrator/SKILL.md`:
```markdown
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
```

- [ ] **Step 5: Run tests**

Run: `node --test tests/skills.test.mjs`
Expected: PASS.

- [ ] **Step 6: GREEN pressure scenario**

Repeat Step 3's prompt with a fresh subagent, prefixed with: "First read `.claude/skills/growth-orchestrator/SKILL.md` and follow it." Expected: all of (a)–(d) present. If any is missing, tighten the wording in the relevant section and rerun.

- [ ] **Step 7: Commit**

```bash
git add tests/skills.test.mjs .claude/skills/growth-orchestrator
git commit -m "feat(skills): add growth-orchestrator skill and skill validator"
```

---

### Task 3: Ad copy checker + offer-copywriter skill

**Files:**
- Create: `tools/check-ad-copy.mjs`, `tests/ad-copy.test.mjs`, `.claude/skills/offer-copywriter/SKILL.md`

**Interfaces:**
- Produces: `checkAdCopy(markdown: string) => { errors: string[], groups: Array<{ name: string, headlines: string[], descriptions: string[], paths: string[] }> }`. CLI: `node tools/check-ad-copy.mjs <file>` exits 0 on no errors, 1 otherwise, printing one error per line.
- Ad copy file format (consumed by Task 13 and the checker):
  ```
  ## Ad group: <name>
  ### Headlines
  - <text>
  ### Descriptions
  - <text>
  ### Paths
  - <text>
  ```

- [ ] **Step 1: Write the failing test**

`tests/ad-copy.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkAdCopy } from '../tools/check-ad-copy.mjs';

const valid = `# Ads v1
## Ad group: Trip planner
### Headlines
- Salvador Trip Planner
- Local Team in Salvador
- Free Quote on WhatsApp
### Descriptions
- Tell us your dates. We book tours, transfers, stays and shows for you.
- Free quote first. You only pay after you approve your plan.
### Paths
- salvador
- trip-plan
`;

test('valid file has no errors', () => {
  const r = checkAdCopy(valid);
  assert.deepEqual(r.errors, []);
  assert.equal(r.groups.length, 1);
  assert.equal(r.groups[0].headlines.length, 3);
});

test('flags headline over 30 chars', () => {
  const r = checkAdCopy(valid.replace('- Salvador Trip Planner', '- Salvador Trip Planner For Foreign Travelers'));
  assert.ok(r.errors.some((e) => e.includes('headline') && e.includes('30')));
});

test('flags description over 90 chars', () => {
  const r = checkAdCopy(valid.replace('- Free quote first.', '- ' + 'x'.repeat(91) + ' Free quote first.'));
  assert.ok(r.errors.some((e) => e.includes('description') && e.includes('90')));
});

test('flags too few headlines and descriptions', () => {
  const r = checkAdCopy('## Ad group: X\n### Headlines\n- One\n### Descriptions\n- Two\n');
  assert.ok(r.errors.some((e) => e.includes('3–15 headlines')));
  assert.ok(r.errors.some((e) => e.includes('2–4 descriptions')));
});

test('flags path over 15 chars and more than 2 paths', () => {
  const r = checkAdCopy(valid.replace('- trip-plan', '- trip-planning-service\n- extra'));
  assert.ok(r.errors.some((e) => e.includes('path') && e.includes('15')));
  assert.ok(r.errors.some((e) => e.includes('max 2 paths')));
});

test('flags unproven superlatives', () => {
  const r = checkAdCopy(valid.replace('- Local Team in Salvador', '- Best Guide in Salvador'));
  assert.ok(r.errors.some((e) => e.includes('superlative')));
});

test('file without ad groups is an error', () => {
  assert.ok(checkAdCopy('# nothing').errors.length > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ad-copy.test.mjs`
Expected: FAIL (`Cannot find module .../tools/check-ad-copy.mjs`).

- [ ] **Step 3: Implement**

`tools/check-ad-copy.mjs`:
```js
// Validates Google Ads RSA copy written by the offer-copywriter skill.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LIMITS = { headlines: [3, 15, 30], descriptions: [2, 4, 90] };
const SUPERLATIVES = /(\bbest\b|#1|\bnumber one\b|\bcheapest\b|\btop-rated\b)/i;

export function checkAdCopy(markdown) {
  const groups = [];
  let group = null;
  let section = null;
  for (const raw of markdown.split('\n')) {
    const line = raw.trim();
    const g = line.match(/^## Ad group:\s*(.+)$/);
    if (g) {
      group = { name: g[1], headlines: [], descriptions: [], paths: [] };
      groups.push(group);
      section = null;
      continue;
    }
    const s = line.match(/^### (Headlines|Descriptions|Paths)$/);
    if (s) { section = s[1].toLowerCase(); continue; }
    if (group && section && line.startsWith('- ')) group[section].push(line.slice(2).trim());
  }

  const errors = [];
  if (groups.length === 0) errors.push('no "## Ad group:" sections found');
  for (const grp of groups) {
    for (const [kind, [min, max, len]] of Object.entries(LIMITS)) {
      const items = grp[kind];
      if (items.length < min || items.length > max) {
        errors.push(`[${grp.name}] needs ${min}–${max} ${kind}, has ${items.length}`);
      }
      const singular = kind.slice(0, -1);
      for (const t of items) {
        if (t.length > len) errors.push(`[${grp.name}] ${singular} over ${len} chars (${t.length}): ${t}`);
        if (SUPERLATIVES.test(t)) errors.push(`[${grp.name}] unproven superlative in ${singular}: ${t}`);
      }
    }
    if (grp.paths.length > 2) errors.push(`[${grp.name}] max 2 paths, has ${grp.paths.length}`);
    for (const p of grp.paths) {
      if (p.length > 15) errors.push(`[${grp.name}] path over 15 chars (${p.length}): ${p}`);
    }
  }
  return { errors, groups };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) { console.error('usage: node tools/check-ad-copy.mjs <ads-file.md>'); process.exit(2); }
  const { errors, groups } = checkAdCopy(readFileSync(file, 'utf8'));
  for (const e of errors) console.log(e);
  if (errors.length) process.exit(1);
  console.log(`OK — ${groups.length} ad group(s)`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ad-copy.test.mjs`
Expected: PASS (7 tests).

- [ ] **Step 5: Baseline pressure scenario**

Fresh subagent without the skill:
> "Repo /home/willianwg/adr. Write the landing page hero and 3 Google ads for a Salvador trip-planning service using `marketing/brief.md`. Our planning fee and testimonials aren't in the brief yet, just make something reasonable."

Record misses among: (a) refuses to invent fee/testimonials and flags gaps, (b) offer defined before copy, (c) each copy choice has a hypothesis, (d) ad copy in the checker format and validated with `node tools/check-ad-copy.mjs`, (e) ad groups mirror search intent. Expected baseline: misses (a), (d).

- [ ] **Step 6: Write the skill**

`.claude/skills/offer-copywriter/SKILL.md`:
```markdown
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
```

- [ ] **Step 7: Run tests + GREEN pressure scenario**

Run: `node --test 'tests/*.test.mjs'`
Expected: PASS.
Repeat Step 5's prompt with a fresh subagent told to read and follow `.claude/skills/offer-copywriter/SKILL.md`. Expected: (a)–(e) present. Tighten wording where missing and rerun.

- [ ] **Step 8: Commit**

```bash
git add tools/check-ad-copy.mjs tests/ad-copy.test.mjs .claude/skills/offer-copywriter
git commit -m "feat(skills): add offer-copywriter skill and ad copy checker"
```

---

### Task 4: sales-page-builder skill + tracking contract

**Files:**
- Create: `.claude/skills/sales-page-builder/SKILL.md`, `.claude/skills/sales-page-builder/references/tracking-contract.md`, `tools/optimize-images.mjs`

**Interfaces:**
- Consumes: approved `marketing/copy/landing-v{n}.md` (Task 3 format).
- Produces: the contract every later page task follows: event names, `CONFIG` keys (`whatsappNumber`, `ga4Id`, `adsId`, `adsConversion`, `leadEndpoint`), lead payload fields (identical to Apps Script `HEADERS` minus `status`/`valor`).

- [ ] **Step 1: Baseline pressure scenario**

Fresh subagent without the skill:
> "Repo /home/willianwg/adr. Add a testimonials carousel and a top navigation menu linking to toknowsalvador.com to the landing page in plan/, and also rewrite the hero headline to something punchier. Plan only, don't edit."

Record misses among: (a) refuses nav/outbound links (CRO rule), (b) does not rewrite copy itself — sends it to `offer-copywriter`, (c) treats a carousel as a change to log in `experiments.md`, one change at a time, (d) names the verification (tests, Lighthouse ≥ 90, screenshots 390/1440).

- [ ] **Step 2: Write the tracking contract**

`.claude/skills/sales-page-builder/references/tracking-contract.md`:
```markdown
# Tracking contract

Changing anything here requires updating `plan/js/lead.mjs`, `plan/js/app.mjs`, `integrations/apps-script/Code.gs` and their tests together.

## CONFIG (`plan/js/config.mjs`)

| Key | Example | Empty means |
|---|---|---|
| `whatsappNumber` | `5571993719791` | never empty |
| `ga4Id` | `G-ABC123XYZ` | gtag not loaded; events are no-ops |
| `adsId` | `AW-123456789` | Ads tag not configured |
| `adsConversion` | `AW-123456789/AbCdEf` | conversion not sent |
| `leadEndpoint` | Apps Script `/exec` URL | lead not posted; WhatsApp still opens |

## GA4 events

| Event | When | Params |
|---|---|---|
| `form_start` | first focus inside the form (once per page view) | — |
| `form_step_2` | step 1 validated, step 2 shown | `people` |
| `generate_lead` | step 2 validated, before redirect | `lead_id` |
| `whatsapp_click` | right before redirect | `lead_id` |

Google Ads conversion: `gtag('event', 'conversion', { send_to: CONFIG.adsConversion, transaction_id: lead_id, event_callback })`.

## Lead payload / sheet columns (in order)

`timestamp, lead_id, name, whatsapp, people, arrival, departure, dates_unknown, interests, budget, utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, landing_url` — the sheet adds `status` (default `novo`) and `valor`.

## Invariants

- Redirect to WhatsApp happens exactly once per submit, within 1 s, whatever happens to gtag or the endpoint.
- Consent defaults: `denied` for `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` in EEA + GB + CH; `granted` elsewhere; banner updates on choice.
```

- [ ] **Step 3: Write the skill**

`.claude/skills/sales-page-builder/SKILL.md`:
```markdown
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

Invoke `frontend-design:frontend-design` for the aesthetic direction, constrained to the brand: DM Sans (body) + Playfair Display (headings), dark base like `toknowsalvador.com`, warm Bahia accent. Conversion beats ornament: contrast ≥ 4.5:1, tap targets ≥ 44px, CTA color used for nothing else.

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
```

- [ ] **Step 4: Image optimizer (referenced by the skill, so the validator requires it)**

`tools/optimize-images.mjs`:
```js
// Converts selected images from public/ to optimized WebP in plan/assets/.
// Usage: npm install --no-save --no-package-lock sharp@0.33.5 && node tools/optimize-images.mjs public/a.jpeg:hero public/b.png:about
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const pairs = process.argv.slice(2);
if (pairs.length === 0) {
  console.error('usage: node tools/optimize-images.mjs <src>:<name> [...]');
  process.exit(2);
}
mkdirSync('plan/assets', { recursive: true });
for (const pair of pairs) {
  const [src, name] = pair.split(':');
  const out = `plan/assets/${name}.webp`;
  const info = await sharp(src).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
  console.log(`${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}
```

- [ ] **Step 5: Run tests + GREEN pressure scenario**

Run: `node --test tests/skills.test.mjs`
Expected: PASS (validator checks `references/tracking-contract.md` and `tools/optimize-images.mjs` exist).
Repeat Step 1 with a fresh subagent told to follow the skill. Expected: (a)–(d) present.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/sales-page-builder tools/optimize-images.mjs
git commit -m "feat(skills): add sales-page-builder skill and tracking contract"
```

---

### Task 5: google-ads-strategist skill

**Files:**
- Create: `.claude/skills/google-ads-strategist/SKILL.md`

**Interfaces:**
- Consumes: approved `marketing/copy/ads-v{n}.md`; `tools/check-ad-copy.mjs`.
- Produces: `marketing/ads/campaign-plan.md` (format defined in the skill) used by `offer-copywriter` and `campaign-analyst`.

- [ ] **Step 1: Baseline pressure scenario**

Fresh subagent without the skill:
> "We have R$ 1.000/month for Google Ads to sell a Salvador trip-planning service to English-speaking foreigners. Plan the campaign. Plan only."

Record misses among: (a) Search only, Display and Search Partners off, (b) phrase/exact only, (c) negative list from day one, (d) bidding progression Maximize Clicks with CPC cap → Maximize Conversions after 15–30 conversions, (e) location strategy "Brazil, presence or interest" + English, (f) budget math (~R$ 33/day) and realistic expectations, (g) auto-apply recommendations off.

- [ ] **Step 2: Write the skill**

`.claude/skills/google-ads-strategist/SKILL.md`:
```markdown
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
```

- [ ] **Step 3: Run tests + GREEN pressure scenario**

Run: `node --test tests/skills.test.mjs`
Expected: PASS.
Repeat Step 1 with a fresh subagent told to follow the skill. Expected: (a)–(g) present.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/google-ads-strategist
git commit -m "feat(skills): add google-ads-strategist skill"
```

---

### Task 6: campaign-analyst skill + full skill set check

**Files:**
- Create: `.claude/skills/campaign-analyst/SKILL.md`
- Modify: `tests/skills.test.mjs` (append completeness test)

**Interfaces:**
- Consumes: CSV exports in `marketing/data/`, the leads sheet columns from the tracking contract, `marketing/ads/campaign-plan.md`.
- Produces: `marketing/reports/YYYY-MM-DD.md` reports and `EXP` entries.

- [ ] **Step 1: Write the failing test**

Append to `tests/skills.test.mjs`:
```js
test('all five campaign skills exist', () => {
  for (const s of ['growth-orchestrator', 'offer-copywriter', 'sales-page-builder',
    'google-ads-strategist', 'campaign-analyst']) {
    assert.ok(skills.includes(s), `missing skill ${s}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/skills.test.mjs`
Expected: FAIL `missing skill campaign-analyst`.

- [ ] **Step 3: Baseline pressure scenario**

Create a throwaway fixture in the scratchpad (not the repo): leads CSV with 6 rows (2 `fechou`, values 400 and 650; 3 `respondeu`; 1 `novo`) across utm_term values, and a search terms CSV with 40 terms including "el salvador tours", "salvador weather" and "salvador trip planner". Fresh subagent without the skill:
> "Here's two weeks of Google Ads data (R$ 460 spent) and our leads sheet: <paths>. Ad A has 4.1% CTR, ad B 5.3%. Which ad won and what should we change?"

Record misses among: (a) refuses to declare a winner at this sample size, (b) computes CPL and cost per sale, (c) lists negatives from search terms, (d) lead quality per keyword using `status`, (e) ≤ 3 prioritized actions each routed to an owner skill, (f) logs to `experiments.md`.

- [ ] **Step 4: Write the skill**

`.claude/skills/campaign-analyst/SKILL.md`:
```markdown
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
4. Leads sheet → File → Download → CSV. Before exporting, the team must update `status` (`novo`, `respondeu`, `orçamento enviado`, `fechou`, `perdido`) and `valor` (sale value in R$) for every lead.

Google Ads CSVs start with 2 title lines; skip them. Compute numbers with a short script (node or python), never by eye, and show the table.

## 1. Funnel table

| Stage | Count | Rate |
|---|---|---|
| Impressions | | |
| Clicks | | CTR |
| Leads (sheet rows with utm_source=google) | | CVR = leads / clicks |
| Responded | | |
| Quotes sent | | |
| Sales (`fechou`) | | close rate = sales / quotes |

Then: spend, CPC, **cost per lead**, **cost per sale**, revenue (`valor` sum), ROAS. Name the weakest stage.

## 2. Waste (always actionable)

- Search terms irrelevant to the offer → negative keywords list (exact text).
- Keyword with spend > R$ 60 and 0 leads → pause.
- Keyword with leads but 0 responses after ≥ 5 leads → lead quality problem → flag for `offer-copywriter` (expectation mismatch).

## 3. Decision rules for small samples

| Situation | Verdict |
|---|---|
| Fewer than 100 clicks per variant | inconclusive — keep running |
| CTR difference between ads | ignore unless ≥ 1.000 impressions each and difference ≥ 50% relative |
| Landing change | compare CVR over ≥ 2 weeks and ≥ 150 clicks per period; otherwise inconclusive |
| Zero leads after 150 clicks | page/offer problem → `sales-page-builder` + `offer-copywriter` |
| Leads arrive but close rate < 20% with ≥ 10 quotes | sales problem → check `whatsapp-closer` trigger in `marketing/skill-backlog.md` |

Always say how many clicks/leads a verdict is based on.

## 4. Output

Write `marketing/reports/YYYY-MM-DD.md`: funnel table, waste list, verdicts, and **max 3 actions**, each with owner skill (`google-ads-strategist`, `offer-copywriter`, `sales-page-builder`) or person. Close or update `EXP` entries in `marketing/experiments.md`. Check backlog triggers in `marketing/skill-backlog.md` and report any that are met to `growth-orchestrator`.

Summarize to the team in Portuguese, in 5 lines or fewer, before the details.
```

- [ ] **Step 5: Run tests + GREEN pressure scenario**

Run: `node --test 'tests/*.test.mjs'`
Expected: PASS (including `all five campaign skills exist`).
Repeat Step 3 with a fresh subagent told to follow the skill. Expected: (a)–(f) present.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/campaign-analyst tests/skills.test.mjs
git commit -m "feat(skills): add campaign-analyst skill"
```

---

### Task 7: Lead logic module (`plan/js/lead.mjs`)

**Files:**
- Create: `plan/js/lead.mjs`, `tests/lead.test.mjs`

**Interfaces:**
- Produces (exact exports):
  - `generateLeadId(rand = Math.random) => string` — `/^TKS-[0-9A-F]{4}$/`
  - `readAttribution(search: string) => object` — keys from `ATTRIBUTION_KEYS` present in the query, trimmed, max 200 chars
  - `loadAttribution(storage: Storage|null, search: string) => object` — merges stored + new (new wins), saves under `tks_attr`; never throws
  - `normalizePhone(countryCode: string, phone: string) => string|null` — `'+' + digits`, 8–15 digits total; `countryCode === 'other'` requires phone starting with `+`
  - `validateStep(step: 1|2, data: FormData-like object) => { valid: boolean, errors: Record<string,string> }`
  - `buildLeadPayload(data, attribution, leadId, now: Date, landingUrl: string) => object` — keys exactly the tracking contract column list
  - `buildWhatsAppText(payload) => string` — ends with `Ref: {lead_id}`
  - `buildWhatsAppUrl(number: string, text: string) => string`
  - `ATTRIBUTION_KEYS = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid']`
- Form data object shape (from `app.mjs` `readForm`): `{ arrival: string, departure: string, datesUnknown: boolean, people: string, interests: string[], name: string, countryCode: string, phone: string, budget: string }`

- [ ] **Step 1: Write the failing tests**

`tests/lead.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateLeadId, readAttribution, loadAttribution, normalizePhone, validateStep,
  buildLeadPayload, buildWhatsAppText, buildWhatsAppUrl,
} from '../plan/js/lead.mjs';

const base = {
  arrival: '2026-12-20', departure: '2026-12-28', datesUnknown: false, people: '2',
  interests: ['tours', 'shows'], name: 'Maya', countryCode: '1', phone: '(555) 123-4567', budget: '',
};

test('generateLeadId format', () => {
  assert.match(generateLeadId(), /^TKS-[0-9A-F]{4}$/);
  assert.equal(generateLeadId(() => 0), 'TKS-0000');
  assert.equal(generateLeadId(() => 0.999999), 'TKS-FFFF');
});

test('readAttribution keeps only known keys, trims and truncates', () => {
  const a = readAttribution(`?utm_source=google&utm_term=%20salvador%20trip%20&foo=bar&gclid=${'x'.repeat(300)}`);
  assert.deepEqual(Object.keys(a).sort(), ['gclid', 'utm_source', 'utm_term']);
  assert.equal(a.utm_term, 'salvador trip');
  assert.equal(a.gclid.length, 200);
});

test('loadAttribution merges stored and new, new wins', () => {
  const store = new Map([['tks_attr', JSON.stringify({ utm_source: 'old', gclid: 'g1' })]]);
  const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const a = loadAttribution(storage, '?utm_source=google');
  assert.deepEqual(a, { utm_source: 'google', gclid: 'g1' });
  assert.deepEqual(JSON.parse(store.get('tks_attr')), a);
});

test('loadAttribution survives throwing storage', () => {
  const storage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.deepEqual(loadAttribution(storage, '?gclid=abc'), { gclid: 'abc' });
  assert.deepEqual(loadAttribution(null, '?gclid=abc'), { gclid: 'abc' });
});

test('loadAttribution ignores corrupt stored JSON', () => {
  const storage = { getItem: () => '{not json', setItem() {} };
  assert.deepEqual(loadAttribution(storage, ''), {});
});

test('normalizePhone', () => {
  assert.equal(normalizePhone('1', '(555) 123-4567'), '+15551234567');
  assert.equal(normalizePhone('44', '07700 900123'), '+447700900123'); // strips trunk 0
  assert.equal(normalizePhone('other', '+61 412 345 678'), '+61412345678');
  assert.equal(normalizePhone('other', '412 345 678'), null);
  assert.equal(normalizePhone('1', '123'), null);
  assert.equal(normalizePhone('1', '1'.repeat(20)), null);
});

test('validateStep 1 accepts valid data', () => {
  assert.deepEqual(validateStep(1, base), { valid: true, errors: {} });
});

test('validateStep 1 requires people between 1 and 20', () => {
  for (const people of ['', '0', '21', 'abc', '2.5']) {
    const r = validateStep(1, { ...base, people });
    assert.equal(r.valid, false, people);
    assert.ok(r.errors.people);
  }
});

test('validateStep 1 dates: unknown is fine, departure before arrival is not', () => {
  assert.equal(validateStep(1, { ...base, arrival: '', departure: '', datesUnknown: true }).valid, true);
  const r = validateStep(1, { ...base, arrival: '2026-12-28', departure: '2026-12-20' });
  assert.ok(r.errors.departure);
  const r2 = validateStep(1, { ...base, arrival: '', departure: '' });
  assert.ok(r2.errors.arrival);
});

test('validateStep 2 requires name and valid WhatsApp', () => {
  assert.equal(validateStep(2, base).valid, true);
  assert.ok(validateStep(2, { ...base, name: ' ' }).errors.name);
  assert.ok(validateStep(2, { ...base, name: 'x'.repeat(81) }).errors.name);
  assert.ok(validateStep(2, { ...base, phone: '12' }).errors.phone);
});

test('buildLeadPayload has exactly the contract columns', () => {
  const p = buildLeadPayload(base, { utm_source: 'google', gclid: 'g1' }, 'TKS-ABCD',
    new Date('2026-10-07T12:00:00Z'), 'https://plan.toknowsalvador.com/?gclid=g1');
  assert.deepEqual(Object.keys(p), ['timestamp', 'lead_id', 'name', 'whatsapp', 'people', 'arrival',
    'departure', 'dates_unknown', 'interests', 'budget', 'utm_source', 'utm_medium', 'utm_campaign',
    'utm_term', 'utm_content', 'gclid', 'landing_url']);
  assert.equal(p.timestamp, '2026-10-07T12:00:00.000Z');
  assert.equal(p.whatsapp, '+15551234567');
  assert.equal(p.people, 2);
  assert.equal(p.interests, 'tours, shows');
  assert.equal(p.utm_medium, '');
  assert.equal(p.dates_unknown, false);
});

test('buildWhatsAppText includes trip details and ends with Ref', () => {
  const p = buildLeadPayload(base, {}, 'TKS-ABCD', new Date(), 'u');
  const t = buildWhatsAppText(p);
  assert.match(t, /Maya/);
  assert.match(t, /2 people/);
  assert.match(t, /2026-12-20 to 2026-12-28/);
  assert.match(t, /tours, shows/);
  assert.match(t, /Ref: TKS-ABCD$/);
  const unknown = buildWhatsAppText(buildLeadPayload({ ...base, datesUnknown: true, arrival: '', departure: '', people: '1', interests: [] }, {}, 'TKS-0001', new Date(), 'u'));
  assert.match(unknown, /dates not decided yet/);
  assert.match(unknown, /1 person/);
  assert.doesNotMatch(unknown, /interested in/);
});

test('buildWhatsAppUrl encodes special characters', () => {
  const text = 'Hi! I\'m José & Zoë #1? 🌴\nLine 2';
  const url = buildWhatsAppUrl('5571993719791', text);
  assert.ok(url.startsWith('https://wa.me/5571993719791?text='));
  assert.equal(new URL(url).searchParams.get('text'), text);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/lead.test.mjs`
Expected: FAIL (`Cannot find module .../plan/js/lead.mjs`).

- [ ] **Step 3: Implement**

`plan/js/lead.mjs`:
```js
// Pure lead logic for the campaign landing page. No DOM access — unit-tested in tests/lead.test.mjs.

export const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];
const STORAGE_KEY = 'tks_attr';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function generateLeadId(rand = Math.random) {
  const n = Math.min(0xffff, Math.floor(rand() * 0x10000));
  return `TKS-${n.toString(16).toUpperCase().padStart(4, '0')}`;
}

export function readAttribution(search) {
  const params = new URLSearchParams(search);
  const out = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value && value.trim()) out[key] = value.trim().slice(0, 200);
  }
  return out;
}

export function loadAttribution(storage, search) {
  let stored = {};
  try {
    const raw = storage && storage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) || {};
  } catch { stored = {}; }
  const merged = { ...stored, ...readAttribution(search) };
  try { storage && storage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch { /* storage unavailable */ }
  return merged;
}

export function normalizePhone(countryCode, phone) {
  const raw = String(phone || '').trim();
  let digits;
  if (countryCode === 'other') {
    if (!raw.startsWith('+')) return null;
    digits = raw.replace(/\D/g, '');
  } else {
    digits = String(countryCode).replace(/\D/g, '') + raw.replace(/\D/g, '').replace(/^0+/, '');
  }
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}

export function validateStep(step, data) {
  const errors = {};
  if (step === 1) {
    const people = String(data.people || '').trim();
    if (!/^\d+$/.test(people) || Number(people) < 1 || Number(people) > 20) {
      errors.people = 'Please enter how many travelers (1–20).';
    }
    if (!data.datesUnknown) {
      if (!ISO_DATE.test(data.arrival || '')) errors.arrival = 'Add your arrival date, or tick "Not sure yet".';
      if (!ISO_DATE.test(data.departure || '')) errors.departure = 'Add your departure date, or tick "Not sure yet".';
      else if (ISO_DATE.test(data.arrival || '') && data.departure < data.arrival) {
        errors.departure = 'Departure must be after arrival.';
      }
    }
  }
  if (step === 2) {
    const name = String(data.name || '').trim();
    if (name.length < 2 || name.length > 80) errors.name = 'Please enter your name.';
    if (!normalizePhone(data.countryCode, data.phone)) {
      errors.phone = 'Please enter a valid WhatsApp number with country code.';
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function buildLeadPayload(data, attribution, leadId, now, landingUrl) {
  const unknown = Boolean(data.datesUnknown);
  return {
    timestamp: now.toISOString(),
    lead_id: leadId,
    name: String(data.name || '').trim(),
    whatsapp: normalizePhone(data.countryCode, data.phone) || '',
    people: Number(data.people),
    arrival: unknown ? '' : data.arrival || '',
    departure: unknown ? '' : data.departure || '',
    dates_unknown: unknown,
    interests: (data.interests || []).join(', '),
    budget: data.budget || '',
    utm_source: attribution.utm_source || '',
    utm_medium: attribution.utm_medium || '',
    utm_campaign: attribution.utm_campaign || '',
    utm_term: attribution.utm_term || '',
    utm_content: attribution.utm_content || '',
    gclid: attribution.gclid || '',
    landing_url: landingUrl,
  };
}

export function buildWhatsAppText(p) {
  const who = `${p.people} ${p.people === 1 ? 'person' : 'people'}`;
  const when = p.dates_unknown || !p.arrival ? 'dates not decided yet' : `${p.arrival} to ${p.departure}`;
  const lines = [`Hi! I'm ${p.name}. I'd like help planning my trip to Salvador.`, `${who}, ${when}.`];
  if (p.interests) lines.push(`I'm interested in: ${p.interests}.`);
  if (p.budget) lines.push(`Budget: ${p.budget}.`);
  lines.push(`Ref: ${p.lead_id}`);
  return lines.join('\n');
}

export function buildWhatsAppUrl(number, text) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
```

Note: the final WhatsApp wording is owned by `offer-copywriter`; Task 10 may change the sentences in `buildWhatsAppText`, and the matching assertions in this test must be updated in the same commit. `Ref: {lead_id}` as the last line is part of the contract and must stay.

The "interested in" negative assertion in the test uses `doesNotMatch(/interested in/)` — the implementation line reads `I'm interested in:` only when interests exist, which satisfies it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/lead.test.mjs`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit**

```bash
git add plan/js/lead.mjs tests/lead.test.mjs
git commit -m "feat(plan): add tested lead logic module"
```

---

### Task 8: Google Apps Script lead webhook

**Files:**
- Create: `integrations/apps-script/Code.gs`, `tests/apps-script.test.mjs`

**Interfaces:**
- Consumes: payload from `buildLeadPayload` (Task 7), sent as `text/plain` JSON body.
- Produces: `HEADERS` (17 contract columns + `status`, `valor`), `sanitizeCell(value) => string`, `buildRow(data) => string[]`, `doPost(e)` appending to sheet `Leads`.

- [ ] **Step 1: Write the failing tests**

`tests/apps-script.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../integrations/apps-script/Code.gs', import.meta.url), 'utf8');

function load(sheetRows = []) {
  const sheet = {
    getLastRow: () => sheetRows.length,
    appendRow: (row) => sheetRows.push(row),
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }) },
    ContentService: { createTextOutput: (t) => ({ text: t }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, sheetRows };
}

const payload = {
  timestamp: '2026-10-07T12:00:00.000Z', lead_id: 'TKS-ABCD', name: 'Maya', whatsapp: '+15551234567',
  people: 2, arrival: '2026-12-20', departure: '2026-12-28', dates_unknown: false, interests: 'tours, shows',
  budget: '', utm_source: 'google', utm_medium: 'cpc', utm_campaign: '123', utm_term: 'salvador trip planner',
  utm_content: '456', gclid: 'g1', landing_url: 'https://plan.toknowsalvador.com/',
};

test('HEADERS matches tracking contract plus status and valor', () => {
  const { ctx } = load();
  assert.deepEqual(Array.from(ctx.HEADERS), [...Object.keys(payload), 'status', 'valor']);
});

test('buildRow orders values and defaults status to novo', () => {
  const { ctx } = load();
  const row = Array.from(ctx.buildRow(payload));
  assert.equal(row[1], 'TKS-ABCD');
  assert.equal(row[4], '2');
  assert.equal(row.at(-2), 'novo');
  assert.equal(row.at(-1), '');
});

test('sanitizeCell neutralizes formulas', () => {
  const { ctx } = load();
  assert.equal(ctx.sanitizeCell('=HYPERLINK("x")'), '\'=HYPERLINK("x")');
  assert.equal(ctx.sanitizeCell('+15551234567'), '\'+15551234567');
  assert.equal(ctx.sanitizeCell('-1'), '\'-1');
  assert.equal(ctx.sanitizeCell('@me'), '\'@me');
  assert.equal(ctx.sanitizeCell(null), '');
  assert.equal(ctx.sanitizeCell('x'.repeat(600)).length, 500);
});

test('doPost writes headers on empty sheet, then the row', () => {
  const { ctx, sheetRows } = load();
  const out = ctx.doPost({ postData: { contents: JSON.stringify(payload) } });
  assert.equal(out.text, 'ok');
  assert.equal(sheetRows.length, 2);
  assert.deepEqual(Array.from(sheetRows[0]), Array.from(ctx.HEADERS));
  assert.equal(sheetRows[1][1], 'TKS-ABCD');
});

test('doPost rejects invalid JSON without throwing', () => {
  const { ctx, sheetRows } = load();
  const out = ctx.doPost({ postData: { contents: '{bad' } });
  assert.equal(out.text, 'error');
  assert.equal(sheetRows.length, 0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/apps-script.test.mjs`
Expected: FAIL (`ENOENT ... Code.gs`).

- [ ] **Step 3: Implement**

`integrations/apps-script/Code.gs` (uses `var`/`function` so the test VM context sees the globals):
```js
// Google Apps Script web app: receives landing page leads and appends them to the "Leads" sheet.
// Deploy: Extensions → Apps Script → paste → Deploy → Web app → Execute as: Me, Access: Anyone.
// Columns must match .claude/skills/sales-page-builder/references/tracking-contract.md.

var SHEET_NAME = 'Leads';
var HEADERS = [
  'timestamp', 'lead_id', 'name', 'whatsapp', 'people', 'arrival', 'departure', 'dates_unknown',
  'interests', 'budget', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'landing_url', 'status', 'valor'
];

function sanitizeCell(value) {
  if (value === null || value === undefined) return '';
  var s = String(value).slice(0, 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s.slice(0, 500);
}

function buildRow(data) {
  return HEADERS.map(function (h) {
    if (h === 'status') return 'novo';
    if (h === 'valor') return '';
    return sanitizeCell(data[h]);
  });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput('error');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow(buildRow(data));
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}
```

Note: `sanitizeCell('x'.repeat(600))` → slice to 500, no prefix → 500. A 500-char string starting with `=` becomes 501 then is cut back to 500 by the final slice.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/apps-script.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add integrations/apps-script/Code.gs tests/apps-script.test.mjs
git commit -m "feat(integrations): add Apps Script lead webhook for Google Sheets"
```

---

### Task 9: Brief interview (human checkpoint)

**Files:**
- Modify: `marketing/brief.md`

- [ ] **Step 1: Run the orchestrator**

Invoke the `growth-orchestrator` skill. It must detect phase `Setup` and interview the team in Portuguese, one question at a time, writing each answer to `marketing/brief.md`.

- [ ] **Step 2: Verify**

Run: `grep -c '\[MISSING\]' marketing/brief.md`
Expected: `0`. (`[UNKNOWN — decide by …]` entries are allowed only outside `## Offer` fee/includes lines; if the fee is unknown, stop here — the copy cannot be written honestly without it.)

- [ ] **Step 3: Commit**

```bash
git add marketing/brief.md
git commit -m "docs(marketing): fill campaign brief from team interview"
```

---

### Task 10: Landing + ad copy v1 (human approval)

**Files:**
- Create: `marketing/copy/landing-v1.md`, `marketing/copy/ads-v1.md`
- Modify: `marketing/decisions.md`; possibly `plan/js/lead.mjs` + `tests/lead.test.mjs` (WhatsApp prefill wording only)

- [ ] **Step 1: Run offer-copywriter**

Invoke the `offer-copywriter` skill. Output both files in the formats it defines.

- [ ] **Step 2: Validate ads**

Run: `node tools/check-ad-copy.mjs marketing/copy/ads-v1.md`
Expected: `OK — 3 ad group(s)` (or 2 if Logistics deferred).

- [ ] **Step 3: Team approval**

Present the Portuguese summary + files. On approval set `Status: approved` in both and add the decision entry. If the WhatsApp prefill differs from `buildWhatsAppText`, update the function and its test assertions, then run `node --test tests/lead.test.mjs` → PASS.

- [ ] **Step 4: Commit**

```bash
git add marketing/copy marketing/decisions.md plan/js/lead.mjs tests/lead.test.mjs
git commit -m "docs(marketing): approve landing and ad copy v1"
```

---

### Task 11: Build the landing page

**Files:**
- Create: `plan/index.html`, `plan/privacy.html`, `plan/_headers`, `plan/js/config.mjs`, `plan/js/app.mjs`, `plan/assets/*.webp`, `tests/page.test.mjs`

**Interfaces:**
- Consumes: `lead.mjs` exports (Task 7), tracking contract (Task 4), `landing-v1.md` (Task 10).
- Produces: DOM ids used by `app.mjs` and tests: `#lead-form`, `fieldset[data-step="1"]`, `fieldset[data-step="2"]`, `[data-next]`, `[data-back]`, `#form-error`, `#consent-banner`, `[data-consent="accept"]`, `[data-consent="decline"]`, `.sticky-cta`; input names `arrival`, `departure`, `datesUnknown`, `people`, `interests`, `name`, `countryCode`, `phone`, `budget`.

- [ ] **Step 1: Optimize images**

`tools/optimize-images.mjs` already exists (Task 4).


Pick images: view candidates in `public/` with the Read tool (only those listed in brief `## Proof` → "Photos/videos we may use"). Choose: `hero` (people enjoying Salvador, faces visible), `about` (Adriano/team), up to 4 `exp-*` (tour, food, show, beach). Run:
```bash
npm install --no-save --no-package-lock sharp@0.33.5
node tools/optimize-images.mjs public/<hero>:hero public/<about>:about public/<x>:exp-tour ...
```
Expected: every output ≤ 250KB. If one is larger, pick a different source photo (busy textures compress poorly) and rerun.

- [ ] **Step 2: Write the failing page test**

`tests/page.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const html = read('plan/index.html');

test('page is English, noindex and declares copy version', () => {
  assert.match(html, /<html lang="en"/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<meta name="copy-version" content="v\d+">/);
  assert.match(read('plan/_headers'), /X-Robots-Tag: noindex, nofollow/);
});

test('no navigation and no outbound links except WhatsApp and privacy', () => {
  assert.doesNotMatch(html, /<nav[\s>]/);
  for (const [, href] of html.matchAll(/<a[^>]+href="([^"]+)"/g)) {
    assert.ok(href.startsWith('#') || href.startsWith('https://wa.me/') || href === 'privacy.html',
      `unexpected link ${href}`);
  }
});

test('form has both steps and all contract fields', () => {
  assert.match(html, /<form id="lead-form"[^>]*novalidate/);
  assert.match(html, /<fieldset data-step="1"/);
  assert.match(html, /<fieldset data-step="2"[^>]*hidden/);
  for (const name of ['arrival', 'departure', 'datesUnknown', 'people', 'interests', 'name', 'countryCode', 'phone', 'budget']) {
    assert.match(html, new RegExp(`name="${name}"`), `missing field ${name}`);
  }
  for (const sel of ['data-next', 'data-back', 'id="form-error"', 'id="consent-banner"',
    'data-consent="accept"', 'data-consent="decline"', 'class="sticky-cta']) {
    assert.ok(html.includes(sel), `missing ${sel}`);
  }
  assert.match(html, /role="alert"/);
});

test('consent default is set before gtag and app module is loaded', () => {
  const consentAt = html.indexOf("gtag('consent', 'default'");
  const appAt = html.indexOf('src="js/app.mjs"');
  assert.ok(consentAt > -1 && appAt > -1 && consentAt < appAt);
  assert.match(html, /region: \[[^\]]*'GB'[^\]]*\]/);
});

test('page is not in sitemap and not linked from main site', () => {
  assert.doesNotMatch(read('sitemap.xml'), /plan\.toknowsalvador/);
  assert.doesNotMatch(read('index.html'), /plan\.toknowsalvador/);
});

test('privacy page exists; config has all contract keys', async () => {
  assert.ok(existsSync(new URL('../plan/privacy.html', import.meta.url)));
  const { CONFIG } = await import('../plan/js/config.mjs');
  assert.deepEqual(Object.keys(CONFIG).sort(), ['adsConversion', 'adsId', 'ga4Id', 'leadEndpoint', 'whatsappNumber']);
  assert.equal(CONFIG.whatsappNumber, '5571993719791');
});

test('all referenced local assets exist and images are ≤ 250KB', () => {
  for (const [, src] of html.matchAll(/(?:src|href)="((?:assets|js)\/[^"]+)"/g)) {
    assert.ok(existsSync(new URL(`../plan/${src}`, import.meta.url)), `missing ${src}`);
  }
  for (const f of readdirSync(new URL('../plan/assets/', import.meta.url))) {
    assert.ok(statSync(new URL(`../plan/assets/${f}`, import.meta.url)).size <= 250 * 1024, `${f} too big`);
  }
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test tests/page.test.mjs`
Expected: FAIL (`ENOENT ... plan/index.html`).

- [ ] **Step 4: Config, headers, app wiring**

`plan/js/config.mjs`:
```js
// Filled during launch — see docs/setup/launch-checklist.md. Empty values disable that integration safely.
export const CONFIG = {
  whatsappNumber: '5571993719791',
  ga4Id: '',
  adsId: '',
  adsConversion: '',
  leadEndpoint: '',
};
```

`plan/_headers`:
```
/*
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: strict-origin-when-cross-origin
```

`plan/js/app.mjs`:
```js
// DOM wiring for the landing page: form steps, consent, tracking, lead submit and WhatsApp redirect.
import { CONFIG } from './config.mjs';
import {
  generateLeadId, loadAttribution, validateStep, buildLeadPayload, buildWhatsAppText, buildWhatsAppUrl,
} from './lead.mjs';

const CONSENT_KEY = 'tks_consent';

function safeStorage(kind) {
  try { return window[kind]; } catch { return null; }
}

function track(name, params = {}) {
  try { if (typeof window.gtag === 'function') window.gtag('event', name, params); } catch { /* tracking must never break the page */ }
}

function loadGtag() {
  if (!CONFIG.ga4Id) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.ga4Id}`;
  document.head.appendChild(s);
  window.gtag('js', new Date());
  window.gtag('config', CONFIG.ga4Id);
  if (CONFIG.adsId) window.gtag('config', CONFIG.adsId);
}

function setupConsent() {
  const banner = document.getElementById('consent-banner');
  const local = safeStorage('localStorage');
  let saved = null;
  try { saved = local && local.getItem(CONSENT_KEY); } catch { saved = null; }
  const apply = (choice) => {
    const v = choice === 'accept' ? 'granted' : 'denied';
    try {
      window.gtag('consent', 'update', {
        ad_storage: v, ad_user_data: v, ad_personalization: v, analytics_storage: v,
      });
    } catch { /* ignore */ }
  };
  if (saved) { apply(saved); return; }
  banner.hidden = false;
  banner.addEventListener('click', (e) => {
    const choice = e.target.closest('[data-consent]')?.dataset.consent;
    if (!choice) return;
    apply(choice);
    try { local && local.setItem(CONSENT_KEY, choice); } catch { /* ignore */ }
    banner.hidden = true;
  });
}

function readForm(form) {
  const fd = new FormData(form);
  return {
    arrival: fd.get('arrival') || '',
    departure: fd.get('departure') || '',
    datesUnknown: fd.get('datesUnknown') === 'on',
    people: fd.get('people') || '',
    interests: fd.getAll('interests'),
    name: fd.get('name') || '',
    countryCode: fd.get('countryCode') || '',
    phone: fd.get('phone') || '',
    budget: fd.get('budget') || '',
  };
}

function showErrors(form, errors) {
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  const fields = Object.keys(errors);
  for (const name of fields) form.querySelector(`[name="${name}"]`)?.setAttribute('aria-invalid', 'true');
  document.getElementById('form-error').textContent = fields.map((f) => errors[f]).join(' ');
  if (fields.length) form.querySelector(`[name="${fields[0]}"]`)?.focus();
}

function sendLead(payload) {
  if (!CONFIG.leadEndpoint) return;
  try {
    const body = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=UTF-8' });
    const queued = navigator.sendBeacon && navigator.sendBeacon(CONFIG.leadEndpoint, body);
    if (!queued) fetch(CONFIG.leadEndpoint, { method: 'POST', body, mode: 'no-cors', keepalive: true }).catch(() => {});
  } catch { /* the WhatsApp message still carries the lead */ }
}

function setupForm(attribution) {
  const form = document.getElementById('lead-form');
  const step1 = form.querySelector('fieldset[data-step="1"]');
  const step2 = form.querySelector('fieldset[data-step="2"]');
  const submit = form.querySelector('button[type="submit"]');
  let started = false;
  let submitted = false;

  form.addEventListener('focusin', () => {
    if (!started) { started = true; track('form_start'); }
  });

  form.querySelector('[name="datesUnknown"]').addEventListener('change', (e) => {
    for (const n of ['arrival', 'departure']) form.querySelector(`[name="${n}"]`).disabled = e.target.checked;
  });

  form.querySelector('[data-next]').addEventListener('click', () => {
    const data = readForm(form);
    const { valid, errors } = validateStep(1, data);
    showErrors(form, errors);
    if (!valid) return;
    step1.hidden = true;
    step2.hidden = false;
    step2.querySelector('input, select')?.focus();
    track('form_step_2', { people: Number(data.people) });
  });

  form.querySelector('[data-back]').addEventListener('click', () => {
    step2.hidden = true;
    step1.hidden = false;
    showErrors(form, {});
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submitted) return;
    const data = readForm(form);
    const { valid, errors } = validateStep(2, data);
    showErrors(form, errors);
    if (!valid) return;
    submitted = true;
    submit.disabled = true;

    const leadId = generateLeadId();
    const payload = buildLeadPayload(data, attribution, leadId, new Date(), location.href);
    const url = buildWhatsAppUrl(CONFIG.whatsappNumber, buildWhatsAppText(payload));
    let navigated = false;
    const go = () => { if (!navigated) { navigated = true; window.location.href = url; } };

    sendLead(payload);
    track('generate_lead', { lead_id: leadId });
    track('whatsapp_click', { lead_id: leadId });
    if (CONFIG.adsConversion) {
      track('conversion', { send_to: CONFIG.adsConversion, transaction_id: leadId, event_callback: go });
    }
    setTimeout(go, 800);
  });
}

function setupStickyCta() {
  const cta = document.querySelector('.sticky-cta');
  const hero = document.getElementById('hero');
  const form = document.getElementById('lead-form');
  if (!cta || !hero || !('IntersectionObserver' in window)) return;
  let heroVisible = true;
  let formVisible = false;
  const update = () => { cta.hidden = heroVisible || formVisible; };
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; update(); }).observe(hero);
  new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; update(); }).observe(form);
}

const attribution = loadAttribution(safeStorage('sessionStorage'), location.search);
setupConsent();
loadGtag();
setupForm(attribution);
setupStickyCta();
```

- [ ] **Step 5: Visual direction**

Invoke `frontend-design:frontend-design` with: the brand constraints from the `sales-page-builder` skill, the section list and copy from `marketing/copy/landing-v1.md`, mobile-first, conversion over ornament. Capture the chosen direction (palette tokens, type scale, spacing) as CSS custom properties.

- [ ] **Step 6: Write `plan/index.html`**

Structure (copy text comes verbatim from `landing-v1.md`; omit the Proof section if the copy file says `PROOF GAP`):

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="copy-version" content="v1">
<title><!-- hero headline from landing-v1 --> | To Know Salvador</title>
<meta name="description" content="<!-- subheadline from landing-v1 -->">
<meta name="theme-color" content="#070707">
<link rel="icon" href="assets/icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<link rel="preload" as="image" href="assets/hero.webp" fetchpriority="high">
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', {
    ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
    region: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH'],
    wait_for_update: 500
  });
  gtag('consent', 'default', {
    ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted'
  });
</script>
<style>
  /* design tokens + all page CSS from Step 5, inline (critical) */
</style>
</head>
<body>
<header id="hero"> <!-- logo (no link), headline, subheadline, CTA <a href="#plan">, microcopy, proof line, hero img with width/height --> </header>
<main>
  <section id="problem"> ... </section>
  <section id="how"> <!-- 3 steps --> </section>
  <section id="handle"> <!-- 6 categories --> </section>
  <section id="about"> <!-- about.webp loading="lazy" --> </section>
  <section id="proof"> <!-- only real proof --> </section>
  <section id="offer"> <!-- risk reversal + CTA <a href="#plan"> --> </section>
  <section id="faq"> <!-- <details><summary> per objection --> </section>
  <section id="plan">
    <form id="lead-form" novalidate>
      <fieldset data-step="1">
        <legend><!-- step 1 title --></legend>
        <label>Arrival <input type="date" name="arrival"></label>
        <label>Departure <input type="date" name="departure"></label>
        <label><input type="checkbox" name="datesUnknown"> Not sure yet</label>
        <label>Travelers <input type="number" name="people" min="1" max="20" inputmode="numeric" required></label>
        <fieldset>
          <legend>What should we handle?</legend>
          <label><input type="checkbox" name="interests" value="tours"> Tours</label>
          <label><input type="checkbox" name="interests" value="transfers"> Transfers</label>
          <label><input type="checkbox" name="interests" value="hotel"> Hotel</label>
          <label><input type="checkbox" name="interests" value="rental"> Airbnb / rental</label>
          <label><input type="checkbox" name="interests" value="restaurants"> Restaurants</label>
          <label><input type="checkbox" name="interests" value="shows"> Cultural shows</label>
        </fieldset>
        <button type="button" data-next><!-- step 1 button text --></button>
      </fieldset>
      <fieldset data-step="2" hidden>
        <legend><!-- step 2 title --></legend>
        <label>Your name <input type="text" name="name" autocomplete="name" required maxlength="80"></label>
        <label>Country code
          <select name="countryCode" autocomplete="tel-country-code">
            <option value="1">🇺🇸🇨🇦 +1</option><option value="44">🇬🇧 +44</option>
            <option value="61">🇦🇺 +61</option><option value="353">🇮🇪 +353</option>
            <option value="64">🇳🇿 +64</option><option value="49">🇩🇪 +49</option>
            <option value="33">🇫🇷 +33</option><option value="31">🇳🇱 +31</option>
            <option value="34">🇪🇸 +34</option><option value="39">🇮🇹 +39</option>
            <option value="55">🇧🇷 +55</option><option value="other">Other (type +code)</option>
          </select>
        </label>
        <label>WhatsApp number <input type="tel" name="phone" autocomplete="tel-national" inputmode="tel" required></label>
        <label>Budget per person (optional)
          <select name="budget">
            <option value="">Prefer not to say</option>
            <option>Under US$1,000</option><option>US$1,000–3,000</option>
            <option>US$3,000–6,000</option><option>US$6,000+</option>
          </select>
        </label>
        <button type="button" data-back>Back</button>
        <button type="submit"><!-- submit text from copy --></button>
      </fieldset>
      <p id="form-error" role="alert" aria-live="polite"></p>
    </form>
  </section>
</main>
<footer><a href="privacy.html">Privacy</a> · © To Know Salvador</footer>
<a class="sticky-cta" href="#plan" hidden><!-- CTA text --></a>
<div id="consent-banner" hidden role="dialog" aria-label="Cookie consent">
  <p>We use cookies to measure our ads. <a href="privacy.html">Privacy</a></p>
  <button type="button" data-consent="decline">Decline</button>
  <button type="button" data-consent="accept">Accept</button>
</div>
<script type="module" src="js/app.mjs"></script>
</body>
</html>
```

Copy `public/toknowsalvador-icon.png` to `plan/assets/icon.png` (via optimizer is unnecessary; if > 250KB, run `node tools/optimize-images.mjs` and use `icon.webp` instead, updating the `<link rel="icon">`).

`plan/privacy.html` — standalone page, same fonts/tokens, `noindex`, sections: what we collect (name, WhatsApp, trip details, ad click IDs), why (to prepare your trip quote and contact you on WhatsApp; to measure ads), where it is stored (Google Sheets, Google Analytics, Google Ads), retention (deleted 12 months after last contact), your rights (ask us on WhatsApp +55 71 99371-9791 to see or delete your data), cookies (analytics/ads, only with consent in UK/EU). Link back with `<a href="./">Back</a>`.

- [ ] **Step 7: Run tests to verify they pass**

Run: `node --test 'tests/*.test.mjs'`
Expected: all PASS. (`page.test.mjs` treats `./` in privacy.html as fine because it only scans `index.html`.)

- [ ] **Step 8: Commit**

```bash
git add plan tests/page.test.mjs
git commit -m "feat(plan): build campaign landing page with 2-step lead form"
```

---

### Task 12: Browser verification

**Files:**
- Modify (temporarily, not committed): `plan/js/config.mjs`

- [ ] **Step 1: Serve**

Run (background): `npx --yes http-server plan -p 4173 -c-1`

- [ ] **Step 2: Lighthouse**

Use chrome-devtools MCP `lighthouse_audit` on `http://localhost:4173/` with mobile emulation.
Expected: performance ≥ 90, accessibility ≥ 90. If below, fix (image sizes, CSS, font weights) and re-run `node --test 'tests/*.test.mjs'`.

- [ ] **Step 3: Screenshots**

Playwright MCP: resize 390×844 and 1440×900, screenshot top of page, form step 1, form step 2 (after valid step 1), sticky CTA visible mid-page. Check visually: CTA above the fold on mobile, no horizontal scroll.

- [ ] **Step 4: Happy path + endpoint down + no gtag**

Set `leadEndpoint: 'http://127.0.0.1:9/'` (unreachable) and leave `ga4Id` empty. In Playwright: fill step 1 (dates, 2 people, tours), Continue, fill name `José & Zoë`, country `+1`, phone `555 123 4567`, submit. Use `browser_network_requests` / page URL:
Expected: navigation to `https://wa.me/5571993719791?text=...` within ~1s; decoded text contains `José & Zoë`, `2 people`, and last line `Ref: TKS-` + 4 hex.

- [ ] **Step 5: Double submit**

Reload. In a single `browser_evaluate` call: fill both steps programmatically (set input values, unhide step 2), set `window.gtag = (...a) => { (window.__ev ||= []).push(a); }`, call `document.getElementById('lead-form').requestSubmit()` twice in a row, then synchronously return `window.__ev.filter(e => e[1] === 'generate_lead').length` (before the 800 ms redirect).
Expected: `window.__ev` contains exactly one `generate_lead` event.

- [ ] **Step 6: Restore config**

Run: `git checkout plan/js/config.mjs && git status --short`
Expected: clean tree.

---

### Task 13: Campaign plan + launch checklist

**Files:**
- Create: `marketing/ads/campaign-plan.md`, `docs/setup/launch-checklist.md`

- [ ] **Step 1: Run google-ads-strategist**

Invoke the skill; it writes `marketing/ads/campaign-plan.md` using `ads-v1`. Validate: `node tools/check-ad-copy.mjs marketing/copy/ads-v1.md` → `OK`.

- [ ] **Step 2: Write `docs/setup/launch-checklist.md`** (Portuguese, numbered, the team executes):

```markdown
# Checklist de lançamento — plan.toknowsalvador.com

## 1. Planilha de leads
1. Criar Google Sheet "TKS Leads".
2. Extensões → Apps Script → colar `integrations/apps-script/Code.gs` → Salvar.
3. Implantar → Nova implantação → Tipo: App da Web → Executar como: Eu → Quem pode acessar: Qualquer pessoa → Implantar → autorizar.
4. Copiar a URL `/exec` → colar em `plan/js/config.mjs` → `leadEndpoint`.
5. Teste: `curl -L -X POST -H 'Content-Type: text/plain' -d '{"lead_id":"TKS-TEST","name":"Teste"}' '<URL>'` → resposta `ok` e linha na aba "Leads". Apagar a linha de teste.
6. Na coluna `status`, criar validação de dados (lista): novo, respondeu, orçamento enviado, fechou, perdido.

## 2. Google Analytics 4
1. analytics.google.com → Admin → Criar propriedade "TKS Plan" → Fluxo Web `https://plan.toknowsalvador.com`.
2. Copiar o ID `G-...` → `config.mjs` → `ga4Id`.
3. Admin → Eventos → marcar `generate_lead` como evento-chave.

## 3. Google Ads
1. Criar conta (modo especialista, sem criar campanha ainda).
2. Metas → Conversões → Nova → Site → `plan.toknowsalvador.com` → criar manualmente: categoria "Enviar formulário de lead", valor: não usar, contagem: uma.
3. Em "Configuração da tag" → "Instalar você mesmo" → copiar `AW-XXXXXXX` → `adsId` e `AW-XXXXXXX/YYYY` → `adsConversion`.
4. Vincular GA4 ↔ Google Ads (Admin GA4 → Vinculações de produtos).
5. Criar a campanha seguindo `marketing/ads/campaign-plan.md` → deixar **pausada**.

## 4. Deploy (Cloudflare Pages)
1. dash.cloudflare.com → Workers & Pages → Criar → Pages → Conectar ao Git → este repositório.
2. Branch de produção: `main`. Comando de build: (vazio). Diretório de saída: `plan`.
3. Custom domains → `plan.toknowsalvador.com` → seguir instrução de DNS (CNAME `plan` → `<projeto>.pages.dev` no provedor de DNS atual).
4. Commitar `config.mjs` preenchido → push → conferir deploy.

## 5. Teste final em produção
1. Abrir `https://plan.toknowsalvador.com/?utm_source=test&gclid=TEST123` no celular.
2. Aceitar cookies, preencher o formulário, enviar.
3. Conferir: WhatsApp abre com `Ref: TKS-…`; linha na planilha com `gclid=TEST123`; GA4 → Tempo real mostra `generate_lead`; Google Ads → conversão "não verificada" passa a "registrando conversões" em até 24h.
4. Apagar a linha de teste. Ativar a campanha.

## 6. Rotina
- Toda conversa no WhatsApp: atualizar `status` e `valor` do lead pelo `Ref`.
- Toda segunda-feira: exportar CSVs (ver skill `campaign-analyst`) e rodar a revisão com o `growth-orchestrator`.
```

- [ ] **Step 3: Run all tests**

Run: `node --test 'tests/*.test.mjs'`
Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add marketing/ads/campaign-plan.md docs/setup/launch-checklist.md
git commit -m "docs: add Google Ads campaign plan and launch checklist"
```
