# Gift lists (/gifts/): design direction "The Tag"

Status: visual design against the real app at `f5ecb3eb84e4feb9c2bb57ed891fdffab99b83cb` (PR #14, branch `cursor/gifts-secret-santa-dd77`). Hooks are `gifts/HOOKS.md`. This folder’s `style.css` replaces the neutral stand-in. Fonts are self-hosted under `gifts/fonts/`. Logic in `gifts/app.js` and `gifts/config.js` is not touched.

The look is **The Tag**, with Pixel’s three fixes applied: 45° clipped tag silhouettes whose 2px ink rule follows the cut; kraft ground `--paper: #d8bf94`; and a “To:” masthead that keeps the full T crossbar and colon, cropped from the left, with a string hanging into the T’s top-left.

## The idea

Every piece of UI is a gift tag: a cream die-cut card with a punched hole, a 2px ink rule, and a name written large. Secret Santa already lives on tags. The app is built out of that one object.

- **Brand.** A short string and a punched hole, then a cropped Fraunces italic **To:** as the masthead. The readable name is “Gift lists” (the app’s copy). Because the real header has no mast markup, “To:”, the string, and the hole are CSS-only on `.gifts-top` / `.gifts-top__inner`. “To:” is aligned to the header’s left edge (not the centered column) so it bleeds off the left at 1024 and up, and the string lands in the T’s top-left at 375, 768, 1024, and 1280. The rest of the header (brand, countdown or lock stamp, Sign out, Cruz chip) shares the current view’s column with the sample banner and main: `--measure` (40rem) for `data-view="signin"|"mine"|"edit"`, `--page` (1120px) for `data-view="all"`. “To:” stays tied to the viewport, not that column.
- **Kids.** Each child’s name is set like the “To:” line on a tag, in Fraunces. That is how adults find the right list. Empty kids on the adult overview compact to a single name + “0 items” row so eleven kids stay scannable.
- **Items.** Each wish is a tag. The item name is the largest thing on it. Priority keeps the app’s words — **Really want / Would like / Bonus** — plus 3 / 2 / 1 ink bars. Never colour alone. A link, if present, is the app’s “Open link” text, underlined, not an icon.
- **Adding.** The kid’s list is led by one large wax-red **Add something** button. The form is a blank tag with a centred hole: real labels, a required name, optional link, optional size or note, and priority as radio buttons made of the same word-plus-bars.
- **Lock.** Before the deadline, a typographic countdown sits in the header under the app’s line “Closes December 11”. After the deadline, the countdown is replaced by an ink date stamp on `.gifts-locknote` that keeps the copy **Lists locked Dec 11**. Edit controls go away.
- **Sample mode.** The demo banner, “Preview locked lists”, and “Leave sample” stay quiet and secondary. They are never wax. “Look at a sample” on the unconfigured intro is the one wax primary on that screen.
- **Ground.** Kraft paper. Cream tags. Warm black ink. Square corners except the 45° top chamfers on tags. No gradients, no snowflakes, no Santa hats, no candy-cane stripes, no emoji decoration, no illustrated people. Sealing-wax red (`#8a1f2c`) is the one action colour: primary buttons and focus rings. It is not used for priority, errors, or decoration.

### Why this beats the alternatives

1. **vs. risograph overprint.** Two holiday inks, slightly misregistered, would feel festive and handmade. It would also make colour the identity, fight “one primary action colour per view”, and lose contrast where the inks overlap — exactly where kids have to read a form. The Tag keeps a print-shop feel (kraft, ink, a wax seal for actions) and lets type and the punched hole do the work, including in greyscale.
2. **vs. wrapping-paper type.** Giving each kid a typographic wrapping pattern is festive, but pattern behind a list hurts the one job adults have: scanning names and wishes fast. The useful part — knowing whose list this is — is done better by setting the child’s name huge on a tag.
3. **vs. HSPT and Chem.** HSPT is white, 1px black rules, Helvetica, red #e2341d. Chem is warm bench paper, 1.5px ink cells, Atkinson plus Plex Mono, cobalt, numbered corners. Gifts is kraft, cream tags with a hole, Fraunces plus Lexend, sealing-wax red only on actions. Same family of craft (honest rules, no gradients, one accent) without being a reskin.

## Tokens (CSS custom properties; full set in style.css)

### Colour

| Token | Value | Use |
|---|---|---|
| --paper | #d8bf94 | page ground (kraft). Pixel’s paper, not a darker stand-in. |
| --tag | #fff8ec | tag faces, fields, raised cards |
| --ink | #1c1612 | text, tag rules, punched-hole ring, lock stamp, current/selected outline |
| --ink-2 | #4f463e | secondary text, labels, notes, countdown units. 5.18:1 on paper — legal AA, do not darken the paper. |
| --hair | #d4c4a8 | decorative only. Never text, never meaning on its own. Empty priority bars use a hair fill *plus* a 1.5px ink outline so they stay visible at 375. |
| --well | #e8d7b8 | hover, selected-but-not-primary fills |
| --wax | #8a1f2c | primary buttons, focus ring. Not priority, not errors, not links in a list |
| --wax-deep | #6e1c28 | button base line and pressed state |
| --good / --good-wash | #1a4f34 / #e3efe8 | “Saved.” status (word + colour) |
| --bad / --bad-wash | #8a2158 / #f6e4ec | errors (a “!” mark + a sentence). Not the same red as wax |
| --white | #ffffff | text on wax, good, and bad solids |

Priority does not get its own colour. High, medium and low are told by the words “Really want”, “Would like”, and “Bonus”, plus 3 / 2 / 1 filled ink bars.

### Type

- **Display.** `--font-display`: Fraunces 800 (self-hosted, OFL). Roman for kid names, countdown numerals, the lock stamp, and headings. Italic for the cropped “To:”. The cut is a display optical size (opsz 144) with a little softness and wonk.
- **Body.** `--font-body`: Lexend 500 and 700 (self-hosted, OFL). UI, forms, item names, notes, and buttons. Fallback is system-ui.
- **Files.** `fraunces-800.woff2`, `fraunces-800i.woff2`, `lexend-500.woff2`, `lexend-700.woff2`, plus OFL licences in `fonts/`. Latin + typographic punctuation subset. Preloaded from `index.html`.
- **Sizes.** 375 → ≥900px:
  - body 18
  - item name 20 → 22
  - h1 32 → 44
  - kid name (`.gifts-kid__name`) 36 → 48
  - “To:” 100 → 160 (CSS-only, decorative, `content: "To:" / ""` so screen readers do not announce it)
  - brand “Gift lists” 28 → 32
  - countdown numerals 36 → 48
  - labels 15 (Lexend 700). Never go below 14px for any meaning, or 16px for input text (iOS zoom).
- **Inputs** are 18px, same as body.

### Space and shape

- **Spacing.** A 4pt scale: `--s1..--s8` = 4, 8, 12, 16, 24, 32, 48, 64.
- **Borders.** Tag and field border `--b: 2px` ink. Square corners everywhere except the tag chamfer. No gradients, no soft drop shadows. The primary button sits on a 3px `--wax-deep` base, like a rubber stamp.
- **Tag silhouette.** `--cut: 12px` (16px ≥900px). Two clipped layers: an ink `::before` in the full tag shape, and a cream `::after` inset by 2px with `--cut-in: calc(var(--cut) - var(--b) * 0.5858)` so the stroke is uniform along the 45° edge. The host is **not** clipped, so `:focus-visible` rings stay visible. `isolation: isolate` and `z-index: -1` on the layers keep text nodes (priority radio labels, item names) above the face.
- **The hole.** CSS-only, punched with a radial-gradient mask on both silhouette layers so kraft shows through and a 2px ink ring remains. Items: hole top-left (`--hole-x` / `--hole-y`). Add/edit form: hole centred under the clipped top. Choice chips have no hole (too many, too small). The masthead hole and string are painted on `.gifts-top::after` / `::before`.
- **Sizes.** `--tap: 48px` minimum control height (44px is the floor; 48 is the rule). Reading measure ~40rem for sign-in, mine, and edit. Page 1120px for the adult overview.

## Hooks (from gifts/HOOKS.md — CSS only)

The stylesheet is written to the real markup. No `.gifts-tag` wrappers or hole spans are added; those would need `app.js`.

### Root and views

- `data-view="signin" | "one" | "all" | "mine" | "edit"` on `body`.
- `data-configured`, `data-demo` on `body`.
- `.is-locked` on `body` when lists are locked (including sample “Preview locked lists”).
- There is no `.is-editing`; edit is `data-view="edit"`.
- `.is-saving` and `.is-error` land on `.gifts-status`, not the root.

### Header

- `.gifts-top` / `.gifts-top__inner` / `.gifts-top__bar` / `.gifts-top__tools`.
- `.gifts-brand` is the “Gift lists” wordmark (`href="#/"`).
- `.gifts-signout` (“Sign out”) is a quiet outline, shown once a role is set.
- `.gifts-back` is the CRUZ name chip (`href="../"`, text “Cruz”).
- `.gifts-countdown` with `__label` (“Closes December 11”), `__chunk`, `__num`, `__unit`.
- `#gifts-locknote.gifts-locknote` — exact copy “Lists locked Dec 11”. Styled as a slightly rotated ink stamp (rotation dropped under `prefers-reduced-motion`).

### Sample banner

- `#gifts-demo.gifts-demo`. The banner copy may list sample codes; it stays quiet secondary type (`ink-2`, 16px, a thin rule, never wax). Buttons `.gifts-preview-lock` (“Preview locked lists” / “Preview open lists”) and `.gifts-leave-demo` (“Leave sample”) are secondary ink outlines.
- `.gifts-demo-start` (“Look at a sample”) is wax; it only appears on the unconfigured intro.

### Lists, items, form

- `section.gifts-kid` with `__name` and `__count`. `ul.gifts-items`. Empty copy is `.gifts-empty`.
- Adult single list (`data-view="one"`): narrow column, masthead aligned with main. The `h1.gifts-one__title` is a calm 18px sentence, with `span.gifts-one__name` in Fraunces; the reused `h2.gifts-kid__name` is the large “To:” address line (56px / 80px). `.gifts-lede` stays secondary. No wax primary. The lock stamp is unchanged. Empty lists keep the dashed-tag `.gifts-empty` (“Nothing here yet.”).
- Adult overview (`data-view="all"`): empty kids compact via `:has(.gifts-empty)` (name + count on one row, hide the empty message and the empty list). From 900px the overview is a 3-column grid; filled kids (`order: 1`) come first, then empty kids as one compact run (`order: 2`, with the first empty forced to column 1 so they don’t share a row with a leftover filled kid). This is visual only: DOM, heading, and screen-reader order stay the family order from config. Empty sections have no focusable controls, so tab order still follows the visual item tags. This view is unchanged from The Tag landing.
- `.gifts-item[data-priority=high|med|low]`. `.gifts-item__name`, `__note`, `__link` (“Open link”), `__priority` (bars via CSS), `__actions`. `.gifts-edit` / `.gifts-remove` are secondary.
- `button.gifts-add` is the wax primary on mine (and on a kid section when the signed-in kid can edit).
- `form.gifts-form#gifts-item-form` is the page at `data-view="edit"`. Fields have real `<label>`s. Priority is `#gifts-priority` radio labels `.gifts-choice`. Actions: `.gifts-save` (wax) and `.gifts-cancel` (outline).

### Sign-in

- `#gifts-kid-form` and `#gifts-adult-form` are not `.gifts-form`. Submits are `.gifts-enter` (wax). Name radios are `label.gifts-choice`.
- Each `.gifts-gate` (`data-gate="kid"` and `data-gate="adult"`) is its own tag (chamfer + 2px ink rule, no hole, so the heading stays short). Each wax submit is full-width of its own tag.
- Kid names are a compact 2-column grid at 375, 4 columns from 900px, each tag at least 48px (`--tap`). The selected name uses a 2px wax ring, a well fill, and an ink check — not colour alone. The focus ring is the ink outline, distinct from the selected ring.
- Two `.gifts-enter` buttons can appear together on the sample sign-in page (kid gate and adult gate). That is a real-markup constraint: each form still has one primary. Demo banner buttons are never wax.
- Adults still follow kids in the DOM (and in tab order). The compact grid shortens the page; a jump link or putting the adult gate first would need a small `app.js` change if the adult field still sits below the fold on a short phone.

### Status and empty

- `#gifts-status.gifts-status` is `aria-live`. Error state shows a “!” mark plus the sentence, magenta wash, not wax. Invalid fields use `[aria-invalid="true"]`.
- `.gifts-empty` on a kid’s own list is a dashed tag prompt, not the compact adult row.

## States designed

Intro (no sheet), sample sign-in (kid name selected), adult one (Cruz, open and locked), adult one empty (Carlos), admin all, kid mine (Cruz), add/edit form, locked variants. Saving… is not a stable demo state: demo writes are synchronous, so it was not shot. Outbound Sheet traffic is never requested in these renders; Playwright aborted every non-local URL (`blocked outbound: []`).

## CSS-only fallbacks (no markup ask required)

- Decorative “To:”, string, and hole on the header.
- Tag chamfers, ink rule, and punched holes on items, the add form, and name/priority choice chips (chips have no hole). Sign-in gates are tags without a hole.
- Priority bars on `.gifts-item__priority` and on `#gifts-priority .gifts-choice` (bars are painted on the cream `::after` so they are not covered by the silhouette).
- Compact empty kids on the adult overview.
- Lock stamp typography and rotation on the existing `#gifts-locknote` node.

## What this does not change

`gifts/app.js`, `gifts/config.js`, and the hook names in `HOOKS.md`. `index.html` is touched only for `theme-color: #d8bf94` and the four font preloads.

## Open notes

- The production lock instant is `2026-12-12T00:00:00-08:00` in `app.js` (the end of 11 Dec 2026, America/Los_Angeles). The stamp copy stays “Lists locked Dec 11”.
- Favicon `../favicon.svg` 404s when only `gifts/` is served; it is a local request and fine.
- If Cruz Engineer later adds a `.gifts-mast` node, the CSS-only “To:” can be retired in favour of real markup. It is not required.
