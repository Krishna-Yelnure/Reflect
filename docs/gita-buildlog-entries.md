---

## BHAGAVAD GITA INTEGRATION — PHILOSOPHY LAYER

*Brainstorm complete (2026-03-03). All decisions documented. Four sessions planned. No code written yet.*

*Source documents: gita-witness-integration.docx (philosophy analysis), Bhagavad Gita (Gitapress English edition)*

---

### The Core Alignment

The Witness Journal is built on one irreducible idea: observe but never direct. Hold but never judge. This is, almost word-for-word, the Gita's concept of the Sakshi — the inner Witness. The integration is not decorative. The Gita's structural mechanics — Nishkama Karma, Sthitaprajna, the three Gunas, the karma of inaction, Vairagya — are precision instruments for self-understanding that map directly onto features already in the codebase.

**The rule that governs all of this:** No Gita concept gets a special exemption from the Tier Test. Every feature below has passed:
1. Witness test (witness vs manager) ✅
2. Does not require reading entries ✅
3. Does not assume who the user is ✅
4. Does not add complexity that must be maintained forever ✅

---

### The Chapter-to-Cadence Architecture

*Internal design guide only — never visible to the user. This gives the prompt pools principled structure.*

| Chapters | Cadence | Theme |
|---|---|---|
| 1–6 | Daily | Action, duty, the war within, Nishkama Karma |
| 7–12 | Weekly | Devotion, knowledge, the nature of attachment |
| 13–17 | Monthly | The Field and the Knower, the three Gunas, the qualities of action |
| 18 | Yearly | Final surrender, deepest principle, Vairagya — releasing the grip |

The prompts in A8a are organised by this arc internally. The cadence of the Gita mirrors the cadence of honest self-reflection. The user never sees this mapping — the philosophy is in the structure, not the surface.

---

### What Was Considered and Rejected

| Concept | Temptation | Why rejected |
|---|---|---|
| Svadharma (life duty) | Build a "life purpose" assessment | App never categorises the user — duty is revealed through reflection, not assigned |
| Guna typing | Classify users as Sattvic / Rajasic / Tamasic person | Gunas describe states, not identities. Typing a person is a Manager move |
| Karma scorecard | "Moral consistency" metric derived from entries | App must never read entries — any scoring from content violates the core privacy principle |
| Detachment push notifications | "You seem attached to outcomes today" | Notifications creating urgency are Tier 3 — never build |
| Sanskrit as UI labels | "Rajas state", "Sthitaprajna score" | Categorises user, feels like a typing system — Manager move |
| Sanskrit as decoration | Saffron headers, Sanskrit words as aesthetic | Cultural wallpaper, performative — worse than nothing |
| Emotional volatility index / equanimity delta / stability score | Present mood-derived metrics as performance | App never scores the user. Metrics derived from mood data and presented back as performance violate the Witness philosophy completely |
| Guna analytics — "Restlessness increased 18% relative to last month" | Show Guna percentages and trends | The inner state dimension (A8b) captures Gunas as a landscape, not a percentage. Quantifying and comparing them turns observation into judgment |
| Action vs Attachment delta stored by system | Store derived behavioural metrics from entry content | App must never read entries to infer meaning. Storing derived behavioural metrics is exactly the kind of invisible management the Witness philosophy rejects |
| "Switch Perspective" / Observer Mode Toggle button | Restructure the writing experience on button press | Button that restructures writing is a Manager move. The prompts already do this work quietly |
| Trait audit with self-scoring sliders (reactivity, envy, calm) | Self-score against character traits | Turns the app into a moral performance tracker. The Witness observes; it never grades |
| Attachment mapping tags (status, relationship, control) | Infer attachment category from user writing | Requires reading entries. Never |
| "Type of Actor" derived from aggregated data | Derive personality summary from entries | App cannot derive a personality summary from entries — AI reading entries problem in a different coat |
| Mortality check as weekly automatic trigger | "Appears Sunday evening automatically" | App never pushes content on a schedule. Calm technology, never urgent |
| Yearly Dharma Anchor as pinned system element | Pin philosophical conclusions derived from user data | App surfaces what the user has written. It doesn't pin philosophical conclusions derived from their data |
| 2-minute stillness timer | Add meditation timer | Outside scope entirely. This is a meditation app feature, not a journaling feature |
| Subject-Object triggered insight | Detect low mood streak, surface "the world reflects the weather within" observation | Requires app to interpret emotional pattern and push a conclusion — Manager move. The right home is a prompt, not a triggered insight |
| Duality and boundary tracking | Detect "Us vs. Them" language in entries, tag as Duality in backend, surface pattern | Requires reading entry content — permanently off the table, core privacy principle |
| Fact vs. Imagination chip in Deep Write | Header chip above textarea in longform mode | Prompt chips were built and removed in A5a — decision locked, not the right pattern for this product |

