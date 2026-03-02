# FEATURE-STATUS.md
# Premium Journal App — Feature Health Tracker
# Last updated: 2026-03-02
# Rule: update this file after every build session before committing.

---

## HOW TO USE THIS FILE

Every feature has a row. After every build session, update the Status column and add a row to the Update Log at the bottom.

**Status definitions:**
- `BUILT` — complete and in production
- `BUILT - NEEDS POLISH` — functional but known visual or UX debt
- `IN PROGRESS` — currently being built
- `PLANNED` — in BUILDLOG, not yet started
- `DEFERRED` — intentionally pushed back, reason documented
- `NEVER` — decided against, reason documented

**V1 column** — IN / POST / NEVER / TBD

---

## INFRASTRUCTURE & ARCHITECTURE

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| React + TypeScript + Vite setup | `BUILT` | A1 | IN | From Figma export |
| GitHub repo + .gitignore | `BUILT` | A1 | IN | |
| Storage abstraction layer (`db/index.ts`) | `BUILT` | A2 | IN | Single interface, Phase B swap-ready |
| localStorage CRUD — entries | `BUILT` | A2 | IN | Via `db.entries` |
| localStorage CRUD — habits | `BUILT` | A2 | IN | Via `db.habits` |
| localStorage CRUD — gentle starts | `BUILT` | A2 | IN | Via `db.gentleStarts` |
| localStorage CRUD — engagements | `BUILT` | A2 | IN | Via `db.engagements` |
| localStorage CRUD — preferences | `BUILT` | A2 | IN | Via `db.prefs` |
| localStorage CRUD — anchors | `BUILT` | A2 | IN | Via `db.anchors` |
| localStorage CRUD — eras | `BUILT` | A2 | IN | Via `db.eras` |
| localStorage CRUD — threads | `BUILT` | A2 | IN | Via `db.threads` |
| localStorage CRUD — questions | `BUILT` | A2 | IN | Via `db.questions` |
| localStorage CRUD — longform | `BUILT` | A2 | IN | Via `db.longform` |
| Full export/import JSON (`db.backup`) | `BUILT` | A2 | IN | All data types, single snapshot |
| `storage.ts` shim | `BUILT` | A2 | IN | Legacy compatibility, points to `db.entries` |
| Tag normalisation (`normaliseTags()`) | `BUILT` | A6a | IN | Applied on add, update, import |

---

## NAVIGATION & LAYOUT

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| Left sidebar navigation | `BUILT` | A2 | IN | 4 groups: Today / Understand / Explore / Settings |
| Sidebar collapse to icon-only | `BUILT` | A2 | IN | |
| Mobile slide-in drawer | `BUILT` | A2 | IN | |
| Default landing view: Timeline | `BUILT` | A3b | IN | Changed from Write in A3b |
| 11 nav items (reduced from 14) | `BUILT` | A3b | IN | Entries, Archive, Calendar absorbed into Timeline |

---

## WRITE EXPERIENCE

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| Quick / Guided / Deep mode switcher | `BUILT` | A4 | IN | |
| Quick Capture mode | `BUILT` | A4 | IN | Single textarea, fast save |
| Guided mode — 5 writing fields | `BUILT` | A4 | IN | whatHappened, feelings, whatMatters, insight, freeWrite |
| Deep Write mode | `BUILT` | A4 | IN | Full-screen, distraction-free |
| Deep Write — word count | `BUILT` | A4e | IN | Fades in once writing starts, no target |
| Deep Write — typewriter scroll | `BUILT` | A4e | IN | Active line stays centred |
| Deep Write — amber caret | `BUILT` | A4e | IN | `caretColor: #f59e0b` |
| Deep Write — display font title | `BUILT` | A4e | IN | Cormorant Garamond |
| Display font on date headings | `BUILT` | A4e | IN | Applied across Write and ClosingMoment |
| Mood selector — compact emoji row | `BUILT` | A6b-polish | IN | Replaced large cards. Label animates in on select. |
| Energy selector — bars only | `BUILT` | A6b-polish | IN | No number labels. Single row with mood. |
| Closing moment after save | `BUILT` | A4 | IN | Full-screen overlay, 2.8s, rotating lines |
| First-entry special closing line | `BUILT` | A4d | IN | "Your first entry. The map has begun." |
| Unsaved changes guard | `BUILT` | A4 | IN | `window.confirm` on Cancel if form is dirty |
| Contextual prompt strip | `BUILT` | A4 | IN | Year-ago > continuity > daily prompt priority |
| Year-ago memory surface | `BUILT` | A4 | IN | ±3 day window, suppressed for reflections |
| Continuity prompt (yesterday) | `BUILT` | A4 | IN | Suppressed for reflection entries |
| Daily rotating prompts | `BUILT` | A4 | IN | From `prompts.ts` |
| Memory surface (similar entries) | `BUILT` | A4 | IN | `findSimilarEntries()`, dismissable |
| Staggered entrance animations | `BUILT` | A5a | IN | All guided form sections cascade |
| Reflection type metadata (custom labels) | `BUILT` | A4b | IN | Weekly/monthly/yearly field labels and placeholders |
| Intention field (reflections only) | `BUILT` | A4c | IN | Forward-looking, not a commitment |
| One-word closing field (reflections only) | `BUILT` | A5a | IN | Past-facing, single word enforced |
| `getPreviousPeriodIntention()` | `BUILT` | A4c | IN | Surfaces last period's intention as opening prompt |
| Long-form / Deep Write flag (`isLongForm`) | `BUILT` | A4 | IN | Field existed in types, wired in A4 |
| Silent markdown support | `BUILT` | A4e | IN | Renders in DayView |
| Tags input (TagManager) | `BUILT` | A6a | IN | Inline, autocomplete, Enter/comma/Backspace |
| Era selector in Write | `PLANNED` | A7a | TBD | Decision needed: manual/auto/hybrid |

