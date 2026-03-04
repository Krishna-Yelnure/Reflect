# BUILDLOG.md
# Journal App — Project Source of Truth
# Last updated: Doc Sprint Session 1 complete — BA-Document, V1-Scope, Witness-Philosophy, User-Journey, INDEX, DOCS-STATUS all current (2026-03-03)

---

## HOW TO USE THIS FILE

This file is the single source of truth for this project.
At the start of every new session, share this file + the project zip with Claude and say:
**"Read the BUILDLOG.md and continue from [SESSION NAME]."**
Update this file at the end of every session with what was done and what's next.

### BRAINSTORM-FIRST RULE (added A6c/A7a — 2026-03-02)

From A6c onward, every session has real design decisions — decisions that affect the product for years and are expensive to undo. Building without resolving them first produces inconsistent UX.

**The rule:** Every session with design decisions gets a brainstorm entry in the BUILDLOG *before* any code is written. The brainstorm documents:
- What decisions need to be made
- The options for each decision
- A recommendation where one exists
- The reasoning so future sessions don't re-litigate settled questions

**The test before opening any file:** Can you answer every decision question in the session spec? If no → brainstorm first. If yes → build.

This adds one conversation per session before the build session. It saves multiples of that time in rework.

---

## PROJECT VISION

A production-grade, privacy-first personal journaling app.
Built for one person now. Architected for thousands later.

**The core promise:**
> "Your journal is yours. We cannot read it even if we wanted to."

**Why this matters as a portfolio piece:**
- Demonstrates BA/PA thinking: requirements → decisions → architecture → roadmap
- Shows AI-assisted development done properly (human makes decisions, AI writes code)
- Real product used daily by the builder — not a toy project
- Privacy-first architecture is a genuine differentiator from Day One, Notion, Reflectly

---

## PRODUCT DECISIONS (locked in, do not revisit without reason)

| Decision | Choice | Why |
|---|---|---|
| Phase 1 target | Web app in browser | Validate visuals before committing to desktop |
| Phase 2 target | Electron desktop app | True install experience, real file storage |
| Data storage (Phase 1) | localStorage + export/import | Simple, works offline, no server needed |
| Data storage (Phase 2) | electron-store → encrypted local file | Permanent, survives browser clears, portable |
| Analytics engine | Local JavaScript only | No external service, fully offline, no installs |
| Telemetry | Zero, none, never | Privacy-first is non-negotiable |
| Cross-platform builds | GitHub Actions CI | Auto-builds Linux/Windows/Mac on every push |
| Linux format | AppImage | Download and double-click, no install needed |
| Windows format | .exe installer | Standard experience |
| Mac format | .dmg | Standard experience |
| Portfolio strategy | Demo video + case study write-up | Shows thinking, not just code |
| Future sync | End-to-end encrypted, optional | User owns encryption key, even dev can't read |
| Business model (future) | Free local app + optional paid sync | Obsidian model |

---

## TECH STACK

### Existing codebase (from Figma export zip)
- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 6
- **Styling:** Tailwind CSS v4
- **UI components:** Radix UI + shadcn/ui pattern
- **Design system:** MUI (Material UI) v7
- **Charts/visualisations:** Recharts
- **Animations:** Motion (Framer Motion v12)
- **Icons:** Lucide React
- **Drag and drop:** react-dnd
- **Calendar:** react-day-picker
- **Notifications:** Sonner (toast)
- **Date utils:** date-fns
- **Package manager:** npm (pnpm overrides in package.json but use npm)

### Added in Phase 1
- Export/import JSON (already partially exists in PrivacySettings)
- Abstracted storage layer (swap localStorage → file later without rewriting app)

### Added in Phase 2 (Electron)
- electron
- electron-builder (cross-platform installers)
- electron-store (persistent encrypted file storage)
- GitHub Actions workflow (.github/workflows/build.yml)

---

## CODEBASE STRUCTURE (existing zip)

```
premium_journal/
├── index.html                          # Entry point
├── package.json                        # Dependencies (heavy — 40+ packages)
├── vite.config.ts                      # Vite config with Tailwind plugin
├── postcss.config.mjs
├── src/
│   ├── main.tsx                        # React root mount
│   ├── styles/
│   │   ├── tailwind.css
│   │   ├── index.css
│   │   ├── fonts.css
│   │   └── theme.css
│   └── app/
│       ├── App.tsx                     # Main app — routing between views
│       ├── types.ts                    # All TypeScript interfaces
│       ├── components/
│       │   ├── JournalEntry.tsx        # Write view — main entry form
│       │   ├── EntriesList.tsx         # Browse all entries
│       │   ├── Insights.tsx            # Pattern insights
│       │   ├── MoodChart.tsx           # Mood over time (Recharts)
│       │   ├── CalendarView.tsx        # Calendar with entry indicators
│       │   ├── TagManager.tsx          # User-controlled tags/themes
│       │   ├── ReflectionModeSelector.tsx  # Daily/weekly/monthly/yearly
│       │   ├── MemorySurface.tsx       # Surface old related entries
│       │   ├── LanguageInsights.tsx    # Writing pattern analysis
│       │   ├── ReflectionAnchors.tsx   # Values, questions, intentions
│       │   ├── PrivacySettings.tsx     # Export/import/delete data
│       │   ├── ErasManager.tsx         # Life chapters/eras
│       │   ├── PersistentQuestions.tsx # Long-running questions
│       │   ├── MemoryThreads.tsx       # User-assembled entry collections
│       │   ├── ArchiveView.tsx         # Archive browsing
│       │   ├── WelcomeMessage.tsx      # First-time onboarding
│       │   ├── DataLegacy.tsx          # Data export for legacy/inheritance
│       │   ├── HabitBuilder.tsx        # Habit tracking (v3.1)
│       │   └── ui/                     # shadcn/ui components (30+ files)
│       └── utils/
│           ├── storage.ts              # localStorage CRUD for journal entries
│           ├── habits.ts               # localStorage CRUD for habits
│           ├── insights.ts             # Local pattern computation
│           ├── language-analysis.ts    # Writing analysis (local)
│           ├── memory-surface.ts       # Related entry surfacing
│           ├── export.ts               # Data export utilities
│           ├── eras.ts                 # Eras/chapters logic
│           ├── threads.ts              # Memory threads logic
│           ├── questions.ts            # Persistent questions logic
│           ├── preferences.ts          # User preferences
│           ├── prompts.ts              # Writing prompts v1
│           ├── prompts-v2.ts           # Writing prompts v2
│           └── longform.ts             # Long-form essay mode
```

### Navigation views in App.tsx (14 views total)
1. **write** — Main journal entry (PenLine icon)
2. **entries** — Browse all entries (BookOpen)
3. **archive** — Archive view (Archive)
4. **calendar** — Calendar with entry dots (Calendar)
5. **mood** — Mood chart over time (TrendingUp)
6. **insights** — Pattern insights (Lightbulb)
7. **language** — Language/writing analysis (MessageSquare)
8. **eras** — Life chapters (Layers)
9. **threads** — Memory threads (FileText)
10. **questions** — Persistent questions (HelpCircle)
11. **anchors** — Reflection anchors/values (Heart)
12. **habits** — Habit builder with 21-day (Target)
13. **privacy** — Export/import/settings (Shield)
14. **legacy** — Data legacy/inheritance (FileText)

### Current storage mechanism
All data in `localStorage` via these keys:
- `journal_entries` — all journal entries
- `journal_habits` — habit definitions
- `journal_gentle_starts` — 21-day gentle starts
- `journal_habit_engagements` — habit check-ins
- Various other keys for eras, threads, questions, preferences

### Key data types (from types.ts)
```typescript
JournalEntry {
  id, date, whatHappened, feelings, whatMatters,
  insight, freeWrite, mood, energy, tags,
  reflectionType, eraId, visibility, isLongForm,
  questionId, createdAt, updatedAt
}

Habit { id, name, why, isArchived, createdAt, updatedAt }
GentleStart { id, habitId, startDate, endDate, engagements, completed, createdAt }
HabitEngagement { id, habitId, date, note, createdAt }
```

### HabitBuilder design philosophy (important — do not change)
- "Container for exploration, not a tracker for compliance"
- No streaks, no performance metrics, no urgency language
- Missed days are neutral, returning is success
- Reflection always counts as engagement
- 21-day gentle start already exists in logic — needs visual upgrade

---

## PLANNED ADDITIONS / CHANGES

### 1. 21-Day Habit Starter Visualisation (NEW)
**What:** Visual progress display for the first 21 days of a habit
**Design spec:**
- 21-cell grid (3 rows × 7 cols, like a compact calendar)
- Each cell = one day. Filled = engaged. Empty = not yet / missed
- Day counter: "Day 8 of 21"
- Milestone markers at day 7, 14, 21
- At day 21: celebration state — "Habit explored. What did you learn?"
- Tone: warm and curious, never punishing
- If a day is missed: cell stays neutral (no red, no X)
- Already has backend logic in habits.ts (startGentleStart, getActiveGentleStart)
- Need to add the visual component to HabitBuilder.tsx

### 2. Storage Abstraction Layer (NEW)
**What:** Wrap all localStorage calls in a storage interface so Phase 2 (Electron) only requires changing one file
**Pattern:**
```typescript
// storage/index.ts — single import everywhere
export const db = {
  getEntries() { ... }
  saveEntries() { ... }
  // etc
}
// In Phase 2, swap implementation to electron-store, interface stays identical
```

### 3. Export/Import Hardening
**What:** Make sure all data (entries + habits + eras + threads + preferences) exports and imports as one complete JSON file
**Current state:** PrivacySettings.tsx has partial export — needs to be comprehensive

---

## BUILD PHASES & SESSIONS

### PHASE A — Web App (Browser)
*Goal: See it running, make it yours, get it exactly right before locking design*

---

#### SESSION A1 — Get It Running
**Status:** ✅ COMPLETE (2026-02-27)

**What was done:**
1. Unzipped project into `~/premium-journal`
2. `npm install` — 280 packages, clean install
3. `npm run dev` — app running at http://localhost:5173
4. All 14 views confirmed working, no errors
5. Write → Save → Entry confirmed saving to localStorage
6. GitHub private repo created: `git@github.com:Krishna-Yelnure/premium-journal.git`
7. SSH key configured (ed25519 with passphrase)
8. `.gitignore` added (node_modules, dist, .env)
9. node_modules removed from repo, clean push done

**Issues fixed:**
- node_modules accidentally in first push — fixed with `git rm -r --cached node_modules`

**Session checklist:**
- [x] All 14 views render
- [x] Write saves entry, appears in Entries view
- [x] GitHub repo connected and clean
- [x] .gitignore in place
- [x] BUILDLOG updated and pushed

---

#### SESSION A2 — Storage Abstraction + 21-Day Habit Visual + Sidebar Nav
**Status:** ✅ COMPLETE (2026-02-28)

**What was done:**
1. Created `src/app/db/index.ts` — unified storage abstraction layer
   - Single `db` object wraps ALL localStorage across entire app
   - Covers: entries, habits, gentleStarts, engagements, prefs, anchors, eras, threads, questions, longform
   - Full export/import — `db.backup.exportAll()` and `db.backup.importAll(json)`
   - In Phase 2 (Electron): only this file changes, nothing else
2. Updated `src/app/utils/storage.ts` → thin shim pointing to `db.entries`
3. Updated `src/app/utils/habits.ts` → thin shim pointing to `db.habits`, `db.gentleStarts`, `db.engagements`
4. Updated `src/app/utils/preferences.ts` → thin shim pointing to `db.prefs`, `db.anchors`
5. Created `src/app/components/GentleStartTracker.tsx` — new 21-day visual component
   - 3 rows × 7 cols grid
   - Day counter "Day X of 21"
   - Milestone dots at day 7, 14, 21
   - Warm celebration state at completion
   - Tone: curious, never punishing
6. Updated `src/app/components/HabitBuilder.tsx` — swapped old `GentleStartProgress` for new `GentleStartTracker`
7. Redesigned `src/app/App.tsx` — horizontal top nav → left sidebar
   - 4 grouped sections: Journal, Reflect, Explore, Settings
   - Collapsible to icon-only mode
   - Mobile slide-in drawer
   - Clean "Private. Secure. Always yours." footer

**Issues fixed:**
- `src/app/db/index.ts` initially named `db-index.ts` — renamed to `index.ts`

**Brainstorming completed this session:**
- Screen space: leave centred layout for now, revisit in A5
- Weekly/Monthly/Yearly reflection types: deferred to A4 — has ripple effects across 8 components
- Mood + energy visual options analysed — decision deferred to A3
- Design principles documented (see section below)
- Product vision and roadmap documented (see section below)

**Session checklist:**
- [x] Storage abstraction layer created and working
- [x] All existing imports still work via shims
- [x] 21-day habit grid rendering correctly
- [x] Sidebar navigation working on desktop and mobile
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

---

#### SESSION A3 — Mood & Energy Visual Upgrade
**Status:** ✅ COMPLETE (2026-02-28)

**What was done:**
1. Replaced flat mood pill buttons with large emoji cards — colour-washed selected state per mood (amber/green/neutral/blue/stone), scale + glow + ring on select, toggle to deselect
2. Replaced energy circles with vertical signal-bar meter — 5 bars grow in height left to right, amber/gold fill on selected, active level shown in amber below bar, ✕ to clear
3. All changes self-contained in JournalEntry.tsx — no other files touched

**Session checklist:**
- [x] Mood buttons feel premium and expressive
- [x] Each mood has a distinct colour wash
- [x] Energy meter reads like a signal strength bar
- [x] Toggle behaviour on both mood and energy
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

---

#### SESSION A3b — Timeline/Heatmap Emotional Landscape
**Status:** ✅ COMPLETE (2026-02-28)

**What was done:**
1. Created `src/app/components/TimelineView.tsx` — new central navigation component
   - Year heatmap: 12 months × daily dots, mood-coloured per BUILDLOG spec
   - Drill-down: year → month → week → day with breadcrumb nav (click any level to jump directly)
   - Year selector sidebar on right — newest year first, mood dot per inactive year
   - Empty cells = quiet `bg-slate-100`, peaceful not alarming — Witness philosophy
   - Month label click → month view. Week number click → week view. Day dot → day view or Write
   - Day view: full read mode with mood/energy bar, all fields, Edit button
   - Week view: vertical timeline dots connected by line, day cards with entry preview
   - Month view: full calendar grid with mood-coloured day tiles
2. Updated `src/app/App.tsx`
   - Default landing view: `write` → `timeline`
   - Sidebar: 14 items → 11 items in 3 groups (Today / Understand / Explore)
   - Entries, Archive, Calendar removed from router — absorbed into Timeline
   - After save → Timeline. Cancel → Timeline
3. Decisions made during session:
   - Tab bar (Daily/Weekly/Monthly/Yearly filter) built then removed — premature, A4b handles this
   - Year prev/next arrows → year selector sidebar per BUILDLOG ASCII spec
   - reflectionType filtering deferred to A4b when Write actually creates those entry types

