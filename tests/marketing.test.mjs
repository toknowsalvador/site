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

test('skill backlog has four entries, each with trigger and status', () => {
  const backlog = read('marketing/skill-backlog.md');
  const entries = backlog.split(/^## /m).slice(1);
  assert.equal(entries.length, 4);
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
