# DECISIONS-LOG.md
# Premium Journal App — Product & Architecture Decision Log
# Last updated: 2026-03-02
# Rule: every significant product, architecture, or design decision gets a row here.
# Purpose: prevents re-litigating settled questions. Single source of decision truth.

---

## HOW TO USE THIS FILE

When a decision is made — in a build session, brainstorm, or review — add it here immediately.
If a decision is revisited, update the status and add a note. Never delete old decisions.

**Status:**
- `LOCKED` — decided, not revisiting without strong reason
- `REVISIT` — decision made but known to need review at a future point
- `SUPERSEDED` — a later decision replaced this one

---

## PRODUCT PHILOSOPHY

| Decision | Choice | Date | Options Considered | Why | Trigger to Revisit | Status |
|---|---|---|---|---|---|---|
| Core philosophy | The Witness — app observes, never judges or instructs | Pre-A1 | Manager (tracks, nudges, rewards) vs Witness | Manager apps are common; Witness is rare and honest. Privacy-first requires it. | Never | `LOCKED` |
| Streak counters | Never build | Pre-A1 | Streaks / no streaks | Gamification. Turns journal into a compliance task. Violates Witness. | Never | `LOCKED` |
| AI reading entries | Never build | Pre-A1 | AI analysis / no AI analysis | The app must never read your journal. Privacy non-negotiable. | Never | `LOCKED` |
| Social features | Never build | Pre-A1 | Sharing / private only | Private by design. Sharing changes what people write. | Never | `LOCKED` |
| Telemetry | Zero, none, never | Pre-A1 | Analytics / no analytics | Privacy-first means no data leaves the device ever. | Never | `LOCKED` |
| Notifications | Never create urgency | Pre-A1 | Push notifications / calm only | Calm technology. Urgency is a manager move. | Never | `LOCKED` |
| Advertising | Never | Pre-A1 | Ad-supported / paid / free local | Violates trust completely. Obsidian model instead. | Never | `LOCKED` |

---

## STORAGE & ARCHITECTURE

| Decision | Choice | Date | Options Considered | Why | Trigger to Revisit | Status |
|---|---|---|---|---|---|---|
| Phase 1 storage | localStorage via abstracted db interface | A2 (2026-02-28) | localStorage / IndexedDB / SQLite | Simple, offline, no server. Abstraction layer means Phase 2 is a single-file swap. | Phase B start | `LOCKED` |
| Storage abstraction pattern | Single `db` object in `src/app/db/index.ts` | A2 (2026-02-28) | Per-feature utils / single interface | One file to swap in Phase B. Already proven with storage.ts, habits.ts, preferences.ts shims. | Never | `LOCKED` |
| Phase 2 storage | electron-store → encrypted local file | Pre-A1 | Cloud / local file / IndexedDB | Local-first. File is human-readable JSON. User owns it. | Phase B start | `LOCKED` |
| Export format | Human-readable JSON | Pre-A1 | JSON / CSV / proprietary | Open format. User can read it, back it up, import it anywhere. Permanence over convenience. | Never | `LOCKED` |
| Cross-platform builds | GitHub Actions CI | Pre-A1 | Manual builds / CI | Auto-builds on every push. Linux/Windows/Mac covered. | Never | `LOCKED` |

---

## NAVIGATION & LAYOUT

| Decision | Choice | Date | Options Considered | Why | Trigger to Revisit | Status |
|---|---|---|---|---|---|---|
| Default landing view | Timeline (heatmap) | A3b (2026-02-28) | Write view / Timeline | Timeline shows the emotional landscape. Write is one action. Landing on the map is more meaningful. | User feedback | `LOCKED` |
| Navigation pattern | Left sidebar, 3 groups | A2 (2026-02-28) | Top nav / sidebar / bottom nav | Screen space. Grouped sections reduce cognitive load. Collapsible for focus. | Phase B (desktop) | `LOCKED` |
| Entries / Archive / Calendar views | Removed, absorbed into Timeline | A3b (2026-02-28) | Keep separate / merge | Timeline drill-down covers all three. Fewer nav items = less cognitive load. | User feedback | `LOCKED` |

---

## WRITE EXPERIENCE

