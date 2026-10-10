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
  for (const name of ['month', 'duration', 'people', 'interests', 'name', 'countryCode', 'phone']) {
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
  assert.match(html, /name="people"[^>]*value="0"/);
});

test('confirmation state exists for after the redirect', () => {
  assert.match(html, /id="form-done"[^>]*hidden/);
  assert.match(html, /id="open-whatsapp"/);
});

test('hero grid columns can shrink so the scrolling month row never widens the page', () => {
  assert.match(html, /\.hero-grid > \* \{ min-width: 0; \}/);
});

test('no budget question anywhere (team found it too invasive)', () => {
  assert.doesNotMatch(html, /name="budget"/);
  assert.doesNotMatch(html, /Budget per person/);
});

test('family line exists, hidden by default, for the family ad group', () => {
  assert.match(html, /<p class="audience-line" data-audience="family" hidden>/);
});

test('country selector stores ISO countries and the phone library is not loaded up front', () => {
  for (const iso of ['US', 'CA', 'GB', 'AU', 'BR']) assert.match(html, new RegExp(`<option value="${iso}"`), iso);
  assert.doesNotMatch(html, /vendor\/libphonenumber/, 'the library must be loaded lazily by app.mjs, not by the page');
  assert.ok(existsSync(new URL('../plan/js/vendor/libphonenumber-min.js', import.meta.url)));
  assert.ok(existsSync(new URL('../plan/js/vendor/libphonenumber-js.LICENSE.txt', import.meta.url)));
  assert.match(html, /id="phone-help"/);
});

test('proof shows a wall of real group photos and only the Tripadvisor rating', () => {
  const proof = html.slice(html.indexOf('<section id="proof"'), html.indexOf('<section id="problem"'));
  const imgs = [...proof.matchAll(/<img [^>]*>/g)].map((m) => m[0]);
  assert.ok(imgs.length >= 6, 'expected a photo wall in #proof');
  for (const img of imgs) {
    assert.match(img, /loading="lazy"/);
    assert.match(img, /width="\d+" height="\d+"/);
    assert.match(img, /alt="[^"]+"/);
  }
  assert.match(proof, /Tripadvisor/);
  assert.match(proof, /153 reviews/);
});

test('no review platform other than Tripadvisor is named, and no cross-platform totals (team decision)', () => {
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
  for (const name of ['GuruWalk', 'GetYourGuide', 'Viator', 'Google,', '> Google<', '800+']) {
    assert.ok(!visible.includes(name), `page still mentions ${name}`);
  }
});

test('proof is the first section after the hero', () => {
  const afterHero = html.slice(html.indexOf('</header>'));
  assert.match(afterHero, /^<\/header>\s*<main>\s*<section id="proof"/);
});

test('the featured review is an original-English Tripadvisor review with name, place and date', () => {
  const proof = html.slice(html.indexOf('<section id="proof"'), html.indexOf('<section id="problem"'));
  assert.match(proof, /<figure class="review"/);
  assert.match(proof, /5\/5 on Tripadvisor/);
  assert.match(proof, /<b>Jordi<\/b> Traveled solo · September 2026/);
  assert.doesNotMatch(proof, /Sonya/);
});
