// V2: Reflection mode prompts + Gita-informed prompt pools + Context-Aware Layer
//
// Architecture:
//   reflectionPrompts       — existing weekly/monthly/yearly sets (unchanged)
//   gitaPrompts             — daily Gita-informed prompts, integrated into BelowHeatmap rotation
//   newDailyPrompts         — new daily prompts (Action, Avoidance, Perception, Ego, Inner state, Alignment, Outcome, Perspective)
//   gitaReflectionPrompts   — weekly/monthly/yearly Gita-informed prompts, merged into reflection sets
//   contextPrompts_*        — contextual buckets for missed days, streaks, gaps, density, repetition
//   getDailyPrompt()        — returns one prompt from the combined daily pool (existing + Gita)
//   getReflectionPrompt()   — returns one prompt from the combined set for a given cadence
//   getContextAwarePrompt() — priority routing based on JournalContext

import { differenceInDays, parseISO } from 'date-fns';
import type { JournalEntry as JournalEntryType } from '@/app/types';

export type JournalContext = {
  wroteToday: boolean;
  daysSinceLastEntry: number;
  streak: number;
  avgEntryLength?: number;
  recentThemes?: string[];
};

// ─── Existing reflection prompts (with new additions) ──────────────────────────

export const reflectionPrompts = {
  weekly: [
    "What patterns repeated this week?",
    "What gave you energy this week?",
    "What drained you this week?",
    "What surprised you about yourself?",
    "What did you avoid or postpone?",
    "What conversations stayed with you?",
    "What changed from last week?",
    // ── Patterns / awareness ─────────────
    "What did I keep returning to — in thought or action?",
    // ── Alignment / integrity ────────────
    "Where did I act differently than I usually do?",
    // ── Avoidance / resistance ───────────
    "Where did I let outcome or discomfort shape my choices?",
    // ── Perspective ──────────────────────
    "What seemed important earlier in the week that feels less so now?",
  ],

  monthly: [
    "What changed emotionally this month?",
    "What themes kept appearing?",
    "What mattered more than you expected?",
    "What relationships shifted?",
    "What did you learn about yourself?",
    "What assumptions can you let go of?",
    "What felt different from last month?",
    // ── Change / continuity ──────────────
    "What changed this month?",
    "What remained constant?",
    // ── Emotional layer ──────────────────
    "What felt less important by the end of the month?",
    // ── Patterns / themes ────────────────
    "What did I carry forward without questioning?",
    // ── Alignment / honesty ──────────────
    "What is the most honest account of how I acted this month?",
    // ── Resistance / effort ──────────────
    "Where did inaction feel safer than action?",
    "Where did I apply more effort than was necessary?",
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
    // ── Identity / change ────────────────
    "What remained steady even as everything else changed?",
    // ── Letting go ───────────────────────
    "What did I stop needing this year?",
    // ── Alignment ────────────────────────
    "Where did I act from my clearest mind this year?",
    // ── Unresolved / tension ─────────────
    "What question have I been not answering?",
  ],
};

// ─── Gita-informed & General daily prompts ───────────────────────────────────

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
  
  // ── Action / clarity ─────────────────
  "What did I already know needed to be done today, before I began thinking about it?",
  "What action felt clear today, even if it was uncomfortable?",
  "Where did I spend more time thinking about action than acting?",
  "If the outcome were irrelevant, what would the right action have been today?",
  
  // ── Avoidance / resistance ───────────
  "What did I move away from today without fully acknowledging it?",
  "Where did discomfort influence my decisions more than clarity?",
  "Is there something I am calling 'waiting' that is actually avoidance?",
  
  // ── Perception / interpretation ──────
  "What did I assume today that I did not verify?",
  "Where did my interpretation add weight to a simple situation?",
  "What felt simple before I started explaining it to myself?",
  
  // ── Ego / identity ───────────────────
  "What part of today felt like it needed to protect an image of myself?",
  "Where did I take something personally that may not have been about me?",
  
  // ── Inner state / reactivity ─────────
  "What shifted my state the most today — and how quickly did it happen?",
  "What was the general tone of my inner state today?",
  "At what moment today did I feel most undisturbed?",
  
  // ── Alignment / integrity ────────────
  "Where did I act with clarity regardless of how I felt?",
  "Did I follow through on what I already understood to be right?",
  
  // ── Outcome / expectation ────────────
  "Where did expectation shape how I acted today?",
  "What would this day look like if nothing needed to be proven?",
  
  // ── Perspective / scale ──────────────
  "What felt urgent today that may not matter as much later?",
];

// ─── Gita-informed reflection prompts (weekly / monthly / yearly) ─────────────

export const gitaReflectionPrompts = {
  weekly: [
    "Where did I act with full integrity this week, regardless of whether I was praised or criticised?",
    "Where did I let the fear of an outcome dictate my choices, instead of focusing on the right action?",
    "How steady was my foundation this week? Where did I lose my centre — and what pulled me back?",
    "Which action this week felt aligned beyond any thought of reward or recognition?",
    "What seemed urgent this week that now appears small?",
  ],

  monthly: [
    "What outcome did I hold too tightly this month that caused unnecessary suffering?",
    "What is the most honest account of how I acted this month — not how I intended to act?",
    "Where did inaction feel safer than the necessary step? What made it feel that way?",
    "What changed this month? What remained constant?",
    "What are you most rooted in — and is that serving you?",
  ],

  yearly: [
    "What did I stop needing this year that I once thought I could not live without?",
    "Where did I act from my clearest mind this year? What made those moments possible?",
    "What question have I been not-answering? What would it take to answer it, or to release it?",
    "What are you still clinging to that prevents full alignment with your deeper principle?",
  ],
};

