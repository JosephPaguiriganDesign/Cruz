# Gift list hooks

Carson can restyle `gifts/style.css` without changing `gifts/app.js`. The page is semantic HTML. Script only toggles classes, the `hidden` attribute, text, and form state. There are no inline styles and no icon fonts.

`gifts/style.css` is Carson's "The Tag" design. New layout for the single-list view reuses those rules and adds only the hooks below. Deploy steps for Joseph are in `gifts/README.md`.

## Views

`data-view` is set on `body`:

| Value | Who | What |
| --- | --- | --- |
| `signin` | nobody yet | Sample prompt, or the kid form and the adult code field |
| `one` | one adult | That kid's list only, read only |
| `all` | admin | Every kid's list, read only |
| `mine` | one kid | That kid's list, with add / edit / remove until the lock |
| `edit` | one kid | The add or change form |

The lock is not a view. `body` gets class `is-locked`. `data-view` stays `signin`, `one`, `all`, `mine`, or `edit`.

Other attributes on `body`:

| Attribute | Values | Meaning |
| --- | --- | --- |
| `data-configured` | `true` / `false` | `scriptUrl` in `config.js` is set |
| `data-demo` | `true` / `false` | Sample data on this device, because the script URL is empty |

There is no `.is-editing` class. The edit screen is `data-view="edit"`.

## State classes

| Class | Where | When |
| --- | --- | --- |
| `.is-locked` | `body` | At or after the deadline, or while the sample "Preview locked lists" control is on |
| `.is-saving` | `.gifts-status` | A save is in flight (`Saving…`) |
| `.is-error` | `.gifts-status` | The status text is an error |

`hidden` is used instead of a display style for:

- `#gifts-countdown` while locked
- `#gifts-locknote` before the lock
- `#gifts-signout` when nobody is signed in
- `#gifts-demo` when not in the sample
- `.gifts-add` and `.gifts-item__actions` while locked
- `.gifts-item__note` when the note is empty
- `a.gifts-item__link` when there is no link

## Regions

| Hook | Element | Role |
| --- | --- | --- |
| `.gifts-skip` | `a` | Skip link |
| `.gifts-top` | `header` | Page header, full width |
| `.gifts-top__inner` | `div` | Centered header column |
| `.gifts-top__bar` | `div` | Brand row |
| `.gifts-top__tools` | `div` | Sign out and home link |
| `.gifts-brand` | `a` | "Gift lists", links to `#/` |
| `#gifts-signout.gifts-signout` | `button` | Clears the session |
| `.gifts-back` | `a` | Back to the Cruz home page |
| `#gifts-countdown.gifts-countdown` | `p` | Countdown. `aria-label` is a full sentence |
| `.gifts-countdown__label` | `span` | "Closes December 11" |
| `.gifts-countdown__chunk` | `span` | Wraps one number and its unit |
| `.gifts-countdown__num` | `span` | The number |
| `.gifts-countdown__unit` | `span` | `day(s)`, `hour(s)`, `minute(s)`, or `second(s)` |
| `#gifts-locknote.gifts-locknote` | `p` | Exact text: `Lists locked Dec 11` |
| `#gifts-demo.gifts-demo` | `div` | Sample banner |
| `.gifts-demo__text` | `p` | Sample explanation |
| `.gifts-preview-lock` | `button` | Toggles the locked preview in the sample only |
| `.gifts-leave-demo` | `button` | Leaves the sample |
| `#gifts-status.gifts-status` | `p` | The only status node. `role="status"` `aria-live="polite"` `aria-atomic="true"` |
| `#gifts-main.gifts-main` | `main` | Swapped content. `tabindex="-1"`. `aria-busy="true"` while a list is loading |
| `.gifts-page` | `div` | Wrapper inside main |
| `.gifts-title` | `h1` | Page title. On sign-in the text is `Who's here?` so it does not repeat the masthead |
| `.gifts-one__title` | `h1` | Adult single-list heading. Text is `You're `, the name span, then `'s secret santa` |
| `.gifts-one__name` | `span` | The one kid's name inside `.gifts-one__title` |
| `.gifts-lede` | `p` | Read-only note on the single-list view and the admin view |
| `.gifts-lead` | `p` | Short explanation on the kid list |
| `.gifts-setup` | `p` | Shown when the script URL is empty and the sample is off |
| `.gifts-demo-start` | `button` | "Look at a sample" |
| `.gifts-loading` | `p` | Placeholder while a request is open |
| `.gifts-lists` | `div` | Adult list wrapper (also `.gifts-page`) |
| `.gifts-sr` | `span` | Visually hidden text |
| `.gifts-noscript` | `p` | No-JavaScript note |

