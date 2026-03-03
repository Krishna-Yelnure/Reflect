# User-Journey.md
# Premium Journal App — The User Journey
# Last updated: 2026-03-02
# Owner: Product
# Registry: docs/DOCS-REGISTRY.md → User-Journey.md entry
# Rule: Update when a new feature materially changes the experience at a journey stage,
#       or when a failure mode is resolved. This document uses a temporal model —
#       not demographic personas. The stages are defined by time and depth, not identity.

---

## WHY A TEMPORAL MODEL, NOT PERSONAS

Traditional user personas describe who a person is — age, profession, goals, frustrations. They are useful for B2B products with multiple distinct user types. They are not the right model for a personal journalling app.

This product has one user type: a person who writes. What changes is not who they are — it is how long they have been writing, and therefore what the app means to them.

A 19-year-old on Day 365 has a fuller relationship with this app than a 45-year-old on Day 7. The age is irrelevant. The depth of use is everything.

The temporal model describes five stages of that relationship. Each stage has its own emotional register, its own needs, its own failure modes. Every feature decision maps to one or more of these stages. A feature that only serves Day 1 creates onboarding debt. A feature that only serves Day 10,000 is irrelevant to everyone for years.

**The design question is always:** which day does this serve?

---

## THE FIVE STAGES

---

## DAY 1 — THE STRANGER

### Who they are

Someone who has tried journalling before and stopped. Or someone starting for the first time, drawn by a transition — a new job, a loss, a move, a relationship ending or beginning. They carry cautious hope: *"maybe this time."*

They are not committed. They have not decided anything. They have opened the app once.

### What they see

An empty heatmap. A full year of grey cells, quiet and unmarked. No colour anywhere.

This is the most important moment in the product. Everything that follows depends on whether this first view feels like an invitation or an accusation.

An empty heatmap that communicates *"you haven't done anything yet"* loses this person. An empty heatmap that communicates *"this is yours, ready when you are"* keeps them.

**The copy test:**
> ❌ "No entries yet — start writing!" — a manager counting the absence
> ✅ "This is yours. Start whenever you're ready." — a witness, present and unhurried

### What they need

Not guidance. Not a tour. Not a checklist of features. They need one thing: to write something true and have somewhere safe to put it.

The form should not overwhelm. The first entry should not feel like an intake form. Quick mode exists for exactly this moment — a mood, a single field, a save button.

### The first save

The closing moment after a first entry must be different from every subsequent closing moment. Not a celebration — celebrations feel false when you have done nothing yet but write two sentences. A quiet acknowledgement.

> *"Your first entry. It's here now. It'll always be here."*

Then one cell in the heatmap lights up with colour. They see it. Something shifts. The map has begun.

### What brings them back on Day 2

Not a notification. Not a streak counter showing "1." Not a reminder.

The memory of how it felt to write something true and have somewhere safe to put it. That is the only thing that brings them back. The product cannot manufacture this — it can only make the first experience good enough that the memory is real.

### Failure modes at Day 1

| Failure | Cause | Current state |
|---|---|---|
| Empty heatmap feels like an accusation | No invitation state designed | ✅ Solved — WelcomeCard + today cell pulse |
| First save feels identical to subsequent saves | No special first-entry closing moment | ✅ Solved — "Your first entry. The map has begun." |
| Form overwhelms on first open | 5-field guided form lands by default | ✅ Mitigated — Quick mode available |
| No sense of what the app is before first write | Philosophy not communicated at entry | ⚠️ Partial — WelcomeCard exists but is brief |
| Guided first entry doesn't exist | No structured onboarding for new users | ❌ Not built — deferred, no session scheduled |

---

## DAY 7 — THE RETURNER

### Who they are

They came back. Maybe 5 of 7 days, maybe 3 of 7 — it doesn't matter. They returned. There is a tentative sense of something forming, not yet a habit, not yet a practice. A possibility.

They are testing whether this is worth continuing. The answer depends entirely on whether the app gives them something they couldn't have gotten from a paper notebook.

### What they see

A small cluster of colour in the heatmap. This week. Their week. It looks like something — not a year, not a meaningful pattern, but a beginning. A few cells of colour in an ocean of grey.

And then they do something they couldn't do with paper: they click on a cell from three days ago and read what they wrote. *"I forgot I felt that way."*

This is the first time the memory machine works. This moment — reading past writing and feeling the distance between then and now — is unique to a digital journal with a good reading experience. Paper can't navigate like this. Most apps bury entries behind search or a flat list. The heatmap makes the past instantly visible and immediately accessible.

