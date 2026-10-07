import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const code = readFileSync(new URL('../integrations/apps-script/Code.gs', import.meta.url), 'utf8');

function load(sheetRows = []) {
  const sheet = {
    getLastRow: () => sheetRows.length,
    appendRow: (row) => sheetRows.push(row),
  };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, insertSheet: () => sheet }) },
    ContentService: { createTextOutput: (t) => ({ text: t }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, sheetRows };
}

const payload = {
  timestamp: '2026-10-07T12:00:00.000Z', lead_id: 'TKS-ABCD', name: 'Maya', whatsapp: '+15551234567',
  people: 2, arrival: '2026-12-20', departure: '2026-12-28', dates_unknown: false, interests: 'tours, shows',
  budget: '', utm_source: 'google', utm_medium: 'cpc', utm_campaign: '123', utm_term: 'salvador trip planner',
  utm_content: '456', gclid: 'g1', landing_url: 'https://plan.toknowsalvador.com/',
};

test('HEADERS matches tracking contract plus status and valor', () => {
  const { ctx } = load();
  assert.deepEqual(Array.from(ctx.HEADERS), [...Object.keys(payload), 'status', 'valor']);
});

test('buildRow orders values and defaults status to novo', () => {
  const { ctx } = load();
  const row = Array.from(ctx.buildRow(payload));
  assert.equal(row[1], 'TKS-ABCD');
  assert.equal(row[4], '2');
  assert.equal(row.at(-2), 'novo');
  assert.equal(row.at(-1), '');
});

test('sanitizeCell neutralizes formulas', () => {
  const { ctx } = load();
  assert.equal(ctx.sanitizeCell('=HYPERLINK("x")'), '\'=HYPERLINK("x")');
  assert.equal(ctx.sanitizeCell('+15551234567'), '\'+15551234567');
  assert.equal(ctx.sanitizeCell('-1'), '\'-1');
  assert.equal(ctx.sanitizeCell('@me'), '\'@me');
  assert.equal(ctx.sanitizeCell(null), '');
  assert.equal(ctx.sanitizeCell('x'.repeat(600)).length, 500);
});

test('doPost writes headers on empty sheet, then the row', () => {
  const { ctx, sheetRows } = load();
  const out = ctx.doPost({ postData: { contents: JSON.stringify(payload) } });
  assert.equal(out.text, 'ok');
  assert.equal(sheetRows.length, 2);
  assert.deepEqual(Array.from(sheetRows[0]), Array.from(ctx.HEADERS));
  assert.equal(sheetRows[1][1], 'TKS-ABCD');
});

test('doPost rejects invalid JSON without throwing', () => {
  const { ctx, sheetRows } = load();
  const out = ctx.doPost({ postData: { contents: '{bad' } });
  assert.equal(out.text, 'error');
  assert.equal(sheetRows.length, 0);
});
