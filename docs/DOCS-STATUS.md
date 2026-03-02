# DOCS-STATUS.md
# Premium Journal App — Document Health Tracker
# Last updated: 2026-03-02
# Rule: check and update this file after every build session and every doc session.
# If a build session changes behaviour, flag the affected documents here before committing.

---

## HOW TO USE THIS FILE

Each document has a status, a last-updated marker, what triggered the last update, and what is still missing or stale.

**Status definitions:**
- `NOT STARTED` — document does not exist yet
- `DRAFT` — exists but incomplete, not reliable
- `IN PROGRESS` — actively being worked on this session
- `COMPLETE` — all sections filled, reflects current state
- `NEEDS UPDATE` — was complete but a build session has changed something. Must be updated before next doc session.

**Trigger column** — what session or event last changed this document.
**Stale flags** — specific sections or facts that are known to be out of date.

---

## TIER 1 — PRODUCT DEFINITION

### BA-Document.docx
| Field | Value |
|---|---|
| Status | `NEEDS UPDATE` |
| Location | `docs/BA-Document.docx` |
| Last updated | Session A2 (2026-02-28) |
| Last trigger | A2 — storage abstraction + sidebar nav |
| Owner | Product |

**What exists:** Executive summary, problem statement, competitive landscape (header only), Witness philosophy (header only), as-is state (stale at A2), gap analysis (partial), SWOT (header only), functional requirements (partial), non-functional requirements, risk register (partial), scope definition (A2 state), user journey framework (header only), privacy architecture, delivery roadmap, design language, tech stack appendix.

**Stale flags — must update before Doc Sprint Session 2:**
- Section 3 (Witness philosophy) — header only, no content
- Section 4 (As-is state) — stale at A2, now at A6b-polish
- Section 5 (Gap analysis) — partial, needs full update
- Section 6 (SWOT) — header only, no content
- Section 9 (Risk register) — partial
- Section 10 (Scope definition) — stale at A2
- Section 11 (User journey) — header only, no content
- Competitive landscape — header only, no content
- Does not reflect: A3 mood/energy, A3b timeline, A4 reflection types, A4c reflection panels, A4d empty state, A5a write polish, A4e deep write, A5b timeline polish, A6a tag infrastructure, A6b tag navigation, A6b-polish compact mood/energy

**Target:** Complete and current in Doc Sprint Session 1.

---

### PRD.md — Product Requirements Document
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/PRD.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Product |

**What it needs to contain:**
- Every feature with priority (must have / should have / nice to have)
- Acceptance criteria per feature
- Dependencies between features
- V1 verdict for each feature (in / post-V1 / never)

**Prerequisite:** V1-Scope.md must be locked first — do not write PRD before scope is defined.

**Target:** Doc Sprint Session 2.

---

### V1-Scope.md — V1 Scope Definition
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/V1-Scope.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Product |

**What it needs to contain:**
- Every planned session: in V1 / post-V1 / never, with reason
- Clear definition of what "V1 complete" means
- What triggers the move from Phase A to Phase B (Electron)
- What triggers public release / early adopter testing

**This is the most important document to produce first in Doc Sprint Session 1 — it unlocks PRD, FRD, and SRS.**

**Target:** Doc Sprint Session 1.

---

## TIER 2 — TECHNICAL SPECIFICATION

### FRD.md — Functional Requirements Document
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/FRD.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Technical + Product |

**What it needs to contain:**
- Every behavioural rule the system must follow
- Every edge case and how it is handled
- Every user interaction and its outcome
- State transitions (e.g. new entry → closing moment → timeline)
- Rules that protect the Witness philosophy (no streaks, no AI reading entries, etc.)

**Known rules to document (non-exhaustive):**
- Deleting an era un-tags entries, never deletes them
- Closing moment fires for new entries only, not edits
- Tags normalised on save: lowercase, trim, deduplicate
- Continuity prompt suppressed for reflection entries
- Year-ago search uses ±3 day window
- Mood filter persists as user drills year → month → week → day
- Auto-dismiss welcome card once first entry exists

