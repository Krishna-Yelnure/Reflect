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

// ─── Bhagavad Gita Quotes of the Day ────────────────────────────────────────
// Source: burningforsuccess.com/bhagavad-gita-quotes/
// Rotated daily by day-of-year index for consistent one-per-day display.

export const gitaDailyQuotes: string[] = [
  // Top quotes
  "You have the right to perform your prescribed duty, but you are not entitled to the fruits of action.",
  "When meditation is mastered, the mind is unwavering like the flame of a lamp in a windless place.",
  "Better indeed is knowledge than mechanical practice. Better than knowledge is meditation. But better still is surrender of attachment to results.",
  "The soul is never born and never dies; it is unborn, eternal, ever-existing, and primeval.",
  "Cultivate an evenness of mind in success and failure; this equanimity makes a man wise.",
  "He who sees the imperishable in the midst of the perishable attains immortality.",
  "Perform your duty with detachment and a steadfast heart, and you will be free from bondage.",
  "Resist the pull of greed and desire; they cloud judgment and bind the spirit.",
  "True heroism lies in self-control rather than the violence of the battlefield.",
  "Rise above despair by acting with courage, not by fleeing from duty.",
  // Duty and Action
  "Act without attachment to results; action itself, done well, purifies the heart.",
  "A man must do his work with sincerity, not for praise nor for blame.",
  "Even small actions, when done with right intent, create great ripples of change.",
  "Let your work be your worship; dedication transforms labor into liberation.",
  "Do your duty steadily; the mind becomes steady by disciplined action.",
  "Action is superior to inaction; inaction breeds confusion and fear.",
  "Face the task before you with courage; procrastination multiplies suffering.",
  "Work without selfish desire and you will find freedom in the midst of activity.",
  "A disciplined life of duty steadies emotion and sharpens wisdom.",
  "Serve with humility and the heart learns generosity, not entitlement.",
  // Detachment
  "Detach from the fruit of action and remain balanced; that is the mark of the wise.",
  "Attachment binds the soul; freedom comes from seeing self beyond possession.",
  "Let pleasures and pains come and go; hold steady as the ocean holds its depths.",
  "The secret of peace is nonattachment to the shifting image of the world.",
  "Release desire and your mind becomes a clear mirror of truth.",
  "Clinging creates fear; releasing creates courage.",
  "Do what is right without clinging to praise or blame.",
  "When the heart does not grasp, sorrow has no anchor to hold it.",
  "Detachment is not indifference; it is enlightened engagement without ownership.",
  "Be free from craving and you will see your path clearly.",
  // Self-Knowledge
  "He who knows the self sees the self in all beings and all beings in the self.",
  "Self-knowledge is the lamp that banishes the darkness of ignorance.",
  "Look inward; the battlefield of life is won by understanding the heart.",
  "Discover who you are beyond roles and names; that discovery is liberation.",
  "The mind that knows itself becomes the master of circumstance.",
  "Awareness of the unchanging self makes all change manageable.",
  "The seeker who turns inward will find the teacher within.",
  "Understanding your nature stops the endless chase after false satisfactions.",
  "Self-knowledge is the foundation upon which right action stands.",
  "When you know yourself, neither praise nor blame can disturb your peace.",
  // Courage and Fearlessness
  "Be bold in doing what is right; fear fades when duty is clear.",
  "Face adversity with a steady heart; strength grows in trials.",
  "Fear is a shadow; truth is the sun that dissolves it.",
  "Stand firm in your values, and storms will pass like distant clouds.",
  "True fearlessness emerges when the self is known and anchored.",
  "Courage is acting in spite of the inner tremor, guided by wisdom.",
  "Let duty be your shield; fear cannot pierce a resolved spirit.",
  "Bravery without wisdom is reckless; courage with insight is liberation.",
  "When you do right for the right reason, doubt loses its hold.",
  "Fortitude is the mind's ability to remain calm in the face of change.",
  // Devotion
  "Surrender to the divine with a pure heart, and the world's burden becomes light.",
  "Devotion means single-pointed love that dissolves separateness.",
  "A devoted heart finds guidance even in silence.",
  "True devotion is service without expectation; it purifies both giver and receiver.",
  "When you fix your mind on the Divine, confusion yields to clarity.",
  "Let love be your discipline; devotion fosters inner steadiness.",
  "The devoted soul finds joy not in possession but in union.",
  "Devotion channels willpower into peaceful, purposeful action.",
  "Faith is the candle that lights the path when reason is clouded.",
  "Loyalty to truth and love dissolves the ego's barriers.",
  // Wisdom and Discrimination
  "Discriminate between the eternal and the temporary; act from the eternal.",
  "Knowledge precedes action; wisdom guides it to fruit without attachment.",
  "A discriminating mind sees through illusion and chooses rightly.",
  "Temper passion with reason and your decisions will be steady.",
  "True wisdom is calm; it does not tremble before praise or blame.",
  "Learn to listen inwardly; the still voice of wisdom will answer.",
  "Discernment protects the heart from unnecessary suffering.",
  "The wise are guided by inner truth, not by shifting opinion.",
  "Knowledge without practice is hollow; applied wisdom changes life.",
  "See things as they are, and your path becomes simple.",
  // Equanimity
  "Be steadfast in joy and sorrow alike; equanimity is the sign of a mature heart.",
  "A balanced mind navigates life's extremes with dignity.",
  "Accept success and failure with the same calm breath.",
  "When the mind is undisturbed, every situation becomes a teacher.",
  "Let neither praise inflate you nor blame deflate you; remain centered.",
  "Equanimity is an inner lighthouse when outer seas are stormy.",
  "Cultivate evenness of mind through steady practice and compassion.",
  "The one who is not shaken by gain or loss walks free.",
  "A composed mind sees choices clearly; panic obscures them.",
  "Balance in heart and mind is the root of effective action.",
  // Leadership and Responsibility
  "Lead by example; duty well performed illuminates the path for others.",
  "A leader's first duty is to be steady and just, not popular.",
  "Responsibility calls for courage, humility, and clear-sightedness.",
  "True authority comes from service, not domination.",
  "Decisions anchored in dharma uplift both leader and led.",
  "A responsible heart weighs consequences for the common good.",
  "Steadfast leaders act without selfish motive and inspire confidence.",
  "Take up your role with humility; leadership is service in action.",
  "Clarity of purpose prevents wavering and builds trust.",
  "Leadership requires inner discipline more than outer command.",
  // Purpose and Dharma
  "Follow your dharma even if imperfectly; avoid another's duty perfectly.",
  "Purpose aligned with dharma transforms labor into a path of growth.",
  "Do what is yours to do; comparison steals your focus and peace.",
  "Dharma is the compass that keeps you steady through life's storms.",
  "Act in accordance with conscience, and results will unfold rightly.",
  "Embrace your role with integrity; purpose clarifies even mundane acts.",
  "Living your duty faithfully is the truest form of success.",
  "When actions are rooted in duty, fear dissolves and courage grows.",
  "Let dharma guide your choices; it steadies ambition with meaning.",
  "Purpose discovered through service becomes a source of enduring joy.",
  // Mind and Meditation
  "A disciplined mind is your greatest ally; train it through steady practice.",
  "Calm the restless mind with breath and focus; clarity will follow.",
  "Meditation lights the inner lamp that dispels the darkness of doubt.",
  "Control the mind and you control your destiny.",
  "Stillness is not escape but the ground from which wise action springs.",
  "The mind that rests in itself is no longer victim of circumstance.",
  "Regular practice molds attention into a tool for insight.",
  "Let thoughts come and go like clouds; remain the sky.",
  "Meditation strengthens the inner witness that sees beyond turmoil.",
  "When the mind is clear, truth speaks plainly and action follows.",
  // Life and Death
  "The soul neither kills nor is killed; it transcends birth and death.",
  "Death is a change of garments; the essence remains forever.",
  "Seeing life as continuous eases grief and encourages right living.",
  "Do not mourn the body; nurture the immortal within.",
  "Understanding mortality makes present moments precious and purposeful.",
  "Life's impermanence is a call to live with clarity and compassion.",
  "When you know the self is timeless, fear of death fades.",
  "Let awareness of death teach you to act rightly today.",
  "Life and death are two phases of the same river; do not cling to the shore.",
  "Embrace the cycle; freedom lies in seeing beyond beginnings and endings.",
  // Change and Impermanence
  "All things change; the wise remain steady through transformation.",
  "Clinging to the transient breeds suffering; flow with change instead.",
  "Accept the flux of life and find freedom in adaptive clarity.",
  "Impermanence invites us to value the present without grasping.",
  "Change is a teacher; resist it and you learn nothing.",
  "Let go of fixed images of how things should be and notice what is.",
  "When expectations fall away, true appreciation arises.",
  "To flow with change is to live with intelligence, not anxiety.",
  "Transform fear of loss into curiosity about what comes next.",
  "Impermanence is the canvas on which life paints meaning.",
  // Inner Strength
  "Strength of spirit is built through right action, thought, and detachment.",
  "The inner fortress is forged by patience, practice, and courage.",
  "Endurance in adversity shapes character and reveals deeper reserves of power.",
  "Calm resolve backed by discipline is the source of true strength.",
  "Stand firm in your principles, and the world will shape around you.",
  "Inner strength is not loud; it is a quiet confidence in right action.",
  "When you align purpose with practice, strength arises naturally.",
  "Face challenges as opportunities to cultivate steadiness and grace.",
  "The disciplined heart weathers storms without losing its center.",
  "True power is gentle, rooted in awareness and compassion.",
];

/**
 * Returns one Bhagavad Gita quote per calendar day.
 * Uses day-of-year index so the same quote shows all day, changing at midnight.
 */
export function getDailyGitaQuote(): string {
  const now = new Date();
  const startOfYr = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYr.getTime()) / 86400000);
  return gitaDailyQuotes[dayOfYear % gitaDailyQuotes.length];
}