| Decision | Choice | Date | Options Considered | Why | Trigger to Revisit | Status |
|---|---|---|---|---|---|---|
| Write modes | Quick / Guided / Deep | A4 (2026-02-28) | Single mode / multiple modes | Different writing needs on different days. One size forces compromise. | User feedback | `LOCKED` |
| Closing moment | Full-screen overlay, new entries only | A4 (2026-02-28) | Toast / overlay / nothing | Editing doesn't deserve ceremony. Saving a new entry does. | User feedback | `REVISIT` |
| Mood position | Top of guided form, compact row | A6b-polish (2026-03-02) | Top (large) / bottom / top (compact) | Bottom risks mood never being set → heatmap starves. Compact row preserves capture without dominating. | User feedback | `LOCKED` |
| Mood labels | Visible only on selected state | A6b-polish (2026-03-02) | Always visible / selected only / never | Reduces visual noise. Emojis are self-explanatory after day one. | User feedback | `LOCKED` |
| Energy display | Bars only, no number labels | A6b-polish (2026-03-02) | Bars + numbers / bars only / dots | Numbers added cognitive weight. Bars read themselves. | User feedback | `LOCKED` |
| Prompt chips | Decided against | A5a (2026-03-01) | Chips above textareas / no chips | Chips created clutter before writing started. Manager move. Placeholders do the job quietly. | Never | `LOCKED` |
| Reflection type entry point | From Timeline drill-down only | A4b (2026-02-28) | Separate nav item / Timeline only | Reflections are period-based. Timeline context makes them natural. No standalone nav needed. | User feedback | `LOCKED` |

---

## TAGS

| Decision | Choice | Date | Options Considered | Why | Trigger to Revisit | Status |
|---|---|---|---|---|---|---|
| Tag normalisation | Lowercase, trim, deduplicate on every save | A6a (2026-03-02) | Normalise / don't normalise | Prevents "Work" and "work" becoming different tags. One function, three call sites. | Never | `LOCKED` |
| Tag filter entry point | DayView only | A6b (2026-03-02) | Search bar / tag cloud / DayView | Discovery-led. User reads entry, sees tag, wonders "when else did I write this?" Natural moment. | User feedback | `LOCKED` |
| Tag management screen | Not needed | A6a (2026-03-02) | Separate screen / inline only | Autocomplete in TagManager covers all use cases. A screen would add nav complexity for no gain. | User feedback | `LOCKED` |

---

## SEARCH

| Decision | Choice | Date | Options Considered | Why | Trigger to Revisit | Status |
|---|---|---|---|---|---|---|
| Search timing | Deferred until 30+ real entries | A6c brainstorm (2026-03-02) | Build now / defer | Building without knowing what you actually search for produces the wrong feature. | When 30+ entries exist | `REVISIT` |
| Search scope | Three problems: keyword / filtered browse / associative recall | A6c brainstorm (2026-03-02) | Keyword only | Keyword alone is insufficient at Day 365. All three problems must be acknowledged before building. | Build session | `LOCKED` |

---

## ERAS

| Decision | Choice | Date | Options Considered | Why | Trigger to Revisit | Status |
|---|---|---|---|---|---|---|
| Era deletion behaviour | Un-tags entries, never deletes them | Pre-A7a | Delete entries / un-tag only | Entries are permanent record. Eras are organisational. Deleting an era should never erase history. | Never | `LOCKED` |
| Era overlap | Warn, don't prevent | Pre-A7a | Prevent / warn / allow silently | Two eras can genuinely overlap in real life. "Working at startup" and "Living in London" coexist. | User feedback | `LOCKED` |
| Era colour palette | TBD — 6 warm colours, must not clash with mood system | A7a brainstorm (2026-03-02) | Various | Must coexist with amber/emerald/slate/blue/stone mood colours on heatmap. Decision pending. | A7a build session | `REVISIT` |
| Era assignment in Write | TBD — hybrid (auto if unambiguous, prompt if overlap) | A7a brainstorm (2026-03-02) | Manual / auto / hybrid | Hybrid is most Witness-appropriate. Build auto-only in A7a, overlap prompt in A7b. | A7a build session | `REVISIT` |

---

## PORTFOLIO & PROCESS

| Decision | Choice | Date | Options Considered | Why | Trigger to Revisit | Status |
|---|---|---|---|---|---|---|
| Development approach | AI-assisted, human-led | Pre-A1 | Fully manual / AI-led / human-led AI | Human makes all product decisions. AI executes and contributes thinking. Rare and demonstrable differentiator. | Never | `LOCKED` |
| Brainstorm-first rule | Every session with design decisions gets brainstorm before build | A6c/A7a (2026-03-02) | Build first / brainstorm first | Design decisions made mid-build cost more than decisions made before. Rework is expensive. | Never | `LOCKED` |
| Documentation strategy | Option B — two doc sprint sessions | Documentation sprint (2026-03-02) | Single session / two sessions / no docs | Scope must be locked before formal docs are written. Two sessions allows proper sequencing. | Never | `LOCKED` |
| Web-first before Electron | Validate visuals in browser before committing to desktop | Pre-A1 | Desktop first / web first | Faster iteration. Design decisions are cheaper to make before Electron wrapping. | Phase A complete | `LOCKED` |
