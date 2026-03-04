import type { JournalEntry } from '@/app/types';
import { subDays, parseISO, isWithinInterval } from 'date-fns';

// V2: Language pattern detection (descriptive, not diagnostic)

export interface LanguagePattern {
  phrase: string;
  frequency: number;
  context: 'positive' | 'negative' | 'neutral' | 'future' | 'past' | 'self-critical';
}

const patterns = {
  future: ['will', 'going to', 'plan to', 'hope to', 'should', 'need to'],
  past: ['was', 'had', 'used to', 'remember when'],
  selfCritical: ['should have', 'failed', 'stupid', 'wrong', 'mistake', 'bad at'],
  uncertain: ['maybe', 'not sure', 'confused', 'unclear', 'don\'t know'],
  growth: ['learned', 'realized', 'understand', 'noticed', 'discovered'],
};

export function analyzeLanguagePatterns(entries: JournalEntry[], days = 30): LanguagePattern[] {
  const now = new Date();
  const recentEntries = entries.filter(entry =>
    isWithinInterval(parseISO(entry.date), {
      start: subDays(now, days),
      end: now,
    })
  );

  if (recentEntries.length < 5) return []; // Need minimum data

  const allText = recentEntries
    .map(e => [e.whatHappened, e.feelings, e.whatMatters, e.insight, e.freeWrite].join(' '))
    .join(' ')
    .toLowerCase();

  const detected: LanguagePattern[] = [];

  // Detect future-oriented language
  const futureCount = patterns.future.reduce((sum, word) => 
    sum + (allText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );
  if (futureCount > 10) {
    detected.push({
      phrase: 'future-oriented language',
      frequency: futureCount,
      context: 'future',
    });
  }

  // Detect self-evaluative patterns — described by the words, not a diagnosis
  const criticalCount = patterns.selfCritical.reduce((sum, word) =>
    sum + (allText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );
  if (criticalCount > 5) {
    detected.push({
      phrase: 'words like "should have" and "mistake"',
      frequency: criticalCount,
      context: 'neutral',   // was 'self-critical' — that label was a diagnosis, not an observation
    });
  }

  // Detect growth language
  const growthCount = patterns.growth.reduce((sum, word) =>
    sum + (allText.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length, 0
  );
  if (growthCount > 8) {
    detected.push({
      phrase: 'reflective language',
      frequency: growthCount,
      context: 'positive',
    });
  }

  return detected.slice(0, 3); // Return top 3
}

export function detectCommonPhrases(entries: JournalEntry[], minFrequency = 3): string[] {
  const allText = entries
    .map(e => [e.whatHappened, e.feelings, e.whatMatters, e.insight, e.freeWrite].join(' '))
    .join(' ')
    .toLowerCase();

  // Common meaningful phrases (bi-grams and tri-grams)
  const phrases = [
    'need to', 'want to', 'have to', 'feel like', 'keep thinking',
    'trying to', 'starting to', 'learning to', 'grateful for',
  ];

  return phrases.filter(phrase => {
    const count = (allText.match(new RegExp(`\\b${phrase}\\b`, 'g')) || []).length;
    return count >= minFrequency;
  });
}