### The continuity prompt

By Day 7, the contextual prompt strip in Write has a chance to land its most important moment: continuity.

> *"A few days ago you wrote about feeling uncertain at work. Still on your mind?"*

If the tone is right, they feel understood. If the tone is wrong, they feel surveilled. The difference is entirely in phrasing. The prompt must feel like it came from someone who remembered, not from an algorithm that flagged a keyword. This is why the phrasing is passive and open — *"still on your mind?"* not *"how did that resolve?"*

### The friction point

By Day 7, a pattern is emerging: they know which fields they always fill and which they always skip. The 5-field guided form that felt appropriate on Day 1 starts to feel like homework. Quick mode becomes essential here — not as a shortcut, but as the right tool for the days when there is only one thing to say.

### What they need

Recognition that they have been here before. The app knows them slightly now — a few entries, a mood history, a sense of rhythm. It should use that knowledge quietly, not aggressively.

Memory surface integrated into Write. Year-ago only if there is something to surface (Day 7 users rarely have a year-ago entry). Continuity if yesterday exists.

### Failure modes at Day 7

| Failure | Cause | Current state |
|---|---|---|
| App feels identical to Day 1 | No continuity or context | ✅ Solved — continuity prompt built in A4 |
| Form friction causes drop-off | No mode below guided | ✅ Solved — Quick mode in A4 |
| Memory surface not integrated | Separate component, not in Write | ✅ Solved — memory surface in Write A4 |
| Continuity prompt feels like surveillance | Wrong phrasing or wrong timing | ⚠️ Risk remains — phrasing must be audited in real use |
| No way to navigate old entries fluidly | Poor timeline UX | ✅ Solved — Timeline drill-down A3b |

---

## DAY 30 — THE PRACTITIONER

### Who they are

A journaller — they may not call themselves that yet, but the behaviour is there. Writing has become part of how they process. Not every day, but regularly. The app is where they go when something happens.

They feel ownership: *"these are my words."* The journal is no longer a new thing they are trying. It is a thing they do.

### What they see

A month of colour. Patterns they did not know were there. They may notice that they always write on Sunday evenings. That energy is always low on Thursdays. That three entries this month mention the same person, same situation. That good weeks have a particular texture.

### The first revelation

At Day 30, insights stop being features and start being mirrors. Not before — you need density. At 10 entries the patterns are noise. At 30 entries they become signal.

The Insights view shows something real: a mood shape, a rhythm, a recurrence. The Language Insights show words that appear often. The heatmap has an emotional texture to it now — not a single colour, a range.

This is the first time the app demonstrates its long-term value. Not *"this is useful"* but *"I could not have seen this without you."*

### What the app should do

Gently surface the monthly reflection option. Not push — offer. The monthly reflection entry type exists and is accessible from the Timeline, but at Day 30 there should be a quiet acknowledgement in the heatmap below:

> *"You've been writing for a month. Some find it useful to reflect on the whole month at once. No pressure."*

Then leave it. No reminder. No follow-up. It was offered. The decision is theirs.

### The risk at Day 30

Mechanical sameness. A ritual is forming but it risks becoming rote — same fields, same structure, same few sentences every day. Writing stops being exploration and becomes a checklist.

Daily rotating prompts earn their place here. Not as guidance, as disruption — a question that opens a different door than the usual one.

### What they need

Depth without complexity. The app should feel richer at Day 30 than Day 1 — because more has been put into it, more comes back out. Tags becoming navigable. Eras taking shape. The Inner Compass beginning to hold real content.

### Failure modes at Day 30

| Failure | Cause | Current state |
|---|---|---|
| Insights feel empty or generic | Not enough data, or not data-threshold-aware | ⚠️ Risk — Insights view needs Witness redesign (A9a) |
| No monthly reflection acknowledgement | Not built | ⚠️ Partial — reflection accessible from Timeline, no quiet prompt yet |
| Daily prompts feel repetitive | Non-rotating prompts | ✅ Solved — rotating prompts in A4 |
| Practice becomes mechanical | No variation in writing experience | ✅ Mitigated — three write modes available |
| Tags unusable at scale | No normalisation, no navigation | ✅ Solved — A6a + A6b |

---

## DAY 365 — THE ANNIVERSARY

### Who they are

Someone whose year is in here. All of it — the good months and the hard ones. The decisions made, the feelings processed, the version of themselves that existed during each chapter. They are not the same person who wrote the first entry.

They feel something between pride and vulnerability. A year of honest writing is a significant thing to have done. Not everyone does it. They did.

### What they see

