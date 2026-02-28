# BUILDLOG.md
# Premium Journal App — Project Source of Truth
# Last updated: Session A2 brainstorm complete (2026-02-28)

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
| Session A2b | 2026-02-28 | Brainstorming: Witness philosophy, heatmap architecture, sidebar redesign, Write section enhancements, human-centred feature audit | ✅ Complete (brainstorm only) |
| Session A3 | — | Mood + energy visual upgrade in JournalEntry.tsx | ⏳ Next |
| Session A3b | — | Timeline/Heatmap — emotional landscape view replacing Entries + Archive + Calendar | ⏳ Pending |
| Session A4 | — | Write section redesign — Quick/Guided/Deep modes, memory surface, closing moment, daily prompt | ⏳ Pending |
| Session A4b | — | Weekly/Monthly/Yearly reflection types accessed via heatmap | ⏳ Pending |
| Session A5 | — | Design polish — apply Witness design language consistently | ⏳ Pending |
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
- **2026-02-28 (A2b):** Questions + Threads — consider merging in A5 as both connect entries across time

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
| Word count | ❌ Manager — removed |
| Streaks | ❌ Manager — never build |
| Activity-based heatmap (green = wrote) | ❌ Manager — reframed to mood-based |

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

---

*End of BUILDLOG.md*
