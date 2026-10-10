// Google Apps Script web app: receives landing page leads and appends them to the "Leads" sheet.
// Deploy: Extensions → Apps Script → paste → Deploy → Web app → Execute as: Me, Access: Anyone.
// Columns must match .claude/skills/sales-page-builder/references/tracking-contract.md.

var SHEET_NAME = 'Leads';
var HEADERS = [
  'timestamp', 'lead_id', 'name', 'whatsapp', 'people', 'month', 'duration',
  'interests', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'landing_url', 'status', 'valor', 'data_venda', 'lucro'
];
var IMPORT_SHEET_NAME = 'Google Ads import';
var SALE_CONVERSION_NAME = 'TKS Sale';

function sanitizeCell(value) {
  if (value === null || value === undefined) return '';
  var s = String(value).slice(0, 500);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s.slice(0, 500);
}

function buildRow(data) {
  return HEADERS.map(function (h) {
    if (h === 'status') return 'novo';
    if (h === 'valor' || h === 'data_venda' || h === 'lucro') return '';
    return sanitizeCell(data[h]);
  });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput('error');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ContentService.createTextOutput('error');
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow(buildRow(data));
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

// ---- Offline conversion import (sales) -------------------------------------------------------
// The team fills `status` = fechou, `valor` (R$) and `data_venda` (dd/mm/yyyy) in the Leads tab.
// refreshAdsImport() rebuilds the "Google Ads import" tab, which Google Ads reads on a schedule.

function sha256Hex(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ((b + 256) % 256).toString(16).padStart(2, '0'); }).join('');
}

function parseValor(value) {
  if (typeof value === 'number') return value;
  var s = String(value || '').replace(/[^\d,.-]/g, '');
  if (!s) return null;
  if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
  var n = Number(s);
  return isFinite(n) && n > 0 ? n : null;
}

function pad2(n) { return String(n).padStart(2, '0'); }

function conversionTime(value) {
  var d = null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    d = value;
  } else {
    var m = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
      if (d.getMonth() !== Number(m[2]) - 1) d = null;
    }
  }
  if (!d || isNaN(d.getTime())) return null;
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' 12:00:00';
}

function buildImportRows(values) {
  var header = values[0];
  var col = {};
  header.forEach(function (h, i) { col[h] = i; });
  var out = [
    ['Parameters:TimeZone=America/Bahia', '', '', '', '', ''],
    ['Google Click ID', 'Phone Number', 'Conversion Name', 'Conversion Time', 'Conversion Value', 'Conversion Currency']
  ];
  values.slice(1).forEach(function (r) {
    if (String(r[col.status]).trim() !== 'fechou') return;
    var time = conversionTime(r[col.data_venda]);
    var value = parseValor(r[col.valor]);
    var gclid = String(r[col.gclid] || '').replace(/^'/, '').trim();
    var phone = String(r[col.whatsapp] || '').replace(/^'/, '').trim();
    var phoneHash = /^\+\d{8,15}$/.test(phone) ? sha256Hex(phone) : '';
    if (!time || !value || (!gclid && !phoneHash)) return;
    out.push([gclid, phoneHash, SALE_CONVERSION_NAME, time, value, 'BRL']);
  });
  return out;
}

function refreshAdsImport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leads = ss.getSheetByName(SHEET_NAME);
  if (!leads || leads.getLastRow() < 2) return;
  var rows = buildImportRows(leads.getDataRange().getValues());
  var target = ss.getSheetByName(IMPORT_SHEET_NAME) || ss.insertSheet(IMPORT_SHEET_NAME);
  target.clearContents();
  target.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

// Run once from the Apps Script editor: refreshes the import tab every hour.
function installImportTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'refreshAdsImport') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('refreshAdsImport').timeBased().everyHours(1).create();
}

// ---- Sheet layout (run setupLeadsSheet once from the editor) ---------------------------------
// Only the columns the team fills by hand get validation; form columns stay free so leads are never rejected.

var STATUS_VALUES = ['novo', 'respondeu', 'orçamento enviado', 'fechou', 'perdido'];

function sheetLayout(headers) {
  var col = function (h) { return headers.indexOf(h) + 1; };
  return {
    list: { column: col('status'), values: STATUS_VALUES },
    dates: [col('data_venda')],
    money: [col('valor'), col('lucro')],
    teamColumns: [col('status'), col('valor'), col('data_venda'), col('lucro')]
  };
}

function setupLeadsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  if (sheet.getMaxRows() < 5000) sheet.insertRowsAfter(sheet.getMaxRows(), 5000 - sheet.getMaxRows());
  var rows = sheet.getMaxRows() - 1;
  var layout = sheetLayout(HEADERS);

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');

  sheet.getRange(2, layout.list.column, rows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(layout.list.values, true).setAllowInvalid(false).build()
  );
  layout.dates.forEach(function (c) {
    sheet.getRange(2, c, rows, 1)
      .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build())
      .setNumberFormat('dd/mm/yyyy');
  });
  layout.money.forEach(function (c) {
    sheet.getRange(2, c, rows, 1)
      .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build())
      .setNumberFormat('"R$" #,##0.00');
  });
  layout.teamColumns.forEach(function (c) {
    sheet.getRange(1, c, 1, 1).setBackground('#FFF4CC');
  });
}

// ---- Campaign dashboard (run setupDashboard once from the editor) -----------------------------
// Tab "Acompanhamento": the team types each week's Google Ads numbers (yellow cells); leads, sales and
// profit come from the "Leads" tab by the week the lead arrived, so late sales count for the right week.

var DASHBOARD_SHEET_NAME = 'Acompanhamento';
var DASHBOARD_FIRST_WEEK = 13;
var DASHBOARD_WEEKS = 52;

function leadsRange(header) {
  var n = HEADERS.indexOf(header) + 1;
  var letter = '';
  while (n > 0) { var m = (n - 1) % 26; letter = String.fromCharCode(65 + m) + letter; n = Math.floor((n - 1) / 26); }
  return SHEET_NAME + '!$' + letter + '$2:$' + letter;
}

function dashboardWeekRow(r) {
  var ts = leadsRange('timestamp');
  var inWeek = 'ARRAYFORMULA(LET(t,' + ts + ',d,IF(ISNUMBER(t),INT(t),IFERROR(DATEVALUE(LEFT(t,10)),0)),' +
    'g,((' + leadsRange('utm_source') + '="google")+(' + leadsRange('gclid') + '<>""))>0,' +
    '(d>=$A' + r + ')*(d<$A' + r + '+7)*g))';
  var sold = '(' + leadsRange('status') + '="fechou")';
  var people = 'ARRAYFORMULA(IFERROR(VALUE(' + leadsRange('people') + '),0))';
  var profit = 'ARRAYFORMULA(IFERROR(' + leadsRange('lucro') + '*1,0))';
  var ifWeek = function (f) { return '=IF($A' + r + '="","",' + f + ')'; };
  return [
    null, null, null, null, null,
    ifWeek('SUMPRODUCT(' + inWeek + ')'),
    '=IFERROR(SUMPRODUCT(' + inWeek + '*' + people + ')/F' + r + ',"")',
    ifWeek('SUMPRODUCT(' + inWeek + '*' + sold + ')'),
    ifWeek('SUMPRODUCT(' + inWeek + '*' + sold + '*' + profit + ')'),
    '=IFERROR(D' + r + '/C' + r + ',"")',
    '=IFERROR(B' + r + '/D' + r + ',"")',
    '=IFERROR(F' + r + '/D' + r + ',"")',
    '=IFERROR(B' + r + '/F' + r + ',"")',
    '=IFERROR(H' + r + '/F' + r + ',"")',
    '=IFERROR(B' + r + '/H' + r + ',"")',
    '=IFERROR((I' + r + '-B' + r + ')/B' + r + ',"")',
    '=IF(OR(B' + r + '="",F' + r + '=0),"",IF(M' + r + '<=$E$8,"dentro do corte","CPL acima do corte"))'
  ];
}

function dashboardCutLines() {
  return {
    profit: '=IF($H$12>0,$I$12/$H$12,$B$4)',
    closeRate: '=IF($F$12>=20,$H$12/$F$12,$B$5)',
    cvr: '=IF($D$12>=100,$F$12/$D$12,$B$6)'
  };
}

// Spreadsheets in comma-decimal locales (pt-BR) take ';' between arguments, also via setFormula.
function localizeFormula(f, sep) {
  if (sep === ',') return f;
  var out = '', inText = false;
  for (var i = 0; i < f.length; i++) {
    var ch = f.charAt(i);
    if (ch === '"') inText = !inText;
    out += (ch === ',' && !inText) ? sep : ch;
  }
  return out;
}

function argumentSeparator(sh) {
  var probe = sh.getRange('Z1');
  probe.setFormula('=SUM(1,2)');
  SpreadsheetApp.flush();
  var ok = probe.getValue() === 3;
  probe.clear();
  return ok ? ',' : ';';
}

function setupDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(DASHBOARD_SHEET_NAME) || ss.insertSheet(DASHBOARD_SHEET_NAME);
  sh.clear();
  var sep = argumentSeparator(sh);
  var L = function (rows) { return rows.map(function (row) { return row.map(function (f) { return localizeFormula(f, sep); }); }); };
  var yellow = '#FFF4CC';
  var last = DASHBOARD_FIRST_WEEK + DASHBOARD_WEEKS - 1;
  var cut = dashboardCutLines();

  sh.getRange('A1').setValue('Acompanhamento da campanha').setFontWeight('bold').setFontSize(14);
  sh.getRange('A2').setValue('Preencha só as células amarelas. Leads, vendas e lucro vêm da aba Leads, pela semana em que o lead chegou.');

  sh.getRange('A3:B3').setValues([['Premissas (troque quando tiver dados)', '']]).setFontWeight('bold');
  sh.getRange('A4:B7').setValues([
    ['Lucro médio por venda (estimativa)', 500],
    ['Taxa de fechamento (estimativa)', 0.2],
    ['Taxa de conversão da página (estimativa)', 0.06],
    ['Meta: lucro ÷ custo por venda', 2]
  ]);
  sh.getRange('B4:B7').setBackground(yellow);

  sh.getRange('D3:F3').setValues([['Linhas de corte', 'Valor', 'Fonte']]).setFontWeight('bold');
  sh.getRange('D4:D9').setValues([['Lucro médio usado'], ['Fechamento usado'], ['Conversão usada'], ['CPA máximo'], ['CPL máximo'], ['CPC máximo']]);
  sh.getRange('E4:E9').setFormulas(L([[cut.profit], [cut.closeRate], [cut.cvr], ['=E4/B7'], ['=E7*E5'], ['=E8*E6']]));
  sh.getRange('F4:F6').setFormulas(L([
    ['=IF($H$12>0,"real","estimativa")'],
    ['=IF($F$12>=20,"real","estimativa (menos de 20 leads)")'],
    ['=IF($D$12>=100,"real","estimativa (menos de 100 cliques)")']
  ]));

  var headers = ['Semana (início)', 'Custo', 'Impressões', 'Cliques', 'Conv. Google Ads', 'Leads (planilha)',
    'Pessoas por lead', 'Vendas', 'Lucro', 'CTR', 'CPC', 'Conversão', 'CPL', 'Fechamento', 'CPA', 'ROI', 'Situação'];
  sh.getRange(11, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setWrap(true);

  var span = function (c) { return c + DASHBOARD_FIRST_WEEK + ':' + c + last; };
  sh.getRange('A12').setValue('TOTAL').setFontWeight('bold');
  sh.getRange('B12:I12').setFormulas(L([[
    '=SUM(' + span('B') + ')', '=SUM(' + span('C') + ')', '=SUM(' + span('D') + ')', '=SUM(' + span('E') + ')',
    '=SUM(' + span('F') + ')', '=IFERROR(SUMPRODUCT(' + span('F') + ',' + span('G') + ')/F12,"")',
    '=SUM(' + span('H') + ')', '=SUM(' + span('I') + ')'
  ]]));
  var total = dashboardWeekRow(12);
  sh.getRange('J12:Q12').setFormulas(L([total.slice(9)]));
  sh.getRange('A12:Q12').setBackground('#EEF2FF').setFontWeight('bold');

  sh.getRange('A' + DASHBOARD_FIRST_WEEK).setValue(new Date(2026, 9, 11));
  for (var r = DASHBOARD_FIRST_WEEK; r <= last; r++) {
    if (r > DASHBOARD_FIRST_WEEK) sh.getRange('A' + r).setFormula('=A' + (r - 1) + '+7');
    sh.getRange(r, 6, 1, 12).setFormulas(L([dashboardWeekRow(r).slice(5)]));
  }
  sh.getRange('B' + DASHBOARD_FIRST_WEEK + ':E' + last).setBackground(yellow);

  var money = '"R$" #,##0.00', pct = '0.0%';
  sh.getRange('A' + DASHBOARD_FIRST_WEEK + ':A' + last).setNumberFormat('dd/mm/yyyy');
  ['B', 'I', 'K', 'M', 'O'].forEach(function (c) { sh.getRange(c + '12:' + c + last).setNumberFormat(money); });
  ['J', 'L', 'N', 'P'].forEach(function (c) { sh.getRange(c + '12:' + c + last).setNumberFormat(pct); });
  sh.getRange('G12:G' + last).setNumberFormat('0.0');
  sh.getRange('B4').setNumberFormat(money);
  sh.getRange('B5:B6').setNumberFormat(pct);
  sh.getRange('E4').setNumberFormat(money);
  sh.getRange('E5:E6').setNumberFormat(pct);
  sh.getRange('E7:E9').setNumberFormat(money);
  sh.setFrozenRows(11);
  sh.setColumnWidth(1, 260);
  sh.setColumnWidth(4, 160);
}
