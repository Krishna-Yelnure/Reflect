# DOCS-REGISTRY.md
# Premium Journal App — Documentation Governance Registry
# Last updated: 2026-03-02
# Purpose: Single source of truth for what every document owns, what triggers updates to it,
#           and where any given change lands. Read this before touching any document.

---

## HOW TO USE THIS FILE

**When a build session ships something:**
1. Identify the change type using the ROUTING TABLE below
2. Find every row that matches — those docs need updating
3. Open each doc and update only the sections listed in that doc's REGISTRY ENTRY
4. Mark updated docs in INDEX.md with new date

**When you're not sure where something goes:**
Read the OWNS / DOES NOT OWN columns in each doc's registry entry.
If two docs could both receive the same update, the OWNS column resolves the tie.

**When a new document is created:**
Add its registry entry here before writing a single line of content.
The registry entry defines what the document is — write to that definition, not beyond it.

---

## ROUTING TABLE
*Match your change type → update every ticked doc*

| Change Type | BUILDLOG | FEATURE-STATUS | DECISIONS-LOG | BUGS-AND-DEBT | DOCS-STATUS | INDEX | BA-Doc | V1-Scope | PRD | FRD | SRS | Witness-Phil | User-Journey | WBS | Roadmap | Risk-Reg | Assumptions |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| New feature built | ✅ | ✅ | — | — | ✅ | ✅ | — | Check | ✅ | ✅ | ✅ | — | — | — | ✅ | — | — |
| Feature behaviour changed | ✅ | ✅ | ✅ | — | ✅ | — | — | Check | ✅ | ✅ | ✅ | — | — | — | — | — | — |
| Feature deferred or descoped | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ | ✅ | — | — | — | — | ✅ | ✅ | — | — |
| Bug discovered | ✅ | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | ✅ | — |
| Bug fixed | ✅ | ✅ | — | ✅ | — | — | — | — | — | ✅ | — | — | — | — | — | — | — |
| Product decision made | ✅ | — | ✅ | — | — | — | ✅ | Check | — | — | — | Check | — | — | — | — | — |
| Product decision reversed | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | Check | — | — | ✅ | — | — |
| Philosophy / principle added | ✅ | — | ✅ | — | ✅ | — | ✅ | — | — | — | — | ✅ | — | — | — | — | — |
| New session completed | ✅ | ✅ | — | Check | ✅ | ✅ | — | Check | — | — | — | — | — | ✅ | ✅ | — | — |
| Scope change (in/out/never) | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | Check | — | ✅ | ✅ | — | — |
| Data model changed | ✅ | — | ✅ | Check | ✅ | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — |
| New assumption identified | ✅ | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | ✅ |
| Assumption invalidated | ✅ | Check | ✅ | Check | ✅ | — | ✅ | ✅ | Check | Check | Check | — | — | — | ✅ | ✅ | ✅ |
| New risk identified | ✅ | — | — | Check | — | — | — | — | — | — | — | — | — | — | — | ✅ | — |
| Risk resolved | ✅ | — | — | ✅ | — | — | — | — | — | — | — | — | — | — | — | ✅ | — |
| New doc created | — | — | — | — | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| Phase boundary crossed (A→B) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:** ✅ = always update | Check = update only if this change affects that doc's content | — = never update for this change type

---

## DOCUMENT LAYERS

Documents are organised into 4 layers. Changes flow down the layers — never up.

```
LAYER 0 — GOVERNANCE (this file + INDEX + BUILDLOG)
    ↓
LAYER 1 — PRODUCT DEFINITION (BA-Doc, V1-Scope, Witness-Philosophy)
    ↓
LAYER 2 — REQUIREMENTS (PRD, FRD, SRS, User-Journey)
    ↓
LAYER 3 — EXECUTION & TRACKING (FEATURE-STATUS, DECISIONS-LOG, BUGS-AND-DEBT,
           WBS, Roadmap, Risk-Register, Assumptions, RTM, Flow-Diagrams)
    ↓
LAYER 4 — PORTFOLIO (AI-Process-Case-Study, Early-Adopter-Brief, Test-Cases,
           Post-Implementation-Review)
```