While the countdown is more than a day away it shows days, hours, and minutes. Under a day it shows hours, minutes, and seconds. Under an hour it shows minutes and seconds. At the deadline the countdown is hidden and the lock note is shown.

## Sign-in

| Hook | Element |
| --- | --- |
| `.gifts-gate` | `section` |
| `data-gate="kid"` | The kid section (first) |
| `data-gate="adult"` | The adult section |
| `#gifts-kid-form` | Kid form. Not `.gifts-form` |
| `.gifts-kids` | `fieldset` of names, in config order |
| `.gifts-choice` | `label` wrapping a radio |
| `#gifts-kid-<lowercase name>` | Each name radio. `name="kid"` `value` is the name |
| `#gifts-edit-code` | The kid's edit code. Label: "Your code" |
| `#gifts-adult-form` | Adult form. One field |
| `#gifts-adult-code` | Adult code. Label text is exactly `Your code` |
| `#gifts-adult-form h3` | Plain heading inside the adult code field, directly above the `Your code` label. Text: `Grown-ups: enter your code`. Not a link or button |
| `.gifts-enter` | Submit for either sign-in form |
| `.gifts-field` | Label + input pair |

The adult field does not ask which kid. The code itself chooses `one`, `all`, or `mine`. The adult field heading uses Fraunces at `--fs-item`, ink on the tag, with no underline.

## Adult single list (`data-view="one"`)

Read only. One kid. The response that filled this view has that kid and that kid's items only.

```html
<h1 class="gifts-one__title">You're <span class="gifts-one__name">Cruz</span>'s secret santa</h1>
<p class="gifts-lede">You can look. Only Cruz can change this list.</p>
```

Then one `section.gifts-kid` with `h2.gifts-kid__name`, `.gifts-kid__count`, `ul.gifts-items`, and `li.gifts-item` as on the admin list. No `.gifts-add` and no `.gifts-item__actions`.

## Admin list (`data-view="all"`)

One `section.gifts-kid` per kid, in the config order, including kids with an empty list.

| Hook | Element |
| --- | --- |
| `.gifts-kid` | `section`. `data-kid` is the kid's name |
| `h2.gifts-kid__name` | Name |
| `.gifts-kid__count` | `5 items`, `1 item`, or `0 items` |
| `ul.gifts-items` | The gifts. Present even when empty |
| `.gifts-empty` | "Nothing here yet." when that kid has no gifts |

No add, edit, or remove controls on this view.

## Item

`li.gifts-item` with `data-priority="high"|"med"|"low"` and `data-id`.

| Hook | Element | Text |
| --- | --- | --- |
| `.gifts-item__name` | `p` | Gift name |
| `.gifts-item__note` | `p` | Size or note. `hidden` if empty |
| `a.gifts-item__link` | `a` | "Open link". `hidden` if there is no URL. Real links use `target="_blank"` and `rel="noopener noreferrer"` |
| `.gifts-item__priority` | `p` | The word, not only the attribute |

| `data-priority` | Visible word |
| --- | --- |
| `high` | Really want |
| `med` | Would like |
| `low` | Bonus |

On `data-view="mine"` only, each item also has `.gifts-item__actions` with:

| Hook | Text |
| --- | --- |
| `button.gifts-item__edit` | Edit. `aria-label` is `Edit` plus the gift name |
| `button.gifts-item__remove` | Remove. `aria-label` is `Remove` plus the gift name |

`button.gifts-add` ("Add something") is the only filled primary button on the kid's list. It sits in that kid's `section.gifts-kid`. It is `hidden` while locked.

## Edit form (`data-view="edit"`)

`form.gifts-form#gifts-item-form` with `novalidate`. `data-id` is set only when changing an existing gift.

Every field has a visible `label`. Priority is a radio group.

| Hook | Field |
| --- | --- |
| `#gifts-name` | "What do you want?" Required. `maxlength` 80 |
| `#gifts-link` | "Link (optional)". `type="url"`. `maxlength` 400 |
| `#gifts-note` | "Size or note (optional)". `maxlength` 140 |
| `#gifts-priority` | `fieldset`. Legend: "How much do you want it?" |
| `#gifts-priority-high` | Radio `value="high"`, label "Really want" |
| `#gifts-priority-med` | Radio `value="med"`, label "Would like" |
| `#gifts-priority-low` | Radio `value="low"`, label "Bonus" |
| `.gifts-form__actions` | Button row |
| `button.gifts-save` | Submit. Primary. Text: "Save" |
| `button.gifts-cancel` | Back to the kid's list. Text: "Cancel" |

