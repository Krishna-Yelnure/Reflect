# BUGS-AND-DEBT.md
# Premium Journal App — Known Issues & Technical Debt
# Last updated: 2026-03-02
# Rule: log issues as you find them. Fix before early adopter testing.

---

## HOW TO USE THIS FILE

Log any known issue, rough edge, or technical debt here as soon as it's identified.
Do not wait for a dedicated fix session — capture it now, fix it when the right session comes.

**Severity:**
- `CRITICAL` — data loss risk or broken core flow
- `MAJOR` — feature doesn't work as intended, visible to users
- `MINOR` — works but feels wrong or incomplete
- `COSMETIC` — visual only, no functional impact
- `DEBT` — works fine now but will cause problems at scale or in Phase B

**Status:**
- `OPEN` — not yet fixed
- `IN PROGRESS` — being worked on
- `FIXED` — resolved, note which session

---

## CRITICAL

| # | Issue | Component | Discovered | Fix Plan | Status |
|---|---|---|---|---|---|
| C1 | localStorage has 5-10MB limit. At scale (years of entries), data could silently fail to save. No warning shown to user. | `db/index.ts` | A2 | Phase B (Electron + file storage) fully solves. Phase A: add storage quota check + gentle warning in PrivacySettings. | `OPEN` |

---

## MAJOR

| # | Issue | Component | Discovered | Fix Plan | Status |
|---|---|---|---|---|---|
| M1 | Deleting an era does not currently un-tag entries. `handleDelete` in ErasManager only removes the era record — entries with that `eraId` are orphaned. | `ErasManager.tsx` | A7a brainstorm | Fix in A7a — loop through entries on delete, set `eraId` to undefined. | `OPEN` |
| M2 | PrivacySettings export is partial — does not include all data types introduced after original build (eras, threads, questions, longform). Import may silently drop data. | `PrivacySettings.tsx` | A2 | Audit and update to use `db.backup.exportAll()` / `importAll()`. Schedule in a polish session. | `OPEN` |
| M3 | WelcomeMessage component (original Figma export) has not been reviewed or updated to current design language. May show stale or conflicting copy. | `WelcomeMessage.tsx` | A4d | Review in A9a or a dedicated polish pass. | `OPEN` |

---

## MINOR

| # | Issue | Component | Discovered | Fix Plan | Status |
|---|---|---|---|---|---|
| m1 | `ReflectionModeSelector.tsx` was removed from usage but may still exist as a file in the codebase. Dead code. | `ReflectionModeSelector.tsx` | A4 | Delete file and confirm no remaining imports. Quick cleanup. | `OPEN` |
| m2 | Year-ago prompt uses ±3 day window which could theoretically surface an entry from a completely different context if writing habits are irregular. No edge case handling for this. | `JournalEntry.tsx` | A4 | Acceptable for now. Revisit if user feedback identifies false positives. | `OPEN` |
| m3 | ErasManager currently has 7 colours including red and generic grey — will clash with mood colour system on heatmap in A7b. Must be resolved before A7a build. | `ErasManager.tsx` | A7a brainstorm | Decision and palette replacement in A7a. | `OPEN` |
| m4 | `getActive()` in `eras.ts` only returns one active era (first with no end date). Doesn't handle multiple concurrent eras. | `eras.ts` | A7a brainstorm | Fix in A7a when overlap logic is built. | `OPEN` |
| m5 | Continuity prompt shows yesterday's entry text in quotes — if the entry contains quotation marks, the string may display awkwardly. | `JournalEntry.tsx` | A4 | Sanitise preview string before inserting into prompt template. Minor. | `OPEN` |

---

## COSMETIC

| # | Issue | Component | Discovered | Fix Plan | Status |
|---|---|---|---|---|---|
| co1 | Several original Figma export components (ErasManager, MemoryThreads, ReflectionAnchors, PersistentQuestions, LanguageInsights, MoodChart) are unstyled or use old design language. Not broken but visually inconsistent with current app. | Multiple | A1 | Each has a dedicated redesign session (A7a, A8a, A9a, A10a). Systematic. | `OPEN` |
| co2 | "About Life Chapters" info box at bottom of ErasManager uses `bg-slate-50` card pattern — old design language. | `ErasManager.tsx` | A7a brainstorm | Remove or absorb into empty state in A7a redesign. | `OPEN` |
| co3 | Empty state in ErasManager: "No life chapters defined yet. Create one to organize your journey." — generic, not Witness voice. | `ErasManager.tsx` | A7a brainstorm | Replace in A7a. Draft: "Your story has chapters even if they haven't been named yet." | `OPEN` |

---

## TECHNICAL DEBT

| # | Issue | Component | Discovered | Impact | Fix Plan | Status |
|---|---|---|---|---|---|---|
| D1 | `erasStorage` in ErasManager still points directly to localStorage, not `db.eras`. Bypasses the abstraction layer. | `ErasManager.tsx`, `eras.ts` | A7a brainstorm | Phase B swap will miss eras data unless fixed. | Fix in A7a — add `eras.ts` shim. | `OPEN` |
| D2 | Several utility files (`eras.ts`, `threads.ts`, `questions.ts`, `longform.ts`) may still have direct localStorage calls not yet shimmed to `db`. Needs audit. | `utils/` | A2 | Phase B swap will miss unshimmed data. | Audit each file before Phase B. A7a starts with eras. | `OPEN` |
| D3 | `buildEntryMap()` in TimelineView rebuilds a full Map on every render cycle where `entries` changes. At scale (1000+ entries) this could cause perceptible lag. | `TimelineView.tsx` | A3b | `useMemo` already wraps it — acceptable for Phase A. Phase B with file storage may need optimisation. | Monitor. Fix if perceptible. | `OPEN` |
| D4 | No error boundary anywhere in the app. A runtime error in any component will crash the entire app with a blank white screen and no recovery path. | Global | A1 | Add React error boundary wrapping main content areas. Schedule in a polish session. | `OPEN` |
| D5 | `localStorage.getItem('journal_first_visit_dismissed')` and `localStorage.getItem('last_prompt_shown_date')` called directly in TimelineView — bypasses db abstraction layer. | `TimelineView.tsx` | A4d | Add these keys to `db.prefs` or a dedicated `db.ui` namespace in Phase B prep. | `OPEN` |

---

## FIXED

| # | Issue | Fixed In | Notes |
|---|---|---|---|
| F1 | `isSameDay` unused import in JournalEntry.tsx causing lint warning | A6a | Removed as part of TagManager integration |
| F2 | Curly apostrophes in single-quoted strings causing build warnings | A4b | 5 strings switched to double quotes |
| F3 | Blank screen bug when editing reflection entries from Timeline | A4c-fix | `pendingReflectionType` inference from synthetic date key |
| F4 | node_modules accidentally committed to GitHub | A1 | `git rm -r --cached node_modules`, .gitignore added |

---

## UPDATE LOG

| Date | What changed |
|---|---|
| 2026-03-02 | File created. All known issues entered from BUILDLOG review and brainstorm sessions. |

---

*Fix CRITICAL items before any user testing. Fix MAJOR items before public release. DEBT items before Phase B.*
