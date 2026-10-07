import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateLeadId, readAttribution, loadAttribution, normalizePhone, validateStep, validateAll,
  upcomingMonths, monthLabel, DURATIONS,
  buildLeadPayload, buildWhatsAppText, buildWhatsAppUrl,
} from '../plan/js/lead.mjs';

const base = {
  month: '2026-12', duration: '5–7 days', people: '2',
  interests: ['tours', 'shows'], name: 'Maya', countryCode: '1', phone: '(555) 123-4567',
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

test('validateStep 1 requires people between 1 and 99', () => {
  assert.equal(validateStep(1, { ...base, people: '21' }).valid, true);
  assert.equal(validateStep(1, { ...base, people: '99' }).valid, true);
  for (const people of ['', '0', '100', 'abc', '2.5']) {
    const r = validateStep(1, { ...base, people });
    assert.equal(r.valid, false, people);
    assert.ok(r.errors.people);
  }
});

test('validateStep 1 month: a month or not-sure is required', () => {
  assert.equal(validateStep(1, { ...base, month: 'not-sure' }).valid, true);
  assert.ok(validateStep(1, { ...base, month: '' }).errors.month);
  assert.ok(validateStep(1, { ...base, month: 'December' }).errors.month);
});

test('validateStep 1 duration: optional, but only known values', () => {
  assert.equal(validateStep(1, { ...base, duration: '' }).valid, true);
  for (const d of DURATIONS) assert.equal(validateStep(1, { ...base, duration: d }).valid, true, d);
  assert.ok(validateStep(1, { ...base, duration: '3 nights' }).errors.duration);
});

test('upcomingMonths starts at the current month and lists 12', () => {
  const m = upcomingMonths(new Date(2026, 9, 7));
  assert.equal(m.length, 12);
  assert.deepEqual(m[0], { value: '2026-10', label: 'Oct 2026' });
  assert.deepEqual(m[3], { value: '2027-01', label: 'Jan 2027' });
  assert.deepEqual(m[11], { value: '2027-09', label: 'Sep 2027' });
});

test('monthLabel spells the month out for the WhatsApp message', () => {
  assert.equal(monthLabel('2026-12'), 'December 2026');
  assert.equal(monthLabel('not-sure'), 'dates not decided yet');
  assert.equal(monthLabel(''), 'dates not decided yet');
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
  assert.deepEqual(Object.keys(p), ['timestamp', 'lead_id', 'name', 'whatsapp', 'people', 'month',
    'duration', 'interests', 'utm_source', 'utm_medium', 'utm_campaign',
    'utm_term', 'utm_content', 'gclid', 'landing_url']);
  assert.equal(p.timestamp, '2026-10-07T12:00:00.000Z');
  assert.equal(p.whatsapp, '+15551234567');
  assert.equal(p.people, 2);
  assert.equal(p.interests, 'tours, shows');
  assert.equal(p.utm_medium, '');
  assert.equal(p.month, '2026-12');
  assert.equal(p.duration, '5–7 days');
});

test('buildWhatsAppText includes trip details and ends with Ref', () => {
  const p = buildLeadPayload(base, {}, 'TKS-ABCD', new Date(), 'u');
  const t = buildWhatsAppText(p);
  assert.match(t, /^Hi! I'm Maya\. I'd like a quote for my Salvador trip\.$/m);
  assert.match(t, /^2 people, December 2026, 5–7 days\.$/m);
  assert.match(t, /tours, shows/);
  assert.match(t, /Ref: TKS-ABCD$/);
  const unknown = buildWhatsAppText(buildLeadPayload({ ...base, month: 'not-sure', duration: '', people: '1', interests: [] }, {}, 'TKS-0001', new Date(), 'u'));
  assert.match(unknown, /^1 person, dates not decided yet\.$/m);
  assert.doesNotMatch(unknown, /interested in/);
});

test('buildWhatsAppUrl encodes special characters', () => {
  const text = 'Hi! I\'m José & Zoë #1? 🌴\nLine 2';
  const url = buildWhatsAppUrl('5571993719791', text);
  assert.ok(url.startsWith('https://wa.me/5571993719791?text='));
  assert.equal(new URL(url).searchParams.get('text'), text);
});

test('normalizePhone ignores the selector when the number is already international', () => {
  assert.equal(normalizePhone('44', '+44 7700 900123'), '+447700900123');
  assert.equal(normalizePhone('1', '+1 415 555 0100'), '+14155550100');
  assert.equal(normalizePhone('44', '0044 7700 900123'), '+447700900123');
});

test('validateAll checks both steps so a lead never goes out with 0 travelers', () => {
  const r = validateAll({ ...base, people: '' });
  assert.equal(r.valid, false);
  assert.ok(r.errors.people);
  assert.equal(validateAll(base).valid, true);
  assert.ok(validateAll({ ...base, name: '' }).errors.name);
});

test('buildWhatsAppUrl survives a lone surrogate from a truncated emoji', () => {
  const url = buildWhatsAppUrl('5571993719791', 'Maya \uD83C');
  assert.ok(url.startsWith('https://wa.me/5571993719791?text=Maya'));
});