---

## TIMELINE & HEATMAP

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| Year heatmap — 12 months × daily dots | `BUILT` | A3b | IN | Mood-coloured per entry |
| Drill-down: year → month → week → day | `BUILT` | A3b | IN | Breadcrumb nav, click any level |
| Year selector sidebar | `BUILT` | A3b | IN | Newest first, mood dot per inactive year |
| Month view — full calendar grid | `BUILT` | A3b | IN | Mood-coloured tiles |
| Week view — vertical timeline dots | `BUILT` | A3b | IN | Connected by line, day cards with preview |
| Day view — full read mode | `BUILT` | A3b | IN | Mood/energy bar, all fields, Edit button |
| Reflection dots on heatmap | `BUILT` | A4b | IN | Violet/sky/rose per type |
| Reflection panels (Month/Week/Year) | `BUILT` | A4c | IN | Full content, intention at top |
| Dynamic level-aware sidebar | `BUILT` | A4c | IN | Year=years, month=months+dots, week/day=7-day strip |
| Welcome card (first-run empty state) | `BUILT` | A4d | IN | Animates out once first entry exists |
| Today's cell pulse (no entries) | `BUILT` | A4d | IN | Amber ring, stops after first save |
| Daily opening prompt (below heatmap) | `BUILT` | A4d | IN | Fades after 6s, once per day |
| Active intention surface | `BUILT` | A4d | IN | Shows latest weekly/monthly intention |
| Year-in-numbers summary | `BUILT` | A4d | IN | Witness-compliant mood phrases |
| Most-active-day observation | `BUILT` | A5b | IN | "You tend to write on Tuesdays" |
| Tag filter — `activeTagFilter` state | `BUILT` | A6b | IN | Internal to TimelineView |
| Tag filter strip (breadcrumb) | `BUILT` | A6b | IN | All drill levels, AnimatePresence |
| Heatmap fading when tag filter active | `BUILT` | A6b | IN | Unmatched cells opacity-20 |
| MonthView fading when tag filter active | `BUILT` | A6b | IN | In-month unmatched cells opacity-20 |
| WeekView fading when tag filter active | `BUILT` | A6b | IN | Entire unmatched rows opacity-25 |
| DayView tag pills clickable | `BUILT` | A6b | IN | Sets filter + navigates to year view |
| Era overlay on heatmap | `PLANNED` | A7b | TBD | Background band behind dots |
| Era label in month/week/day views | `PLANNED` | A7b | TBD | Quiet "Chapter: [name]" |
| Era filter (shares A6b infrastructure) | `PLANNED` | A7b | TBD | |

---

## REFLECTION SYSTEM

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| Weekly reflection entries | `BUILT` | A4b | IN | Synthetic key: `reflection-weekly-YYYY-MM-DD` |
| Monthly reflection entries | `BUILT` | A4b | IN | Synthetic key: `reflection-monthly-YYYY-MM` |
| Yearly reflection entries | `BUILT` | A4b | IN | Synthetic key: `reflection-yearly-YYYY` |
| Reflection type badge in DayView | `BUILT` | A4b | IN | Violet/sky/amber pill |
| Reflection prompt from `prompts-v2.ts` | `BUILT` | A4b | IN | Per reflection type |
| Continuity/year-ago suppressed for reflections | `BUILT` | A4b | IN | |

---

## HABITS

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| HabitBuilder view | `BUILT` | A1 | IN | From original Figma export |
| `habits.ts` shim → `db.habits` | `BUILT` | A2 | IN | |
| 21-day gentle start visual (GentleStartTracker) | `BUILT` | A2 | IN | 3×7 grid, milestone markers, celebration state |
| Habit philosophy: no streaks, no urgency | `BUILT` | A2 | IN | Locked product decision |

---

## ERAS (LIFE CHAPTERS)

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| Era CRUD (basic) | `BUILT - NEEDS POLISH` | A1 | IN | Original ErasManager, unstyled |
| `eras.ts` shim → `db.eras` | `PLANNED` | A7a | IN | Mechanical, 15 min |
| ErasManager redesign | `PLANNED` | A7a | IN | Warm minimal design language |
| Era colour palette (6 warm colours) | `PLANNED` | A7a | IN | Decisions needed — must not clash with mood system |
| Overlap detection + inline warning | `PLANNED` | A7a | IN | Warn don't prevent |
| Delete with inline confirmation | `PLANNED` | A7a | IN | Un-tags entries on delete |
| Open-ended eras (no end date = ongoing) | `BUILT - NEEDS POLISH` | A7a | IN | Logic exists, UI needs polish |
| Era surfaces on Timeline | `PLANNED` | A7b | TBD | Background band, legend, labels |
| Era filter | `PLANNED` | A7b | TBD | |

