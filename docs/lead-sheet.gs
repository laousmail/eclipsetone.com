/**
 * EclipseTone leads: Google Apps Script that writes website project requests into a Google Sheet
 * and emails you the moment someone sends one.
 *
 * Every visitor who types a name plus an email or WhatsApp number in "Start your project" gets a row,
 * even if they never finish. When they send, the same row flips to "Sent" and you get an email.
 * Rows still marked "Started" after a day are the people to follow up with.
 *
 * Setup (5 minutes): see docs/SETUP.md, section "Lead sheet".
 */

const SHEET_NAME = 'Leads'
// Where new-project emails go. Leave empty to use the Google account that owns this sheet.
const ALERT_EMAIL = ''
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
    let wasSent = false
    if (at === -1) {
      sheet.appendRow(row)
    } else {
      const r = at + 2
      const prev = sheet.getRange(r, 1, 1, HEADERS.length).getValues()[0]
      row[13] = prev[13] || now
      wasSent = prev[1] === 'Sent'
      if (prev[1] === 'Sent' && status !== 'Sent') row[1] = 'Sent' // never downgrade
      sheet.getRange(r, 1, 1, HEADERS.length).setValues([row])
    }
    if (status === 'Sent' && !wasSent) notifyNewProject(d)
    return out({ ok: true })
  } catch (err) {
    return out({ ok: false, error: String(err) })
  } finally {
    lock.releaseLock()
  }
}

// One email per project, the moment it's sent. Tap the WhatsApp link to reply.
function notifyNewProject(d) {
  try {
    const to = ALERT_EMAIL || Session.getEffectiveUser().getEmail()
    const digits = String(d.phone || '').replace(/[^0-9]/g, '')
    const wa = digits ? 'https://wa.me/' + digits : ''
    const sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl()
    const lines = [
      ['Project', d.pick], ['Their answer', d.answer], ['Name', d.name], ['Email', d.email],
      ['WhatsApp', d.phone], ['Contact by', d.contact], ['15-min call', d.call], ['Note', d.note],
      ['Language', d.lang === 'fr' ? 'French' : 'English'],
    ].filter(function (x) { return x[1] })
    const esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }
    const html = '<div style="font:15px/1.5 Arial,sans-serif">' +
      (wa ? '<p><a href="' + wa + '" style="display:inline-block;background:#C8203A;color:#fff;padding:12px 20px;border-radius:99px;text-decoration:none;font-weight:bold">Reply on WhatsApp</a></p>' : '') +
      '<table cellpadding="6" style="border-collapse:collapse">' +
      lines.map(function (x) { return '<tr><td style="color:#777">' + esc(x[0]) + '</td><td><b>' + esc(x[1]) + '</b></td></tr>' }).join('') +
      '</table><p><a href="' + sheetUrl + '">Open the lead sheet</a></p></div>'
    MailApp.sendEmail({
      to: to,
      subject: 'New project: ' + clip(d.pick, 60) + ', ' + clip(d.name, 60),
      htmlBody: html,
      body: lines.map(function (x) { return x[0] + ': ' + x[1] }).join('\n') + (wa ? '\nReply: ' + wa : ''),
      replyTo: d.email || to,
      name: 'EclipseTone website',
    })
  } catch (err) { console.error(err) }
}

// Run this once from the editor (select testAlert, press Run) to allow emails and check one arrives.
function testAlert() {
  notifyNewProject({ pick: 'Full Song', answer: 'Song package', name: 'Test Artist', email: '', phone: '+1 438 466 8971', contact: 'Text (WhatsApp)', call: 'Offered 15-min call', note: 'This is a test.', lang: 'en' })
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
