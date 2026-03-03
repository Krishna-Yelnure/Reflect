# V1-Scope.md
# Premium Journal App — V1 Scope Definition
# Last updated: 2026-03-02
# Owner: Product
# Registry: docs/DOCS-REGISTRY.md → V1-Scope.md entry
# Rule: This document is the scope authority. PRD, FRD, and SRS must not be written before this is locked.
#       Update this file when any feature moves between IN / POST-V1 / NEVER. Check it when any feature is deferred.

---

## WHAT THIS DOCUMENT IS

This document defines exactly what V1 is — and is not.

V1 is the completed Phase A web app: everything built, polished, and stable enough for daily personal use and early adopter testing. It is not a public release. It is not the Electron app. It is the moment Phase A is done and Phase B begins.

Every planned feature has a verdict here. Every verdict has a reason. This is the document that prevents scope creep and prevents under-scoping equally.

---

## WHAT "V1 COMPLETE" MEANS

V1 is complete when all of the following are true:

1. **All IN-V1 sessions are done** — A6b through A11b, all ✅ Complete
2. **Living With It period is done** — minimum 2 weeks of daily use with no active building
3. **No CRITICAL bugs open** — BUGS-AND-DEBT.md C1 must be addressed (storage quota warning)
4. **No MAJOR bugs open** — M1, M2, M3 must be resolved or explicitly deferred with reason
5. **All IN-V1 docs are complete** — V1-Scope, BA-Document, User-Journey, Witness-Philosophy, PRD, FRD, SRS
6. **Early adopter testing plan exists** — Early-Adopter-Brief.md written (requires 30+ real entries)
7. **The app feels finished** — not perfect, but coherent. Every view has the same design language. No view feels like a stub.

V1 complete does not require: Electron, CI/CD, public release, or portfolio assets. Those are Phase B and C.

---

## WHAT TRIGGERS PHASE A → PHASE B

Phase B (Electron) begins when:

- V1 complete criteria above are all met
- Living With It period confirms no fundamental UX problems remain
- localStorage limitations are starting to be felt in daily use (early warning of C1)
- The app is worth wrapping — it has earned the permanence that a local file provides

Phase B does not begin early. Wrapping an unfinished product in Electron does not fix the product.

---

## WHAT TRIGGERS EARLY ADOPTER TESTING

Early adopter testing begins when:

- V1 is complete
- 30+ real personal entries exist (decisions about what to test are clearer from lived use)
- Early-Adopter-Brief.md is written
- The app has been used daily for at least 2 weeks post-V1

---

## SCOPE VERDICT TABLE

### Phase A — In V1 (must be complete before V1 is called done)

| Session | Feature Area | What It Delivers | V1 Verdict | Reason |
|---|---|---|---|---|
| A1–A6a | Foundation | App running, storage layer, sidebar nav, all core infrastructure | **IN** | Already complete. Non-negotiable baseline. |
| A6b | Tag Navigation | Clickable tags in Timeline, filter state, heatmap filter | **IN** | Tags without navigation are storage without surface. Filters are the payoff of A6a. |
| A6c | Search | Full-text search + tag dimension + result view | **IN** | Critical by Day 365. Must exist before V1. Deferred until 30+ entries to build correctly — but IN V1. |
| A7a | Era Management | ErasManager redesign, data model audit, colour palette, overlap detection | **IN** | Eras are a core data type. A stub ErasManager in V1 is a broken promise. |
| A7b | Era Surfaces | Era overlay on heatmap, era label in all views, era filter | **IN** | Eras mean nothing if they don't surface. A7a without A7b is data with no visibility. |
| A8a | Inner Compass — Values | Data model merge, Values tab, surface in Write | **IN** | Values are the philosophical core of reflection. Must exist in V1. |
| A8b | Inner Compass — Questions | Questions tab, question thread view, surface in Write | **IN** | Questions without lifecycle are just notes. Both tabs required for Inner Compass to be coherent. |
| A8c | Inner Compass — Lifecycle | Question resolution → value pipeline | **IN** | The lifecycle is what makes questions meaningful over time. A8b without A8c is incomplete. |
| A9a | Insights — Redesign | Witness-compliant redesign, warm empty states, MoodChart integration | **IN** | Insights view is currently styled from Figma export. V1 cannot ship a view that violates design language. |
| A9b | Insights — Connected | Tag/era/question/habit pattern connections | **POST-V1** | Highest scope creep risk. Valuable but not essential for V1 coherence. Build after Living With It reveals what patterns actually matter. |
| A10a | Threads — Reading | Reading experience redesign | **IN** | Threads exist but are unstyled. V1 cannot have a view that looks unfinished. |
| A10b | Threads — Building | Intelligent thread building (tag/question-assisted) | **POST-V1** | Nice to have. Current manual building is functional. Intelligence can wait for real usage data. |
| A11a | Connecting the Dots — Passive | Passive connections surfaced quietly | **IN** | The Patterns Surface layer of the philosophy. V1 without any passive connections is missing its third philosophical layer. |
| A11b | Connecting the Dots — Active | North star session, active surfaces | **POST-V1** | Highest scope creep and philosophy risk. Valuable but requires lived data and careful design. Not V1. |
| Living With It | No building | Daily use, no active sessions | **IN** | Non-negotiable. V1 must be lived before early adopters use it. |

---

### Phase B — Post-V1 (begin after V1 complete)

