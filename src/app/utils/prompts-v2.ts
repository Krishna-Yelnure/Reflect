// V2: Reflection mode prompts + Gita-informed prompt pools (Session A8a)
//
// Architecture:
//   reflectionPrompts       — existing weekly/monthly/yearly sets (unchanged)
//   gitaPrompts             — daily Gita-informed prompts, integrated into BelowHeatmap rotation
//   gitaReflectionPrompts   — weekly/monthly/yearly Gita-informed prompts, merged into reflection sets
//   getDailyPrompt()        — returns one prompt from the combined daily pool (existing + Gita)
//   getReflectionPrompt()   — returns one prompt from the combined set for a given cadence
//
// Design decisions (A8a — locked):
//   - No Sanskrit, no attribution visible in UI
//   - No new rotation logic — existing last_prompt_shown_date gate is sufficient
//   - Gita prompts integrated into named pools; selection logic unchanged
//   - All prompts pass Witness test: observational, no urgency, no instruction

// ─── Existing reflection prompts (unchanged) ──────────────────────────────────

export const reflectionPrompts = {
  weekly: [
    "What patterns repeated this week?",
    "What gave you energy this week?",
    "What drained you this week?",
    "What surprised you about yourself?",
    "What did you avoid or postpone?",
    "What conversations stayed with you?",
    "What changed from last week?",
  ],

  monthly: [
    "What changed emotionally this month?",
    "What themes kept appearing?",
    "What mattered more than you expected?",
    "What relationships shifted?",
    "What did you learn about yourself?",
    "What assumptions can you let go of?",
    "What felt different from last month?",
  ],

  yearly: [
    "What defined this year for you?",
    "How did you change?",
    "What surprised you most?",
    "What relationships deepened or faded?",
    "What belief did you outgrow?",
    "What are you grateful for?",
    "What do you understand now that you didn't before?",
    "What still feels unresolved?",
  ],
};

// ─── Gita-informed daily prompts ─────────────────────────────────────────────
//
// Plain English only. No attribution in UI. Philosophy is in the structure,
// not the surface. All pass the Witness test: observational, not instructional.
//
// Internal chapter references are for design guidance only — never shown to user:
//   Ch. 1  — internal conflict, the war before action
//   Ch. 3  — Nishkama Karma, action as duty regardless of mood
//   Ch. 5  — renunciation of outcome vs renunciation of effort
//   Ch. 11 — perspective on urgency and scale
//   Ego/conflict lens (Acharya Prashant additions)

export const gitaPrompts = [
  // Core Nishkama Karma / action-without-attachment
  "Was my most difficult decision today made from a steady mind, or was it shadowed by a sudden desire for comfort or a flash of frustration?",
  "Is there something I've been calling 'waiting' or 'not the right time' that is actually a choice not to act?",
  "If the outcome were completely out of my hands, what would the right action have been today?",
  "What immediate comfort am I willing to relinquish for long-term clarity?",
  "Am I avoiding this because it feels genuinely wrong — or because of the discomfort it requires?",

  // Ch. 1 — the internal conflict before action
  "What situation is creating internal conflict right now — and what would it mean to act anyway?",

  // Ch. 3 — action regardless of mood
  "What action is mine to take today, regardless of how I feel about it?",

  // Ch. 5 — renunciation distinction
  "Did I renounce the outcome today — or did I renounce the effort?",

  // Ego and conflict lens
  "Is the frustration today truly about the situation — or is something deeper using it as a reason to surface?",
  "What is the weather within today — and how much of it is colouring what you see outside?",
  "What hard fact might you be softening today through distraction or imagination?",
];

// ─── Gita-informed reflection prompts (weekly / monthly / yearly) ─────────────
//
// Internal chapter references are for design guidance only — never shown to user:
//   Ch. 9  — ordinary acts carrying deeper meaning
//   Ch. 11 — perspective: what seemed urgent, how small it appears now
//   Ch. 13 — the Field and the Knower; what changed vs what remained constant
//   Ch. 15 — what one is most rooted in
//   Ch. 18 — final surrender, deepest principle, releasing the grip

export const gitaReflectionPrompts = {
  weekly: [
    "Where did I act with full integrity this week, regardless of whether I was praised or criticised?",
    "Where did I let the fear of an outcome dictate my choices, instead of focusing on the right action?",
    "How steady was my foundation this week? Where did I lose my centre — and what pulled me back?",

    // Ch. 9 — ordinary acts and deeper meaning
    "Which action this week felt aligned beyond any thought of reward or recognition?",

    // Ch. 11 — scale and perspective
    "What seemed urgent this week that now appears small?",
  ],

  monthly: [
    "What outcome did I hold too tightly this month that caused unnecessary suffering?",
    "What is the most honest account of how I acted this month — not how I intended to act?",
    "Where did inaction feel safer than the necessary step? What made it feel that way?",

    // Ch. 13 — Field vs Knower: roles performed vs what remained unchanged
    "What changed this month? What remained constant?",

    // Ch. 15 — what one is rooted in
    "What are you most rooted in — and is that serving you?",
  ],

  yearly: [
    "What did I stop needing this year that I once thought I could not live without?",
    "Where did I act from my clearest mind this year? What made those moments possible?",
    "What question have I been not-answering? What would it take to answer it, or to release it?",

    // Ch. 18 — final chapter, deepest principle
    "What are you still clinging to that prevents full alignment with your deeper principle?",
  ],
};

// ─── Combined pools for rotation ─────────────────────────────────────────────

/** Full daily prompt pool — existing smart prompts + Gita-informed prompts */
const allDailyGitaPrompts = [...gitaPrompts];

/** Combined reflection sets — existing + Gita */
const combinedReflectionPrompts = {
  weekly:  [...reflectionPrompts.weekly,  ...gitaReflectionPrompts.weekly],
  monthly: [...reflectionPrompts.monthly, ...gitaReflectionPrompts.monthly],
  yearly:  [...reflectionPrompts.yearly,  ...gitaReflectionPrompts.yearly],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a Gita-informed daily prompt.
 * Called from BelowHeatmap when no contextual prompt is active.
 * Existing once-per-day gate (last_prompt_shown_date) handles deduplication.
 */
export function getGitaDailyPrompt(): string {
  return allDailyGitaPrompts[
    Math.floor(Math.random() * allDailyGitaPrompts.length)
  ];
}

/**
 * Returns one prompt from the combined reflection pool for the given cadence.
 * Replaces the original getReflectionPrompt — interface is identical.
 */
export function getReflectionPrompt(type: 'weekly' | 'monthly' | 'yearly'): string {
  const prompts = combinedReflectionPrompts[type];
  return prompts[Math.floor(Math.random() * prompts.length)];
}
