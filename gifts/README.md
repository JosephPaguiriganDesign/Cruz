# Gift lists

A small site at `/gifts/` for the family wish lists. Each adult is the secret santa for one kid and sees only that kid's list. Each kid picks their name, enters their own code, and can change only their list. Joseph has an admin code that can look at every list and cannot change them.

The page is plain HTML, CSS, and JavaScript. The lists live in a private Google Sheet. A Google Apps Script web app reads and writes that sheet. GitHub Pages only serves the page, so the script is what rejects edits after the deadline.

Edits lock at the end of December 14, 2026, Pacific time (`2026-12-15T00:00:00-08:00`, which is midnight at the start of December 15, Pacific Standard Time). After that, everyone can still look. The script refuses saves.

## Names

The eleven kids, in this order:

Cruz, Kaleo, Sammy, Carlos, Josie, Alberto, Isaiah, Madison, Eli, Wyatt, Emmett.

Each one has their own list. The names are in two places, and those lists must match:

- `gifts/config.js` — what the website shows
- `KIDS` at the top of `gifts/apps-script/Code.gs` — what the script allows

To add or rename someone later, change both, publish the website, and redeploy the script (steps below). Then run `setupCodes` again. It only creates a code for a name that does not have one yet.

## Codes stay off the website

Do not put a real code in `config.js`, `app.js`, or any other file in this repo. The sample codes below work only in the on-device preview, before the sheet is connected.

The script stores real codes in **Script Properties**:

- `CODE_Cruz`, `CODE_Kaleo`, and so on — the kid's edit code
- `VIEW_Cruz`, `VIEW_Kaleo`, and so on — that kid's secret santa code
- `ADMIN` — Joseph's code, every list, read only

`setupCodes` always creates the admin code if it is missing. It also copies every code onto a **Codes** tab so you can read them and hand them out. That tab is only a copy. The website never reads it. A view code returns only that one kid. An edit code returns only that kid, and it is the only code that can save. An unknown code returns an error and no list.

Keep the Google Sheet private. Do not share it, and do not publish it to the web. Anyone who can open the sheet can read the Codes tab.

The codes use uppercase letters and digits, and they skip `0`, `O`, `1`, `I`, and `L` so they are easier to read aloud. No two codes are the same.

## What you do once

1. Create a new Google Sheet. Name it something like `Gift lists`. Leave it private.
2. In the sheet, choose **Extensions → Apps Script**.
3. Delete the sample `function myFunction`. Paste in the whole file `gifts/apps-script/Code.gs`. Save (disk icon).
4. Open **Project Settings** (gear). The runtime should be **Chrome V8**. New scripts already use it. The deadline is an exact timestamp, so the project timezone does not move it. America/Los_Angeles is a fine choice anyway.
5. Back in the editor, choose the function **`setupCodes`** in the toolbar and press **Run**.
6. Google will ask for permission to edit the spreadsheet and the script properties. Approve it with the account that owns the sheet.
7. Open the sheet again. You should see:
   - **Items** — empty except a header row. Gifts will show up here.
   - **Codes** — one row per kid, with an edit code and a view code, plus an `ADMIN` row.
8. You can delete the blank **Sheet1** tab if it is still there and empty.
9. Write the codes down from the Codes tab, or just leave them in this private sheet.
   - Give each kid only the edit code in their row.
   - Give each adult only the view code for the one kid they are buying for.
   - Keep the `ADMIN` code for yourself. It opens every list and cannot change them.
10. In Apps Script, choose **Deploy → New deployment**.
    - Click the gear and choose **Web app**.
    - Description: `Gift lists`.
    - Execute as: **Me**.
    - Who has access: **Anyone**.
    - Press **Deploy**, approve if asked, and copy the **Web app URL**. It ends in `/exec`.
11. Open `gifts/config.js`. Paste that URL between the quotes for `scriptUrl`. Do not add codes to this file.

```javascript
var GIFTS_CONFIG = {
  scriptUrl: "https://script.google.com/macros/s/…/exec",
  kids: [ "Cruz", "Kaleo", … ]
};
```

12. Commit `config.js` and get it onto `main` so GitHub Pages publishes it. Until `scriptUrl` is filled in, the site shows a sample on the device and does not save anything for the family.

Open `https://josephpaguirigandesign.github.io/Cruz/gifts/`. An adult enters their view code and sees one list. A kid picks their name and enters their edit code.

Running `setupCodes` again does **not** change codes that already exist. It only fills in a missing edit code, view code, or the admin code, and it refreshes the Codes tab from Script Properties.

## If a code is lost

In the spreadsheet, use the **Gift lists** menu and choose **Reset a code**.

- For a kid, type the name and `edit` or `view`, such as `Cruz edit` or `Josie view`.
- For the admin code, type `ADMIN`.

Read the new code on the Codes tab. The old one stops working immediately. The new code will not match any other code.

From the Apps Script editor you can also run `resetCodePrompt`. The Run button cannot pass a name by itself, so the menu is the easy path. `resetCode("Cruz", "view")` and `resetCode("ADMIN")` are the functions the menu calls.

Do not edit codes by hand in the Codes tab. The next `setupCodes` or `resetCode` rewrites that tab from Script Properties. Hand edits on the tab are ignored.

## If you change the script later

**Deploy → Manage deployments → pencil → Version: New version → Deploy.**

That keeps the same URL. A brand-new deployment makes a new URL, and you would have to paste it into `config.js` again.

Change `LOCK_AT` only if the family really wants a different deadline, and change the same string in `gifts/app.js` so the countdown matches. Then deploy a new version of the script and publish the website.

## Sample codes

These work only while `scriptUrl` in `config.js` is empty. They are not the family's real codes. Each kid's sample view code is the lowercase name plus `-view`. The edit code is the lowercase name plus `-edit`. The admin sample code is `sample-admin`.

| Kid | View code (one adult) | Edit code (the kid) |
| --- | --- | --- |
| Cruz | `cruz-view` | `cruz-edit` |
| Kaleo | `kaleo-view` | `kaleo-edit` |
| Sammy | `sammy-view` | `sammy-edit` |
| Carlos | `carlos-view` | `carlos-edit` |
| Josie | `josie-view` | `josie-edit` |
| Alberto | `alberto-view` | `alberto-edit` |
| Isaiah | `isaiah-view` | `isaiah-edit` |
| Madison | `madison-view` | `madison-edit` |
| Eli | `eli-view` | `eli-edit` |
| Wyatt | `wyatt-view` | `wyatt-edit` |
| Emmett | `emmett-view` | `emmett-edit` |

Admin sample code: `sample-admin`.

On the sample, adults use the single code field. Kids pick their name and type their edit code.

## Sheet tabs

**Items**

| id | kid | name | link | note | priority | updatedAt |
| --- | --- | --- | --- | --- | --- | --- |

`priority` is `high`, `med`, or `low` (Really want, Would like, Bonus).

**Codes** (private copy, not used by the website)

| kid | edit code | view code |
| --- | --- | --- |
| ADMIN | | (created by setupCodes) |
| Cruz | (edit) | (view) |

The note in column D is a reminder. Do not share the spreadsheet.