| Session | Feature Area | What It Delivers | Trigger to Start |
|---|---|---|---|
| A9b | Connected Insights | Tag/era/question/habit pattern connections | After Living With It reveals which patterns matter |
| A10b | Intelligent Thread Building | Tag/question-assisted thread construction | After 30+ entries exist and manual building feels limiting |
| A11b | Active Connections | North star session, active surfaces once per week | After 60+ entries; requires careful scope control |
| B1 | Electron Wrapper | Desktop app, true install experience | V1 complete |
| B2 | GitHub Actions CI | Auto-builds Linux/Windows/Mac on push | B1 complete |
| B3 | Polish + Final Testing | App icon, window behaviour, cross-platform testing | B2 complete |
| C1 | Portfolio Assets | Demo video, case study write-up, README polish | B3 complete |

---

### Never Build (permanent — Witness philosophy violations)

| Feature | Reason | Locked In |
|---|---|---|
| Streak counters | Gamification. Turns journalling into compliance. Violates Witness. | Pre-A1 |
| AI that reads or interprets entries | Privacy non-negotiable. The app must never read your journal. | Pre-A1 |
| Social features / sharing | Private by design. Sharing changes what people write. | Pre-A1 |
| Telemetry / analytics | Zero data leaves device. Privacy-first is absolute. | Pre-A1 |
| Urgency notifications | Calm technology. Urgency is a manager move. | Pre-A1 |
| Advertising | Violates trust completely. | Pre-A1 |
| Age-based UI versions | Demographic assumption. Infinite maintenance. | Pre-A1 |
| Gender-based themes | Reductive. Assumes identity before user speaks. | Pre-A1 |
| Word count targets or goals | Manager move. Removed from A2b plan. | A2b |
| Hard day counts in stats | Tallies pain. Violates emotional safety. | A4d |
| Absence-pointing observations | "You haven't written about X lately" is surveillance. | Philosophy audit |
| Causation-implied recommendations | "When you do X you feel better" is prescription. | Philosophy audit |
| Prompt chips above writing fields | Clutter before writing starts. Built and removed. | A5a |
| To-do list / task management | Creates obligation. Makes app a manager. | A4d |

---

## FEATURES WITH CONDITIONAL SCOPE

These features are IN V1 but have specific conditions on how they are built. The condition is part of the scope definition — building them without the condition is out of scope.

| Feature | Condition | Reason |
|---|---|---|
| Search (A6c) | Build after 30+ real personal entries exist | Building without knowing what you actually search for produces the wrong feature. Deferred until data exists, but IN V1. |
| A9b Connected Insights | Maximum 5 insights at any time, all dismissable | Scope creep guard. Insights must never feel like surveillance or a report. |
| A11a Passive Connections | Presence only — never absence-pointing | Philosophy guard. Cannot surface "you haven't mentioned X." |
| A11b Active Connections (POST-V1) | Maximum once per week, never negative framing | When built: strict constraints are part of scope, not optional polish. |
| Era colours | Must not clash with mood colour system | Amber/emerald/slate/blue/stone are taken. Era palette is a separate decision, locked in A7a. |

---

## WHAT IS PERMANENTLY OUT OF SCOPE FOR THE ENTIRE PRODUCT

Beyond the Never Build list, these categories are permanently excluded regardless of phase:

- **Cloud storage as default** — sync is always optional, always E2E encrypted, always user-controlled
- **Account/login requirement** — the app works without signup, email, or identity
- **Any form of data monetisation** — user data is never the product
- **Proprietary export format** — data is always human-readable JSON, always
- **Features that require reading entry content** — any feature that analyses, summarises, or acts on journal content is permanently excluded

---

## SCOPE CHANGE PROCESS

If a feature needs to move between IN / POST-V1 / NEVER:

1. Document the reason in DECISIONS-LOG.md (never delete the old decision — add a new row)
2. Update the verdict table in this file
3. Update FEATURE-STATUS.md (V1 column)
4. Update PRD.md if it exists
5. Flag in BUILDLOG at the session where the change was made
6. If moving to NEVER: add to the Never Build table with reason and date

Scope does not change casually. A feature moving to POST-V1 is a decision, not a postponement.

---

## V1 DOCUMENT COMPLETION REQUIREMENTS

These documents must be complete before V1 is called done:

| Document | Required For | Target Session |
|---|---|---|
| V1-Scope.md (this file) | Unlocks PRD, FRD, SRS | Doc Sprint 1 ✅ |
| Witness-Philosophy.md | Portfolio + design guard | Doc Sprint 1 |
| User-Journey.md | Portfolio + early adopter design | Doc Sprint 1 |
| BA-Document.docx (complete) | BA portfolio piece | Doc Sprint 1 |
| PRD.md | Requirements authority | Doc Sprint 2 |
| FRD.md | Behavioural rules | Doc Sprint 2 |
| SRS.md | Data model authority | Doc Sprint 2 |
| WBS.md | Project structure | Doc Sprint 2 |
| Product-Roadmap.md | Phase narrative | Doc Sprint 2 |
| Risk-Register.md | Risk authority | Doc Sprint 2 |
| Assumptions-and-Constraints.md | Assumption tracking | Doc Sprint 2 |

---

## UPDATE LOG

| Date | What changed | Trigger |
|---|---|---|
| 2026-03-02 | File created. All sessions scoped. V1 complete criteria defined. | Doc Sprint Session 1 |

---

*This document is the scope authority. When in doubt about whether something is in V1, the answer is here.
If it is not here, it is not decided — add it before building it.*