---

## INNER COMPASS (ANCHORS + QUESTIONS)

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| ReflectionAnchors view (basic) | `BUILT - NEEDS POLISH` | A1 | IN | Original, unstyled |
| PersistentQuestions view (basic) | `BUILT - NEEDS POLISH` | A1 | IN | Original, unstyled |
| `preferences.ts` shim → `db.prefs` + `db.anchors` | `BUILT` | A2 | IN | |
| Merge into InnerCompass.tsx | `PLANNED` | A8a | TBD | Two-tab: Values + Questions |
| Values tab | `PLANNED` | A8a | TBD | Add/edit/delete/reorder |
| Values surface in Write | `PLANNED` | A8a | TBD | Quiet context line |
| Questions tab | `PLANNED` | A8b | TBD | Open/closed state, entry count |
| Question surfaced in Write | `PLANNED` | A8b | TBD | Opt-in |
| Question thread view | `PLANNED` | A8b | TBD | Chronological entries |
| Question lifecycle (resolve → value) | `PLANNED` | A8c | TBD | |

---

## INSIGHTS

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| Insights view (basic) | `BUILT - NEEDS POLISH` | A1 | IN | Original, needs Witness redesign |
| MoodChart view (basic) | `BUILT - NEEDS POLISH` | A1 | IN | Recharts, needs integration |
| LanguageInsights view (basic) | `BUILT - NEEDS POLISH` | A1 | IN | Needs absorption into Insights |
| Insights audit + Witness redesign | `PLANNED` | A9a | TBD | |
| Connected insights (tag/era/habit patterns) | `PLANNED` | A9b | TBD | POST-V1 candidate |

---

## THREADS & MEMORY

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| MemoryThreads view (basic) | `BUILT - NEEDS POLISH` | A1 | IN | Original, unstyled |
| `threads.ts` → `db.threads` | `BUILT` | A2 | IN | |
| Threads reading experience redesign | `PLANNED` | A10a | TBD | |
| Intelligent thread building | `PLANNED` | A10b | TBD | |

---

## SEARCH

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| Full-text search | `DEFERRED` | A6c | TBD | Build when 30+ real entries. Brainstorm complete. |
| Filtered browse (mood + date + tag) | `PLANNED` | A6c phase 2 | TBD | More useful than keyword alone |
| Search empty state + no-results copy | `PLANNED` | A6c | TBD | Brainstorm complete, copy decisions needed |

---

## PRIVACY & DATA

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| PrivacySettings view | `BUILT - NEEDS POLISH` | A1 | IN | Partial export, needs hardening |
| Full export/import (all data types) | `BUILT` | A2 | IN | `db.backup.exportAll()` / `importAll()` |
| DataLegacy view | `BUILT - NEEDS POLISH` | A1 | IN | Currently just export button |
| Zero telemetry | `BUILT` | A1 | IN | Permanent product decision |
| Local-only storage | `BUILT` | A1 | IN | Phase A: localStorage. Phase B: file. |

---

## ONBOARDING

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| WelcomeCard (first-run empty state) | `BUILT` | A4d | IN | Dismissable, disappears after first entry |
| WelcomeMessage component | `BUILT - NEEDS POLISH` | A1 | IN | Original, may need review |
| Guided first entry | `PLANNED` | TBD | TBD | Not yet scheduled |

---

## PHASE B — ELECTRON

| Feature | Status | Session | V1 | Notes |
|---|---|---|---|---|
| Electron wrapper | `PLANNED` | B1 | POST-V1 (Phase B) | |
| electron-store file storage | `PLANNED` | B1 | POST-V1 (Phase B) | Replaces localStorage |
| Cross-platform builds (GitHub Actions) | `PLANNED` | B2 | POST-V1 (Phase B) | Linux/Windows/Mac |
| App icon + window behaviour | `PLANNED` | B3 | POST-V1 (Phase B) | |

---

## NEVER BUILD (Tier 3 — Witness violations)

| Feature | Status | Reason |
|---|---|---|
| AI that reads and interprets entries | `NEVER` | App must never read your journal |
| Streak counters | `NEVER` | Gamification — manager not witness |
| Social sharing | `NEVER` | Private by design, always |
| Notifications that create urgency | `NEVER` | Calm technology |
| Recommendations based on content | `NEVER` | Requires reading entries |
| Advertising | `NEVER` | Violates trust completely |
| Age-based UI versions | `NEVER` | Demographic assumption, infinite maintenance |
| Gender-based themes | `NEVER` | Reductive, assumes identity |

---

## UPDATE LOG

| Date | Session | What changed |
|---|---|---|
| 2026-03-02 | Documentation strategy session | File created. All features entered from BUILDLOG review. |

---

*Update this file after every build session. It is only useful if it reflects reality.*