The full heatmap for the first time. A complete year. The emotional shape of their life rendered in colour — warm amber clusters in summer, deep slate through the hard stretch in autumn, a gentle return to green in December.

They see a story they lived but could not have narrated from inside it.

**This moment is what the entire product is being built toward.** Every design decision, every session, every philosophical constraint — all in service of this view, this person, this feeling.

### What they do

They click the darkest cells. They read what they wrote during the hard weeks. They see they got through it. They were more thoughtful than they remembered being. Some entries make them cry. Some make them laugh. Some entries describe a version of themselves that seems very far away.

They click the brightest cells too — the good months, the easy weeks. They remember how that felt.

They find an entry they had completely forgotten writing. It speaks directly to something happening right now, as if past-them was leaving a message. This is the year-ago surface working at its full power: not surfacing yesterday, but surfacing a year ago, in the Write view, without being asked.

They may feel, perhaps for the first time, that they have been witnessed.

### What the app should do on Day 365

Nothing aggressive. No banner. No badge. No streak congratulation. No notification.

If they open the app on or near the anniversary of their first entry, one quiet acknowledgement in the Timeline below the heatmap:

> *"A year of writing. That's something."*

Then get out of the way. Let them navigate. Let them read. Let them be alone with it.

### Search becomes critical here

At Day 365, they know there was an entry about their mother during the spring, or an entry about the job decision, or something they wrote when they were feeling a particular way. They want to find it. The heatmap navigation helps but is not sufficient.

Search — full-text, tag-filtered — must exist by this point. Not as a convenience, as a necessity. The journal is large enough to get lost in without it.

### Failure modes at Day 365

| Failure | Cause | Current state |
|---|---|---|
| Heatmap doesn't carry the emotional weight it should | Visual design insufficiently powerful | ✅ Mostly solved — A3b + A5b typography polish |
| No anniversary acknowledgement | Not built | ❌ Not built — no session scheduled |
| Yearly reflection doesn't feel earned | Accessed same as any entry | ⚠️ Partial — accessible, not specially surfaced |
| Search doesn't exist | Deferred | ⚠️ In V1, deferred until 30+ entries — must be built before V1 complete |
| Tags/eras not navigable | Core features incomplete | ⏳ In progress — A6b, A7a, A7b pending |

---

## DAY 10,000 — THE LIFE

### Who they are

27 years of daily entries.

Someone who has used this app through multiple complete chapters of life. Jobs held and left. Relationships formed and ended. Children born or not born. People lost. Cities lived in. A self that has transformed multiple times, each transformation visible in the heatmap as a shift in emotional texture.

The app is an old friend. It knows things about them that no other person knows. It has held what they could not say out loud.

### What they see

27 years of heatmaps. A life in colour. Each year a different texture — the anxious early twenties, the settled middle years, the grief year, the renaissance. Scrolling through years feels like reading chapters of a book they lived.

They can find any entry from any day in any year within seconds. They have a complete record of their adult life.

### What the app owes this person

Everything.

They trusted this app with the most private contents of their mind, consistently, across nearly three decades. In return, the app owes them:

- **Permanence** — every entry exactly as written, forever, accessible on any device they own
- **Respect** — nothing ever read, analysed, or processed without explicit permission
- **Speed** — 10,000 entries must be searchable and navigable instantly
- **Portability** — the data must be theirs in a format they can keep, back up, and open without this app

### The local-first argument at Day 10,000

This is not an argument about features. It is an argument about what can be lost.

> A journal kept in a proprietary cloud app is a journal that can be taken away. The company shuts down. The subscription lapses. The format becomes unreadable. The servers go offline. The data is gone.

> A journal kept in a local file, in human-readable JSON, backed up wherever the user chooses — that is a journal that lasts a lifetime. It does not depend on a company existing. It does not depend on a subscription being paid. It does not depend on a server being available. It is a file. Files last.

This is why local-first is not a technical decision — it is an ethical one. The Day 10,000 user is the reason.

### Performance becomes existential

localStorage fails silently around 5-10MB. 10,000 entries will exceed this. The Phase B Electron migration solves this with file-based storage — but the migration must happen before the user feels it, not after entries start disappearing.

The storage quota warning (BUGS-AND-DEBT C1) must surface well before the limit. Phase B is the architectural solution.

### Legacy needs real thinking

The DataLegacy view currently provides an export button. At Day 10,000, legacy is not an export button — it is a question: *what happens to this record when I am gone?*

This is not a morbid feature. It is the completion of the permanence promise. A journal kept for 27 years represents something. The person who kept it may want to determine who can access it, and when, and how. The app should have an answer to that question that is worthy of what was entrusted to it.

