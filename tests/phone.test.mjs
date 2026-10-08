import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  normalizePhone, phonePreview, countryFromLocale, setPhoneLibrary, FALLBACK_COUNTRIES, validateStep,
} from '../plan/js/lead.mjs';

// Load the vendored browser bundle exactly as the page does (it sets a global `libphonenumber`).
const ctx = {};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../plan/js/vendor/libphonenumber-min.js', import.meta.url), 'utf8'), ctx);
const lib = ctx.libphonenumber;

afterEach(() => setPhoneLibrary(null));

test('with the library: real per-country validation', () => {
  setPhoneLibrary(lib);
  assert.equal(normalizePhone('US', '(415) 555-0100'), '+14155550100');
  assert.equal(normalizePhone('GB', '07911 123456'), '+447911123456');
  assert.equal(normalizePhone('BR', '71 99371-9791'), '+5571993719791');
  assert.equal(normalizePhone('US', '415 555 010'), null, 'too short for the US');
  assert.equal(normalizePhone('US', 'abc'), null);
});

test('with the library: repeated country code without + is fixed', () => {
  setPhoneLibrary(lib);
  assert.equal(normalizePhone('US', '1 415 555 0100'), '+14155550100');
  assert.equal(normalizePhone('GB', '44 7911 123456'), '+447911123456');
});

test('with the library: a number typed with + wins over the selected country', () => {
  setPhoneLibrary(lib);
  assert.equal(normalizePhone('US', '+55 71 99371-9791'), '+5571993719791');
  assert.equal(normalizePhone('GB', '0044 7911 123456'), '+447911123456');
  assert.equal(normalizePhone('other', '+61 412 345 678'), '+61412345678');
  assert.equal(normalizePhone('other', '412 345 678'), null);
});

test('with the library: step 2 rejects a number that is invalid for the country', () => {
  setPhoneLibrary(lib);
  const data = { name: 'Maya', countryCode: 'US', phone: '415 555 010' };
  assert.ok(validateStep(2, data).errors.phone);
  assert.equal(validateStep(2, { ...data, phone: '(415) 555-0100' }).valid, true);
});

test('phonePreview shows the number we will message', () => {
  setPhoneLibrary(lib);
  assert.equal(phonePreview('US', '4155550100'), '+1 415 555 0100');
  assert.equal(phonePreview('US', '41555'), null);
  setPhoneLibrary(null);
  assert.equal(phonePreview('US', '(415) 555-0100'), '+14155550100');
});

test('without the library the form still works (fallback by calling code)', () => {
  assert.equal(normalizePhone('US', '(415) 555-0100'), '+14155550100');
  assert.equal(normalizePhone('CA', '416 555 0100'), '+14165550100');
  assert.equal(normalizePhone('GB', '07911 123456'), '+447911123456');
  assert.equal(normalizePhone('other', '+61 412 345 678'), '+61412345678');
  for (const [iso, code] of FALLBACK_COUNTRIES) assert.match(code, /^\d{1,3}$/, iso);
});

test('countryFromLocale picks the visitor country from the browser language', () => {
  const allowed = FALLBACK_COUNTRIES.map(([iso]) => iso);
  assert.equal(countryFromLocale('en-GB', allowed), 'GB');
  assert.equal(countryFromLocale('pt-BR', allowed), 'BR');
  assert.equal(countryFromLocale('en', allowed), null);
  assert.equal(countryFromLocale('es-MX', allowed), null);
  assert.equal(countryFromLocale('es-MX', [...allowed, 'MX']), 'MX');
});