**Session checklist:**
- [x] Year heatmap renders with mood colours
- [x] Drill-down navigation correct at all levels
- [x] Breadcrumb shows correct path, clickable at each segment
- [x] Year selector sidebar matches BUILDLOG spec
- [x] Empty states are invitations, not voids
- [x] Witness philosophy — calm, no urgency, no judgement
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

---

#### SESSION A4 — Write Section Redesign
**Status:** ✅ COMPLETE (2026-02-28)

**What was done:**
1. Replaced single-mode Write form with three-mode architecture — Mode switcher (Quick / Guided / Deep) lives in the header
2. **Mode 1 — Quick Capture:** Mood picker + single textarea. 30-second entry. Still counts, still saves with closing moment.
3. **Mode 2 — Guided Entry (default):** All existing fields preserved. Upgraded with contextual prompt strip (see below). ReflectionModeSelector removed per spec.
4. **Mode 3 — Deep Write (longform):** Full-screen takeover. Distraction-free. Title field + open canvas textarea. Sets `isLongForm: true` on entry. Back button returns to Guided without losing content.
5. **`ContextualPrompt` component:** Single strip above mood/energy. Priority order: year-ago memory > continuity prompt > daily rotating prompt. Never shows more than one.
6. **`getContinuityPrompt()`:** Looks for yesterday's entry. Pulls most meaningful snippet (whatHappened > whatMatters > insight > freeWrite). Surfaces as *"Yesterday you wrote: '…' — how did it unfold?"*
7. **`getOneYearAgoEntry()`:** Searches ±3 days around exactly one year ago. If found, renders amber "A year ago" card with snippet and *Read that entry* link → calls `onViewEntry()`.
8. **`ClosingMoment` component:** Full-screen white overlay after saving a new entry. Shows quiet date + one rotating line from `closingLines[]` + expanding underline animation. Auto-dismisses at 2.8s or on click. Does NOT fire for edits — those get a toast instead.
9. **Unsaved changes guard:** Tracks `hasUnsavedChanges` boolean. Cancel button triggers `window.confirm` if form is dirty. Addresses 🔴 Critical edge case from risk register.
10. **`ReflectionModeSelector` removed:** Import and usage deleted. Reflection types (weekly/monthly/yearly) now belong exclusively to Timeline drill-down — implemented in A4b.

**Decisions made during session:**
- `ContextualPrompt` uses strict priority (year-ago > continuity > daily) to avoid overwhelming the user — one signal at a time
- Year-ago search uses ±3 day window to account for irregular writing habits without surfacing irrelevant entries
- Closing moment only fires for new entries, not updates — editing doesn't deserve ceremony, saving a new entry does
- `isLongForm` field already existed in `types.ts` — no schema change needed
- `prompts-v2.ts` (reflection prompts) not used in Write — those belong to A4b when reflection entry types are wired to Timeline

**Issues encountered:** None — clean implementation, no ripple effects outside JournalEntry.tsx

**Session checklist:**
- [x] Mode switcher renders correctly in all three modes
- [x] Quick Capture saves with closing moment
- [x] Guided mode shows contextual prompt strip (tested with/without prior entries)
- [x] Deep Write is full-screen, distraction-free, title + canvas
- [x] Year-ago memory surfaces when prior year entry exists
- [x] Continuity prompt surfaces when yesterday entry exists
- [x] Daily rotating prompt shown when no contextual prompts apply
- [x] Closing moment fires for new entries, toast for updates
- [x] Unsaved changes guard works on Cancel
- [x] ReflectionModeSelector fully removed
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

---

#### SESSION A4b — Weekly/Monthly/Yearly Reflection Types via Timeline
**Status:** ✅ COMPLETE (2026-02-28)

**What was done:**
1. Synthetic date keys for reflection entries — never collide with daily entries:
   - Weekly: `reflection-weekly-YYYY-MM-DD`, Monthly: `reflection-monthly-YYYY-MM`, Yearly: `reflection-yearly-YYYY`
2. `onReflectionEntry(date, type)` prop on TimelineView — routes from Timeline into Write with correct type
3. `findReflectionEntry()` helper + `ReflectionDot` component (violet/sky/rose per type)
4. Timeline reflection banners in Month and Week views — "+ Write" when empty, "written — edit" when exists
5. Reflection dots on month labels, week numbers, year sidebar
6. DayView badge for non-daily entries
7. `JournalEntry`: `initialReflectionType` prop, `REFLECTION_META` (custom labels/placeholders per type), `formatEntryDate()` helper for synthetic keys, reflection prompt from `prompts-v2.ts`, continuity/year-ago suppressed for reflection entries
8. `App.tsx`: `pendingReflectionType` state + `handleReflectionEntry()` handler wired
9. Bug fix: curly apostrophes in single-quoted strings (5 strings switched to double quotes)

---

#### SESSION A4c — Reflection Panels + Intentions Loop
**Status:** ✅ COMPLETE (2026-03-01) — including fix sessions A4c-fix through A4c-fix4

**What was done:**
1. `types.ts` — added `intention?: string` to `JournalEntry`
2. `TimelineView.tsx` — `ReflectionPanel` replaces banners — full text, mood, date, Edit button. Intention shown at top as through-line. Empty state: invitation to write.
3. `JournalEntry.tsx` — intention field at bottom of reflection forms. `getPreviousPeriodIntention()` surfaces last period's intention as opening prompt.

**Fix sessions:**
- **A4c-fix** — Yearly dot colour corrected. ReflectionPanel only renders when entry exists. Mood/energy removed from reflection entries.
- **A4c-fix2** — Stats scoped to correct level. Blank screen bug fixed. Intention labels refined per type.
- **A4c-fix3** — Dynamic level-aware sidebar (year=years, month=months+dots, week/day=7-day strip). "Written, no mood" dashed ring dot state. ReflectionPanel layout inverted — intention at top, content below. BelowHeatmap reordered.
- **A4c-fix4** — ReflectionPanel moved below calendar grid. Duplicate intention block removed. Dashed ring applied to month grid cells for no-mood entries.

**Files changed:** `src/app/components/TimelineView.tsx`, `src/app/types.ts`, `src/app/components/JournalEntry.tsx`

---

#### SESSION A4d — First-Run Empty State + Below-Heatmap Space
**Status:** ✅ COMPLETE (2026-03-01)

**Goal:** Fix the void that new users land on. Fill the space below the heatmap with content that serves the Witness philosophy.

**What was done:**

**Part 1 — First-run empty state (TimelineView.tsx + JournalEntry.tsx)**

1. **`WelcomeCard`** — rendered above heatmap when `dailyEntries.length === 0` AND `journal_first_visit_dismissed` is not set. Amber-tinted card, warm copy, single CTA "Write today's entry →", soft "Got it" dismiss. Animates in/out via `AnimatePresence`. Disappears automatically once `hasEntries` becomes true.

2. **Today's cell pulse** — when `hasEntries === false`, today's dot gets `ring-2 ring-amber-400 animate-pulse` instead of the regular subtle grey ring. Stops pulsing the moment any entry exists.

3. **First-entry special closing moment** — `JournalEntry.tsx` now checks `allEntries.filter(non-reflection).length === 0` at save time. If true, closing moment shows *"Your first entry. The map has begun."* instead of the rotating `closingLines[]` pool. One-time only by nature.

**Part 2 — Below-heatmap section (BelowHeatmap component in TimelineView.tsx)**

- **Feature A** — Daily opening prompt from `prompts.ts` pool. Auto-fades after 6 seconds. Click to dismiss early. `last_prompt_shown_date` in localStorage ensures once-per-day only.
- **Feature B** — Active intention surface. Reads `activeIntention` prop passed from `App.tsx`. Absent when no intention — section simply doesn't render. Ready for A4c to populate.
- **Feature C** — Year-in-numbers. *"2026 · 28 entries · A mostly good year so far"*. Witness-compliant mood phrases (low/difficult → *"A tender year so far"*). Zero-entry state: *"Your story is just beginning."* Never surfaces negative tallies.

**summaryLine() fixed** — removed hard day count entirely. Witness-compliant language throughout. Zero-entry state returns `''` (WelcomeCard owns that space now).

**App.tsx updated:**
- `activeIntention` computed after `loadEntries()` — finds newest weekly/monthly reflection with an `intention` field, returns `undefined` cleanly until A4c is built
- Passed to `<TimelineView activeIntention={activeIntention} />`

**localStorage keys added this session:**
- `journal_first_visit_dismissed` — WelcomeCard dismiss state
- `last_prompt_shown_date` — daily prompt once-per-day gate

**Issues encountered:** None — all changes self-contained in three files.

**Session checklist:**
- [x] WelcomeCard appears for new users, dismisses correctly, disappears after first entry
- [x] Today's cell pulses amber when no entries, stops after first save
- [x] First-entry closing moment shows special line, not from rotating pool
- [x] Daily prompt fades after 6s, once per day only
- [x] Intention surface renders when data exists, absent when not
- [x] Year-in-numbers uses Witness-compliant language — no hard day counts, no negative tallies
- [x] summaryLine() no longer shows "No entries yet." or hard day counts
- [x] App.tsx passes activeIntention to TimelineView
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

**Files changed:**
- `src/app/components/TimelineView.tsx`
- `src/app/components/JournalEntry.tsx`
- `src/app/App.tsx`

---

#### SESSION A5a — Write + Form Polish
**Status:** ✅ COMPLETE (2026-03-01)
**Files changed:** `src/app/components/JournalEntry.tsx`, `src/app/types.ts`

**What was done:**

1. **`types.ts`** — added `oneWord?: string` to `JournalEntry`. Past-facing closing word for reflection entries.

