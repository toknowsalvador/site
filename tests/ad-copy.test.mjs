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
