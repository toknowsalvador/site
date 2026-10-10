import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

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
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, str) => Array.from(createHash(alg).update(str, 'utf8').digest()).map((b) => (b > 127 ? b - 256 : b)),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return { ctx, sheetRows };
}

const payload = {
  timestamp: '2026-10-07T12:00:00.000Z', lead_id: 'TKS-ABCD', name: 'Maya', whatsapp: '+15551234567',
  people: 2, month: '2026-12', duration: '5–7 days', interests: 'tours, shows',
  utm_source: 'google', utm_medium: 'cpc', utm_campaign: '123', utm_term: 'salvador trip planner',
  utm_content: '456', gclid: 'g1', landing_url: 'https://plan.toknowsalvador.com/',
};

test('HEADERS matches tracking contract plus status and valor', () => {
  const { ctx } = load();
  assert.deepEqual(Array.from(ctx.HEADERS), [...Object.keys(payload), 'status', 'valor', 'data_venda', 'lucro']);
});

test('buildRow orders values and defaults status to novo', () => {
  const { ctx } = load();
  const row = Array.from(ctx.buildRow(payload));
  assert.equal(row[1], 'TKS-ABCD');
  assert.equal(row[4], '2');
  assert.equal(row.at(-4), 'novo');
  assert.deepEqual(row.slice(-3), ['', '', '']);
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

test('sanitizeCell also neutralizes tab and carriage-return prefixes', () => {
  const { ctx } = load();
  assert.equal(ctx.sanitizeCell('\t=1+1'), "'\t=1+1");
  assert.equal(ctx.sanitizeCell('\r=1+1'), "'\r=1+1");
});

test('doPost rejects JSON that is not an object', () => {
  for (const body of ['null', '42', '"x"', '[1]']) {
    const { ctx, sheetRows } = load();
    assert.equal(ctx.doPost({ postData: { contents: body } }).text, 'error', body);
    assert.equal(sheetRows.length, 0);
  }
});

const sha = (v) => createHash('sha256').update(v, 'utf8').digest('hex');

test('sha256Hex matches standard SHA-256 hex', () => {
  const { ctx } = load();
  assert.equal(ctx.sha256Hex('+15551234567'), sha('+15551234567'));
});

test('parseValor reads Brazilian money formats', () => {
  const { ctx } = load();
  assert.equal(ctx.parseValor('1.050,00'), 1050);
  assert.equal(ctx.parseValor('R$ 400,50'), 400.5);
  assert.equal(ctx.parseValor('650'), 650);
  assert.equal(ctx.parseValor(650), 650);
  assert.equal(ctx.parseValor(''), null);
  assert.equal(ctx.parseValor('abc'), null);
});

test('conversionTime accepts a Sheets date or dd/mm/yyyy, at noon', () => {
  const { ctx } = load();
  assert.equal(ctx.conversionTime(new Date(2026, 9, 20)), '2026-10-20 12:00:00');
  assert.equal(ctx.conversionTime('20/10/2026'), '2026-10-20 12:00:00');
  assert.equal(ctx.conversionTime(''), null);
  assert.equal(ctx.conversionTime('32/13/2026'), null);
});

test('buildImportRows exports only closed sales with a date, value and a match key', () => {
  const { ctx } = load();
  const H = Array.from(ctx.HEADERS);
  const row = (o) => H.map((h) => (h in o ? o[h] : ''));
  const values = [
    H,
    row({ lead_id: 'TKS-AAAAAA', gclid: 'g1', whatsapp: "'+15551234567", status: 'fechou', valor: '1.050,00', data_venda: '20/10/2026' }),
    row({ lead_id: 'TKS-BBBBBB', gclid: '', whatsapp: '+447700900123', status: 'fechou', valor: '400', data_venda: new Date(2026, 9, 21) }),
    row({ lead_id: 'TKS-CCCCCC', gclid: 'g3', whatsapp: '+15550000000', status: 'respondeu', valor: '900', data_venda: '20/10/2026' }),
    row({ lead_id: 'TKS-DDDDDD', gclid: 'g4', whatsapp: '+15550000001', status: 'fechou', valor: '', data_venda: '20/10/2026' }),
    row({ lead_id: 'TKS-EEEEEE', gclid: 'g5', whatsapp: '+15550000002', status: 'fechou', valor: '300', data_venda: '' }),
    row({ lead_id: 'TKS-FFFFFF', gclid: '', whatsapp: '', status: 'fechou', valor: '300', data_venda: '20/10/2026' }),
  ];
  const out = Array.from(ctx.buildImportRows(values), (r) => Array.from(r));
  assert.deepEqual(out[0], ['Parameters:TimeZone=America/Bahia', '', '', '', '', '']);
  assert.deepEqual(out[1], ['Google Click ID', 'Phone Number', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency']);
  assert.deepEqual(out.slice(2), [
    ['g1', sha('+15551234567'), 'TKS Sale', '2026-10-20 12:00:00', 1050, 'BRL'],
    ['', sha('+447700900123'), 'TKS Sale', '2026-10-21 12:00:00', 400, 'BRL'],
  ]);
});

test('sheetLayout: team-filled columns get a dropdown, a date and money formats', () => {
  const { ctx } = load();
  const layout = JSON.parse(JSON.stringify(ctx.sheetLayout(Array.from(ctx.HEADERS))));
  const col = (h) => Array.from(ctx.HEADERS).indexOf(h) + 1;
  assert.deepEqual(layout.list, { column: col('status'), values: ['novo', 'respondeu', 'orçamento enviado', 'fechou', 'perdido'] });
  assert.deepEqual(layout.dates, [col('data_venda')]);
  assert.deepEqual(layout.money, [col('valor'), col('lucro')]);
  assert.deepEqual(layout.teamColumns, [col('status'), col('valor'), col('data_venda'), col('lucro')]);
});

test('sheetLayout status list includes the value doPost writes for new leads', () => {
  const { ctx } = load();
  const statusIndex = Array.from(ctx.HEADERS).indexOf('status');
  const newRow = Array.from(ctx.buildRow({ lead_id: 'TKS-AAAAAA' }));
  assert.ok(Array.from(ctx.sheetLayout(Array.from(ctx.HEADERS)).list.values).includes(newRow[statusIndex]));
});

test('dashboard week row reads the right Leads columns and computes the funnel', () => {
  const { ctx } = load();
  const row = Array.from(ctx.dashboardWeekRow(13));
  assert.equal(row.length, 17);
  const leads = row[5];
  assert.match(leads, /Leads!\$A\$2:\$A/, 'timestamp column');
  assert.match(leads, /Leads!\$I\$2:\$I="google"/, 'utm_source column');
  assert.match(leads, /Leads!\$N\$2:\$N<>""/, 'gclid column');
  assert.match(row[7], /Leads!\$P\$2:\$P="fechou"/, 'sales use status');
  assert.match(row[8], /Leads!\$S\$2:\$S/, 'profit uses lucro');
  assert.equal(row[12], '=IFERROR(B13/F13,"")', 'CPL = cost / leads');
  assert.equal(row[15], '=IFERROR((I13-B13)/B13,"")', 'ROI on profit');
});

test('dashboard cut lines fall back to estimates until there is enough data', () => {
  const { ctx } = load();
  const cut = ctx.dashboardCutLines();
  assert.match(cut.profit, /^=IF\(\$H\$12>0,\$I\$12\/\$H\$12,\$B\$4\)$/);
  assert.match(cut.closeRate, /\$F\$12>=20/);
  assert.match(cut.cvr, /\$D\$12>=100/);
});

test('formulas are localized to ; for spreadsheets that use it (pt-BR)', () => {
  const { ctx } = load();
  assert.equal(ctx.localizeFormula('=IFERROR(B13/F13,"")', ';'), '=IFERROR(B13/F13;"")');
  assert.equal(ctx.localizeFormula('=IF(A1="a, b",1,2)', ';'), '=IF(A1="a, b";1;2)', 'commas inside text stay');
  assert.equal(ctx.localizeFormula('=SUM(A1,B1)', ','), '=SUM(A1,B1)');
});
