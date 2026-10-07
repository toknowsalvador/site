import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);

test('GitHub Pages excludes the campaign, marketing memory and tooling from toknowsalvador.com', () => {
  const cfg = readFileSync(new URL('_config.yml', root), 'utf8');
  for (const path of ['plan', 'marketing', 'docs', 'tests', 'tools', 'integrations', 'node_modules', 'CLAUDE.md']) {
    assert.match(cfg, new RegExp(`^\\s*-\\s*${path.replace('.', '\\.')}\\s*$`, 'm'), `${path} must be excluded`);
  }
});

test('no .nojekyll file (it would make GitHub Pages ignore _config.yml exclude)', () => {
  assert.equal(existsSync(new URL('.nojekyll', root)), false);
});