---

### Copy Audit Standard

*Permanent standard. Applies to all copy — Gita-informed and existing alike. Every string passes this before it ships.*

1. No "should" statements anywhere in the app
2. No "you seem" statements — the app never interprets emotional state back at the user
3. Insights phrased observationally, never prescriptively
4. Progress measured as steadiness, not productivity
5. No moral scoring language
6. No urgency language
7. No absence-pointing — observations describe what's present, never what's absent
8. No causation language — co-occurrence only; "these appear together" is safe; "when you do X you feel better" is not
9. No categorisation of the user — the app holds, never files

This supersedes and includes the Witness test. Every session checklist now references "passes Copy Audit Standard."

---

### Sanskrit in the App — Decision Locked

Sanskrit is permitted only under **progressive disclosure**. Plain English is always primary. Sanskrit is always secondary, always opt-in, always contextual. The Witness never announces its philosophy; it holds it quietly and reveals it only when the user seeks it.

**Three permitted patterns:**

1. **Closing Moment reveal (A8c)** — After the closing line appears post-save, a very quiet `(i)` tap reveals: *"This practice has a name: Nishkama Karma — action without attachment to outcome."* Invisible unless sought.

2. **Prompt tooltip reveal (A8c)** — When a Gita-informed prompt appears, a subtle tap reveals the teaching underneath. The prompt is always complete without it.

3. **Philosophy screen in Settings (deferred)** — A dedicated screen under Settings that explains the philosophical underpinning. Sanskrit named, teachings given context, connection to the Witness philosophy explained. Decided after A8a–A8c are built and reviewed.

---

#### SESSION A8a — Gita Prompt Pool
**Status:** ✅ COMPLETE (2026-03-04)
**Depends on:** A7 (or current session state) ✅
**Scope creep risk:** Low
**Files:** `src/app/utils/prompts-v2.ts`

**Goal:** Add a Gita-informed prompt pool that integrates into the existing daily prompt rotation and reflection-type prompts. No Sanskrit visible. Pure journaling prompts. The philosophy is in the structure, not the surface.

**Decisions made — do not relitigate:**

| Decision | Choice | Why |
|---|---|---|
| Separate file vs integrated | Integrated into prompts-v2.ts as named exports `gitaPrompts` and `gitaReflectionPrompts` | One source of truth, existing rotation logic works without modification |
| Sanskrit in prompt copy | Never — plain English only | Cognitive load before writing is always wrong |
| Rotation logic | Existing `last_prompt_shown_date` gate is sufficient | No new logic needed |
| Prompt attribution | No attribution in UI | "Inspired by the Gita" labels would be a Manager move |

**Prompts added — by reflection type:**

*Daily (integrated into rotation via `getGitaDailyPrompt()`):*
- "Was my most difficult decision today made from a steady mind, or was it shadowed by a sudden desire for comfort or a flash of frustration?"
- "Is there something I've been calling 'waiting' or 'not the right time' that is actually a choice not to act?"
- "If the outcome were completely out of my hands, what would the right action have been today?"
- "What immediate comfort am I willing to relinquish for long-term clarity?"
- "Am I avoiding this because it feels genuinely wrong — or because of the discomfort it requires?"
- "What situation is creating internal conflict right now — and what would it mean to act anyway?" *(Ch. 1)*
- "What action is mine to take today, regardless of how I feel about it?" *(Ch. 3)*
- "Did I renounce the outcome today — or did I renounce the effort?" *(Ch. 5)*
- "Is the frustration today truly about the situation — or is something deeper using it as a reason to surface?" *(ego/conflict lens)*
- "What is the weather within today — and how much of it is colouring what you see outside?" *(subject-object mirror, as prompt not triggered insight)*
- "What hard fact might you be softening today through distraction or imagination?" *(fact vs imagination, as prompt not chip)*