2. **Closing lines copy audit** — all lines pass Witness test. Removed `"The witness remembers."` (self-referential — the app shouldn't name itself). Added `"The story continues."` and `"Here. Now. Remembered."`.

3. **Staggered entrance animations** — all guided form sections animate in sequence:
   - Header → 0.05s, contextual prompt → 0.12s, mood & energy → 0.18s
   - Each writing field → 0.05s × index (cascades 0 → 0.20s)
   - Intention → 0.3s, one-word field → 0.4s, tags → 0.35s, actions → 0.4s

4. **One-word closing field** — reflection entries only (weekly/monthly/yearly), never daily. Sits after the intention field — past-facing after the forward-looking field. Renders as borderless input with bottom border only (feels like a signature). Single-word enforced (strips after first space).
   - Weekly: *"A word for how this week felt"* — placeholder: *"Unsettled. Warm. Alive. Yours."*
   - Monthly: *"A word for how this month felt"* — placeholder: *"Heavy. Hopeful. Shifting. Yours."*
   - Yearly: *"A word for this year"* — placeholder: *"Becoming. Surviving. Opening. Yours."*
   - Helper text: *"Past-facing. Observational. No right answer."*

5. **Prompt chips — built and removed.** Chips were added (soft pill buttons above each textarea as optional nudges) then removed after visual review. They created clutter and cognitive weight before writing had started — a manager move. Placeholders already do the job quietly. Chips are not the right pattern for this product.

**Session checklist:**
- [x] `oneWord` in types.ts
- [x] Closing lines audited — all pass Witness test
- [x] Staggered animations on all guided form sections
- [x] One-word field on weekly/monthly/yearly, absent on daily
- [x] Prompt chips built, reviewed, and removed — decision locked: placeholders are sufficient
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

---

#### SESSION A4e — Deep Write Enhancements
**Status:** ✅ COMPLETE (2026-03-02)
**Depends on:** A4 ✅
**Scope creep risk:** Low

**Goal:** Enhance Deep Write with features that serve the writer without adding UI clutter.

**Features considered and decisions made:**
| Feature | Decision | Reason |
|---|---|---|
| Silent markdown support | ✅ Added (renders in DayView) | Writer writes naturally, reads back beautifully — zero UI change |
| Word count | ✅ Added | Quiet, passive, fades in once writing starts — no target, no pressure |
| Typewriter scroll | ✅ Added | Active line stays centred — reduces fatigue in long sessions, zero UI |
| Auto-save indicator | ❌ Not added | Already auto-saves silently — indicator would introduce anxiety not remove it |
| Time in session | ❌ Not added | No purpose in Witness-philosophy app — would feel like a manager clocking you |
| Focus mode (dim surrounding text) | ❌ Not added | Competing visual element — blank page is already the focus mode |

**What was built:**

1. **Word count** — `countWords()` helper counts whitespace-split tokens. Renders bottom-right as `{n} words` in `var(--font-mono)` at `text-slate-300`. Fades in via `AnimatePresence` once word count > 0. Fixed position, `pointer-events-none` — never interferes with writing. No target, no colouring, no celebration at any threshold.

2. **Typewriter scroll** — Container uses `scroll-padding-top: 40vh` + `overflow-y-auto`. Canvas has `padding-top: 20vh` and `padding-bottom: 50vh` so the writing area always sits in the upper-middle of the viewport. On `Enter` keydown, `scrollIntoView({ block: 'center' })` fires on the next animation frame to keep the caret centred. Smooth, invisible, no UI.

3. **Amber caret** — `caretColor: #f59e0b` on the Deep Write textarea. The one moment amber earns its place in the writing experience — a quiet signal that this space is yours.

4. **Display font in Deep Write title** — Title input uses `var(--font-display)` (Cormorant Garamond). The chapter heading feels like it belongs in a book.

5. **Display font consistency** — Applied `var(--font-display)` to:
   - Deep Write title input
   - Guided mode date heading (h1)
   - Quick mode date heading (h1)
   - ClosingMoment line — the one place it matters most

**Session checklist:**
- [x] Word count renders quietly, fades in, never shows 0
- [x] Typewriter scroll keeps caret in upper-centre of viewport
- [x] Amber caret in Deep Write textarea
- [x] Display font on all date headings and closing moment
- [x] No new UI elements visible until writing starts
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

**Files changed:**
- `src/app/components/JournalEntry.tsx`

---

#### SESSION A5b — Timeline + Global Polish
**Status:** ✅ COMPLETE (2026-03-02)
**Depends on:** A5a ✅
**Scope creep risk:** Low

**Goal:** Polish the Timeline experience and unify the global design language.

**Checklist:**
- [ ] Typographic hierarchy — stronger heading font, lighter body. Audit `fonts.css` and `theme.css`
- [ ] Mood language audit across ALL stat surfaces — every mood data reflection passes the copy test
- [ ] Hard day counts NEVER shown anywhere — audit every instance in TimelineView.tsx
- [ ] Empty states review across all views — open door copy, not a void
- [ ] Consistent visual language — border radius, shadow, colour logic unified across all components
- [ ] Microinteractions: save, delete, mood select — intentional, warm, satisfying
- [ ] Purposeful accent colour — amber/gold applied consistently as the one accent

**Files:** `src/app/components/TimelineView.tsx`, `src/styles/fonts.css`, `src/styles/theme.css`, multiple components

---

#### SESSION A6a — Tag Infrastructure
**Status:** ✅ COMPLETE (2026-03-02)
**Depends on:** A5 done
**Scope creep risk:** Low

**Goal:** Make tags clean, consistent, and queryable. The foundation every other feature depends on.

**What was done:**

1. **`db/index.ts` — `normaliseTags()` helper** — lowercase, trim, deduplicate, remove empties. Applied in `entries.add()` and `entries.update()` so every save is clean. Also applied in `backup.importAll()` so imported historical JSON gets cleaned on the way in. One function, three call sites, covers all paths.

2. **`TagManager.tsx` — full rewrite** — replaced the two-step "Add tag" button flow with an inline input field embedded directly in the tag pill row:
   - Type to filter existing tags — dropdown appears with up to 6 matches
   - Press Enter or comma to add a new tag
   - Press Backspace on empty input to remove the last tag
   - Click any suggestion to add instantly
   - `onMouseDown` (not `onClick`) on suggestions prevents input blur before selection fires
   - Escape clears input and dismisses dropdown
   - Helper text appears on focus only — not always visible
   - Tags render as compact pills with × button inline
   - Zero dependency on `Button`, `Input`, `Badge` shadcn components — self-contained

3. **`JournalEntry.tsx`** — removed unused `isSameDay` import. No other changes needed — TagManager interface is backwards-compatible.

**Decision confirmed:** TagManager was never a standalone nav item — it was always used inline in JournalEntry. No nav change needed. A separate management screen is not needed — autocomplete covers all use cases.

**Session checklist:**
- [x] Tags normalised on save (add + update)
- [x] Tags normalised on import
- [x] Autocomplete surfaces existing tags while typing
- [x] Enter / comma to add new tag
- [x] Backspace to remove last tag
- [x] No extra clicks — one field, inline experience
- [x] `isSameDay` unused import removed from JournalEntry
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

**Files changed:**
- `src/app/db/index.ts`
- `src/app/components/TagManager.tsx`
- `src/app/components/JournalEntry.tsx`

---

#### SESSION A6b — Tag Navigation
**Status:** ✅ COMPLETE (2026-03-02)
**Depends on:** A6a ✅

**Goal:** Tags become navigable. Click a tag anywhere → filtered Timeline view.

**What was done:**

1. **`activeTagFilter: string | null` state** — added to `TimelineView`. Entirely internal — no `App.tsx` changes, no prop drilling.

2. **`TagFilterStrip` component** — renders just below `YearNav` at all drill levels when a filter is active. Active tag shown as a dark pill with × to dismiss. Plain "clear" text link as secondary dismiss target. `AnimatePresence` enter/exit animation.

3. **Heatmap fading (year view)** — cells whose entry doesn't include the active tag fade to `opacity-20`. Tagged entries stay at full colour. Shape of the full year stays visible. Days with no entry unaffected.

4. **MonthView fading** — in-month cells without the tag fade to `opacity-20`. Out-of-month cells already at `opacity-20` — unchanged.

5. **WeekView fading** — entire day rows (dot + card) fade to `opacity-25` when unmatched.

6. **DayView tag pills → clickable** — changed from `<span>` to `<button>`. Clicking a tag sets the filter and navigates back to year view so the filtered heatmap is immediately visible. Clicking the active tag again clears it (toggle). Active tag gets `bg-slate-900 text-white` so it's clear which filter is live. Tooltip says "Filter by X" or "Clear filter".

**Decision confirmed:** Filter entry point is DayView only — the natural discovery moment. User reads an entry, sees a tag, wonders "when else did I write about this?" — that question has an immediate answer. No other entry points built. Witness-led, not search-led.

**Session checklist:**
- [x] `activeTagFilter` state in TimelineView
- [x] TagFilterStrip visible at all drill levels when filter active
- [x] TagFilterStrip absent when no filter
- [x] Heatmap cells fade when unmatched
- [x] MonthView cells fade when unmatched
- [x] WeekView rows fade when unmatched
- [x] DayView tag pills clickable — sets filter + returns to year view
- [x] Toggle: clicking active tag clears filter
- [x] App.tsx untouched
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

**Files changed:**
- `src/app/components/TimelineView.tsx`

---

#### SESSION A6b-polish — Mood & Energy Compact Redesign
**Status:** ✅ COMPLETE (2026-03-02)
**Depends on:** A6b ✅

**What prompted this:** Screenshot review showed mood cards + energy bars consuming ~220px of vertical space before writing begins. Two full labelled sections pushing writing fields off-screen. Design critique: mood is metadata, not the point — the writing is the point.

**Decision process:**
- Bottom placement rejected — risks mood data going uncaptured, heatmap starves of colour. The heatmap is the emotional backbone of the entire product. Moving mood to the bottom means users finish writing, feel done, hit Save, and never set it.
- Expandable/collapsed rejected — extra interaction step, inconsistent capture
- Compact single row chosen — same position, ~40px total height, nothing removed, data still captured reliably

**What was done:**

1. **Mood — 5 compact emoji buttons** — removed large cards (`px-4 pt-4 pb-3`, `text-3xl`, border, shadow, scale). Now tight pill row: unselected = emoji only (`text-lg`, minimal padding, `hover:bg-slate-100`). Selected = emoji grows to `text-xl` + label animates in with `width: auto` slide. Colour-wash background pill on selected. All expressiveness preserved at a fraction of the height.

2. **Energy — bars only, zero labels** — removed all number labels (always-visible, hover, and active states). Bars slightly smaller (`w-3.5`, max 28px height vs old 42px). `✕` clear still appears when set. No section label above. Bars read themselves after day one.

3. **Single row layout** — mood buttons + thin vertical divider + energy bars all on one `flex items-center` row. `~36–40px` total height. Writing fields begin immediately below. No `space-y-8`, no separate section per control.

**Principle confirmed:** Mood + energy are closing punctuation on an entry, not a gate before writing. Making them small honours that without sacrificing data capture.

**Session checklist:**
- [x] Mood fits in one compact row, no cards
- [x] Label only appears on selected mood, animates in cleanly
- [x] Energy bars only — zero number labels anywhere
- [x] Both controls on single line with divider
- [x] Writing fields immediately visible on load
- [x] Mood data still captures reliably (visible, easy to tap)
- [x] Committed and pushed to GitHub
- [x] BUILDLOG updated

**Files changed:**
- `src/app/components/JournalEntry.tsx`

---

#### SESSION A6c — Search
**Status:** NOT STARTED — BRAINSTORM COMPLETE, DEFERRED (build when 30+ real entries exist)
**Depends on:** A6a
**Scope creep risk:** Medium → High if not carefully scoped

**Goal:** Full-text search across all entries. Important feature — existential at Day 365.

---

**Brainstorm completed (2026-03-02) — do not skip this section before building**

**The core insight:** A journal is not a database. People rarely remember the exact word they used. They remember the feeling, the person, the rough time period. Search in a journal is fundamentally different from search in a document or a codebase.

**Search is actually three separate problems:**

1. **Keyword lookup** — find entries containing this exact word or phrase. Simple, buildable, limited. This is what the original spec described.

2. **Filtered browse** — show me entries from a date range where mood was low and tag was "work." More useful than keyword alone. Needs UI for combined filters.

3. **Associative recall** — help me find something I only vaguely remember. Hard. Requires either semantic/AI search (violates privacy principle — the app must never read entries) or a well-designed browse experience that makes 1+2 good enough together.

**The Witness constraint:** AI reading entries is permanently off the table. Option 3 must be solved through excellent browse (options 1+2 combined), not through intelligence.

---

**Every edge case that must be handled:**

**Word mismatch** — user searches "happy", entry says "content" or "at peace." Exact match returns nothing. User concludes they never wrote about happiness. This is a false negative and misrepresents their own history back to them. Decision needed: accept this limitation and be honest about it in the UI, or implement basic fuzzy/stem matching.

**Too many results** — user searches "work", 200 entries match. Result list is useless. Needs narrowing by date range, mood, tag, or reflection type. Without filters, keyword search on a large journal is nearly worthless for common words.

**Nothing found** — two different situations:
- Word not found anywhere → they may never have written about this
- Word not found but topic exists under different language → false negative
The UI cannot know the difference. Response must leave the door open, never feel like failure.

**Partial memory** — user remembers "it was around summer, I felt low, something about a decision" but has no specific word. Pure text search cannot help. This is a browse problem, not a search problem. Filters solve this better than a search box.

**Private language** — journals use personal shorthand, nicknames, abbreviations. Search must work with the user's actual language, not normalised language.

**Recency bias** — results must always show date. Temporal context is never optional in a journal.

---

**Empty state and copy decisions:**

**Search input blank (opening state):**
Not a failure — an invitation. Avoid "Search your journal" (generic). Consider: *"What are you looking for?"* — simple, human. Or quieter: *"Every word you've written is here."*

**No results found:**
Never say "No results found." Options:
- *"Nothing here for that. The words might live under a different name."*
- *"You haven't written about this yet."* — honest, not harsh
- Best version turns dead end into invitation: *"Nothing found. Want to write about it now?"* — the app stays a witness, not a search engine

**Snippet highlighting:**
Showing the matched word in context (one sentence, matched word bold or amber) so the user can see *why* an entry matched without opening it. Reduces cognitive load at scale (50+ results). Risk: fragments of private writing displayed in a clinical list can feel cold — tone of the snippet display matters as much as the highlighting itself. Decision: include it but keep the snippet short (one sentence max), no aggressive highlighting — subtle amber underline rather than bold.

---

**Build decision:**

Do not build A6c until you have 30+ real entries and feel the absence of search yourself. The right time to build it is when you open the app, want to find something specific, and can't. That moment will tell you exactly what to build. Building it now means building for a hypothetical user, not a real one.

**When ready to build, build in this order:**
1. Keyword search across all 6 text fields + tags — results list with date + snippet
2. Add mood filter + date range filter alongside the search input
3. Add tag filter (integrates with A6b tag infrastructure)
4. Empty states and no-results copy — last, because you'll know what feels right after using it

**Files when ready:** New `src/app/components/SearchView.tsx`, `src/app/App.tsx`

---

#### SESSION A7a — Era Management ← START HERE NEXT
**Status:** NOT STARTED — BRAINSTORM COMPLETE, DECISIONS NEEDED BEFORE BUILDING
**Depends on:** A6a ✅
**Scope creep risk:** Low
**Estimated build time:** 2–3 hours once decisions are made upfront

**Goal:** Redesign ErasManager to current design language. Data model solid before surfaces are built.

---

**Brainstorm completed (2026-03-02) — resolve all decisions before opening a file**

**Current state assessment:**

`eras.ts` — solid foundation. Clean CRUD, correct data model, good structure. Not a rewrite — needs a thin shim to point `erasStorage` → `db.eras`, identical pattern to `storage.ts` in A2. 15 minutes of mechanical work.

`ErasManager.tsx` — functional bones, wrong skin. Form logic works, inline editing works, list renders. But built with unstyled shadcn defaults (`Card`, generic `Input`, `Textarea`, `Button`) — looks like a settings panel, not a warm personal product. Needs redesign, not rewrite.

---

**The five decisions that must be made before building:**

**Decision 1 — Era colour palette**
Current palette has 7 colours including red (`#ef4444`) and generic grey (`#64748b`). Both will clash with the mood colour system on the heatmap in A7b (mood uses amber, emerald, slate, blue, stone). Need 6 warm colours that are visually distinct from each other AND from the mood system, so when era bands appear behind mood dots in A7b, nothing fights.

Candidate palette to discuss:
- Terracotta `#c2714f` — warm earth, nothing like mood colours
- Sage `#7c9a7e` — muted green, distinct from emerald
- Dusty rose `#b87d8a` — warm, distinct from all mood colours
- Warm indigo `#6b6fa8` — distinct from blue mood
- Ochre `#c49a3c` — warm gold, adjacent to amber but distinct enough
- Slate violet `#7c6f8a` — muted purple, nothing in the mood system

*Decision needed: approve this palette or propose alternatives.*

**Decision 2 — Era assignment in the Write view**
`JournalEntry.tsx` is listed as a file to change. Entries already have an `eraId` field in types but no UI to set it. Three options:

- **Manual** — quiet dropdown of active eras near the tags field. User picks one. Simple, explicit, adds a small decision to every entry.
- **Auto by date** — on save, find which era(s) the entry date falls within, assign automatically. Zero friction. Problem: what if eras overlap?
- **Hybrid** — auto-assign if unambiguous (one era covers this date), show quiet prompt if ambiguous (multiple eras overlap this date), show nothing if no eras exist. Most Witness-appropriate. Most complex.

*Decision needed: which model. Recommendation is Hybrid — but only build the auto-assign part in A7a, leave the ambiguous-overlap prompt for A7b when eras are visible in the timeline.*

**Decision 3 — Overlap warning style**
Currently no overlap detection exists. Spec says warn, don't prevent. When user sets a date range that overlaps an existing era, what happens?

Options:
- **Inline under date fields** — quiet text appears below the date inputs: *"This overlaps with 'Early Career' — that's fine if both feel true."* Non-blocking, contextual, Witness-appropriate.
- **Toast on save** — fires after creation. Less immediate but less cluttered.
- **Defer to A7b** — overlapping eras only become a visual problem when rendered on the heatmap. Could argue the warning belongs there, not here.

*Decision needed: inline warning is recommended — it's the least manager-like of the three.*

**Decision 4 — Delete confirmation**
Currently delete fires immediately with no confirmation. Deleting an era is significant — it un-tags potentially hundreds of entries. Options:

- **Inline confirm** — clicking delete changes the button to "Are you sure? Yes / No" inline in the card. No modal, no interruption, one extra click.
- **Confirm dialog** — modal appears. More disruptive but harder to misfire.
- **Soft delete with undo** — era disappears, toast appears with "Undo" for 5 seconds. Most elegant but more complex.

*Decision needed: inline confirm is recommended — consistent with the app's calm, non-alarming philosophy.*

**Decision 5 — Empty state and copy**
Current empty state: *"No life chapters defined yet. Create one to organize your journey."* — generic, not Witness voice.

Needs to feel like an open door, not a void. Draft:
> *"Your story has chapters even if they haven't been named yet."*
> [Create your first era →]

The "About Life Chapters" info box at the bottom also needs to be either removed or absorbed into the empty state — it's old design language.

*Decision needed: approve copy or suggest alternatives.*

---

**Build order when ready:**

1. `eras.ts` shim → `db.eras` (15 min, mechanical)
2. Era colour palette finalised and documented
3. `ErasManager.tsx` redesign — form, list, empty state, all to current design language
4. Delete with inline confirmation + un-tag entries on delete
5. Overlap detection + inline warning
6. `JournalEntry.tsx` — auto-assign era by date (simple path first)

**Files:** `src/app/components/ErasManager.tsx`, `src/app/utils/eras.ts`, `src/app/components/JournalEntry.tsx`

---

#### SESSION A7b — Era Surfaces
**Status:** NOT STARTED
**Depends on:** A6b + A7a
**Scope creep risk:** High

**Goal:** Eras become visible across the Timeline. Life chapters rendered in colour on the emotional landscape.

**What to build:**
- Era overlay on heatmap — background band behind dots, doesn't conflict with mood colours
- Era legend below heatmap
- Era label in month/week/day views — quiet "Chapter: [name]"
- Era transition — week an era changes is quietly noted
- Era filter — shares filter state infrastructure from A6b
- Multi-year eras — band spans correctly across year boundaries

**Files:** `src/app/components/TimelineView.tsx`, `src/app/components/ErasManager.tsx`

---

#### SESSION A8a — Inner Compass: Data Model + Values
**Status:** NOT STARTED
**Depends on:** A5 done
**Scope creep risk:** Low

**Goal:** Merge Anchors + Questions into one coherent screen. Values tab built and surfaced in Write.

**What to build:**
- Rename sidebar: `anchors` → `inner-compass`
- Merge `ReflectionAnchors.tsx` + `PersistentQuestions.tsx` into new `InnerCompass.tsx`
- Two-tab layout: **Values** and **Questions**
- Values tab: add/edit/delete, drag-to-reorder
- Values in Write — quiet context line: *"Your values: Clarity · Family · Craft"*

**Witness test:** Values never scored, checked off, or tracked. Held present, not evaluated.

**Files:** New `InnerCompass.tsx`, `App.tsx`, `JournalEntry.tsx`, `preferences.ts`

---

#### SESSION A8b — Inner Compass: Questions
**Status:** NOT STARTED
**Depends on:** A8a
**Scope creep risk:** Medium

**What to build:**
- Questions tab: add, open/closed state, entry count, created date
- Question surfaced in Write — opt-in: *"Open question: [X] — does today's entry relate?"*
- `questionId` wired in JournalEntry.tsx
- Question thread view — chronological read of all tagged entries
- `questions.ts` db abstraction audit

**Files:** `InnerCompass.tsx`, `JournalEntry.tsx`, `questions.ts`

---

#### SESSION A8c — Inner Compass: Lifecycle
**Status:** NOT STARTED
**Depends on:** A8b
**Scope creep risk:** Medium

**Goal:** Questions can resolve. Resolution can become a value. The arc from inquiry to belief is complete.

**The lifecycle:**
```
Question created (open)
    ↓ entries tagged over weeks/months
Question accumulates entries
    ↓ user reaches clarity
Question marked resolved + closing entry written
    ↓ optionally
New value created from resolution
```

**What to build:**
- Resolution flow — closing reflection → save
- "This became a value" prompt on resolution
- Closed question archive within Questions tab
- *"You've been asking this for X months"* quiet observation
- Resolved questions surfaceable in year-ago mechanic

**Files:** `InnerCompass.tsx`, `JournalEntry.tsx`

---

#### SESSION A9a — Insights: Audit + Witness Redesign
**Status:** NOT STARTED
**Depends on:** A5 done
**Scope creep risk:** Medium

**What to build:**
- Full audit of `Insights.tsx`, `insights.ts`, `LanguageInsights.tsx`, `language-analysis.ts`
- Rebuild with Witness philosophy — every stat passes copy test
- Warm empty state for Day 1–30: *"Your patterns are still forming. Come back after a few more weeks."*
- MoodChart.tsx — integrate into Insights or keep separate (decide at session start)
- `LanguageInsights.tsx` — absorb into Insights, remove as separate sidebar item

**Files:** `Insights.tsx`, `MoodChart.tsx`, `LanguageInsights.tsx`, `insights.ts`, `language-analysis.ts`, `App.tsx`

---

#### SESSION A9b — Connected Insights
**Status:** NOT STARTED
**Depends on:** A6 + A7 + A8 + A9a all done
**Scope creep risk:** High

**What to build:**
- Tag frequency — *"You write about [career] most in Q1. It quietens in summer."*
- Era-labelled patterns — *"During your [era] chapter, you wrote more on weekends."*
- Question insights — *"You've been asking '[question]' for 4 months across 12 entries."*
- Habit + journal co-occurrence — *"Your [habit] weeks and good-mood weeks appear together often."* (co-occurrence only — never causation)
- All dismissable permanently. Max 5 total.

**Scope creep guard:** One insight per category. Never more than 5. All dismissable.

**Files:** `Insights.tsx`, `insights.ts`

---

#### SESSION A10a — Threads: Reading Experience
**Status:** NOT STARTED
**Depends on:** A5 done
**Scope creep risk:** Low

**What to build:**
- `MemoryThreads.tsx` redesign to warm minimal design language
- Thread reading mode — distraction-free, chronological, clean typography
- Thread cover — title, date range (auto-computed), optional note
- Entry cards — compact, mood colour, snippet, date. Click → Day View
- **Markdown rendering** — install lightweight renderer (e.g. `marked` or `micromark`). Render markdown in DayView (`freeWrite` + `whatHappened` fields) and Thread reading mode. No changes to Write form — writing stays raw, reading is rendered. No toolbar, no live preview, no syntax highlighting. Writer uses `**bold**`, `# heading`, `- list` naturally; it renders when read back.

**Decision locked:** Markdown is a reading-experience feature, not a writing-experience feature. The textarea stays plain text always.

**Files:** `MemoryThreads.tsx`, `threads.ts`, `TimelineView.tsx`

---

#### SESSION A10b — Threads: Intelligent Building
**Status:** NOT STARTED
**Depends on:** A6 + A8 done
**Scope creep risk:** Medium

**What to build:**
- Tag-assisted entry suggestion when building a thread
- Question-to-thread bridge — resolved question can become a thread
- Era-filtered thread building
- Thread suggestion — quiet, once, dismissable

**Witness test:** Suggestions are offers, never assignments.

**Files:** `MemoryThreads.tsx`, `InnerCompass.tsx`

---

#### SESSION A11a — Connecting the Dots: Passive Connections
**Status:** NOT STARTED
**Depends on:** All A5–A10 sessions done
**Scope creep risk:** High

**What to build:**
- Year-ago surfaces era context — *"A year ago you were in your [era] chapter"*
- Continuity prompt era-aware
- Tag co-occurrence surfaces together in Thread suggestions and Insights
- Question-to-heatmap indicator on tagged entries (opt-in)
- Values contextualise intentions in Write

**Files:** `JournalEntry.tsx`, `TimelineView.tsx`, `insights.ts`

---

#### SESSION A11b — Connecting the Dots: Active Surfaces
**Status:** NOT STARTED
**Depends on:** A11a
**Scope creep risk:** High

**Goal:** The north star session. The app surfaces one quiet observation at the right moment.

**What to build:**
- Pattern observation — one quiet observation when pattern is strong. Max once per week. Always dismissable.
- Anniversary acknowledgement — *"A year of writing. That's something."*
- Era transition acknowledgement — *"You've started a new chapter."*
- Annual pattern card — once a year, one gentle observation
- Question resolution acknowledgement — when entries accelerate near resolution

**Scope creep guard (non-negotiable):**
- One observation at a time, never stacked
- Never more than once per week
- Every observation permanently dismissable
- Observation only — never instruction
- Never negative patterns

**The true form moment:** The app surfaces something the user wrote two years ago that speaks to what they're going through today — without being asked.

**Files:** `TimelineView.tsx`, `insights.ts`, new pattern detection module

---

### PHASE B — Desktop App (Electron)
*Goal: Same app, real installed application*

---

#### SESSION B1 — Electron Wrapper
**Status:** NOT STARTED

**Prerequisites:** Phase A complete and approved

**Steps:**
1. `npm install --save-dev electron electron-builder`
2. `npm install electron-store`
3. Create `electron/main.js` — main process
4. Create `electron/preload.js` — secure bridge
5. Swap storage layer to use electron-store (file on disk)
6. Update `package.json` with electron-builder config
7. Test: `npm run electron:dev`

**Data file location after install:**
- Linux: `~/.config/premium-journal/journal.json`
- Windows: `%APPDATA%/premium-journal/journal.json`
- Mac: `~/Library/Application Support/premium-journal/journal.json`

**Deliverable:** App opens in Electron window, data saves to file

---

#### SESSION B2 — GitHub Actions CI
**Status:** NOT STARTED

**Steps:**
1. Create `.github/workflows/build.yml`
2. Configure matrix build: ubuntu-latest, windows-latest, macos-latest
3. Push to GitHub private repo
4. Verify releases page produces:
   - `premium-journal-x.x.x.AppImage` (Linux)
   - `premium-journal-x.x.x-setup.exe` (Windows)
   - `premium-journal-x.x.x.dmg` (Mac)

**Deliverable:** GitHub Releases page with downloadable installers

---

#### SESSION B3 — Polish & Final Testing
**Status:** NOT STARTED

**Steps:**
1. App icon (512×512 PNG → auto-converted for each platform)
2. Window behaviour (min size, remember position/size)
3. Graceful close (confirm if unsaved)
4. Test full install → use → uninstall cycle on Linux
5. Final BUILDLOG update

**Deliverable:** Production-ready desktop app

---

### PHASE C — Portfolio
*Goal: Showcase to employers*

---

#### SESSION C1 — Portfolio Assets
**Status:** NOT STARTED

**Deliverables:**
1. **Demo video** (2–3 min Loom)
   - App launch from desktop
   - Write an entry
   - Show mood chart, insights, habits, 21-day tracker
   - Show privacy/export feature
   - Show it's offline (turn off wifi, still works)

2. **Case study document** (Google Doc or Notion)
   - Problem: existing journaling apps have telemetry / no true privacy
   - Decisions: why Electron, why local-first, why abstracted storage
   - Architecture diagram
   - Privacy principles
   - Roadmap to public release
   - Role: BA/PA — defined requirements, made architecture decisions, validated with AI tooling

3. **Professional README**
   - What it is
   - Screenshots
   - Privacy principles
   - How to install
   - Roadmap

---

## PRIVACY PRINCIPLES (non-negotiable, document these publicly)

1. **Local by default** — data never leaves your device without your explicit action
2. **No telemetry** — zero analytics, crash reporting, or usage tracking ever
3. **You own your data** — export everything as JSON anytime, in one click
4. **Open storage format** — journal.json is human-readable, not proprietary
5. **No account required** — the app works without signup, email, or identity
6. **Future sync = E2E encrypted** — when cloud sync is added, the server stores ciphertext only

---

## HOW TO START SESSION A5b

In a new Claude conversation, say exactly this:

> "I am building a privacy-first journaling desktop app. Please read the BUILDLOG.md carefully, then help me complete Session A5b — Timeline + Global Polish."

Then attach:
1. This `BUILDLOG.md`
2. `src/app/components/TimelineView.tsx`
3. `src/styles/fonts.css`
4. `src/styles/theme.css`
5. `src/styles/index.css`

---

## SESSION LOG

| Session | Date | What was done | Status |
|---|---|---|---|
| Session 0 | 2026-02-27 | Full brainstorming. All decisions locked. BUILDLOG created. | ✅ Complete |
| Session A1 | 2026-02-27 | App running in browser, all 14 views confirmed, GitHub repo set up, .gitignore added | ✅ Complete |
| Session A2 | 2026-02-28 | Storage abstraction layer, 21-day habit tracker, sidebar navigation, design principles + product vision brainstorm | ✅ Complete |
| Session A2b | 2026-02-28 | Brainstorming: Witness philosophy, heatmap architecture, sidebar redesign, Write section enhancements, human-centred feature audit | ✅ Complete (brainstorm only) |
| Session A3 | 2026-02-28 | Mood + energy visual upgrade — emoji cards with colour wash, vertical signal bar meter | ✅ Complete |
| Session A3b | 2026-02-28 | Timeline/Heatmap — year heatmap, drill-down nav, year selector sidebar, day/week/month/day views | ✅ Complete |
| Session A4 | 2026-02-28 | Write section redesign — Quick/Guided/Deep modes, contextual prompt, continuity, year-ago memory, closing moment, unsaved changes guard | ✅ Complete |
| Session A4b | 2026-02-28 | Weekly/Monthly/Yearly reflection types via Timeline — synthetic date keys, reflection dots/banners, custom prompts/fields, App.tsx wired | ✅ Complete |
| Session A4c | 2026-03-01 | Reflection panels inline readable + intentions loop + intention field in Write | ✅ Complete |
| Session A4c-fix | 2026-03-01 | Yearly colour + empty panel gate + mood/energy removed from reflections | ✅ Complete |
| Session A4c-fix2 | 2026-03-01 | Stats scoping + blank screen bug + intention labels | ✅ Complete |
| Session A4c-fix3 | 2026-03-01 | Dynamic sidebar + dot states (written/no-mood dashed ring) + ReflectionPanel polish | ✅ Complete |
| Session A4c-fix4 | 2026-03-01 | ReflectionPanel below calendar grid + duplicate intention removed | ✅ Complete |
| Session A4d | 2026-03-01 | First-run WelcomeCard + today cell pulse + daily prompt + intention surface + year-in-numbers | ✅ Complete |
| Session Brainstorm-1 | 2026-03-01 | IS-AS + gap analysis + SWOT — Tags, Eras, Questions, Anchors, Threads, Insights. Session map A5a–A11b locked. Philosophy expanded and audited. | ✅ Complete (brainstorm only) |
| Session A5a | 2026-03-01 | oneWord field, staggered animations, closing lines audit. Prompt chips built and removed. | ✅ Complete |
| Session A5b | 2026-03-02 | Typography upgrade (Cormorant Garamond + DM Sans), mood language audit ("Difficult" → "Hard"), month cell contrast fix, amber accent audit, DayView date heading, BelowHeatmap polish | ✅ Complete |
| Session A4e | 2026-03-02 | Deep Write enhancements — word count, typewriter scroll, amber caret, display font on headings + closing moment | ✅ Complete |
| Session A6a | 2026-03-02 | Tag normalisation (save + import), TagManager rewrite — inline autocomplete, Enter/comma/Backspace UX | ✅ Complete |
| Session A6b | 2026-03-02 | Tag navigation — clickable tags in DayView, filter strip, heatmap fade at all drill levels | ✅ Complete |
| Doc Strategy | 2026-03-02 | Documentation governance — DOCS-REGISTRY created, all 17 docs audited, keep/skip/defer decisions locked | ✅ Complete |
| Doc Sprint 1 | 2026-03-03 | BA-Document v1.0, V1-Scope, Witness-Philosophy, User-Journey, INDEX, DOCS-STATUS all completed | ✅ Complete |
| Session A6c | — | Search — full-text + tag dimension + result view. **Deferred until 30+ real entries. IN V1.** | ⏳ Pending |
| **BRAINSTORM A7a** | — | Era colour palette, data model audit, heatmap overlay design. Required before A7a build. | ⏳ Next |
| Session A7a | — | Era management — redesign ErasManager, data model audit, era colour palette | ⏳ Pending |
| Session A7b | — | Era surfaces — heatmap overlay, era label in all views, era filter | ⏳ Pending |
| Brainstorm Gita | 2026-03-03 | Bhagavad Gita philosophy layer — full brainstorm. Chapter-to-cadence architecture, all four sessions (A8a–A8d) scoped, rejection table locked, Copy Audit Standard written. No code. | ✅ Complete (brainstorm only) |
| Session A8a | 2026-03-04 | Gita prompt pool — 11 daily + 14 reflection prompts added to prompts-v2.ts. BelowHeatmap rotation updated in TimelineView.tsx. Copy Audit Standard formalised. | ✅ Complete |
| Session A8b | — | Inner State Dimension (Gunas) — `innerState` field, compact selector in Write, distribution chart in Insights | ⏳ Pending |
| Session A8c | — | Sanskrit Reveal Layer — progressive disclosure on closing moment + daily prompt | ⏳ Pending |
| Session A8d | — | Habit Builder copy refresh — equanimity language throughout | ⏳ Pending |
| Session A9a | — | Insights audit + Witness redesign + warm empty state | ⏳ Pending |
| Session A9b | — | Connected insights — tag, era, question, habit patterns. **POST-V1.** | ⏳ POST-V1 |
| Session A10a | — | Threads reading experience redesign | ⏳ Pending |
| Session A10b | — | Threads intelligent building — tag/question-assisted. **POST-V1.** | ⏳ POST-V1 |
| Session A11a | — | Connecting the dots — passive connections | ⏳ Pending |
| Session A11b | — | Connecting the dots — active surfaces (north star session). **POST-V1.** | ⏳ POST-V1 |
| Living With It | — | No building. Minimum 2 weeks daily use. Required before V1 declared complete. | ⏳ After A11a |
| Doc Sprint 2 | — | PRD, FRD, SRS, WBS, Roadmap, Risk-Register, Assumptions, RTM, Flow-Diagrams, AI-Case-Study | ⏳ Pending |
| Session B1 | — | Electron wrapper | ⏳ Phase B |
| Session B2 | — | GitHub Actions CI — Linux, Windows, macOS builds | ⏳ Phase B |
| Session B3 | — | Polish and final testing | ⏳ Phase B |
| Session C1 | — | Portfolio assets — demo video, case study, README polish, early adopter testing | ⏳ Phase C |

---

## COMPANION FILES & DOC STATUS

*All documents live in the `docs/` folder. Read DOCS-STATUS.md for full health detail on each.*

| File | Purpose | Status | Last Updated |
|---|---|---|---|
| `docs/INDEX.md` | Master index — start here to navigate the doc suite | ✅ Current | 2026-03-03 |
| `docs/DOCS-REGISTRY.md` | Governance — routing table, what each doc owns, update triggers | ✅ Current | 2026-03-03 |
| `docs/DOCS-STATUS.md` | Health of every document — stale flags, what needs updating | ✅ Current | 2026-03-03 |
| `docs/FEATURE-STATUS.md` | Every feature — BUILT / PLANNED / DEFERRED / NEVER with V1 verdict | ✅ Current | 2026-03-02 |
| `docs/DECISIONS-LOG.md` | Every significant product and architecture decision with rationale | ✅ Current | 2026-03-02 |
| `docs/BUGS-AND-DEBT.md` | Known issues, rough edges, technical debt — open and fixed | ✅ Current | 2026-03-02 |
| `docs/BA-Document.docx` | Business analysis — 18 sections, full product definition | ✅ Current | 2026-03-03 |
| `docs/V1-Scope.md` | V1 scope authority — IN / POST-V1 / NEVER verdicts per session | ✅ Current | 2026-03-03 |
| `docs/Witness-Philosophy.md` | Full philosophy — three layers, guards, never-build rationale | ✅ Current | 2026-03-03 |
| `docs/User-Journey.md` | Day 1 → Day 10,000 temporal model and feature-to-day mapping | ✅ Current | 2026-03-03 |
| `docs/PRD.md` | Product requirements — features, priorities, acceptance criteria | ❌ Not Started | Doc Sprint 2 |
| `docs/FRD.md` | Functional requirements — every behavioural rule and edge case | ❌ Not Started | Doc Sprint 2 |
| `docs/SRS.md` | Software requirements — data models, storage contracts | ❌ Not Started | Doc Sprint 2 |
| `docs/WBS.md` | Work breakdown structure — phases and sessions | ❌ Not Started | Doc Sprint 2 |
| `docs/Product-Roadmap.md` | Phase narrative A → B → C → optional sync | ❌ Not Started | Doc Sprint 2 |
| `docs/Risk-Register.md` | Forward-looking risks with scoring and mitigation ownership | ❌ Not Started | Doc Sprint 2 |
| `docs/Assumptions-and-Constraints.md` | Operating assumptions with invalidation tracking | ❌ Not Started | Doc Sprint 2 |
| `docs/RTM.md` | Requirements traceability matrix | ❌ Not Started | Doc Sprint 2 (after PRD + FRD) |
| `docs/Flow-Diagrams.md` | Core user flows as Mermaid diagrams | ❌ Not Started | Doc Sprint 2 |
| `docs/AI-Process-Case-Study.md` | Portfolio — how human-led AI development was done | ❌ Not Started | Doc Sprint 2 |
| `docs/Early-Adopter-Brief.md` | Testing framework for first users | ⏳ Deferred | After 30+ real entries |
| `PROJECT-TRACKER.xlsx` | Master spreadsheet — all trackers in one view | ✅ Current | 2026-03-02 |

### Update routing — which file gets updated when

| Change type | Files to update |
|---|---|
| Feature built or changed | BUILDLOG → FEATURE-STATUS → DOCS-STATUS (flag stale docs) |
| Decision made | BUILDLOG → DECISIONS-LOG (immediately, same session) |
| Bug found | BUILDLOG mention → BUGS-AND-DEBT (immediately, same session) |
| Bug fixed | BUILDLOG → BUGS-AND-DEBT (move to FIXED) → FEATURE-STATUS |
| Scope verdict changes | BUILDLOG → DECISIONS-LOG → FEATURE-STATUS → V1-Scope |
| Doc session completes a document | BUILDLOG → DOCS-STATUS → INDEX |
| BA-Document / PRD / FRD updates | Doc sprint checkpoints only — DOCS-STATUS holds stale flags between sprints |

**Rule:** BUILDLOG, DECISIONS-LOG, and BUGS-AND-DEBT are written during or immediately after the session. BA-Document, PRD, FRD wait for the next doc sprint.

---

## NOTES & DECISIONS LOG

*Add any new decisions or important notes here as the project progresses*

- **2026-02-27:** Decided web-first approach to validate visuals before Electron commitment
- **2026-02-27:** HabitBuilder philosophy must be preserved — no streaks, no punishment, exploration only
- **2026-02-27:** Storage abstraction is critical — must be done in A2 before any more features are added
- **2026-02-27:** Portfolio strategy: demo video + case study, not just a GitHub link
- **2026-02-27:** Figma source available at https://www.figma.com/design/7Gf3HV2SR2CUKwy5n7JhKi/Premium-Journal-App
- **2026-02-27 (A1):** GitHub repo is `git@github.com:Krishna-Yelnure/premium-journal.git` (private)
- **2026-02-27 (A1):** SSH key configured on Linux Mint with passphrase — needed for every git push
- **2026-02-27 (A1):** App runs with `npm run dev` from `~/premium-journal` — opens at http://localhost:5173
- **2026-02-27 (A1):** node_modules must never be committed — .gitignore is in place
- **2026-02-28 (A2):** db/index.ts is the single storage interface — never import localStorage directly anywhere else
- **2026-02-28 (A2):** Weekly/Monthly/Yearly ripple effects mapped — defer to A4b, accessed via heatmap not Write buttons
- **2026-02-28 (A2):** Screen space/layout — keep centred max-width for now, revisit in A5
- **2026-02-28 (A2):** All entries belong to the day written, tagged with reflectionType — no date ranges
- **2026-02-28 (A2):** App currently rated 6.5/10 — good bones, needs narrative continuity to reach 9/10
- **2026-02-28 (A2b):** Core design philosophy is "Witness" — app is a quiet witness to your life, never a manager
- **2026-02-28 (A2b):** Heatmap = emotional landscape map — colour encodes mood not activity, empty = unknown not failed
- **2026-02-28 (A2b):** Heatmap replaces Entries + Archive + Calendar — one coherent experience
- **2026-02-28 (A2b):** Weekly/Monthly/Yearly accessed by clicking week column/month label/year in heatmap — not Write buttons
- **2026-02-28 (A2b):** Write section becomes Daily entry only — clean, focused, no type switcher
- **2026-02-28 (A2b):** Default landing view = Timeline (heatmap) not Write — returning user sees their story first
- **2026-02-28 (A2b):** Sidebar reduced from 14 to 11 items in 3 groups + settings
- **2026-02-28 (A2b):** Word count REMOVED from plan — violates Witness philosophy (manager not witness)
- **2026-02-28 (A2b):** Streaks NEVER — violates emotional safety, gamification is anti-human for journaling
- **2026-02-28 (A3):** Mood cards + energy signal bar — self-contained in JournalEntry.tsx, no ripple effects
- **2026-02-28 (A3b):** TimelineView created — replaces Entries, Archive, Calendar as single coherent view
- **2026-02-28 (A3b):** Tab bar (Daily/Weekly/Monthly/Yearly filter) built and removed — premature before A4b creates those entry types
- **2026-02-28 (A3b):** Year selector sidebar on right per BUILDLOG spec — replaces prev/next arrows
- **2026-02-28 (A3b):** reflectionType filtering in Timeline deferred to A4b — hooks are in place, data doesn't exist yet
- **2026-02-28 (A4b):** Reflection entries use synthetic date keys — can never collide with daily entries
- **2026-02-28 (A4b):** Reflection dot colours: weekly = violet, monthly = sky, yearly = rose — distinct from mood system
- **2026-02-28 (A4b):** pendingReflectionType always reset to 'daily' on regular navigation — prevents type leaking
- **2026-02-28 (A4b):** formatEntryDate() renders synthetic keys as human-readable period names
- **2026-02-28 (A4c brainstorm):** Reflections need to be readable inline at their Timeline level — not just editable via dot
- **2026-02-28 (A4c brainstorm):** ReflectionPanel replaces banner — full text, mood, date, Edit button; invitation when empty
- **2026-02-28 (A4c brainstorm):** Intentions = single optional line at end of reflection — not a task list, not tracked for completion
- **2026-02-28 (A4c brainstorm):** Intention surfaced as prompt in next period ("Last week you intended: X — how did that unfold?") — never a metric
- **2026-02-28 (A4c brainstorm):** `intention?: string` to be added to JournalEntry type in types.ts
- **2026-02-28 (A4d brainstorm):** Empty heatmap = void not invitation — Day 1 critical problem confirmed
- **2026-02-28 (A4d brainstorm):** First-run solution = WelcomeCard + today cell pulse + first-entry special closing moment
- **2026-02-28 (A4d brainstorm):** To-do list REJECTED — violates Witness philosophy, makes app a manager not a witness
- **2026-02-28 (A4d brainstorm):** Below-heatmap space = three layered features: daily prompt (Option 2) + intention surface (Option 4) + year-in-numbers (Option 1)
- **2026-02-28 (A4d brainstorm):** Daily opening prompt shown once per app open, fades automatically — no dismiss button, no friction. Mechanic: last_prompt_shown_date in localStorage
- **2026-02-28 (A4d brainstorm):** Hard day counts NEVER shown in stats — violates emotional safety. Negative tallies never surfaced.
- **2026-02-28 (A4d brainstorm):** Mood language rule — difficult/low dominant mood → "A tender year so far" not "mostly difficult"
- **2026-02-28 (A4d brainstorm):** Mood stat copy test: "Would this make someone feel observed or understood?" — observed = rewrite, understood = keep
- **2026-02-28 (A4d brainstorm):** Year-in-numbers only surfaces positive highlights — great day count shown, hard day count never shown
- **2026-02-28 (A4d brainstorm):** Mood language audit added to A5 checklist — every mood data surface must pass the copy test
- **2026-02-28 (A4):** Write now has three modes — Quick Capture / Guided (default) / Deep Write — mode switcher in header
- **2026-02-28 (A4):** ContextualPrompt uses strict priority: year-ago memory > continuity prompt > daily rotating prompt — one signal at a time, never stacked
- **2026-02-28 (A4):** Year-ago search uses ±3 day window — accounts for irregular writing without surfacing irrelevant entries
- **2026-02-28 (A4):** Closing moment fires for new entries only — editing gets a toast, new entries get a moment
- **2026-02-28 (A4):** Unsaved changes guard added — window.confirm on Cancel if form is dirty (addresses 🔴 Critical edge case)
- **2026-02-28 (A4):** ReflectionModeSelector removed from Write entirely — reflection types accessed via Timeline drill-down in A4b
- **2026-02-28 (A4):** prompts-v2.ts (reflection prompts) not used in Write — reserved for A4b when weekly/monthly/yearly entry types are wired
- **2026-02-28 (A4):** isLongForm field already existed in types.ts — Deep Write mode sets it without schema change
- **2026-03-01 (A4c):** `intention?: string` added to JournalEntry in types.ts
- **2026-03-01 (A4c):** ReflectionPanel replaces banners — full entry text readable inline, intention at top as through-line
- **2026-03-01 (A4c-fix3):** Dynamic sidebar locked — level-aware: year=years list, month=months+dots, week/day=7-day strip
- **2026-03-01 (A4c-fix3):** "Written, no mood" dot state — dashed ring on slate, distinct from empty and mood-coloured
- **2026-03-01 (A4c-fix4):** ReflectionPanel placement locked — always below data grid, never above
- **2026-03-01 (A4d):** WelcomeCard appears when dailyEntries.length === 0 and journal_first_visit_dismissed not set
- **2026-03-01 (A4d):** Today's cell pulses amber when no entries — stops after first save
- **2026-03-01 (A4d):** Daily prompt once-per-day gate — last_prompt_shown_date in localStorage
- **2026-03-01 (A4d):** Hard day counts never shown in any stat surface — confirmed and enforced
- **2026-03-01 (Philosophy audit):** Philosophy expanded to three layers — Witness, Mirror, Patterns Surface. All audited.
- **2026-03-01 (Philosophy audit):** Mirror guard — texture not quality. "Shape" safe, "quality" not.
- **2026-03-01 (Philosophy audit):** Language rule — "patterns surface" always. Never "app connects the dots."
- **2026-03-01 (Philosophy audit):** Presence guard — observations describe what's present, never what's absent.
- **2026-03-01 (Philosophy audit):** Causation guard — co-occurrence only. "These appear together" safe. "When you do X you feel better" is not.
- **2026-03-01 (Philosophy audit):** "System" retired, replaced with "companion." "Life OS" rejected as label.
- **2026-03-01 (Philosophy audit):** "Your life, made legible" confirmed as one-sentence product description.
- **2026-03-01 (Brainstorm-1):** IS-AS audit — all six features are storage without surfaces. Data goes in, nothing comes back out.
- **2026-03-01 (Brainstorm-1):** Three underlying systems — (1) Tagging System, (2) Context Layer, (3) Surfaces Layer. Tags are the foundation.
- **2026-03-01 (Brainstorm-1):** Tag quality solution — autocomplete + normalisation together. Both required.
- **2026-03-01 (Brainstorm-1):** Anchors + Questions merged into "Inner Compass" — Values tab + Questions tab. Lifecycle: question → resolution → value.
- **2026-03-01 (Brainstorm-1):** Session priority — Tags (1), Eras (2), Questions (3), Insights (4), Anchors (5), Threads (6).
- **2026-03-01 (Brainstorm-1):** A7b hard dependency on A6b — era filter shares filter state infrastructure with tag filter.
- **2026-03-01 (Brainstorm-1):** Living With It after A11b, not after A5. Full product first.
- **2026-03-01 (Brainstorm-1):** A9b and A11b highest scope creep risk. Guards: A9b max 5 insights all dismissable. A11b max once per week, never negative.
- **2026-03-01 (A5a):** `oneWord?: string` added to JournalEntry — past-facing, observational, single word only
- **2026-03-01 (A5a):** Closing lines audited — "The witness remembers." removed (self-referential). 11 lines total.
- **2026-03-01 (A5a):** Staggered entrance animations on all guided form sections — header through actions in sequence.
- **2026-03-01 (A5a):** oneWord renders as borderless bottom-border input — feels like a signature, not a form field.
- **2026-03-01 (A5a):** Prompt chips — built (soft pill buttons above each textarea) then removed after visual review. Verdict: clutter before writing starts, manager not witness. Placeholders are sufficient. Pattern rejected permanently.
- **2026-03-01 (Philosophy audit):** Philosophy expanded to three layers — Witness (foundation), Mirror (reflective), Patterns Surface (connective). All three audited against the Witness test before locking.
- **2026-03-01 (Philosophy audit):** Mirror guard locked — mirror shows emotional *texture* of a period, never its *quality*. "Shape" is safe language. "Quality" is not. Never becomes a report card.
- **2026-03-01 (Philosophy audit):** Language rule locked — always "patterns surface", never "app connects the dots." Passive construction is correct. The patterns were always there.
- **2026-03-01 (Philosophy audit):** Presence guard locked — observations describe what's *present*, never what's *absent*. Absence-pointing ("you haven't written about X lately") is a manager move. Never build it.
- **2026-03-01 (Philosophy audit):** Causation guard locked — habit + journal intersection shows co-occurrence only, never causation or implied recommendation. "These appear together in your story" is safe. "When you do X you feel better" is not. One sentence away from prescription.
- **2026-03-01 (Philosophy audit):** "System" retired from product identity language — imports wrong register (optimisation, efficiency). Replaced with "companion" — warm, personal, non-prescriptive.
- **2026-03-01 (Philosophy audit):** "Life OS" explicitly rejected as product label — accurate in capability but wrong in feeling. The product is warmer than an OS.
- **2026-03-01 (Philosophy audit):** "Your life, made legible" confirmed as the one-sentence product description — legible implies meaning already exists, app makes it readable. Not interpreted, not improved. Legible.
- **2026-03-01 (Philosophy audit):** Journal + Habits relationship formalised — not two tools bolted together. Journal witnesses inner life. Habits shape outer life. Patterns connect them over time. Neither is primary, both serve the same intention: helping a person know themselves more clearly.
- **2026-03-02 (A6b):** Tag filter built — clickable tags in DayView, filter strip in Timeline, heatmap cells fade to 20% opacity when unmatched, filter persists across all drill levels (year → month → week → day). A6b complete.
- **2026-03-02 (Doc Strategy):** Full documentation audit complete — 17 document types evaluated against this project. Keep/skip/defer decisions locked. DOCS-REGISTRY.md created as governance layer with routing table, layer architecture, and per-doc ownership entries.
- **2026-03-02 (Doc Strategy):** Documentation layer architecture locked — Layer 0 (Governance) → Layer 1 (Product Definition) → Layer 2 (Requirements) → Layer 3 (Execution) → Layer 4 (Portfolio). Changes flow down only. If a change requires going upstream, the upstream decision was wrong.
- **2026-03-02 (Doc Strategy):** Witness-Philosophy.md added to document suite — ethical positioning document explaining why streaks/AI-reading/urgency were rejected. Portfolio differentiator. Stands alone from BA-Document.
- **2026-03-02 (Doc Strategy):** User-Journey.md uses temporal model (Day 1/7/30/365/10,000) not demographic personas. The defining variable is depth of use over time, not user identity.
- **2026-03-02 (Doc Strategy):** BRD, Project Charter, standalone Personas, Communication Plan, RAID Log skipped — absorbed into other documents or not applicable to solo project. Decisions logged in DECISIONS-LOG.md.
- **2026-03-03 (Doc Sprint 1):** Product renamed from "Premium Journal App" to "Journal App" — cleaner, no marketing qualifier, consistent across all docs and UI copy going forward.
- **2026-03-03 (Doc Sprint 1):** V1 scope locked in V1-Scope.md. A9b, A10b, A11b moved to POST-V1 (scope creep risk). A11a remains IN V1 (third philosophical layer). A6c IN V1 with condition: build after 30+ real entries.
- **2026-03-03 (Doc Sprint 1):** V1 complete criteria locked — all 7 criteria must be true before Phase B begins. See V1-Scope.md.
- **2026-03-03 (Doc Sprint 1):** BA-Document v1.0 complete — 18 sections, McKinsey-register writing, proper 2×2 SWOT, Document Control + Revision History, Assumptions & Constraints, Glossary added.
- **2026-03-03 (Doc update routing):** Rule locked — BUILDLOG gets an entry for every session without exception. DECISIONS-LOG and BUGS-AND-DEBT are captured immediately (not at end of session). BA-Document, PRD, FRD updated only at doc sprint checkpoints. DOCS-STATUS holds stale flags between sprints.
- **2026-03-04 (A8a):** Gita prompt pool complete — 11 daily prompts (Ch. 1/3/5 arc + ego/conflict lens) and 14 reflection prompts (Ch. 9/11/13/15/18 arc) integrated into prompts-v2.ts as named exports `gitaPrompts` and `gitaReflectionPrompts`. No Sanskrit, no attribution in UI.
- **2026-03-04 (A8a):** `getGitaDailyPrompt()` exported from prompts-v2.ts. TimelineView.tsx BelowHeatmap uses 50/50 split between `getSmartPrompt()` and `getGitaDailyPrompt()`. Once-per-day gate unchanged.
- **2026-03-04 (A8a):** `getReflectionPrompt()` now draws from combined pool (existing + Gita). Interface identical — no downstream changes needed.
- **2026-03-04 (A8a):** Copy Audit Standard formalised as permanent 9-point checklist in gita-buildlog-entries.md. Supersedes the older "Witness test" phrasing for all copy review going forward.
- **2026-03-04 (A8a):** Chapter-to-cadence architecture documented (Ch. 1–6 daily, 7–12 weekly, 13–17 monthly, 18 yearly) — internal design guide only, never visible to user.
- **2026-03-04 (A8a):** Gita A8a–A8d sessions replace the old Inner Compass A8a–A8c session slots in the session map. Inner Compass work still planned — renumbering deferred until Gita sessions complete.

---

## CORE PHILOSOPHY — THE WITNESS

> "A quiet witness to your life. Holds your memories. Surfaces your patterns. Never judges. Always remembers."

This is the product. Every feature decision passes this test:
**"Does this make the app feel more like a witness — or more like a manager?"**

---

### The Three Layers (expanded 2026-03-01)

The philosophy has three layers that build on each other. All three must remain in the Witness register — none of them tips into manager territory.

**Layer 1 — The Witness (foundation)**
Passive. Holds. Stores. Remembers. Never initiates. Never evaluates. The bedrock that everything else rests on.

**Layer 2 — The Mirror**
Reflective, not passive. Shows you yourself over time. The heatmap, year-ago surfacing, mood patterns — these are mirrors. You see something you couldn't see from inside the moment.

*The mirror guard:* **The mirror shows the emotional texture of a period, never its quality.** Texture is neutral — "a mix of good and tender weeks." Quality is judgemental — "a bad year." The mirror never becomes a report card. The word "shape" is safe. The word "quality" is not.

**Layer 3 — The Patterns Surface**
Over time, patterns emerge from what the user has written and labelled. The app holds them until they become visible. It does not connect dots — the dots were always connected. The app just makes the connection legible.

*The language rule:* Always say **"patterns surface"** — never "the app connects the dots." Passive construction is correct. The patterns were always there. The app holds them until they're readable.

*The presence guard:* **Observations describe what's present, never what's absent.** The app notices when a theme is active in someone's writing. It never notices when a theme goes quiet. Absence-pointing implies neglect ("you haven't written about family lately") — that's a manager, not a witness.

*The causation guard:* **Co-occurrence only — never causation, never correlation as recommendation.** If habit weeks and good-mood weeks overlap, the app may name that they appear together in the user's story. It never says "when you do X, you feel better" — that's one sentence away from "so you should do X more." The user draws their own conclusions. The app only shows the texture.

---

### The Full Product Identity

> *"The journal witnesses. The mirror reflects. The patterns surface. The habits shape. Together — a quiet companion for knowing yourself over time."*

**One-sentence version:**
> *"Your life, made legible."*

*Why "companion" not "system":* System imports the wrong register — architecture, efficiency, optimisation. A companion is warm, personal, non-prescriptive. A companion doesn't manage. A companion is just there, consistently, paying attention.

*Why "legible" not "understood" or "improved":* Legible implies your life already has meaning — the app makes it readable, not interpreted. A witness makes things legible. A manager makes things better. This app is a witness.

---

### What the Journal and Habits Are Together

The journal and the habits are not two tools bolted together. They are two expressions of the same intention: helping a person know themselves more clearly over time.

- The journal witnesses the inner life — thoughts, feelings, what happened, what mattered.
- The habits shape the outer life — the small things done consistently that form a person over time.
- The patterns connect them — not by analysis, but by holding both long enough that the person can see them together.

This is not a Life OS. It is not a self-improvement system. It is a quiet companion that holds your whole story — inner and outer — and makes it legible to you.

---

### The Witness Test (applied)

| Feature | Test result | Notes |
|---|---|---|
| Closing moment after save | ✅ Witness | |
| Memory surface in Write | ✅ Witness | |
| Continuity prompt | ✅ Witness | |
| Daily rotating prompt | ✅ Witness | |
| Emotional landscape heatmap | ✅ Witness | Shows texture not quality |
| Quick/Guided/Deep write modes | ✅ Witness | |
| Mood visual upgrade | ✅ Witness | |
| Reflection panels (inline readable) | ✅ Witness | |
| Intentions loop (prompt not metric) | ✅ Witness | |
| Daily opening prompt (fades, no friction) | ✅ Witness | |
| Intention surface below heatmap | ✅ Witness | |
| Year-in-numbers (positive highlights only) | ✅ Witness | |
| First-run WelcomeCard | ✅ Witness | |
| One-word closing field on reflections | ✅ Witness | Past-facing, observational, no right answer |
| Tags — clickable, filterable, normalised | ✅ Witness | User labels, app honours |
| Era overlay — life chapters on heatmap | ✅ Witness | Shows shape of time, no judgement |
| Inner Compass — Values + Questions lifecycle | ✅ Witness | Held present, never scored |
| Search — local, full-text | ✅ Witness | Finds what user seeks |
| Insights — pattern observations, dismissable | ✅ Witness | One at a time, never prescriptive |
| Patterns surfacing — passive connections | ✅ Witness | Presence only, no absence-pointing |
| Habit + journal co-occurrence observation | ✅ Witness with guard | Co-occurrence named, causation never implied |
| Anniversary acknowledgement | ✅ Witness | Quiet, once, no badge |
| Era transition acknowledgement | ✅ Witness | Observation only |
| Word count | ❌ Manager — removed | |
| Streaks | ❌ Manager — never build | |
| Activity-based heatmap (green = wrote) | ❌ Manager — reframed to mood-based | |
| To-do list / top 3 tasks | ❌ Manager — creates obligation | |
| Hard day counts in stats | ❌ Manager — tallies pain | |
| Prompt chips above writing fields | ❌ Manager — clutter before writing starts | Built and removed in A5a |
| Absence-pointing observations | ❌ Manager — never show | "You haven't written about X lately" |
| Causation observations | ❌ Manager — never imply | "When you do X you feel better" |
| AI that reads and interprets entries | ❌ Never — privacy violation | |
| Social features | ❌ Never — private by design | |
| Urgency notifications | ❌ Never — calm technology | |
| Age/gender-based UI variants | ❌ Never — demographic assumption | |

---

## DESIGN LANGUAGE — WARM MINIMAL / WITNESS

**Aesthetic direction:** Warm Minimal

- Muted warm background tones — cream, slate, soft white
- One accent colour — amber/gold for active and selected states
- Colour used semantically — mood colours carry meaning, not decoration
- Generous whitespace — nothing cramped, breathing room everywhere
- Typography-led — headings do the heavy lifting
- Data visualisation that feels human, not corporate
- Empty states are peaceful and inviting, never alarming
- Motion is subtle — things slide and fade, never bounce or flash
- No badges, no notification dots, no urgency indicators

**Mood colour system (to be finalised in A5):**
- Great → warm amber
- Good → soft sage green
- Okay → neutral warm grey
- Low → cool muted blue
- Difficult → deep muted slate
- No entry → light empty (not red, not marked as failure)

---

## DESIGN PRINCIPLES (checklist for Session A5)

1. **Calm Technology** — no aggressive colours, no urgent language, no guilt
2. **Progressive Disclosure** — simple for new users, depth for power users
3. **Emotional Safety** — every label and prompt written with care, never judgmental
4. **Typographic Hierarchy** — strong display font for headings, lighter for body
5. **Microinteractions** — intentional, warm, satisfying at key moments
6. **Spatial Breathing Room** — generous padding, whitespace signals quality
7. **Consistent Visual Language** — same border radius, shadow, colour logic everywhere
8. **Feedback at Every Action** — quiet confirmations, not loud toasts everywhere
9. **Purposeful Colour** — mood colours, one accent, colour carries meaning
10. **Empty States as Invitations** — open door copy, not a void

**Top 3 highest impact for A5:**
- Typographic hierarchy
- Mood colour system applied consistently
- Emotional safety audit of all copy and placeholders

---

## HEATMAP — EMOTIONAL LANDSCAPE VIEW

**What it is:**
The central navigation paradigm of the app. Replaces Entries, Archive, and Calendar as three separate views with one coherent experience.

**Not a GitHub contribution graph** — reframed entirely:
- GitHub: green = committed code (activity)
- Ours: colour = mood of that day (emotion)
- Empty cell = unknown, not failed. Peaceful, not alarming.

**Year view layout:**
```
Your Journal — 2026                    2026 ←
                                       2025
  Jan Feb Mar Apr May Jun              2024
  ░░░ ░░░ ░░░ ░░░ ░░░ ░░░             2023
  ░░█ ░░░ ░█░ ░░░ ██░ ░░░             2022
  ░░░ ░░░ ░░░ ░░░ ░░░ ░░░
                                       
  287 entries · Mostly good · 3 lows
```

**Drill-down navigation:**
```
YEAR VIEW (heatmap)
    ↓ click month label
MONTH VIEW (weeks laid out, mood colours, entry previews)
    ↓ click week
WEEK VIEW (timeline dots — vertical line, one dot per day)
    ↓ click day dot
DAY VIEW (full entry in read mode + Edit button)
```

**Reflection type access via heatmap:**
- Click any day cell → Daily entry form for that date
- Click any week column header → Weekly reflection form
- Click any month label → Monthly reflection form
- Click year selector → Yearly reflection form

This eliminates the broken Weekly/Monthly/Yearly buttons in Write section entirely.

**Day cell states:**
- Empty → opens Write form with that date pre-selected (invitation)
- Has entry → opens Day View in read mode
- Edit from Day View → opens Write form pre-filled

**Default landing view:** Timeline (heatmap) — not Write.
Returning user sees their story first, then chooses to write.

---

## SIDEBAR — REDESIGNED (11 items, 3 groups)

**Down from 14 to 11 items. Cleaner, more logical.**

```
TODAY
├── Write          (daily entry — clean, focused)
└── Timeline       (heatmap — replaces Entries, Archive, Calendar)

UNDERSTAND
├── Insights       (computed patterns and observations)
├── Mood           (detailed mood chart over time)
└── Language       (writing pattern analysis)

EXPLORE
├── Habits         (21-day gentle start)
├── Anchors        (values, intentions, questions)
├── Eras           (life chapters overlaid on timeline)
└── Threads        (curated memory collections)

(no group label — bottom of sidebar)
├── Privacy
└── Legacy
```

**Items removed from original 14:**
- Entries → absorbed into Timeline
- Archive → absorbed into Timeline
- Calendar → absorbed into Timeline
- Questions → consider merging into Anchors in A5

---

## WRITE SECTION — REDESIGNED

**Write becomes Daily entry only.** Type switcher removed — reflection types accessed via heatmap.

**Three modes within Write:**

**Mode 1 — Quick Capture (30 seconds)**
Mood + energy + one line. For days with no time or energy for more. Still counts. Still valuable.

**Mode 2 — Guided Entry (default)**
```
Memory surface (if exists)       ← "A year ago you wrote..."
Daily rotating prompt            ← one question, changes daily
─────────────────────────────
Mood selector (visual, warm)     ← A3 upgrade
Energy meter (vertical bars)     ← A3 upgrade
─────────────────────────────
What happened today
How did it feel
What mattered most
One insight or lesson
Free write
─────────────────────────────
Tags    Era tag
─────────────────────────────
Save Entry
```

**Mode 3 — Deep Write (longform)**
Full screen, distraction free. Title + open canvas. No fields, no structure. For essays, letters to future self, big life processing. Uses existing `isLongForm` field in types.ts.

**New Write features:**
- Daily rotating prompt — one thoughtful question from prompts.ts/prompts-v2.ts (already exists, never surfaced)
- Memory surface integration — "On this day last year..." (MemorySurface.tsx already exists, never integrated)
- Continuity prompt — "Yesterday you wrote about X. How did it go?"
- Closing moment after save — quiet screen: entry saved, date, a rotating thought, then fades to Timeline
- NO word count — violates Witness philosophy

**Feature priority for Write (by session):**

| Feature | Session |
|---|---|
| Mood + energy visual upgrade | A3 |
| Quick/Guided/Deep mode toggle | A4 |
| Daily rotating prompt | A4 |
| Memory surface in Write | A4 |
| Closing moment after save | A4 |
| Continuity prompt | A4 |
| Longform / deep write mode | A4 |

---

## PRODUCT VISION & ROADMAP

**Core vision:**
> "Record the thought process of that day and how it impacts the next set of days and life itself."

**The Witness promise:**
> "A quiet witness to your life. Holds your memories. Surfaces your patterns. Never judges. Always remembers."

**Current rating: 6.5/10** — good bones, needs narrative continuity and human-centred UX to reach 9/10.

**What makes this different from every competitor:**
- Day One, Notion, Reflectly → activity tracking, telemetry, cloud dependency
- This app → emotional witness, local-first, privacy by architecture, no judgement

**What takes this to 9/10:**
1. Emotional landscape heatmap as primary navigation
2. Satisfying daily ritual — welcome, write, closing moment
3. Narrative continuity — entries that know about each other
4. Search (critical missing feature)
5. Reading mode — distraction-free, like a book

**Future features (post-public release):**
- Belief tracker — what did you believe in Jan vs now?
- Decision journal — record why, revisit outcome later
- Growth markers — explicit "I've changed on this" moments
- Pattern recognition — automatic theme detection
- Import from Day One, Notion, plain text
- Local reminders — browser notification, no server
- Photos/attachments — one photo per entry anchors memory
- E2E encrypted optional sync (Obsidian model)

## EDGE CASES & RISK REGISTER

*Identified during A2 brainstorm. Address before or during the relevant session.*

---

### 🔴 Critical — Fix Before Feature Ships

| Edge case | Risk | Session |
|---|---|---|
| Unsaved changes — no warning when navigating away | Data loss — user writes 500 words, clicks sidebar, loses everything | A4 |
| Delete all data — no confirmation | Catastrophic, irreversible, one click currently | A3 (quick fix) |
| Import collision — old backup overwrites newer entries | Silent data loss, no merge strategy | A4b |
| Multiple tabs open simultaneously | Race condition — second save overwrites first on localStorage | B1 |

---

### 🟡 Important — Design For Before Building

| Edge case | Risk | Session |
|---|---|---|
| Multiple entries same day — heatmap colour logic | Core heatmap feature — morning Great + evening Difficult = what colour? | A3b |
| Empty heatmap on day 1 | First impression — feels like a void not an invitation | A3b |
| Entries with no mood recorded — heatmap cell colour | Show grey? Transparent? Different opacity? Needs decision | A3b |
| Week column spanning two months in drill-down | Dec 28–Jan 3 — which month does it belong to? | A3b |
| Memory surface on day 1 — "A year ago you wrote..." | No entries from a year ago — needs graceful empty state | A4 |
| Grief/sensitive entry resurfacing via memory surface | "A year ago you wrote about your father" — could be devastating | A5 |
| localStorage quota exceeded mid-write | Silent failure — no warning, entry lost | B1 (Electron fixes) |
| Corrupt data — browser crash mid-write | No recovery path currently | B1 |

---

### 🟢 Known — Address When Relevant

| Edge case | Risk | Session |
|---|---|---|
| Multiple entries same day — which one shows in heatmap | Average mood? Last entry? Most intense? | A3b |
| Weekly reflection written mid-week | Does week column highlight from Monday or day written? | A4b |
| Yearly reflection written in March for previous year | Belongs to March or to the year reflected on? | A4b |
| Switching reflection type after saving | Can user change type? What happens to heatmap? | A4b |
| Overlapping eras | Two eras share the same date range — which wins? | A5 |
| Open-ended era — does it auto-close when new era created? | UX decision needed | A5 |
| Deleting an era with 50 entries tagged to it | Entries lose eraId — show as untagged? | A5 |
| Habit 21-day — user changes device | localStorage is device-specific — progress disappears on new device | B1 |
| Habit archived mid gentle-start | Does 21-day continue or stop? | A5 |
| Engagement recorded for future date | System currently allows it — heatmap shows future cell filled | A4 |
| Leap year — February 29th | Grid layout needs to handle 366 days cleanly | A3b |
| Export file too large | 10 years of data could be 50MB+ — browser download may struggle | B3 |
| Import wrong file format | Basic validation exists but partial corruption still possible | A4b |
| Closing moment — user clicks away immediately | Back button behaviour unclear during 2-second closing screen | A4 |
| Daily prompt rotation exhausted | Finite prompts — user notices the cycle repeating | A4 |
| Continuity prompt false positives | Irrelevant prompt surfaces and feels jarring | A4 |
| Clock/timezone issues — entry lands on wrong date | User travels, writes at 11pm, entry appears on yesterday | B1 |
| Browser updates break localStorage | Safari periodically changes storage behaviour | B1 |
| Very long entries — 5000+ words | localStorage 5-10MB limit — power user over years could hit this | B1 |
| Backdated entries | User writes entry for last Tuesday — heatmap and continuity prompts handle correctly? | A4 |

---

### 🔵 Human & Philosophical — Handle With Care

| Edge case | Consideration |
|---|---|
| Grief entries resurfaced by memory surface | Need content sensitivity controls or "never resurface" visibility flag (already in types.ts) — ensure it's surfaced clearly in UI |
| Entries about other people | If device shared or compromised — those people are exposed. Entry-level privacy flag needed long term |
| Re-reading painful old self | User finds 5-year-old entries embarrassing or painful — "seal entry" or "archive deeply" feature beyond current visibility flags |
| The journal outlives the user | Legacy feature exists but underdeveloped — who gets the data, how, when? Profound product question for future |
| Therapeutic use | No safeguards for users processing trauma or grief — not a crisis but worth awareness. Copy must always be careful |

---

### Key Decisions Needed Before A3b (Heatmap)

These must be decided before building the heatmap — they affect the data model:

1. **Multiple entries same day** — one entry per day (enforce) or multiple allowed?
2. **Heatmap cell colour logic** — mood of last entry? average? most intense?
3. **No mood recorded** — cell colour fallback?
4. **Week column boundary** — entries belong to week of their date, full stop
5. **Empty state** — what does a new user see on their first open of Timeline?

## SWOT ANALYSIS

### Strengths

**Privacy architecture is bulletproof**
Local-first, zero telemetry, abstracted storage layer ready for Electron. Not just a feature — the foundation. No competitor can credibly claim this without rebuilding from scratch.

**The Witness philosophy is differentiated**
No other journaling app has articulated this clearly. Day One is a photo diary. Notion is a productivity tool. Reflectly is a mood tracker with AI. None say "we are a quiet witness to your life." That positioning is genuinely open.

**Technical foundation is solid**
React + TypeScript, storage abstraction, 14 views working, sidebar navigation, 21-day habit tracker. More built than most portfolio projects ever reach.

**HabitBuilder philosophy**
"Container for exploration, not a tracker for compliance" — a genuine philosophical stance against gamification of self-improvement. Worth documenting publicly.

**You are the user**
Building something you will actually use daily. Every decision grounded in real need, not assumption. The most underrated advantage in product development.

**BA/PA thinking embedded in process**
The BUILDLOG itself is a portfolio piece. Demonstrates requirements thinking, architecture decisions, risk management, and product vision — not just code.

---

### Weaknesses

**No narrative continuity yet**
The most important feature — entries knowing about each other — doesn't exist. Currently a collection of isolated moments, not a story.

**Daily loop is broken**
Open → blank form → write → save → list. No welcome, no memory, no closing moment. The most used flow feels clinical.

**localStorage fragility**
5-10MB limit, device-specific, no sync. Users with years of data are at risk. Electron fixes this but that's Phase B.

**No search**
For a memory app this is serious. Finding anything older than 2 weeks requires scrolling.

**Heatmap not built**
The centrepiece of the product vision doesn't exist yet. The app cannot deliver its core promise without it.

**Write section is still a form**
5 structured fields. Clinical. Doesn't feel like opening a journal.

**Zero onboarding**
WelcomeMessage.tsx exists but new user experience is undefined. No guided first entry, no philosophy introduction.

---

### Opportunities

**Privacy is a growing concern**
GDPR, data breaches, AI training on personal data — timing for a genuinely private journaling app has never been better.

**AI journaling apps are invasive**
Every competitor rushing to add AI that reads your entries. Clear counter-positioning available — "we will never read your journal, not even an AI."

**Obsidian proved local-first can win**
Zero to 1M+ users with local-first, privacy-respecting note-taking. Same model, same audience, different use case. The path is proven.

**Desktop apps are underserved**
Most journaling apps are mobile-first. A premium desktop experience targets writers, developers, thoughtful professionals — underserved and willing to pay.

**The portfolio angle is immediate**
App + BUILDLOG + demo video is already a stronger BA/PA portfolio piece than 95% of candidates have. Don't need to launch publicly to get value.

**The Witness framing is publishable**
A blog post — "why we built a journaling app that refuses to track you" — writes itself and would find an audience.

---

### Threats

**Obsidian + community plugins**
Already has journaling plugins. Power users who know Obsidian may never switch.

**Day One is deeply entrenched**
10+ years of brand trust, iOS integration, E2E encryption already in place. High switching cost for existing users.

**localStorage data loss kills trust**
One browser clear or Safari update and a user loses everything before Electron is built. One bad experience shared publicly ends the product.

**Scope creep**
The vision is ambitious. Risk of never shipping if each session reveals more to build.

**AI will commoditise features**
Memory surface, continuity prompts, pattern recognition — in 2 years every app will have AI doing this better. Moat must be privacy and philosophy, not features.

---

## GAP ANALYSIS

### Gap 1 — The Witness Experience
| Vision | Reality | Size |
|---|---|---|
| App feels like a quiet witness | App feels like a structured form | Large |
| Opening is a ritual | Opening is a task | Large |
| Closing an entry feels meaningful | Redirects to a list | Large |

*Fix in: A4*

---

### Gap 2 — Narrative Continuity
| Vision | Reality | Size |
|---|---|---|
| Entries know about each other | Completely isolated | Large |
| Memory surface shows the past | MemorySurface.tsx exists, never integrated | Medium |
| Heatmap shows emotional shape of years | Not built | Large |

*Fix in: A3b, A4*

---

### Gap 3 — Navigation & Information Architecture
| Vision | Reality | Size |
|---|---|---|
| Timeline is the centrepiece | Entries/Archive/Calendar are three separate views | Large |
| Year → Month → Week → Day drill-down | No drill-down exists | Large |
| Reflection types accessed via heatmap | Broken buttons in Write section | Medium |

*Fix in: A3b*

---

### Gap 4 — Write Experience
| Vision | Reality | Size |
|---|---|---|
| Three modes: Quick/Guided/Deep | One mode, 5 fixed fields | Large |
| Daily rotating prompt surfaces naturally | prompts.ts exists, never shown | Medium |
| Memory surface in Write | Not integrated | Medium |

*Fix in: A4*

---

### Gap 5 — Visual & Emotional Quality
| Vision | Reality | Size |
|---|---|---|
| Warm minimal design language | Inconsistent mix of MUI + Radix | Medium |
| Mood/energy feel expressive | Flat text buttons, numbered circles | Medium |
| Typography creates clear hierarchy | Uniform font weights | Medium |
| One amber accent colour system | No accent colour system | Medium |

*Fix in: A3, A5*

---

### Gap 6 — Data Safety
| Vision | Reality | Size |
|---|---|---|
| Data is permanent and safe | localStorage — fragile, device-specific | Large |
| Unsaved changes warning | No warning exists | Large |
| Delete all requires confirmation | One click, irreversible | Critical |
| Import merges intelligently | Import overwrites silently | Large |

*Fix in: A3 (delete confirm), A4 (unsaved warning), B1 (Electron)*

---

### Gap 7 — Onboarding
| Vision | Reality | Size |
|---|---|---|
| New user understands philosophy immediately | WelcomeMessage.tsx unclear | Medium |
| First entry guided and warm | Blank form, no context | Large |
| Empty heatmap feels like invitation | Not built | Medium |

*Fix in: A5*

---

### Priority Order from SWOT + Gap Analysis

**Fix immediately:**
1. Delete all — add confirmation (30 min, critical risk)

**Build to deliver core promise:**
2. Heatmap emotional landscape — A3b
3. Write section redesign — A4
4. Memory surface integration — A4
5. Closing moment after save — A4

**Fix to be trustworthy:**
6. Unsaved changes warning — A4
7. Import merge strategy — A4b

**Fix to feel premium:**
8. Mood + energy visual upgrade — A3
9. Design language applied consistently — A5

**Strategic moat to protect always:**
10. Privacy positioning — document in README and case study
11. Witness philosophy — publish as essay, not just feature list

---

## THE PATH TO TRUE FORM

### Phase 1 — Making it Real
*Sessions A3 through A5*

The sketch becomes a painting. The heatmap lands. The Write section stops feeling like a form and starts feeling like a journal. The closing moment exists. The mood colours mean something.

At the end of A5 you will open the app and feel something for the first time. Not "this works" — but "this is mine." That's the moment it crosses from project to product.

*What it feels like: Pieces clicking into place. Each session reveals the app underneath the scaffolding.*

---

### Phase 2 — Living With It
*Between A5 and B1 — no building, just using*

The most underrated phase. Use it daily for 4-6 weeks. Nothing new gets built. Just live with it.

This is where the real gaps appear — not the ones you can think your way to, but the ones that reveal themselves at 11pm when you're tired and trying to write something true.

You'll discover:
- A prompt that always feels wrong on Mondays
- A closing moment that's slightly too long
- A heatmap colour that looks different in dark mode
- Something you reach for that isn't there yet

*What it feels like: Quiet frustration that becomes clarity. The app teaching you what it needs.*

---

### Phase 3 — Making it True
*B1 through B3 — Electron*

It stops being a web app and becomes a real object in your life. An application you install. A file that lives on your machine like a real journal on a shelf.

The first time you launch it from your desktop — not a browser tab — something shifts. It feels permanent. It feels like it matters.

*What it feels like: The difference between a note on your phone and a letter written by hand and sealed.*

---

### The True Form

The app reaches its true form when a user opens it years from now, clicks a year in the heatmap, and sees the emotional shape of a chapter of their life rendered in colour.

When they click into a week and read what they wrote during a hard time. When they see they were okay. That they got through it. That they were more thoughtful than they remembered being.

When the app surfaces something they wrote two years ago that speaks directly to something they're going through today — and they didn't ask it to. It just knew.

That's the true form. Not a feature. Not a design. A moment of recognition between a person and their own past self.

**The app is a time machine that only goes backwards. And that's exactly what makes it powerful.**

---

### What the Path Requires

**Patience over perfection.** Every session reveals something new to fix. That's not failure — that's the product maturing.

**Usage over building.** The phase between A5 and B1 where you just use it — don't skip this. It's where the best decisions come from.

**Trust the philosophy.** When a feature feels tempting but doesn't pass the Witness test — don't build it. The restraint is the product.

**Ship before it's ready.** The app doesn't need to be perfect to show employers. It needs to be honest and considered. The BUILDLOG already proves that.

---

## USER JOURNEY — DAY 1 TO DAY 10,000

*The north star for every design decision. Ask: which day does this serve?*

---

### Day 1 — The Stranger

**Who they are:** Someone who has tried journaling before and stopped. Going through a transition, a loss, a new chapter. Cautious hope — "maybe this time."

**What they see:** Empty heatmap. A full year of grey cells. No colour.

**The critical question:** Does the empty heatmap feel like an invitation or an accusation?

**What it must feel like:** A blank journal, freshly opened. Emptiness is potential, not failure.

**Empty state copy — the Witness test:**
- ❌ "No entries yet — start writing!" (manager)
- ✅ "This is yours. Start whenever you're ready." (witness)

**The first save:**
Must be specially warm. Not a celebration — a quiet acknowledgement.
> "Your first entry. It's here now. It'll always be here."
Then one cell lights up with colour. They see it. Something shifts.

**What brings them back on Day 2:** Not a notification. Not a streak. The memory of how it felt to write something true and have somewhere safe to put it.

**Gaps revealed at Day 1:**
- Empty heatmap needs carefully designed invitation state
- First save closing moment needs special treatment — warmer than regular saves
- No guided first entry — lands on blank form with no context
- Philosophy needs to be communicated before first write, not after

---

### Day 7 — The Returner

**Who they are:** Showed up more days than not. Maybe 5 of 7, maybe 3 of 7. They came back. Tentative sense of routine — not a habit yet, a possibility.

**What they see:** A small cluster of colour in the heatmap. This week. Their week. It looks like something.

**The first meaningful moment:** They click on a cell from 3 days ago. Read what they wrote. Think — "I forgot I felt that way." The memory machine begins to work.

**First continuity prompt — must land right:**
> "A few days ago you wrote about feeling uncertain at work. Still on your mind?"
- If tone is right → they feel understood
- If tone is wrong → they feel surveilled
The difference is entirely in phrasing and timing.

**The friction point at Day 7:** The form. They know which fields they always fill and which they always skip. 5 fields starts feeling like homework. Quick mode becomes essential here.

**Gaps revealed at Day 7:**
- Continuity prompt doesn't exist yet
- Quick mode doesn't exist — can't drop below 5 fields
- Memory surface not integrated into Write

---

### Day 30 — The Practitioner

**Who they are:** A journaler — they might not call themselves that yet. Writing has become part of how they process. The app is where they go when something happens.

**What they feel:** Ownership. "This is mine. These are my words."

**What they see:** A month of colour. Patterns they didn't know were there. Maybe they always write Sunday evenings. Maybe energy is always low on Thursdays. Maybe three entries mention the same person.

**The first revelation:** Insights start to mean something at Day 30. Not before — you need enough data. At 30 days the language analysis, mood chart, pattern recognition stop being features and start being mirrors.

**What the app should do:** Gently surface the monthly reflection option. Not push — offer.
> "You've been writing for a month. Some people find it useful to reflect on the whole month at once. No pressure."

**The risk at Day 30:** Complacency. Ritual established but app hasn't grown with them. Every day feeling identical — same form, same structure — practice becomes mechanical. Daily rotating prompts earn their place here.

**Gaps revealed at Day 30:**
- Monthly reflection not accessible naturally
- Insights give no indication they need 30 days of data to new users
- No "you've been writing for a month" quiet acknowledgement
- Daily prompts not rotating — same structure every day

---

### Day 365 — The Anniversary

**Who they are:** Someone whose year is in here. All of it. The good months and the hard ones. The decisions made, the feelings processed, the person they were becoming.

**What they feel:** Something between pride and vulnerability. A year of honest writing is a significant thing to have done.

**What they see:** The full heatmap. A complete year. The emotional shape of their life rendered in colour.

**This moment is what everything is being built toward.** Every other feature is in service of this.

**They will:**
- Click the darkest cells. The hard weeks. Re-read what they wrote.
- Click the brightest cells. The good months. Remember.
- Notice patterns they never could have seen from inside the year.
- Find an entry that makes them cry or laugh or feel proud.
- Feel, perhaps for the first time, that they have been witnessed.

**What the app should do on Day 365:** Nothing aggressive. No banner, no badge, no streak congratulations. Just — if they open near the anniversary — a quiet acknowledgement:
> "A year of writing. That's something."
Then get out of the way.

**Gaps revealed at Day 365:**
- No anniversary acknowledgement
- Yearly reflection prompt needs to feel earned — not just another form
- Heatmap must carry the emotional weight of a full year beautifully
- Search — critical by this point, doesn't exist

---

### Day 10,000 — The Life

**27 years of daily entries.**

**Who they are:** Someone who has used this app through multiple chapters of life. Jobs changed. Relationships formed and ended. People were lost. A self that has transformed multiple times.

**What they feel:** The app is an old friend. It knows things about them that no other person knows. It has held what they couldn't say out loud.

**What they see:** 27 years of heatmaps. A life in colour. Each year a different emotional texture.

**What the app owes this person:** Everything. Trusted with the most private contents of a human mind across decades. Owes them permanence, respect, and the ability to access every word instantly.

**The failure mode at Day 10,000:** The app doesn't exist anymore. The company shut down. The format became unreadable. The file was lost. This is why local-first matters. This is why open JSON matters. This is why export matters. Not for convenience — for permanence.

> A journal kept in a proprietary cloud app is a journal that can be taken away.
> A journal kept in a local file, in human-readable JSON, backed up wherever the user chooses — that's a journal that lasts a lifetime.

**Gaps revealed at Day 10,000:**
- Search — now existential, not just convenient
- Performance at scale — 10,000 entries in localStorage is impossible (Electron + indexed file storage needed)
- Legacy feature needs real thinking — not just an export button
- Data portability must be guaranteed — open format, local file, user-controlled backup

---

### The Feature-to-Day Framework

*Every feature decision should be mapped to which day it primarily serves.*

| Feature | Primary day | Notes |
|---|---|---|
| Empty heatmap invitation state | Day 1 | First impression — critical |
| First save closing moment (special) | Day 1 | Must be warmer than regular saves |
| Guided first entry | Day 1 | Not built |
| Quick mode | Day 7 | Reduces friction for returning users |
| Continuity prompt | Day 7 | Must feel understood not surveilled |
| Memory surface in Write | Day 7+ | Already exists, not integrated |
| Rotating daily prompts | Day 30 | Prevents mechanical sameness |
| Monthly reflection | Day 30 | Needs natural access point |
| Insights with data threshold | Day 30 | Show "building" state before 30 days |
| Full year heatmap | Day 365 | The moment everything is for |
| Yearly reflection earned | Day 365 | Must feel significant |
| Anniversary acknowledgement | Day 365 | Quiet, not celebratory |
| Search | Day 365 (critical) | Day 10,000 (existential) |
| Performance at scale | Day 10,000 | Electron partially solves |
| Legacy — real thinking | Day 10,000 | Currently just an export button |
| Local-first, open format | Every day | Non-negotiable from day 1 |
| Witness philosophy in copy | Every day | Audit every string in A5 |

---

## THE HUMAN LAYER

*What a human truly cherishes — and how to serve that without scope creep.*

---

### The Real Need

People want to feel **known**. Not categorised — known. There's a profound difference.

Age-based versions, gender-based themes, birthday notifications — these are attempts to serve the need to be known through demographics. They assume who you are before you've said a word.

The Witness never assumes. The Witness listens.

The deepest feeling of being known doesn't come from a purple theme or a birthday notification. It comes from someone saying — "remember when you told me that thing three years ago? I never forgot."

**That's what the app can do. That's already in the vision. The Human Layer is how we build toward it specifically.**

---

### What Was Considered and Why It Was Set Aside

| Idea | Why set aside |
|---|---|
| Age-based versions (teen, 20s, 30s+) | 16-year-old becomes 17, then 25 — infinite maintenance, unclear transitions |
| Gender-based themes | Reductive, binary, doesn't make anyone feel known — makes them feel categorised |
| Birthday notifications from app | Sweet once, expected forever — magic evaporates second time |
| Streak counters | Gamification — violates Witness philosophy completely |

These all fail the Witness test: they make the app feel like a manager who has filed you under a category.

---

### Tier 1 — Core (Sessions A3–A5)

Already planned. Serves every human on every day.

- Heatmap emotional landscape
- Write section redesign
- Memory surface integrated
- Closing moment after save
- Design language applied consistently

---

### Tier 2 — Human Layer (Post Phase A, before public release)

Features that ask the user to tell the app about their life — so the app can be a better witness to it.

**Important Dates System**

The dates that matter to a specific human:
- Birthday (self)
- Anniversary (relationship, recurring yearly)
- Memorial (loss, endings — recurring yearly)
- Milestone (one-time — first day of something significant)
- Birthday of someone who matters to them

On or near the date, the Write view quietly acknowledges:
> "Three years ago today you marked this as the day you left your hometown. You wrote about it then. Would you like to read it?"

Or if no entry exists:
> "Today is a date you marked as important — the anniversary of your father's passing. No pressure to write. This space is here if you need it."

That's not a feature. That's a witness.

**The People Layer**

Every journal is full of other people. The app currently has no concept of people.

User adds people who matter:
- Name
- Relationship type
- Optional birthday
- Optional notes

The app can then:
- Surface entries mentioning them
- On their birthday: "It's [person]'s birthday today. You've written about them 23 times."
- After absence: "You haven't mentioned [person] in your writing recently."

Not surveillance — recognition. The person chose to add them. The app honours that.

**User-Chosen Themes (feeling-based, not demographic)**

5 options. Each has a personality. User chooses based on feeling, not identity.

- **Morning Light** — warm cream, soft amber, gentle. For optimistic chapters.
- **Midnight** — deep navy, soft white. For contemplative seasons.
- **Forest** — muted green, earthy, grounded. For recovery and growth.
- **Minimal** — pure white, black text, nothing in the way. For clarity.
- **Warm** — terracotta, amber. For human, emotional periods.

They change it when they feel like it. No demographic assumptions. No maintenance burden. The theme becomes a reflection of where they are in life right now.

---

### Tier 3 — Never Build (violates Witness philosophy)

| Feature | Why never |
|---|---|
| AI that reads and interprets entries | The app must never read your journal — even an AI |
| Streak counters | Gamification — manager not witness |
| Age-based UI versions | Infinite maintenance, demographic assumption |
| Gender-based themes | Reductive, assumes identity |
| Social features — sharing entries | Private by design, always |
| Notifications that create urgency | Calm technology — never urgent |
| Recommendations based on content | Requires reading entries — never |
| Any form of advertising | Violates trust completely |

---

### The Tier Test

Before any new feature is considered:

1. Does it pass the Witness test? (witness vs manager)
2. Does it serve Day 1 through Day 10,000?
3. Does it require reading the user's entries? (if yes → never)
4. Does it assume who the user is? (if yes → reconsider)
5. Does it add complexity that must be maintained forever? (if yes → scope creep warning)

---

*End of BUILDLOG.md*