**Target:** Doc Sprint Session 2.

---

### SRS.md — Software Requirements Specification
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/SRS.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Technical |

**What it needs to contain:**
- Data models for all types (JournalEntry, Habit, Era, Thread, Question, etc.)
- Storage contracts — what db.ts guarantees
- Component interfaces — props and responsibilities
- Performance requirements
- Phase A → Phase B swap contract (what changes in db/index.ts, what doesn't)
- localStorage keys and their schemas

**Target:** Doc Sprint Session 2.

---

## TIER 3 — PORTFOLIO & USER ARTEFACTS

### User-Journey.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/User-Journey.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Product |

**What it needs to contain:**
- Day 1 / Day 7 / Day 30 / Day 365 / Day 10,000 narrative fully written
- What the user feels, sees, and needs at each stage
- Which features serve which day
- Feature-to-day mapping table (already exists in BUILDLOG — extract and expand)

**Source material:** BUILDLOG section "THE FEATURE-TO-DAY FRAMEWORK" and "USER JOURNEY SCENARIOS" — extract, expand, and make standalone.

**Target:** Doc Sprint Session 1.

---

### Flow-Diagrams.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/Flow-Diagrams.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Product + Technical |

**Flows to diagram (Mermaid, renderable on GitHub):**
- Write entry flow (open → mode select → write → save → closing moment → timeline)
- Timeline drill-down flow (year → month → week → day → edit)
- Tag filter flow (day view → click tag → filtered heatmap → clear)
- Reflection entry flow (timeline → write reflection → save → panel)

**Target:** Doc Sprint Session 2.

---

### AI-Process-Case-Study.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/AI-Process-Case-Study.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Portfolio |

**What it needs to contain:**
- What AI did vs what the human decided — the distinction that makes this portfolio piece rare
- Key decisions that were human-led (no streaks, Witness philosophy, A6c deferred, brainstorm-first rule)
- Key decisions AI contributed to (architecture recommendations, edge case identification)
- The BUILDLOG as evidence of process — not just a finished product
- What this demonstrates to a hiring manager

**This is the strongest portfolio differentiator. Most developers using AI tools use them to write code faster. This project used AI as a thinking partner with the human retaining full product ownership. That is genuinely rare right now.**

**Target:** Doc Sprint Session 2.

---

### Early-Adopter-Brief.md
| Field | Value |
|---|---|
| Status | `INTENTIONALLY DEFERRED` |
| Location | `docs/Early-Adopter-Brief.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Product |

**Why deferred:** Must be written from lived experience, not hypothesis. Build when 30+ real entries exist. The questions you want to ask early adopters will be clearer once you've felt the gaps yourself.

**When to build:** After 30+ real entries, before any public sharing of the app.

---

## TRACKING FILES

### DOCS-STATUS.md (this file)
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/DOCS-STATUS.md` |
| Last updated | 2026-03-02 |
| Last trigger | Documentation strategy session |

---

### FEATURE-STATUS.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/FEATURE-STATUS.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Product + Technical |

**What it needs to contain:**
- Every feature built or planned
- Status: built / in progress / planned / deferred / never
- Which session built or will build it
- Which documents cover it (PRD ref, FRD ref)
- V1 verdict

**Why this exists separately from BUILDLOG and PRD:**
BUILDLOG is chronological — great for history, hard to scan for current state.
PRD has features with priorities. Neither gives a single clean view of every feature's status and documentation coverage. FEATURE-STATUS.md is that view.

**Target:** Doc Sprint Session 1. Requires careful reading of full BUILDLOG to populate accurately — do not rush.

---

## UPDATE LOG

| Date | Session | What changed |
|---|---|---|
| 2026-03-02 | Documentation strategy session | File created. All documents entered with initial status. |

---

*This file is only useful if it is kept current. Five minutes after every build session. Before every doc session.*