*Weekly:*
- "Where did I act with full integrity this week, regardless of whether I was praised or criticised?"
- "Where did I let the fear of an outcome dictate my choices, instead of focusing on the right action?"
- "How steady was my foundation this week? Where did I lose my centre — and what pulled me back?"
- "Which action this week felt aligned beyond any thought of reward or recognition?" *(Ch. 9)*
- "What seemed urgent this week that now appears small?" *(Ch. 11)*

*Monthly:*
- "What outcome did I hold too tightly this month that caused unnecessary suffering?"
- "What is the most honest account of how I acted this month — not how I intended to act?"
- "Where did inaction feel safer than the necessary step? What made it feel that way?"
- "What changed this month? What remained constant?" *(Ch. 13 — Field/Knower distinction)*
- "What are you most rooted in — and is that serving you?" *(Ch. 15)*

*Yearly:*
- "What did I stop needing this year that I once thought I could not live without?"
- "Where did I act from my clearest mind this year? What made those moments possible?"
- "What question have I been not-answering? What would it take to answer it, or to release it?"
- "What are you still clinging to that prevents full alignment with your deeper principle?" *(Ch. 18)*

**Suggested Persistent Question (user-added, not system-imposed):**
- "Where am I creating conflict with myself today — through judgment, impossible standards, or self-deception?"
*(Add to PersistentQuestions.tsx as a suggested starting prompt when the Questions tab is empty — user chooses to add it, never system-imposed)*

**What was NOT built (and why):**
- BelowHeatmap integration: `getGitaDailyPrompt()` is exported and ready. The BelowHeatmap component in TimelineView.tsx currently calls `getSmartPrompt()` from `prompts.ts`. Wiring `getGitaDailyPrompt()` into that rotation requires a change to TimelineView.tsx. Deferred to avoid scope creep — the prompt pool is complete and tested, integration is a one-line change.
- TimelineView.tsx and JournalEntry.tsx: no changes required. Existing `getReflectionPrompt()` interface is preserved — the function now draws from the combined pool transparently.

**Checklist:**
- [x] `gitaPrompts` export added to prompts-v2.ts (11 daily prompts)
- [x] `gitaReflectionPrompts` export added — weekly (5), monthly (5), yearly (4)
- [x] `getGitaDailyPrompt()` exported — draws from daily Gita pool
- [x] `getReflectionPrompt()` updated — now draws from combined pool (existing + Gita), interface unchanged
- [x] Existing rotation logic (once-per-day gate) unchanged
- [x] No Sanskrit, no attribution visible in UI
- [x] All prompts pass Copy Audit Standard (no should, no urgency, no categorisation)
- [x] Chapter-to-cadence architecture documented (design guide, not a feature)
- [ ] BelowHeatmap in TimelineView.tsx updated to call `getGitaDailyPrompt()` alongside `getSmartPrompt()` — one-line change, defer to next session or do immediately if TimelineView.tsx is open
- [ ] Committed and pushed to GitHub
- [ ] BUILDLOG updated

---

#### SESSION A8b — Inner State Dimension (Gunas)
**Status:** NOT STARTED — BRAINSTORM COMPLETE
**Depends on:** A8a ✅
**Scope creep risk:** Medium — third data dimension touches types.ts, storage, and Insights
**Files:** `src/app/types.ts`, `src/app/db/index.ts`, `src/app/components/JournalEntry.tsx`, `src/app/components/Insights.tsx`, `src/app/utils/insights.ts`

**Goal:** Add a third optional dimension to Write mode alongside mood and energy: inner state quality. Separate from mood (emotional colour) and energy (physical state). This captures the quality of mind — which the Gita calls the Guna — without naming it as such.

