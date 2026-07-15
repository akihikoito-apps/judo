# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

**My道場 (internal name: MyDojo)** — a Japanese-language judo dojo / team
management app, built as a **client-only Progressive Web App (PWA)**. A single
coach or dojo admin uses it on a phone to manage members, attendance, fees,
schedule, and match results. All data lives in the browser (`localStorage`);
there is no server, no account, and no network backend.

The primary UI language is **Japanese**. The app also ships a runtime
translation layer for English / French / Portuguese (see [i18n](#internationalization-i18n)).

## Repository layout

This is a **static site with no build step**. Everything is hand-written HTML
with inline `<style>` and `<script>` — there is **no `package.json`, no bundler,
no dependencies, no framework**.

| File | Purpose |
|------|---------|
| `index.html` | The entire app (~5,600 lines). All HTML, CSS, and JS inline. This is where ~all work happens. |
| `report.html` | Standalone **parent-facing** "試合きろく" (match record) entry page. Parents fill in a child's match results, then copy/share the generated text to the dojo via LINE. |
| `sw.js` | Service worker (offline cache + update handling). |
| `terms.html` | Terms of use (利用規約). Japanese only, legal content. |
| `privacy.html` | Privacy policy (プライバシーポリシー). Japanese only, legal content. |
| `report.html` → `index.html` | The coach pastes the parent's text into the app's "📋取り込み" (import) feature to register matches in bulk. |

There is no test suite, linter config, or CI. Verification is manual: open
`index.html` in a browser (ideally mobile viewport) and exercise the flow.

## Architecture of `index.html`

It is a **single-page app** built from six full-screen "screens", switched by a
fixed bottom tab bar. No router, no virtual DOM — screens are `<section
class="screen">` elements toggled with an `active` class, and each screen is
re-rendered by a plain `render*()` function that rebuilds `innerHTML`.

### The six screens / tabs

Defined in `<nav class="tabbar">` and switched by `switchTab(tab)`:

| Tab id | Japanese | Meaning | Render fn |
|--------|----------|---------|-----------|
| `mates` | 仲間 | Members / roster | `renderMates()` |
| `att` | 出欠 | Attendance (default screen) | `renderAtt()` |
| `money` | お金 | Fees + cash accounting | `renderMoney()` → `renderFee()` / `renderCash()` |
| `sched` | 予定 | Schedule / calendar | `renderSched()` |
| `list` | 集計 | Reports (attendance, accounting, member info, **match results**) | `renderList()` |
| `set` | 設定 | Settings | `renderSettings()` |

`switchTab` (around line 2466) removes `active` from all screens, adds it to the
target, updates the tab bar, and calls the matching render function.

### Data model — the `DB` object

A single global `let DB = {...}` (around line 2291) holds **all** app state. Key
fields:

- `team`, `logo`, `themeColor`, `themeShape`, `fontScale`, `lang`, `currency`
- `students[]` — the roster (each has id, name, category, grade/belt, sex, grip, enrollment dates, etc.)
- `attendance{}` — keyed by date → `{studentId: 'present'|'absent'}`
- `fees{}`, `feeOverrides{}`, `feePresets[]`, `visitFees{}` — monthly fee tracking
- `cash[]`, `cashCats{in,out}` — dojo income/expense ledger
- `schedule[]`, `schedPresets{}` — events
- `matchResults{}` — per-student match/bout records (individual 個人戦 + team 団体戦)
- `matchPresets{rounds,grades}` — pickers for match entry
- `categories[]`, `ranks{kyu,dan}` — student category & belt-rank config
- `places[]`, `metaHistory[]`, `fyStartMonth`, `gradeStartMonth`

`DB` is initialized with defaults, then `load()` merges saved data over it via
`Object.assign(DB, JSON.parse(localStorage))`.

### Persistence

- **`STORE_KEY = 'judoTeamApp_v2'`** — the whole `DB` is `JSON.stringify`'d into this one `localStorage` key.
- **`LOCK_KEY = 'judoTeamApp_lock'`** — optional PIN lock (enabled flag + hashed code).
- `save()` writes `DB` to `localStorage` on every mutation. **Any function that changes `DB` must call `save()`**, then re-render the affected screen.
- There is no migration framework; be careful renaming/removing `DB` fields (existing users have saved data). New fields should default gracefully.
- Backup/restore is manual JSON export/import (`downloadFullBackup`, `doRestore`) — this is the only way to move data between devices, since `seedIfEmpty()` intentionally adds **no** sample data.

### Boot sequence

The last lines of the main script (around line 5625) run on load:

```
load(); seedIfEmpty(); save(); initUI();
loadLock(); // shows lock screen if a PIN is set
// ...then a dynamically-generated PWA manifest (uses the team logo as icon)
```

`initUI()` sets language, theme, font, default dates, starts the i18n observer,
and renders the attendance screen.

### Internationalization (i18n)

- `DICT` — a large object keyed by **Japanese source string** → `{en, fr, pt}`.
- The engine walks DOM text nodes and swaps text based on `LANG`; a `MutationObserver` re-scans on dynamic re-renders (`startI18nObserver`, `runI18nScan`, `applyI18n`).
- Japanese (`ja`) and any string missing from `DICT` are left untouched. **User data (names, memos, dates, amounts) is never translated** — only UI chrome in `DICT`.
- Legal pages (`terms.html`, `privacy.html`) are intentionally out of scope and stay Japanese.
- When you add visible UI text, add a `DICT` entry (with en/fr/pt) if it should localize; regressions here show up as untranslated Japanese in other languages.

### Match results & the import pipeline

- Coaches record bouts per student (individual and 団体戦 team matches), with round, result (○勝 / ▲負 / ×分), technique (決まり技), grip (右組/左組), opponent, etc. Pickers are driven by `matchPresets` and a Kodokan technique dictionary.
- **Import feature** (`parseImportText`, `openImportModal`, `renderImportBouts`, around line 3927): parents use `report.html` to produce a pipe/`｜`-delimited text and send it via LINE; the coach pastes it into "📋取り込み" and the parser turns lines into bout records with a preview before saving.

## Service worker & versioning (critical)

`sw.js` and `index.html` are **version-coupled**. Two constants must stay
identical:

- `sw.js` → `const VERSION = 'vNNN'` (line ~5)
- `index.html` → `const APP_VERSION = 'vNNN'` (line ~1831)

Caching policy in `sw.js`:
- **HTML / navigation requests: network-first** (falls back to cache offline).
- Everything else: cache-first.
- The SW **does not auto-update**. On a new version it waits and the app shows an update banner; the user taps "更新する" (`applyUpdate` → posts `SKIP_WAITING`) to activate. On activation, all caches except the current version are deleted.

**When you change `index.html` (or any cached file) in a way users should
receive, bump the version in BOTH `sw.js` and `index.html` together.** Shipping
new HTML without a version bump means returning users may keep a stale cache.

## Conventions

- **Vanilla everything.** No frameworks, no libraries, no `import`. New code should match the existing plain-DOM, `innerHTML`-rebuild style — don't introduce build tooling or dependencies.
- **Inline only.** CSS lives in the `<style>` block (CSS custom properties in `:root`, e.g. `--navy`, `--gold`, `--paper`); JS in the `<script>` block. `report.html` is self-contained the same way.
- **Escaping:** always wrap user-supplied strings with `esc()` before inserting into `innerHTML`. This is the app's only XSS guard.
- **Mutate → save → render:** every state change follows `DB.* = ...; save(); render*()`.
- **IDs:** `uid()` generates record ids (`Date.now()` + random suffix).
- **Money:** use `money(n)` for display (respects `DB.currency`; display-unit only, no FX conversion).
- **Japanese UI:** comments, labels, commit messages, and toasts are in Japanese. Keep new UI strings Japanese-first and add translations to `DICT`.
- **Mobile-first:** the app targets phones; use the existing `var(--fs)` font-scale pattern and large tap targets (min ~46–52px) for new controls.

## Git & commit conventions

- Commit messages are **Japanese**, typically: `vNNN 公開反映：<short description>` ("公開反映" = "reflected to the public build"). Version numbers increment per release and are mirrored in `sw.js` / `APP_VERSION`.
- The `main` branch is the published site. Historically, files were also uploaded directly ("Add files via upload").
- Follow the branch instructions given for the current task; do not push to `main` without explicit permission.

## Working checklist for changes to `index.html`

1. Make the change inline (HTML in the markup, CSS in `<style>`, JS in `<script>`).
2. Route any new state through `DB`, and call `save()` + the relevant `render*()`.
3. `esc()` all user data written to the DOM.
4. If you added user-visible chrome, add a `DICT` entry with en/fr/pt.
5. If the change should reach existing users, **bump the version in both `sw.js` and `index.html`**.
6. If `report.html`'s output format changes, keep `parseImportText` in `index.html` in sync (and vice versa).
7. Verify manually in a mobile-sized browser viewport — there are no automated tests.
