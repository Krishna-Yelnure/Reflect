# BUILDLOG.md
# Premium Journal App — Project Source of Truth
# Last updated: Session A4c-fix3 complete (2026-03-01)

---

## HOW TO USE THIS FILE

This file is the single source of truth for this project.
At the start of every new session, share this file + the project zip with Claude and say:
**"Read the BUILDLOG.md and continue from [SESSION NAME]."**
Update this file at the end of every session with what was done and what's next.

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
**Status:** NOT STARTED

**Goal:** Clicking month label in Timeline → Monthly reflection form. Week → Weekly. Year → Yearly.

**What to build:**
- Monthly prompt set: biggest shift, what you'd tell past self, growth area, what to carry forward
- Weekly prompt set: wins, challenges, patterns, next week intention, one word summary
- Yearly prompt set: major chapters, who you became, what to leave behind, word for the year
- Wire Timeline month label click → Write with reflectionType pre-set to 'monthly'
- Wire Timeline week click → Write with reflectionType pre-set to 'weekly'
- Wire Timeline year selector → Write with reflectionType pre-set to 'yearly'
- Timeline then shows those entry types with appropriate colour/indicator

**Files to upload:**
- `BUILDLOG.md`
- `src/app/components/TimelineView.tsx`
- `src/app/components/JournalEntry.tsx`
- `src/app/utils/prompts-v2.ts`

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
**Status:** ✅ COMPLETE (2026-03-01)

**Goal:** Make reflections readable inline. Close the loop between past reflection and future intention.

**`types.ts`** — Added `intention?: string` to `JournalEntry` interface. Optional, additive — no migration needed.

**`JournalEntry.tsx`**
1. `getPreviousPeriodIntention()` helper — filters entries by reflection type prefix, finds most recent with a non-empty intention, returns *"Last week you intended: '[X]' — how did that unfold?"* Truncates at 80 chars. Returns null cleanly when nothing exists.
2. `previousIntention` computed — joins `continuityPrompt` and `yearAgoEntry` in contextual prompts block. Reflection entries only, never daily.
3. `ContextualPrompt` updated — new `previousIntention` prop. Priority: year-ago → continuity → previous intention → daily prompt. Renders in violet card with 🔁 icon.
4. Intention textarea — bottom of guided mode for reflection entries only, after writing fields, before Tags. Label/placeholder vary by type. Subtext: *"Not a goal. Not a commitment. Just a direction."*

**`TimelineView.tsx`**
1. `ReflectionPanel` component — replaces all flat banners. Empty state: accent card + "Write →". Written state: all non-empty fields with period-appropriate labels, mood emoji, Edit button, intention in italic at bottom. Colour-coded: violet/weekly, sky/monthly, amber/yearly.
2. MonthView, WeekView, Year view all use ReflectionPanel.

**Files changed:** `src/app/types.ts`, `src/app/components/JournalEntry.tsx`, `src/app/components/TimelineView.tsx`

---

#### SESSION A4c-fix — Reflection UX Corrections
**Status:** ✅ COMPLETE (2026-03-01)

**Problems fixed (visual review):**
1. Empty yearly panel appearing on Day 1 — pressure before any writing done
2. Yearly colour rose/red — felt anxious, violated colour philosophy
3. Mood/energy + mode switcher on reflection forms — wrong questions for a period review

**`TimelineView.tsx`** — All rose → amber. Empty yearly panel hidden: `if (!yearlyReflection) return null`. Entry point: sidebar `+` only.

**`JournalEntry.tsx`** — Mode switcher: `{!isReflection && <ModeSwitcher />}`. Mood+energy: `{!isReflection && (...)}`. Reflection form now: date → badge → previous intention prompt → writing fields → intention → tags → save.

**Decisions locked:** Yearly gate = written only. Yearly colour = amber. Mood/energy on reflections = never.

**Files changed:** `src/app/components/TimelineView.tsx`, `src/app/components/JournalEntry.tsx`

---

#### SESSION A4c-fix2 — Timeline Stats, Intentions, Blank Screen Bug
**Status:** ✅ COMPLETE (2026-03-01)

**Problems fixed:**
1. Year stat duplicated in breadcrumb AND BelowHeatmap
2. "This week you intended" showing monthly intention — label wrong
3. Month/week views showing year stats instead of period-scoped stats
4. **Critical bug:** editing any reflection → blank screen. Root cause: `handleEditEntry` always set `pendingReflectionType('daily')`.

**`App.tsx`** — `handleEditEntry` infers type from date key prefix. `activeIntention` returns `{ text, type }` instead of bare string.

**`TimelineView.tsx`** — Breadcrumb stat level-aware (year/month/week scoped). BelowHeatmap: removed duplicate stat, fixed intention label. `mostActiveDay()` helper added — *"You write most on Sundays."* Monthly intention above calendar grid. Weekly intention above day timeline. Both only when written.

**Files changed:** `src/app/App.tsx`, `src/app/components/TimelineView.tsx`

---

#### SESSION A4c-fix3 — Dynamic Sidebar, Dot States, ReflectionPanel Polish
**Status:** ✅ COMPLETE (2026-03-01)

**Problems fixed (visual review + user feedback):**
1. Right sidebar always showed years regardless of drill level — disorienting in month/week/day views
2. Entries written in Deep/Quick mode (no mood set) looked identical to empty days on the heatmap
3. ReflectionPanel showed intention at the bottom — wrong narrative order, intention should lead
4. "You write most on Sundays" appeared after an intention in month view — wrong context, year-only observation
5. Day view showed year stat in breadcrumb — noise when reading a single entry
6. Day view had no useful sidebar navigation