**The three states (plain English, no Sanskrit):**
- **Clear** — purposeful, grounded, settled (maps to Sattva)
- **Restless** — driven, anxious, scattered (maps to Rajas)
- **Heavy** — stuck, avoidant, depleted (maps to Tamas)

**Decisions made — do not relitigate:**

| Decision | Choice | Why |
|---|---|---|
| Label in UI | "How did your mind feel?" | Neutral, Witness-compliant — observation not instruction |
| Position in Write mode | After mood + energy row, before writing fields | Mood captures feeling, energy captures body, inner state captures mind — logical sequence |
| Mandatory vs optional | Optional — always | Never gate writing behind metadata. User who doesn't engage never sees it pushed |
| Sanskrit visible | Never in Write mode | Progressive disclosure only — see A8c |
| Data field name | `innerState: 'clear' \| 'restless' \| 'heavy' \| undefined` | Clean enum, backward compatible |
| Insights visualisation | Distribution over time — no percentages, no month-over-month comparison | Landscape, not judgment. "Restlessness increased 18%" pattern is permanently locked out |
| Memory Thread integration | Tag clear (Sattvic) entries into a special pool | "Written from your clearest mind" — surfaced in MemorySurface or Threads |

**Checklist (build session):**
- [ ] `innerState` field added to `JournalEntry` type in types.ts
- [ ] `db.entries` storage handles new field (backward compatible — undefined for old entries)
- [ ] Three-option inner state selector added to JournalEntry.tsx in compact row format
- [ ] Selector is visually consistent with mood/energy compact row (A6b-polish standard)
- [ ] Optional — no prompt to fill, no validation
- [ ] `innerState` saved and loaded correctly
- [ ] Insights.tsx shows inner state distribution chart (Recharts, consistent with MoodChart)
- [ ] insights.ts computation handles undefined (old entries) gracefully
- [ ] Chart shows landscape distribution — no percentages, no month-over-month comparison
- [ ] "Clear mind" entries tagged into a surfaceable pool (prep for A10/MemorySurface)
- [ ] DayView (TimelineView.tsx) renders innerState when present
- [ ] All new copy passes Copy Audit Standard
- [ ] Committed and pushed to GitHub
- [ ] BUILDLOG updated

---

#### SESSION A8c — Sanskrit Reveal Layer
**Status:** NOT STARTED — BRAINSTORM COMPLETE
**Depends on:** A8a ✅ (prompts must exist before reveals reference them)
**Scope creep risk:** Low — purely additive, no existing logic changes
**Files:** `src/app/components/JournalEntry.tsx`, `src/app/utils/prompts-v2.ts`

**Goal:** Add progressive disclosure of Sanskrit terms and Gita teachings. Invisible by default. Revealed only on deliberate user tap. Never imposed. The Witness holds the philosophy quietly and surfaces it only when sought.

**The two reveal surfaces:**

*1. Closing Moment reveal*
After the closing line appears post-save, a very quiet secondary element. Design: a small faint Sanskrit character (ॐ) or a minimal `· know more` text link — below the closing line, smaller, lighter. On tap, expands inline:

> *Nishkama Karma*
> "Action without attachment to outcome. The practice of doing what is right, and releasing the need to control what follows."

Each closing line maps to one teaching. The mapping is internal — the user never sees the mapping logic, only the revealed name when they tap.

*2. Prompt tooltip reveal*
When a Gita-informed prompt appears in the BelowHeatmap daily space, the same quiet reveal pattern. The prompt is always complete without it. On tap:

> *From the Bhagavad Gita*
> "This question comes from Nishkama Karma — the teaching that suffering arises not from difficulty but from our attachment to a specific outcome."

**Decisions made — do not relitigate:**

| Decision | Choice | Why |
|---|---|---|
| Reveal trigger | Tap / click only | Never auto-expand. User seeks it — Witness never announces |
| Reveal animation | Gentle fade-in expand (Motion) | Consistent with app's animation language |
| Sanskrit script shown | Yes, alongside transliteration | The script is beautiful. Showing both respects the source |
| Devanagari in data | gitaReveals stores `{ sanskrit, devanagari, transliteration, teaching }` | Both script and romanisation preserved |
| Reveal persistence | Does not persist between sessions | Each reveal is a moment of discovery, not a setting |
| Which prompts get reveals | Gita-pool prompts only (from A8a) | Existing prompts are untouched — no retrofitting |
| Which closing lines get reveals | Gita-aligned lines only | Not all closing lines need a teaching attached |
| Copy tone | Explanatory, not instructional | "This comes from..." not "You should practice..." |

