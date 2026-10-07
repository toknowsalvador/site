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
    'data-consent="accept"', 'data-consent="decline"']) {
    assert.ok(html.includes(sel), `missing ${sel}`);
  }
  assert.match(html, /class="[^"]*\bsticky-cta\b/, 'missing .sticky-cta');
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

test('form posts (never GETs personal data into the URL) if JS fails', () => {
  assert.match(html, /<form id="lead-form"[^>]*method="post"/);
});
