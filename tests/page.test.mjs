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
  for (const name of ['month', 'duration', 'people', 'interests', 'name', 'countryCode', 'phone', 'budget']) {
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
  assert.deepEqual(Object.keys(CONFIG).sort(), ['adsConversion', 'adsId', 'clarityId', 'ga4Id', 'leadEndpoint', 'whatsappNumber']);
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

test('phone row cells can shrink so inputs never overflow narrow phones', () => {
  assert.match(html, /\.row-phone > \* \{ min-width: 0; \}/);
});

test('form starts in the hero, before any other section', () => {
  const formAt = html.indexOf('<form id="lead-form"');
  assert.ok(formAt > -1 && formAt < html.indexOf('</header>'), 'form must live inside the hero header');
});

test('step 1 uses month and trip-length buttons, not date pickers', () => {
  assert.doesNotMatch(html, /type="date"/);
  assert.match(html, /id="month-options"/);
  assert.match(html, /<input type="radio" name="month" value="not-sure"/);
  for (const d of ['2–4 days', '5–7 days', '1–2 weeks', '2+ weeks']) {
    assert.ok(html.includes(`name="duration" value="${d}"`), `missing duration ${d}`);
  }
  assert.match(html, /name="people"[^>]*value="2"/);
});

test('confirmation state exists for after the redirect', () => {
  assert.match(html, /id="form-done"[^>]*hidden/);
  assert.match(html, /id="open-whatsapp"/);
});

test('hero grid columns can shrink so the scrolling month row never widens the page', () => {
  assert.match(html, /\.hero-grid > \* \{ min-width: 0; \}/);
});