**`TimelineView.tsx` — 6 changes:**

**Dynamic right sidebar** — four distinct states:
- Year view: year list with mood dots and yearly reflection dots (unchanged)
- Month view: Jan–Dec for the active year, active month highlighted, mood dot or reflection badge per month
- Week view: 7 days of the focused week with day names + mood/dashed-ring dots. Click written → day view. Click empty → write form.
- Day view: same 7-day week sidebar, current day highlighted. Navigate between days without going up levels.

**"Written, no mood" dot** — entries without a mood now render as `bg-slate-200` with dashed ring border (`ring-1 ring-slate-400 ring-dashed`). Clearly different from empty `bg-slate-100`. Appears in heatmap and sidebar navigation dots. Covers Deep/Quick writes that don't capture mood.

**ReflectionPanel layout inverted** — intention moved to top, separated by divider, before content fields. Thread from last period is the first thing seen — contextualises everything below. No intention = section absent, no layout shift.

**BelowHeatmap reordered** — prompt → witness observation → intention. Thematically: reflective content first, active content last. "You write most on…" no longer appears mid-intention.

**Day view breadcrumb stat hidden** — `{level !== 'day' && <span>...stat...</span>}`. Reading a single entry, the year aggregate is noise.

**Brainstorm decisions locked for next session (A5):**
- One-word closing field at end of all reflection forms (weekly/monthly/yearly) — *"A word for how this period felt"* — past-facing, observational, Witness-compliant
- Staggered entrance animations on panels/cards (Framer Motion already available)
- HTML reference inspiration: card-label trailing line dividers and inline prompt chips deferred to A5 design polish pass
- HTML habits tracker, streak labels, celebratory saves — explicitly rejected (anti-Witness)

**Files changed:** `src/app/components/TimelineView.tsx`

---

#### SESSION A5 — Design Polish Pass ← START HERE NEXT
**Status:** NOT STARTED

**Goal:** Apply design principles, audit copy, elevate visual quality. Also carry in deferred items from A4c-fix3.

**Carry-in from A4c-fix3:**
- [ ] One-word closing field on all reflection forms (weekly/monthly/yearly) — *"A word for how this period felt"*
- [ ] Staggered entrance animations on ReflectionPanel fields and cards

**Design polish checklist:**
- [ ] Typographic hierarchy — stronger heading font, lighter body
- [ ] Purposeful accent colour — one warm colour applied consistently
- [ ] Copy audit — every label, placeholder, empty state checked for emotional safety tone
- [ ] **Mood language audit** — hard day counts never shown, negative tallies never shown, tender language for difficult periods
- [ ] Empty states — turn bare empty views into invitations
- [ ] Microinteractions — review key moments: save, delete, mood select
- [ ] Consistent visual language — border radius, shadow, colour logic unified
- [ ] Inline prompt chips above textarea fields (from HTML reference)
- [ ] Card-label trailing line dividers (from HTML reference — evaluate fit)
- [ ] Welcome/home state — handled in A4d
- [ ] Closing moment after save — handled in A4

**Files needed:** Multiple — assess at session start

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

## HOW TO START SESSION A4d

In a new Claude conversation, say exactly this:

> "I am building a privacy-first journaling desktop app. Please read the BUILDLOG.md carefully, then help me complete Session A4d — First-run empty state and below-heatmap space."

Then attach:
1. This `BUILDLOG.md`
2. `src/app/components/TimelineView.tsx`
3. `src/app/components/JournalEntry.tsx`

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
| Session A4c | — | Reflection panels (inline readable) + Intentions loop | ⏳ Pending |
| Session A4d | — | First-run empty state + below-heatmap space (daily prompt, intention surface, year-in-numbers) | ⏳ Next |
| Session A5 | — | Design polish — Witness design language, mood language audit, copy audit | ⏳ Pending |
| Session B1 | — | Electron wrapper | ⏳ Pending |
| Session B2 | — | GitHub Actions CI | ⏳ Pending |
| Session B3 | — | Polish and final testing | ⏳ Pending |
| Session C1 | — | Portfolio assets | ⏳ Pending |

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

---

## CORE PHILOSOPHY — THE WITNESS

> "A quiet witness to your life. Holds your memories. Surfaces your patterns. Never judges. Always remembers."

This is the product. Every feature decision passes this test:
**"Does this make the app feel more like a witness — or more like a manager?"**

| Feature | Test result |
|---|---|
| Closing moment after save | ✅ Witness |
| Memory surface in Write | ✅ Witness |
| Continuity prompt | ✅ Witness |
| Daily rotating prompt | ✅ Witness |
| Emotional landscape heatmap | ✅ Witness |
| Quick/Guided/Deep write modes | ✅ Witness |
| Mood visual upgrade | ✅ Witness |
| Reflection panels (inline readable) | ✅ Witness |
| Intentions loop (prompt not metric) | ✅ Witness |
| Daily opening prompt (fades, no friction) | ✅ Witness |
| Intention surface below heatmap | ✅ Witness |
| Year-in-numbers (positive highlights only) | ✅ Witness |
| First-run WelcomeCard | ✅ Witness |
| Word count | ❌ Manager — removed |
| Streaks | ❌ Manager — never build |
| Activity-based heatmap (green = wrote) | ❌ Manager — reframed to mood-based |
| To-do list / top 3 tasks | ❌ Manager — creates obligation, completion anxiety |
| Hard day counts in stats | ❌ Manager — tallies pain, never show |

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
