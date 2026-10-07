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

test('all five campaign skills exist', () => {
  for (const s of ['growth-orchestrator', 'offer-copywriter', 'sales-page-builder',
    'google-ads-strategist', 'campaign-analyst']) {
    assert.ok(skills.includes(s), `missing skill ${s}`);
  }
});
