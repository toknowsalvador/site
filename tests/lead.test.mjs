import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateLeadId, readAttribution, loadAttribution, normalizePhone, validateStep, validateAll,
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

test('validateStep 1 requires people between 1 and 99', () => {
  assert.equal(validateStep(1, { ...base, people: '21' }).valid, true);
  assert.equal(validateStep(1, { ...base, people: '99' }).valid, true);
  for (const people of ['', '0', '100', 'abc', '2.5']) {
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
  assert.match(t, /^Hi! I'm Maya\. I'd like a quote for my Salvador trip\.$/m);
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