// ─── Context-Aware Prompt Buckets ──────────────────────────────────────────

const contextPrompts_missedToday = [
  "What is present right now that hasn't been put into words yet?",
  "What feels slightly unresolved today?",
  "What has been left unacknowledged so far today?",
];

const contextPrompts_afterGap = [
  "What has shifted since you last wrote?",
  "What has been quietly building over the past few days?",
  "What feels different now compared to the last time you paused to notice?",
];

const contextPrompts_streak = [
  "What are you noticing more quickly than before?",
  "What has become clearer through repetition?",
  "What are you no longer reacting to in the same way?",
];

const contextPrompts_shallow = [
  "What feels just beneath what you wrote today?",
  "What did you leave out, even briefly?",
  "What was easier to skip than to stay with?",
];

const contextPrompts_dense = [
  "What part of what you wrote feels most central?",
  "What could be removed without losing meaning?",
  "What remained unsaid despite everything you wrote?",
];

const contextPrompts_repetition = [
  "What keeps returning, even when approached from different angles?",
  "What feels familiar in a way that is no longer surprising?",
  "What have you already seen clearly but not fully acknowledged?",
];

// ─── Combined pools for rotation ─────────────────────────────────────────────

const allDailyGitaPrompts = [...gitaPrompts];

const combinedReflectionPrompts = {
  weekly:  [...reflectionPrompts.weekly,  ...gitaReflectionPrompts.weekly],
  monthly: [...reflectionPrompts.monthly, ...gitaReflectionPrompts.monthly],
  yearly:  [...reflectionPrompts.yearly,  ...gitaReflectionPrompts.yearly],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hasRepetition(themes: string[]): boolean {
  const counts: Record<string, number> = {};
  for (const t of themes) {
    counts[t] = (counts[t] || 0) + 1;
    if (counts[t] >= 3) return true;
  }
  return false;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a Gita-informed daily prompt.
 * Falls back to this if no contextual prompt is active.
 */
export function getGitaDailyPrompt(): string {
  return pick(allDailyGitaPrompts);
}

/**
 * Returns a Context-Aware Prompt based on priority routing.
 * If no context rules are met, falls back to the general daily prompt pool.
 */
export function getContextAwarePrompt(ctx: JournalContext): string {
  // Time-of-day sensitivity
  const hour = new Date().getHours();
  if (hour >= 18 && Math.random() > 0.5) {
    return "What stands out when you look back at today as a whole?";
  }

  // Priority order
  if (!ctx.wroteToday) {
    return pick(contextPrompts_missedToday);
  }

  if (ctx.daysSinceLastEntry >= 2) {
    return pick(contextPrompts_afterGap);
  }

  if (ctx.streak >= 5) {
    return pick(contextPrompts_streak);
  }

  if (ctx.avgEntryLength && ctx.avgEntryLength < 100 && Math.random() > 0.5) {
    return pick(contextPrompts_shallow);
  }

  if (ctx.avgEntryLength && ctx.avgEntryLength > 400 && Math.random() > 0.5) {
    return pick(contextPrompts_dense);
  }

  if (ctx.recentThemes && hasRepetition(ctx.recentThemes)) {
    return pick(contextPrompts_repetition);
  }

  // fallback → existing pool
  return getGitaDailyPrompt();
}

/**
 * Returns one prompt from the combined reflection pool for the given cadence.
 */
export function getReflectionPrompt(type: 'weekly' | 'monthly' | 'yearly'): string {
  const prompts = combinedReflectionPrompts[type];
  return pick(prompts);
}

/**
 * Computes the context for the current writing session.
 */
export function computeJournalContext(allEntries: JournalEntryType[], selectedDate: string, existing: boolean): JournalContext {
  const dailyEntries = allEntries
    .filter(e => e.reflectionType === 'daily' || !e.reflectionType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (dailyEntries.length === 0) {
    return { wroteToday: false, daysSinceLastEntry: Infinity, streak: 0 };
  }

  const wroteToday = existing || dailyEntries.some(e => e.date === selectedDate);
  const lastEntry = dailyEntries.find(e => e.date !== selectedDate);
  const daysSinceLastEntry = lastEntry ? differenceInDays(parseISO(selectedDate), parseISO(lastEntry.date)) : Infinity;

  let streak = 0;
  if (lastEntry) {
    const idx = dailyEntries.findIndex(e => e.date === lastEntry.date);
    if (idx !== -1 && daysSinceLastEntry <= 1) {
      streak = 1;
      let expectedDaysAgo = 1;
      for (let i = idx + 1; i < dailyEntries.length; i++) {
        const diff = differenceInDays(parseISO(lastEntry.date), parseISO(dailyEntries[i].date));
        if (diff === expectedDaysAgo) {
          streak++;
          expectedDaysAgo++;
        } else if (diff > expectedDaysAgo) {
          break;
        }
      }
    }
  }

  const recent = dailyEntries.slice(0, 5);
  let totalLength = 0;
  const themes: string[] = [];
  recent.forEach(e => {
    const txt = [e.whatHappened, e.feelings, e.whatMatters, e.insight, e.freeWrite].filter(Boolean).join(' ');
    totalLength += txt.length;
    if (e.tags) themes.push(...e.tags);
  });
  const avgEntryLength = recent.length > 0 ? totalLength / recent.length : undefined;

  return {
    wroteToday,
    daysSinceLastEntry,
    streak: streak + (wroteToday ? 1 : 0), // Include today if written
    avgEntryLength,
    recentThemes: themes.length > 0 ? themes : undefined,
  };
}
