// Google Apps Script web app: receives landing page leads and appends them to the "Leads" sheet.
// Deploy: Extensions → Apps Script → paste → Deploy → Web app → Execute as: Me, Access: Anyone.
// Columns must match .claude/skills/sales-page-builder/references/tracking-contract.md.

var SHEET_NAME = 'Leads';
var HEADERS = [
  'timestamp', 'lead_id', 'name', 'whatsapp', 'people', 'month', 'duration',
  'interests', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'landing_url', 'status', 'valor'
];

function sanitizeCell(value) {
  if (value === null || value === undefined) return '';
  var s = String(value).slice(0, 500);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s.slice(0, 500);
}

function buildRow(data) {
  return HEADERS.map(function (h) {
    if (h === 'status') return 'novo';
    if (h === 'valor') return '';
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
