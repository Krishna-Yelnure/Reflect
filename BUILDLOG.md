# BUILDLOG.md
# Premium Journal App — Project Source of Truth
# Last updated: Session A2 complete (2026-02-28)

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

#### SESSION A3 — Mood & Energy Visual Upgrade ← START HERE NEXT
**Status:** NOT STARTED

**Goal:** Make mood and energy inputs feel premium, warm and expressive

**Decided approach (from A2 brainstorm):**
- Mood: Large emoji buttons with soft colour wash on selected state. No text needed.
  - Great = warm amber glow, Good = soft green, Okay = neutral, Low = cool blue, Difficult = muted grey
- Energy: 5 vertical bars like a signal meter, amber/gold colour, grows left to right

**Files to upload for this session:**
- `BUILDLOG.md`
- `src/app/components/JournalEntry.tsx`

**Steps:**
1. Read JournalEntry.tsx to understand current mood/energy implementation
2. Replace mood buttons with large emoji + colour wash design
3. Replace energy circles with vertical bar meter
4. Confirm all views still work
5. Commit and push

**Deliverable:** Mood and energy inputs feel polished and warm

---

#### SESSION A4 — Weekly/Monthly/Yearly Reflection Types
**Status:** NOT STARTED

**Goal:** Different prompt sets per reflection type — not just a label change

**Ripple effects to handle (mapped in A2):**

| Component | Change needed |
|---|---|
| JournalEntry.tsx | Different prompts per type |
| EntriesList.tsx | Badge/filter by type |
| ArchiveView.tsx | Group or filter by type |
| CalendarView.tsx | Weekly/monthly shown on day written |
| MoodChart.tsx | Filter by entry type |
| Insights.tsx | Weight weekly/monthly entries differently |
| LanguageInsights.tsx | Option to filter by type |

**Decision locked:** All entries belong to the day they were written, tagged with type. No date ranges.

**Prompt sets to build:**
- Daily: what happened, feelings, what mattered, insight, free write (current)
- Weekly: wins this week, challenges, patterns noticed, next week intention, one word summary
- Monthly: biggest shift, what you'd tell past self, growth area, what to carry forward
- Yearly: major chapters, who you became, what to leave behind, word for the year

**Files to upload for this session:**
- `BUILDLOG.md`
- `src/app/components/JournalEntry.tsx`
- `src/app/components/EntriesList.tsx`
- `src/app/components/ArchiveView.tsx`
- `src/app/components/MoodChart.tsx`
- `src/app/components/Insights.tsx`

---

#### SESSION A5 — Design Polish Pass
**Status:** NOT STARTED

**Goal:** Apply design principles, audit copy, elevate visual quality

**Checklist (from design principles):**
- [ ] Typographic hierarchy — stronger heading font, lighter body
- [ ] Purposeful accent colour — one warm colour applied consistently
- [ ] Copy audit — every label, placeholder, empty state checked for emotional safety tone
- [ ] Empty states — turn bare empty views into invitations
- [ ] Microinteractions — review key moments: save, delete, mood select
- [ ] Consistent visual language — border radius, shadow, colour logic unified
- [ ] Welcome/home state — "Good morning. You last wrote X days ago about..."
- [ ] Closing moment after save — not just redirect to entries list

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

## HOW TO START SESSION A3

In a new Claude conversation, say exactly this:

> "I am building a privacy-first journaling desktop app. Please read the BUILDLOG.md carefully, then help me complete Session A3 — mood and energy visual upgrade."

Then attach:
1. This `BUILDLOG.md`
2. `src/app/components/JournalEntry.tsx`

---

## SESSION LOG

| Session | Date | What was done | Status |
|---|---|---|---|
| Session 0 | 2026-02-27 | Full brainstorming. All decisions locked. BUILDLOG created. | ✅ Complete |
| Session A1 | 2026-02-27 | App running in browser, all 14 views confirmed, GitHub repo set up, .gitignore added | ✅ Complete |
| Session A2 | 2026-02-28 | Storage abstraction layer, 21-day habit tracker, sidebar navigation, design principles + product vision brainstorm | ✅ Complete |
| Session A3 | — | Mood + energy visual upgrade | ⏳ Next |
| Session A4 | — | Weekly/Monthly/Yearly reflection types + ripple effects | ⏳ Pending |
| Session A5 | — | Design polish pass | ⏳ Pending |
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
- **2026-02-28 (A2):** Weekly/Monthly/Yearly ripple effects mapped — defer to A4, too big for end of A2
- **2026-02-28 (A2):** Screen space/layout — keep centred max-width for now, revisit in A5
- **2026-02-28 (A2):** All entries belong to the day written, tagged with reflectionType — no date ranges
- **2026-02-28 (A2):** App currently rated 6.5/10 — good bones, needs narrative continuity to reach 9/10

---

## DESIGN PRINCIPLES (for Session A5 visual review)

1. **Calm Technology** — no aggressive colours, no urgent language, no guilt
2. **Progressive Disclosure** — simple for new users, depth for power users
3. **Emotional Safety** — every label and prompt written with care, never judgmental
4. **Typographic Hierarchy** — strong display font for headings, lighter for body
5. **Microinteractions** — intentional, warm, satisfying moments at key actions
6. **Spatial Breathing Room** — generous padding, whitespace signals quality
7. **Consistent Visual Language** — same border radius, shadow, colour logic everywhere
8. **Feedback at Every Action** — quiet confirmations, not loud toasts for everything
9. **Purposeful Colour** — one warm accent, semantic use, colour carries meaning not decoration
10. **Empty States as Invitations** — open door copy, not a void

**Top 3 highest impact for A5:**
- Typographic hierarchy
- Purposeful accent colour applied consistently
- Emotional safety audit of all copy and placeholders

---

## PRODUCT VISION & ROADMAP (north star for post-A5)

**Core vision:**
> "Record the thought process of that day and how it impacts the next set of days and life itself."

**Current rating: 6.5/10** — good bones, needs narrative continuity.

**Biggest gap — Narrative & Continuity:**
- Entries exist in isolation, no thread between them
- No "story of me" view — timeline with emotional shape
- No connections between entries across time
- Eras and Threads exist but are manual and disconnected from writing

**Incomplete daily loop:**
- Current: Open → blank form → write → save → redirects to list
- Needed: Open → welcomed back → prompted by recent writing → write → feel heard → closing moment → close

**Personality development features (future):**
- Belief tracker — what did you believe in Jan vs now?
- Decision journal — record why, revisit outcome later
- Growth markers — explicit "I've changed on this" moments
- Pattern recognition — app notices recurring themes automatically

**Critical missing features:**
- Search — no search at all, serious omission for a memory app
- Import — from Day One, Notion, plain text
- Reading mode — distraction-free view of past entries like a book
- Local reminders — browser notification at chosen time, no server needed
- Photos/attachments — even one photo per entry anchors memory

**What takes this to 9/10:**
1. Narrative continuity — entries that know about each other
2. Satisfying daily ritual loop with welcome and closing moment
3. Search
4. Reading mode
5. Belief tracking + decision journal + growth markers

---

*End of BUILDLOG.md*