**The rule:** If a Layer 1 document changes, review every Layer 2 document for impact. If a Layer 2 document changes, review Layer 3. Changes should never require going back up a layer — if they do, the upstream decision was wrong and must be revisited at source.

---

## REGISTRY ENTRIES

---

### BUILDLOG.md
| Field | Value |
|---|---|
| Layer | 0 — Governance |
| Location | `/BUILDLOG.md` (project root) |
| Owner | Build sessions |
| Status | Live |
| Update frequency | After every build session, before every commit |

**OWNS:**
- Chronological record of every session: what was done, what was decided, what's next
- Brainstorm entries (decisions made before build sessions)
- Session checklist completions
- Brainstorm-first rule
- Product decisions table (high level — detail lives in DECISIONS-LOG)
- Full tech stack and codebase structure
- Session log table (the definitive schedule)

**DOES NOT OWN:**
- Document health (→ DOCS-STATUS)
- Feature-level status scanning (→ FEATURE-STATUS)
- Isolated decision rationale (→ DECISIONS-LOG)
- Bug tracking (→ BUGS-AND-DEBT)
- Formal requirements (→ PRD/FRD/SRS)

**UPDATE TRIGGERS:**
- Every build session, without exception
- Every brainstorm session
- When any product decision is locked

**SECTIONS TO UPDATE WHEN A FEATURE SHIPS:**
1. SESSION LOG table — mark session ✅ Complete
2. Relevant session entry — add to "What was done"
3. PRODUCT DECISIONS table — if any new decisions were locked

---

### INDEX.md
| Field | Value |
|---|---|
| Layer | 0 — Governance |
| Location | `docs/INDEX.md` |
| Owner | Documentation sessions |
| Status | Live |
| Update frequency | When any doc changes status |

**OWNS:**
- Master list of every document with status and last-updated date
- Document creation schedule (target session per doc)
- Status legend

**DOES NOT OWN:**
- What each document contains (→ DOCS-STATUS or this file)
- Update routing logic (→ this file)
- Document health detail (→ DOCS-STATUS)

**UPDATE TRIGGERS:**
- A new document is created → add row
- Any document status changes (Not Started → Draft → Complete → Needs Update) → update row
- Document creation schedule changes → update table

---

### DOCS-STATUS.md
| Field | Value |
|---|---|
| Layer | 0 — Governance |
| Location | `docs/DOCS-STATUS.md` |
| Owner | Documentation sessions |
| Status | Live |
| Update frequency | After every build or doc session |

**OWNS:**
- Per-document health entries: status, last trigger, stale flags
- Specific stale sections called out by name
- Prerequisites between documents

**DOES NOT OWN:**
- What to update in each doc (→ this file)
- Feature-level status (→ FEATURE-STATUS)

**UPDATE TRIGGERS:**
- Any build session that changes behaviour → flag affected docs as NEEDS UPDATE
- Any doc session that completes a document → mark COMPLETE
- Any new document created → add entry

---

### DOCS-REGISTRY.md (this file)
| Field | Value |
|---|---|
| Layer | 0 — Governance |
| Location | `docs/DOCS-REGISTRY.md` |
| Owner | Documentation governance |
| Status | Live |
| Update frequency | When a new document is created, or document scope changes |

**OWNS:**
- Routing table (change type → which docs to update)
- Document layer architecture
- Per-document registry entries (owns / does not own / update triggers)

**DOES NOT OWN:**
- Document health (→ DOCS-STATUS)
- Document content (→ the documents themselves)

**UPDATE TRIGGERS:**
- A new document is created → add registry entry before writing any content
- A document's scope changes (it takes on or loses responsibility) → update OWNS/DOES NOT OWN
- A new change type category is needed in the routing table → add row

