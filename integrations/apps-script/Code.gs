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
