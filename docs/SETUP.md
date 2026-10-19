# EclipseTone site setup

Each switch takes about 5 minutes. Sections 1 to 3 end with a value pasted into `config.js`.

## 1. Lead sheet (Google Sheets)

Every visitor who types a valid email or WhatsApp number in "Start your project" lands in the sheet, even if they never press Send in WhatsApp. Rows marked **Started** are the people to follow up with. Rows marked **Sent** pressed the button.

1. Go to sheets.google.com and create a blank sheet. Name it "EclipseTone leads".
2. Menu **Extensions → Apps Script**.
3. Delete what's in the editor. Paste everything from `docs/lead-sheet.gs`. Click the save icon.
4. Click **Deploy → New deployment**. Click the gear next to "Select type" and pick **Web app**.
   - Description: `leads`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, then **Authorize access** and allow it with your Google account. (Google warns that the app is unverified because you wrote it. Click Advanced, then Go to project.)
6. Copy the **Web app URL** (it ends in `/exec`).
7. Paste it into `config.js`: `leadSheetUrl: 'https://script.google.com/macros/s/…/exec',`

Test: open the site, pick a package, type a name and email, wait 2 seconds. A row appears in the sheet.

If you ever change the script, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## 2. Analytics (GoatCounter)

Free for small sites, no cookies, so no cookie banner needed.

1. Sign up at goatcounter.com. Pick the code `eclipsetone` (your dashboard becomes eclipsetone.goatcounter.com).
2. Paste the code into `config.js`: `goatcounter: 'eclipsetone',`

You'll see visits per page plus these events:

| Event | Meaning |
| --- | --- |
| `get-started-opened` | Opened the plan builder |
| `price-form-pick-…` | Picked a package in the price form |
| `price-form-started` | Typed a valid email (a lead) |
| `price-form-sent` | Pressed the send button |
| `order-cd`, `order-usb` | Tapped a physical copies order button |
| `questions-whatsapp` | Tapped "Questions?" |
| `call-booking`, `phone-call`, `whatsapp-other` | Other ways they reached out |
| `currency-USD`, `currency-EUR`, `language-fr` | Display choices (tells you where visitors come from) |

## 3. MailerLite (email sign-up)

1. In MailerLite: **Forms → Embedded forms → Create**. Add only the email field.
2. Open the form's **HTML code** and find `action="https://assets.mailerlite.com/jsonp/…/subscribe"`.
3. Paste that URL into `config.js`: `mailerlite: 'https://assets.mailerlite.com/jsonp/…/subscribe',`

The "Not ready yet?" section on the homepage appears once this is set.

## Prices and taxes

- All prices are in Canadian dollars. Visitors can switch to a USD or EUR estimate; rates refresh daily and fall back to `fx` in `config.js`.
- Québec rules allow sales taxes to be added on top of an advertised price; every other fee must be included. The site says "plus taxes (GST and QST) for clients in Canada."
- Check with your accountant whether you are registered for GST/QST (required above $30,000 in revenue over 4 quarters).

## 4. The 15-minute call (Calendly)

Bigger projects (Full Song, Song + Songwriting, Song + Launch, 3-Song EP, Not sure yet) see a calendar right after they send their request.

- It uses your Calendly event `free-onboarding-call`. Set its length to **15 minutes** in Calendly.
- Name and email are filled in for the visitor. If you add a custom question to the event (for example "What's your project?"), the first one is pre-filled with the package and their WhatsApp number.
- Mixing, Studio Recording and Physical copies skip the call: you just message or call them, as they chose.