---

### FEATURE-STATUS.md
| Field | Value |
|---|---|
| Layer | 0 — Governance (tracking) |
| Location | `docs/FEATURE-STATUS.md` |
| Owner | Build sessions |
| Status | Live |
| Update frequency | After every build session |

**OWNS:**
- Every feature's current status (BUILT / IN PROGRESS / PLANNED / DEFERRED / NEVER)
- Which session built or will build each feature
- V1 verdict per feature (IN / POST / NEVER / TBD)
- Never-build list with reasons

**DOES NOT OWN:**
- Why decisions were made (→ DECISIONS-LOG)
- Acceptance criteria (→ PRD)
- Behavioural rules (→ FRD)
- Bug tracking (→ BUGS-AND-DEBT)

**UPDATE TRIGGERS:**
- Feature built → status BUILT, session noted
- Feature deferred → status DEFERRED, reason noted
- V1 verdict locked → update V1 column
- New feature planned → add row

---

### DECISIONS-LOG.md
| Field | Value |
|---|---|
| Layer | 0 — Governance (tracking) |
| Location | `docs/DECISIONS-LOG.md` |
| Owner | Build + brainstorm sessions |
| Status | Live |
| Update frequency | When any significant decision is made |

**OWNS:**
- Every significant product, architecture, and design decision
- Options considered for each decision
- Reasoning and trigger-to-revisit conditions
- Decision status (LOCKED / REVISIT / SUPERSEDED)

**DOES NOT OWN:**
- Implementation detail of decisions (→ FRD/SRS)
- Feature status resulting from decisions (→ FEATURE-STATUS)
- Philosophy narrative (→ Witness-Philosophy.md)

**UPDATE TRIGGERS:**
- Any decision locked in a build or brainstorm session → add row immediately
- Any decision revisited → update status, add note, never delete old row
- Any decision superseded → mark SUPERSEDED, add new row

---

### BUGS-AND-DEBT.md
| Field | Value |
|---|---|
| Layer | 0 — Governance (tracking) |
| Location | `docs/BUGS-AND-DEBT.md` |
| Owner | Build sessions |
| Status | Live |
| Update frequency | When any issue is found or fixed |

**OWNS:**
- All known bugs (CRITICAL / MAJOR / MINOR / COSMETIC)
- All technical debt items
- Fix plan and target session per issue
- Fixed log

**DOES NOT OWN:**
- Risk tracking (→ Risk-Register.md)
- Feature status (→ FEATURE-STATUS)
- Assumptions (→ Assumptions-and-Constraints.md)

**UPDATE TRIGGERS:**
- Bug discovered → add row immediately, do not wait
- Bug fixed → move to FIXED table with session noted
- Debt identified → add to DEBT table
- Debt resolved → mark fixed

---

### BA-Document.docx
| Field | Value |
|---|---|
| Layer | 1 — Product Definition |
| Location | `docs/BA-Document.docx` |
| Owner | Product (Doc Sprint Sessions) |
| Status | NEEDS UPDATE (stale at A2) |
| Update frequency | Doc sprint sessions only — not after every build |

**OWNS:**
- Executive summary
- Problem statement and market context
- Competitive landscape (Day One, Notion, Reflectly)
- Witness philosophy narrative (summary — full version in Witness-Philosophy.md)
- As-is state of the product (must stay current)
- Gap analysis
- SWOT analysis
- Functional requirements summary (detail in FRD)
- Non-functional requirements
- Risk register summary (detail in Risk-Register.md)
- V1 scope summary (detail in V1-Scope.md)
- User journey summary (detail in User-Journey.md)
- Privacy architecture
- Delivery roadmap summary
- Design language principles
- Tech stack appendix
- Business case (hypothetical monetisation model)

