/**
 * EclipseTone leads: Google Apps Script that writes website price requests into a Google Sheet.
 *
 * The website sends a request only when the visitor presses Send. Each request becomes one new row.
 *
 * This endpoint is public (anyone on the internet can call it), so it trusts nothing it receives:
 * - Text that a spreadsheet would run as a formula (=, +, -, @) is stored as plain text, so a
 *   "name" like =IMPORTDATA("https://…") can't make the sheet send your leads anywhere.
 * - Requests must look like a person used the form: the hidden "website" field is empty
 *   (bots fill every field) and the form was open for at least 3 seconds.
 * - Fields are checked (valid email, real phone number, known service) and cut to a safe length.
 * - At most 30 requests per 10 minutes are accepted, so a bot can't flood the sheet.
 * - Rows are only ever added, never changed, and errors say nothing about how this works.
 *
 * Setup (5 minutes): see docs/SETUP.md, section "Lead sheet". After changing this file,
 * paste it into Apps Script and deploy a new version (Deploy → Manage deployments → Edit → New version).
 */

const SHEET_NAME = 'Leads'
const HEADERS = ['Received', 'Interested in', 'Their answer', 'Name', 'Email', 'WhatsApp', 'Contact by', '15-min call', 'Note', 'Page', 'Language', 'Request ID']
const MAX_PER_10_MIN = 30
const MIN_FORM_MS = 3000

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    if (!looksHuman(d) || !valid(d) || !underRateLimit()) return out({ ok: false })
    const lock = LockService.getScriptLock()
    lock.waitLock(10000)
    try {
      getSheet().appendRow([
        new Date(), safe(pickName(d.pick)), safe(d.answer, 120), safe(d.name, 100), safe(d.email, 200),
        safe(d.phone, 30), safe(d.contact, 40), safe(d.call, 40), safe(d.note, 1000), safe(d.page, 200),
        d.lang === 'fr' ? 'fr' : 'en', safe(d.id, 40),
      ])
    } finally {
      lock.releaseLock()
    }
    return out({ ok: true })
  } catch (err) {
    return out({ ok: false })
  }
}

// Bots fill the hidden "website" field and send instantly; people don't.
function looksHuman(d) {
  return d.status === 'sent' && !d.website && Number(d.t) >= MIN_FORM_MS
}

function valid(d) {
  const email = String(d.email || '').trim()
  const digits = String(d.phone || '').replace(/\D/g, '')
  return String(d.name || '').trim().length >= 1 && String(d.name).length <= 100 &&
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 200 &&
    digits.length >= 8 && digits.length <= 15
}

// Service names are short words like "Full Song", "3-Song EP" or "Music video"; anything else is "Other"
function pickName(pick) {
  const p = String(pick || '').slice(0, 80)
  return /^[A-Za-z0-9][A-Za-z0-9 +&'’-]*$/.test(p) ? p : 'Other'
}

function underRateLimit() {
  const cache = CacheService.getScriptCache()
  const key = 'n' + Math.floor(Date.now() / 600000)
  const n = Number(cache.get(key) || 0)
  if (n >= MAX_PER_10_MIN) return false
  cache.put(key, String(n + 1), 700)
  return true
}

// Plain text only: anything a spreadsheet would treat as a formula gets a leading apostrophe.
function safe(v, n) {
  const s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, n || 200)
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME)
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS)
    sheet.setFrozenRows(1)
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold')
  }
  return sheet
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON) }