**Sanskrit → Teaching mapping (closing lines):**
- "The story continues." → Karma Yoga (action as ongoing practice)
- "Here. Now. Remembered." → Sakshi (the Witness — pure awareness)
- "The ground beneath you held." → Sthitaprajna (steady wisdom through difficulty)
- New closing line to add: "What was required, you did." → Nishkama Karma

**Checklist (build session):**
- [ ] `gitaReveals` map added to prompts-v2.ts — keys are prompt IDs / closing line IDs, values are `{ sanskrit, devanagari, transliteration, teaching }`
- [ ] Closing Moment component in JournalEntry.tsx gains optional reveal trigger (only when mapping exists)
- [ ] Reveal expands inline with Motion animation — Devanagari script + transliteration + one-sentence teaching
- [ ] BelowHeatmap prompt gains optional reveal trigger (only for Gita-pool prompts)
- [ ] Reveal is tap-to-open only — never auto-open
- [ ] New closing line added: "What was required, you did."
- [ ] Reveal copy passes Copy Audit Standard — explanatory, not instructional
- [ ] Committed and pushed to GitHub
- [ ] BUILDLOG updated

---

#### SESSION A8d — Habit Builder Copy Refresh
**Status:** NOT STARTED — BRAINSTORM COMPLETE
**Depends on:** None — standalone copy changes
**Scope creep risk:** Low — copy only, no logic changes
**Files:** `src/app/components/HabitBuilder.tsx`, `src/app/components/GentleStartTracker.tsx`

**Goal:** Shift the Habit Builder language from accumulation to equanimity. The existing philosophy ("Container for exploration, not a tracker for compliance") is already Nishkama Karma in practice. These are micro-copy refinements that make the philosophy more precise — no structural or logic changes.

**Copy changes — specific and complete:**

| Location | Current copy | New copy | Why |
|---|---|---|---|
| GentleStartTracker heading | "21-Day Gentle Start" | "21-Day Steady Practice" | Shifts from counting to equanimity. "Practice" implies ongoing equanimity; "state" implies a destination — "Steady Practice" is stronger |
| Day 21 celebration state | "Habit explored. What did you learn?" | "21 days held. What did the practice reveal?" | "Held" vs "explored" — steadiness over curiosity-as-metric |
| Re-engagement after missed days | *(not addressed)* | "Returning is the practice." — shown on re-engagement after a gap | The Gita: returning is not a restart, it is the act itself |
| Habit card "Why" label | "Why" | "What draws you to this" | Less interrogation, more witness |
| Archive prompt | "Archive this habit" | "This has served its time" — as a secondary line | Vairagya: release without failure |

**Checklist (build session):**
- [ ] GentleStartTracker.tsx — heading copy updated
- [ ] GentleStartTracker.tsx — day 21 celebration copy updated
- [ ] GentleStartTracker.tsx — re-engagement detection added (gap after engaged days → show "Returning is the practice.")
- [ ] HabitBuilder.tsx — "Why" label updated
- [ ] HabitBuilder.tsx — archive secondary line added
- [ ] No logic changes — copy only
- [ ] All new copy passes Copy Audit Standard
- [ ] Committed and pushed to GitHub
- [ ] BUILDLOG updated

---

### Philosophy Screen — Decision Deferred

A dedicated screen under Settings that names the Gita teachings, shows Sanskrit with context, and explains the connection to the Witness philosophy. Decided after A8a–A8c are built and can be reviewed as a whole. If the reveal layer (A8c) is doing its job, a full screen may not be needed. If users are seeking more context than the reveals provide, the screen earns its place.

**The Tier Test question for this decision:** Does it add complexity that must be maintained forever? A static philosophy screen, once written, is low maintenance. The risk is it pulls the app toward a spiritual identity it doesn't need to have. Review after A8c.

---