**DOES NOT OWN:**
- Granular feature-level requirements (→ PRD/FRD)
- Data models and storage contracts (→ SRS)
- Day-by-day user narrative (→ User-Journey.md)
- Full philosophy treatise (→ Witness-Philosophy.md)
- Detailed risk entries (→ Risk-Register.md)
- Session-level scope decisions (→ V1-Scope.md)

**UPDATE TRIGGERS:**
- Doc Sprint Sessions only — not updated after routine build sessions
- Exception: if a Phase boundary is crossed (A→B), update as-is state and roadmap summary
- DOCS-STATUS.md will flag which sections are stale — update only those sections

**STALE SECTIONS (as of 2026-03-02 — must fix in Doc Sprint Session 1):**
- Section 3: Witness philosophy — header only, no content
- Section 4: As-is state — stale at A2, now at A6b-polish
- Section 5: Gap analysis — partial
- Section 6: SWOT — header only
- Section 9: Risk register — partial
- Section 10: Scope definition — stale at A2
- Section 11: User journey — header only
- Competitive landscape — header only
- Does not reflect: A3 through A6b-polish (14 sessions of work)

---

### V1-Scope.md
| Field | Value |
|---|---|
| Layer | 1 — Product Definition |
| Location | `docs/V1-Scope.md` |
| Owner | Product (Doc Sprint Session 1) |
| Status | NOT STARTED |
| Update frequency | When scope decisions change — not after routine builds |

**OWNS:**
- Every planned session: IN V1 / POST-V1 / NEVER, with reason
- Definition of "V1 complete" (the criteria that closes Phase A)
- What triggers move from Phase A → Phase B (Electron)
- What triggers early adopter testing
- What is permanently out of scope (with Witness-philosophy rationale where relevant)

**DOES NOT OWN:**
- Feature-level detail (→ PRD)
- Behavioural rules (→ FRD)
- Build schedule (→ WBS)

**UPDATE TRIGGERS:**
- Scope decision changes: a feature moves IN/POST/NEVER → update immediately
- V1 definition criteria change → update
- Phase boundary conditions change → update
- Must be checked (not necessarily updated) when any feature is deferred

**PREREQUISITE FOR:** PRD.md, FRD.md, SRS.md — do not write these before V1-Scope is locked.

---

### Witness-Philosophy.md
| Field | Value |
|---|---|
| Layer | 1 — Product Definition |
| Location | `docs/Witness-Philosophy.md` |
| Owner | Product |
| Status | NOT STARTED — create Doc Sprint Session 1 |
| Update frequency | Rarely — only when philosophy evolves at a fundamental level |

**OWNS:**
- Full Witness philosophy narrative
- Why streaks were rejected (with specific reasoning)
- Why AI reading entries is a permanent never
- Why urgency notifications violate the product premise
- Why demographic-based design was rejected
- Ethical positioning statement
- The Tier Test as a formal decision framework
- What this product refuses to do and why — as intentional product design, not limitation
- The "Never Build" list with full rationale

**DOES NOT OWN:**
- Philosophy summary (→ BA-Document, one section)
- Product decisions log (→ DECISIONS-LOG)
- Feature status (→ FEATURE-STATUS)

**UPDATE TRIGGERS:**
- A new "never build" decision is made with philosophical rationale → add entry
- The Tier Test framework is refined → update
- A philosophy principle is articulated for the first time → add
- This document should almost never change — it reflects settled values, not evolving features

---