Invalid fields get `aria-invalid="true"`. The message goes in `.gifts-status`.

## Kid and item fields

Kids have a name only on the website. The name is the id. Order is the `kids` array in `gifts/config.js`.

A gift:

| Field | Rules |
| --- | --- |
| `id` | Server-created on add. Demo ids stay in `sessionStorage` |
| `name` | Required, trimmed, 1–80 characters, no control characters or `<>` |
| `link` | Optional. Empty or an `http` / `https` URL, up to 400 characters |
| `note` | Optional, up to 140 characters |
| `priority` | `high`, `med`, or `low` |

The sheet also stores `kid` and `updatedAt`. Those are not hooks on the item element. `updatedAt` is not sent back to the page.

At most 40 gifts per kid.

## Config

`gifts/config.js` exposes `GIFTS_CONFIG`:

| Key | Purpose |
| --- | --- |
| `scriptUrl` | Apps Script web app URL ending in `/exec`. Empty until Joseph pastes it |
| `kids` | Names in list order. No codes |

`gifts/app.js` holds the lock instant `2026-12-12T00:00:00-08:00` and the same rules the script enforces. The only codes in that file are the sample words (`cruz-view`, `cruz-edit`, `sample-admin`, and the same pattern for each kid). They work only while `scriptUrl` is empty.

## Storage in the browser

| Key | Store | Contents |
| --- | --- | --- |
| `gifts-session-v1` | `sessionStorage` | `{ demo, role, kid, code, previewLocked }` |
| `gifts-demo-v1` | `sessionStorage` | Sample gifts only. Used when `scriptUrl` is empty |

The session is dropped when the tab closes. A live session keeps the code that was typed so a refresh can reload the same list. `role` is `one`, `admin`, or `kid`.

Hash routes: `#/`, `#/one`, `#/all`, `#/mine`, `#/edit`, `#/edit/<id>`.

## Server

Source: `gifts/apps-script/Code.gs`.

Script Properties (not in the repo):

| Key | Who |
| --- | --- |
| `VIEW_<Name>` | The adult for that kid. Example key: `VIEW_Cruz` |
| `CODE_<Name>` | That kid's edit code. Example key: `CODE_Cruz` |
| `ADMIN` | Joseph. Every list, read only. Always created |

`setupCodes()` creates any missing property, including `ADMIN`, and rewrites the private **Codes** tab. It does not replace an existing property. `resetCode("Cruz", "edit")` or `resetCode("Cruz", "view")` replaces one kid code. `resetCode("ADMIN")` replaces the admin code. `resetCodePrompt()` asks for `Cruz edit`, `Cruz view`, or `ADMIN`. A new code never matches another stored code.

Sheet tabs:

| Tab | Columns |
| --- | --- |
| Items | `id`, `kid`, `name`, `link`, `note`, `priority`, `updatedAt` |
| Codes | `kid`, `edit code`, `view code` — private copy for Joseph. The `ADMIN` row keeps its code in the view column. Never returned by the web app |

### `doGet`

`?code=` is the whole request. The code decides the payload.

| Code matches | Response |
| --- | --- |
| `VIEW_<Name>` | `{ ok, role: "view", locked, lockAt, kid, items }`. `items` are only that kid. No `kids` array and no other names |
| `CODE_<Name>` | `{ ok, role: "edit", locked, lockAt, kid, items }` for that kid only |
| `ADMIN` | `{ ok, role: "admin", locked, lockAt, kids: [{ name, items }] }` for every kid, in order |
| anything else | `{ ok: false, error: "That code is not right." }` and no kid, items, or kids |

Reads work before and after the lock.

### `doPost`

`Content-Type: text/plain;charset=utf-8` and a JSON body, so the browser does not send a preflight.

```json
{ "action": "add|update|remove", "kid": "Cruz", "code": "……", "item": { "id": "", "name": "", "link": "", "note": "", "priority": "high" } }
```

`id` is required for `update` and `remove`. The script accepts only that kid's edit code (`CODE_<Name>`), then the deadline, then writes that kid's row only. A view code or the admin code cannot save.

Success: `{ ok: true, locked: false, items }`.

After the deadline: `{ ok: false, locked: true, error: "Lists locked Dec 11." }` and nothing is written.

Reads still work after the lock.
