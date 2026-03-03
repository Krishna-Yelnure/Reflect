# DOCS-STATUS.md
# Journal App — Document Health Tracker
# Last updated: 2026-03-03
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
- `NEEDS UPDATE` — was complete but a build session has changed something

**Trigger column** — what session or event last changed this document.
**Stale flags** — specific sections or facts known to be out of date.

---

## TIER 1 — PRODUCT DEFINITION

### BA-Document.docx
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/BA-Document.docx` |
| Last updated | 2026-03-03 |
| Last trigger | Doc Sprint Session 1 |
| Owner | Product |

**Sections (18 total):**
1. Executive Summary ✅
2. Problem Statement ✅
3. Witness Philosophy ✅
4. Competitive Landscape ✅
5. As-Is State (A6b-polish) ✅
6. Gap Analysis ✅
7. SWOT Analysis ✅
8. Functional Requirements Summary ✅
9. Non-Functional Requirements ✅
10. Risk Register Summary ✅
11. V1 Scope Summary ✅
12. User Journey Summary ✅
13. Privacy Architecture ✅
14. Delivery Roadmap ✅
15. Design Language ✅
16. Technical Stack ✅
17. Assumptions and Constraints ✅
18. Glossary ✅

**Next stale trigger:** Any build session that changes the as-is state (§5), scope decisions (§11), or risk profile (§10). Do not update after routine sessions — update at doc sprint checkpoints or phase boundaries.

---

### V1-Scope.md
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/V1-Scope.md` |
| Last updated | 2026-03-03 |
| Last trigger | Doc Sprint Session 1 |
| Owner | Product |

**Contents:** V1 complete criteria, Phase A→B trigger conditions, full scope verdict table (IN/POST-V1/NEVER per session), conditional scope constraints, permanently out-of-scope list, scope change process, document completion requirements.

**Next stale trigger:** Any feature verdict changes (IN → POST-V1, or new session added). Check this file whenever a feature is deferred — do not update unless a verdict actually changes.

**Unlocks:** PRD.md, FRD.md, SRS.md — do not write these before V1-Scope is locked. ✅ Now locked.

---

### Witness-Philosophy.md
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/Witness-Philosophy.md` |
| Last updated | 2026-03-03 |
| Last trigger | Doc Sprint Session 1 |
| Owner | Product |

**Contents:** One-sentence product description, core principle, three layers (Witness / Mirror / Patterns Surface) with guards, full product identity, five never-build rationales (streaks, AI reading entries, urgency notifications, demographic design, social features), Tier Test, Never-Build table.

**Next stale trigger:** This document should almost never change. Update only if the philosophy is genuinely refined at a fundamental level — not when features change or sessions complete.

---

### PRD.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/PRD.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Product |

**Prerequisite:** V1-Scope.md locked ✅ — PRD can now be written.
**Target:** Doc Sprint Session 2.

---

## TIER 2 — TECHNICAL SPECIFICATION

### FRD.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/FRD.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Technical + Product |

**Prerequisite:** V1-Scope.md locked ✅, PRD.md drafted.
**Target:** Doc Sprint Session 2.

---

### SRS.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/SRS.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Technical |

**Prerequisite:** V1-Scope.md locked ✅, FRD.md drafted.
**Target:** Doc Sprint Session 2.

---

## TIER 3 — PORTFOLIO & USER ARTEFACTS

### User-Journey.md
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/User-Journey.md` |
| Last updated | 2026-03-03 |
| Last trigger | Doc Sprint Session 1 |
| Owner | Product |

**Contents:** Temporal model rationale, five journey stages (Day 1/7/30/365/10,000) — each with profile, needs, failure modes table with current state column, feature-to-day mapping table, The Real Need closing section.

**Next stale trigger:** When a failure mode listed in the stage tables is resolved by a build session — update the current state column for that row only. Full rewrite not needed.

---

### Flow-Diagrams.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/Flow-Diagrams.md` |
| Last updated | — |
| Last trigger | — |
| Owner | Product + Technical |

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

**Target:** Doc Sprint Session 2.

---

### Early-Adopter-Brief.md
| Field | Value |
|---|---|
| Status | `INTENTIONALLY DEFERRED` |
| Location | `docs/Early-Adopter-Brief.md` |
| Last updated | — |
| Owner | Product |

**Why deferred:** Must be written from lived experience. Build after 30+ real entries — the questions worth asking early adopters will only be clear once the product has been used at depth.

---

## TIER 4 — EXECUTION & TRACKING

### WBS.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/WBS.md` |
| Last updated | — |
| Owner | Project |

**Target:** Doc Sprint Session 2. Source material: BUILDLOG session map.

---

### Product-Roadmap.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/Product-Roadmap.md` |
| Last updated | — |
| Owner | Product |

**Target:** Doc Sprint Session 2.

---

### Risk-Register.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/Risk-Register.md` |
| Last updated | — |
| Owner | Product + Technical |

**Note:** Risk summary exists in BA-Document §10. Standalone Risk-Register.md adds forward-looking risk scoring and mitigation ownership.
**Target:** Doc Sprint Session 2.

---

### Assumptions-and-Constraints.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/Assumptions-and-Constraints.md` |
| Last updated | — |
| Owner | Product + Technical |

**Note:** Assumptions summary exists in BA-Document §17. Standalone file adds invalidation tracking.
**Target:** Doc Sprint Session 2.

---

### RTM.md
| Field | Value |
|---|---|
| Status | `NOT STARTED` |
| Location | `docs/RTM.md` |
| Last updated | — |
| Owner | Product + Technical |

**Prerequisite:** PRD.md and FRD.md must exist first.
**Target:** Doc Sprint Session 2 (after PRD + FRD complete).

---

## TRACKING FILES

### DOCS-REGISTRY.md
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/DOCS-REGISTRY.md` |
| Last updated | 2026-03-03 |
| Last trigger | Doc Sprint Session 1 — governance layer created |

---

### DOCS-STATUS.md (this file)
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/DOCS-STATUS.md` |
| Last updated | 2026-03-03 |
| Last trigger | Doc Sprint Session 1 |

---

### FEATURE-STATUS.md
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/FEATURE-STATUS.md` |
| Last updated | 2026-03-02 |
| Last trigger | Documentation strategy session |

**Next stale trigger:** Any build session that changes a feature status.

---

### INDEX.md
| Field | Value |
|---|---|
| Status | `COMPLETE` |
| Location | `docs/INDEX.md` |
| Last updated | 2026-03-03 |
| Last trigger | Doc Sprint Session 1 — new docs added, Tier 4 and 5 sections added |

---

## TIER 5 — DEFERRED

### Test-Cases.md
| Status | `DEFERRED` — write after A11b. Feature set must be stable before test cases are written. |
|---|---|

### Post-Implementation-Review.md
| Status | `DEFERRED` — write after Phase A complete. |
|---|---|

---

## UPDATE LOG

| Date | Session | What changed |
|---|---|---|
| 2026-03-02 | Documentation strategy session | File created. All documents entered with initial status. |
| 2026-03-03 | Doc Sprint Session 1 | BA-Document, V1-Scope, Witness-Philosophy, User-Journey marked COMPLETE. DOCS-REGISTRY added. Tier 4 and 5 documents added with NOT STARTED status. PRD prerequisite unlocked. |

---

*This file is only useful if it is kept current. Five minutes after every build session. Before every doc session.*