### Failure modes at Day 10,000

| Failure | Cause | Resolution |
|---|---|---|
| App no longer exists | Company shut down | Local-first architecture. Open JSON. No dependency on servers. |
| Data unreadable | Proprietary format | Human-readable JSON export from Day 1. Always. |
| Performance collapse | localStorage at scale | Phase B — Electron + file storage. Solve before it's felt. |
| Search is too slow or missing | Scale issues | Phase B indexed storage + search optimisation. |
| Legacy is just an export button | Insufficient thought | Requires real design thinking post-V1. |
| Entries lost to browser clear | localStorage cleared | Phase B solves. Phase A: export reminder prominent. |

---

## FEATURE-TO-DAY MAPPING

*Every feature maps to the day it primarily serves. A feature that serves only one day is a risk. A feature that serves every day is a foundation.*

| Feature | Primary Day | Also Serves | Notes |
|---|---|---|---|
| Empty heatmap invitation state | Day 1 | — | First impression — non-negotiable |
| First save special closing moment | Day 1 | — | Warmer than all subsequent saves |
| Quick mode | Day 1, Day 7 | Every day | Reduces friction at every stage |
| WelcomeCard | Day 1 | — | Dismisses after first entry |
| Today cell pulse | Day 1 | — | Stops after first save |
| Continuity prompt | Day 7 | Day 30+ | Must feel understood, not surveilled |
| Memory surface in Write | Day 7+ | Day 365 | Year-ago is most powerful at anniversary |
| Daily rotating prompts | Day 30 | Every day | Prevents mechanical sameness |
| Monthly reflection | Day 30 | Day 365 | Natural access point needed |
| Insights — data threshold aware | Day 30 | Day 365+ | Show "building" state before 30 days |
| Tag navigation + filter | Day 30 | Day 365+ | Tags are meaningless without surfaces |
| Era system | Day 30+ | Day 365+ | Chapters require time to form |
| Inner Compass — Values | Day 30+ | Day 365+ | Values crystallise through writing |
| Inner Compass — Questions | Day 30+ | Every day | Questions are held across months |
| Full year heatmap | Day 365 | Day 10,000 | The moment everything is built toward |
| Yearly reflection (earned) | Day 365 | — | Must feel significant, not routine |
| Anniversary acknowledgement | Day 365 | — | Quiet, not celebratory |
| Search | Day 365 (critical) | Day 10,000 (existential) | Must exist before V1 |
| Passive pattern connections | Day 365+ | Day 10,000 | Requires data density |
| Threads — reading experience | Day 365+ | Day 10,000 | Assembled collections of entries |
| Local-first architecture | Every day | Day 10,000 | Non-negotiable from Day 1 |
| Open JSON export | Every day | Day 10,000 | Permanence promise |
| Witness philosophy in all copy | Every day | — | Audit every string |
| Performance at scale | Day 10,000 | — | Phase B solves |
| Legacy — real design | Day 10,000 | — | Post-V1, requires real thought |
| End-to-end encrypted sync | Every day | Day 10,000 | Optional, user-controlled, Phase C |

---

## THE REAL NEED BENEATH THE FEATURES

People want to feel **known**. Not categorised — known. There is a profound difference.

Age-based UI versions, gender-based themes, birthday notifications from the app — these are attempts to serve the need to be known through demographics. They assume who you are before you have said a word.

The Witness never assumes. The Witness listens.

The deepest feeling of being known does not come from a purple theme or a birthday notification. It comes from someone saying: *"remember when you told me that thing three years ago? I never forgot."*

That is what this app can do. Not through AI. Not through analysis. Through time and attention. The journal that holds everything honestly, and surfaces it at the right moment, makes a person feel known in a way that no feature list can describe.

The Day 10,000 user is the proof. 27 years of writing held perfectly, accessible instantly, never read by the app, never monetised, never lost. That is what it means for someone to feel known by a piece of software.

Every feature decision either moves toward that or away from it.

---

## UPDATE LOG

| Date | What changed | Trigger |
|---|---|---|
| 2026-03-02 | Document created. Extracted and expanded from BUILDLOG sections: USER JOURNEY DAY 1 TO 10,000, THE FEATURE-TO-DAY FRAMEWORK, THE HUMAN LAYER. | Doc Sprint Session 1 |

---

*Update this document when a new feature materially changes the experience at a journey stage,
or when a failure mode listed here is resolved. The temporal model does not change —
the stages are fixed. What changes is the current state column in each failure mode table.*