### PRD.md
| Field | Value |
|---|---|
| Layer | 2 — Requirements |
| Location | `docs/PRD.md` |
| Owner | Product (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | When features are added, changed, or reprioritised |

**OWNS:**
- Every feature with MoSCoW priority (Must / Should / Could / Won't)
- Acceptance criteria per feature
- User stories per feature ("As a [user] I want [x] so that [y]")
- Dependencies between features
- V1 verdict per feature (pulled from V1-Scope, not re-decided here)

**DOES NOT OWN:**
- Behavioural rules and edge cases (→ FRD)
- Data models (→ SRS)
- V1 scope decisions (→ V1-Scope.md — PRD reflects those decisions, doesn't make them)

**PREREQUISITE:** V1-Scope.md must be locked first.
**UPDATE TRIGGERS:**
- Feature added or removed → add/remove row
- Priority changes → update MoSCoW column
- Acceptance criteria refined → update
- V1 verdict changes in V1-Scope → reflect here

---

### FRD.md
| Field | Value |
|---|---|
| Layer | 2 — Requirements |
| Location | `docs/FRD.md` |
| Owner | Technical + Product (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | When behavioural rules or edge cases change |

**OWNS:**
- Every behavioural rule the system must follow
- Every edge case and its resolution
- State transitions (new entry → closing moment → timeline, etc.)
- Rules that protect the Witness philosophy (no streaks, no AI reading, etc.)
- Interaction rules (what happens when user does X)

**Known rules to document (starter list — not exhaustive):**
- Deleting an era un-tags entries, never deletes them
- Closing moment fires for new entries only, not edits
- Tags normalised on save: lowercase, trim, deduplicate
- Continuity prompt suppressed for reflection entries
- Year-ago search uses ±3 day window
- Mood filter persists as user drills year → month → week → day
- Welcome card auto-dismisses once first entry exists
- `getActive()` for eras returns all concurrent active eras (not just first)

**DOES NOT OWN:**
- Data models and storage schemas (→ SRS)
- Priorities and acceptance criteria (→ PRD)
- UI/visual behaviour (→ Design language in BA-Document)

**PREREQUISITE:** V1-Scope.md locked. PRD.md drafted.

---

### SRS.md
| Field | Value |
|---|---|
| Layer | 2 — Requirements |
| Location | `docs/SRS.md` |
| Owner | Technical (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | When data models or storage contracts change |

**OWNS:**
- All TypeScript data models (JournalEntry, Habit, Era, Thread, Question, GentleStart, etc.)
- Storage contracts — what db.ts guarantees to the rest of the app
- localStorage key schemas
- Component interfaces (props and responsibilities, not implementation)
- Performance requirements (Phase A acceptable thresholds, Phase B targets)
- Phase A → Phase B swap contract (what changes in db/index.ts, what the app never sees)
- Non-functional requirements (offline-first, zero telemetry, cross-platform)

**DOES NOT OWN:**
- Behavioural rules (→ FRD)
- Feature priorities (→ PRD)
- Bug tracking (→ BUGS-AND-DEBT)

**UPDATE TRIGGERS:**
- Data model changes (new field, type change, new entity) → update immediately
- Storage contract changes → update
- Phase B swap design changes → update
- Performance thresholds defined or changed → update

---

### User-Journey.md
| Field | Value |
|---|---|
| Layer | 2 — Requirements |
| Location | `docs/User-Journey.md` |
| Owner | Product (Doc Sprint Session 1) |
| Status | NOT STARTED |
| Update frequency | When new features materially change the experience at a journey stage |

**OWNS:**
- Day 1 / Day 7 / Day 30 / Day 365 / Day 10,000 narrative fully written
- What the user feels, sees, and needs at each stage
- Feature-to-day mapping table
- The temporal persona model (replaces demographic personas for this product)
- Failure modes at each stage (what breaks the experience)
- The permanence argument (Day 10,000 — why local-first matters)

**SOURCE MATERIAL:** Extract and expand from BUILDLOG sections:
- "USER JOURNEY SCENARIOS"
- "THE FEATURE-TO-DAY FRAMEWORK"
- "THE HUMAN LAYER"

**DOES NOT OWN:**
- Feature-level status (→ FEATURE-STATUS)
- Persona demographics (not applicable — this app uses temporal model)
- Flow diagrams (→ Flow-Diagrams.md)

**UPDATE TRIGGERS:**
- A new journey stage scenario is written → add
- A feature materially changes the Day 1/7/30/365/10k experience → update relevant stage
- Failure modes change (bug fixed, feature added) → update

---

### WBS.md
| Field | Value |
|---|---|
| Layer | 3 — Execution & Tracking |
| Location | `docs/WBS.md` |
| Owner | Project management (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | When sessions are added, removed, or reordered |

**OWNS:**
- Work breakdown by phase (Phase A / Phase B / Phase C)
- Sessions as work packages within each phase
- Deliverables per session
- Dependencies between sessions

**SOURCE MATERIAL:** Session map in BUILDLOG (A1 → A11b → B1 → B3 → C1). Reformat as proper WBS, not flat list.

**DOES NOT OWN:**
- Session content / what was done (→ BUILDLOG)
- Timeline / dates (→ Roadmap if a Gantt is built)
- Feature status (→ FEATURE-STATUS)

---

### Product-Roadmap.md
| Field | Value |
|---|---|
| Layer | 3 — Execution & Tracking |
| Location | `docs/Product-Roadmap.md` |
| Owner | Product (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | When phases or major milestones change |

**OWNS:**
- Phase A → Phase B → Phase C narrative
- Major milestones (V1 complete, first early adopter, Electron release, optional sync)
- What "done" looks like at each phase
- High-level feature groupings per phase
- Business model evolution (free local → optional paid sync)

**DOES NOT OWN:**
- Session-level schedule (→ WBS / BUILDLOG)
- Feature-level detail (→ PRD)
- V1 scope decisions (→ V1-Scope)

---

### Risk-Register.md
| Field | Value |
|---|---|
| Layer | 3 — Execution & Tracking |
| Location | `docs/Risk-Register.md` |
| Owner | Product + Technical (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | When new risks are identified or existing risks resolve |

**OWNS:**
- Forward-looking threats (things that haven't happened but could)
- Probability × impact scoring
- Mitigation plan per risk
- Risk owner and review trigger
- Resolved risks log

**NOTE — distinction from BUGS-AND-DEBT:**
BUGS-AND-DEBT = things that are already wrong (known issues).
Risk-Register = things that could go wrong (future threats).
Example: "localStorage quota overflow" → BUGS-AND-DEBT (it's a known constraint, C1).
Example: "electron-builder breaks on a macOS update" → Risk-Register (hasn't happened, future threat).

**SOURCE MATERIAL:** Risk sections in BA-Document (partial), BUGS-AND-DEBT (for known constraints that imply future risks), DECISIONS-LOG (decisions with REVISIT status may carry risks).

**UPDATE TRIGGERS:**
- New risk identified in any session → add immediately (also log in BUILDLOG)
- Risk resolved → move to resolved log
- Risk probability or impact changes → update scoring
- Phase boundary crossed → review all risks for Phase B context

---

### Assumptions-and-Constraints.md
| Field | Value |
|---|---|
| Layer | 3 — Execution & Tracking |
| Location | `docs/Assumptions-and-Constraints.md` |
| Owner | Product + Technical (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | When new assumptions are made or existing ones are invalidated |

**OWNS:**
- Every assumption the project is operating under
- Constraints (hard limits that cannot change)
- Invalidated assumptions log (with impact assessment)

**Starter list of known assumptions to document:**
- localStorage is sufficient for Phase A entry volume
- 30+ real entries are needed before search is worth building
- Electron wrapping is straightforward for this React/Vite stack
- GitHub Actions free tier is sufficient for CI builds
- User (solo) will write frequently enough to validate design decisions before public release
- electron-builder supports current target OS versions

**UPDATE TRIGGERS:**
- New assumption made (often in brainstorm sessions) → add immediately
- Assumption invalidated by evidence → mark invalid, assess impact on V1-Scope/PRD/FRD
- New constraint identified → add

---

### RTM.md (Requirements Traceability Matrix)
| Field | Value |
|---|---|
| Layer | 3 — Execution & Tracking |
| Location | `docs/RTM.md` |
| Owner | Product + Technical |
| Status | NOT STARTED — create after PRD + FRD exist |
| Update frequency | When requirements, features, or test cases change |

**OWNS:**
- Mapping: requirement → feature → component → test case
- Demonstrates every requirement is implemented and testable
- Gap identification (requirements with no feature mapping)

**PREREQUISITE:** PRD.md and FRD.md must exist. Do not create RTM before those are complete.

---

### Flow-Diagrams.md
| Field | Value |
|---|---|
| Layer | 3 — Execution & Tracking |
| Location | `docs/Flow-Diagrams.md` |
| Owner | Product + Technical (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | When core flows change |

**OWNS (Mermaid diagrams, renderable on GitHub):**
- Write entry flow: open → mode select → write → save → closing moment → timeline
- Timeline drill-down: year → month → week → day → edit
- Tag filter flow: day view → click tag → filtered heatmap → clear
- Reflection entry flow: timeline → write reflection → save → panel
- Phase A → Phase B storage swap flow

---

### AI-Process-Case-Study.md
| Field | Value |
|---|---|
| Layer | 4 — Portfolio |
| Location | `docs/AI-Process-Case-Study.md` |
| Owner | Portfolio (Doc Sprint Session 2) |
| Status | NOT STARTED |
| Update frequency | Milestone updates only — not after every build session |

**OWNS:**
- What AI did vs what the human decided — the core portfolio argument
- Key decisions that were human-led (Witness philosophy, no streaks, A6c deferred, brainstorm-first rule)
- Key contributions AI made (architecture recommendations, edge case identification, implementation)
- The BUILDLOG as evidence of process — not just a finished product
- AI governance in development context: prompt design, human override, no AI reading user data
- What this demonstrates to a hiring manager

**DOES NOT OWN:**
- AI inside the product (there is none — Witness philosophy prohibits it)
- General AI ethics (only this project's specific decisions)

---

### Test-Cases.md
| Field | Value |
|---|---|
| Layer | 4 — Portfolio |
| Location | `docs/Test-Cases.md` |
| Owner | Technical + Product |
| Status | DEFERRED — write after A11b |
| Update frequency | When feature behaviour changes or new features are added |

**PREREQUISITE:** Feature set must be stable. Do not write test cases for features still being actively changed.

---

### Post-Implementation-Review.md
| Field | Value |
|---|---|
| Layer | 4 — Portfolio |
| Location | `docs/Post-Implementation-Review.md` |
| Owner | Product |
| Status | DEFERRED — write after Phase A complete |
| Update frequency | Once per phase |

**OWNS:**
- What went well in Phase A
- What would be done differently
- Decisions that proved right and wrong
- What the BUILDLOG and brainstorm-first rule produced in practice
- Lessons for Phase B

---

### Early-Adopter-Brief.md
| Field | Value |
|---|---|
| Layer | 4 — Portfolio |
| Location | `docs/Early-Adopter-Brief.md` |
| Owner | Product |
| Status | DEFERRED — write after 30+ real entries |
| Update frequency | Before each early adopter cohort |

**OWNS:**
- What you want to learn from early adopters (not what you want them to like)
- Specific questions about Day 1, Day 7, Day 30 experience
- What constitutes a successful early adopter session
- Stakeholder register (you + early adopters)

---

## VERIFICATION CHECKLIST
*Run this after every build session before committing.*

```
□ BUILDLOG updated — session logged, decisions noted
□ FEATURE-STATUS updated — any changed features have new status
□ DECISIONS-LOG updated — any new decisions have a row
□ BUGS-AND-DEBT updated — any new issues logged, any fixes marked
□ DOCS-STATUS updated — any docs made stale by this session are flagged
□ INDEX updated — if any doc status changed
□ Routing table checked — no missed updates
```

---

## UPDATE LOG

| Date | What changed |
|---|---|
| 2026-03-02 | File created. Full registry built for all current and planned documents. |

---

*This file governs everything else. Keep it accurate. A stale registry is worse than no registry.*
