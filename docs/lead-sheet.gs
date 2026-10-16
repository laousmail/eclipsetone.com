/**
 * EclipseTone leads: Google Apps Script that writes website price requests into a Google Sheet.
 *
 * Every visitor who types a valid email or WhatsApp number in the "Get your price" form gets a row, even if they
 * never press Send in WhatsApp. When they do send, the same row flips to "Sent".
 * Rows still marked "Started" after a day are the people to follow up with.
 *
 * Setup (5 minutes): see docs/SETUP.md, section "Lead sheet".
 */

const SHEET_NAME = 'Leads'
const HEADERS = ['Updated', 'Status', 'Interested in', 'Their answer', 'Name', 'Email', 'WhatsApp', 'Contact by', '15-min call', 'Note', 'Their selection', 'Page', 'Language', 'First seen', 'Lead ID']

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    const d = JSON.parse(e.postData.contents || '{}')
    if (!d.id || !(d.email || d.phone)) return out({ ok: false })
    const sheet = getSheet()
    const now = new Date()
    const ids = sheet.getRange(2, HEADERS.length, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().flat()
    const at = ids.indexOf(String(d.id))
    const status = d.status === 'sent' ? 'Sent' : 'Started'
    const row = [now, status, clip(d.pick), clip(d.answer), clip(d.name), clip(d.email), clip(d.phone), clip(d.contact), clip(d.call), clip(d.note, 1000), clip(d.selection, 1000), clip(d.page), clip(d.lang), now, String(d.id)]
    if (at === -1) {
      sheet.appendRow(row)
    } else {
      const r = at + 2
      const prev = sheet.getRange(r, 1, 1, HEADERS.length).getValues()[0]
      row[13] = prev[13] || now
      if (prev[1] === 'Sent' && status !== 'Sent') row[1] = 'Sent' // never downgrade
      sheet.getRange(r, 1, 1, HEADERS.length).setValues([row])
    }
    return out({ ok: true })
  } catch (err) {
    return out({ ok: false, error: String(err) })
  } finally {
    lock.releaseLock()
  }
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

function clip(v, n) { return String(v == null ? '' : v).slice(0, n || 200) }
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON) }
