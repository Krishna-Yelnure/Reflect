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

export interface LanguageFingerprint {
  cognitive: number;
  somatic: number;
  relational: number;
  aspirational: number;
  total: number;
}

export function getLanguageFingerprint(entries: JournalEntry[]): LanguageFingerprint {
  const allText = entries
    .map(e => [e.whatHappened, e.feelings, e.whatMatters, e.insight, e.freeWrite].join(' '))
    .join(' ')
    .toLowerCase();

  const dictionaries = {
    cognitive: [
      'think', 'thinks', 'thinking', 'thought', 'thoughts', 'realize', 'realized', 'realization', 
      'understand', 'understood', 'understanding', 'wonder', 'wondering', 'wondered', 
      'know', 'knew', 'knowing', 'notice', 'noticed', 'noticing', 'analyze', 'analyzed', 
      'guess', 'guessing', 'assume', 'assuming', 'figure', 'figured', 'logic', 'mind', 'brain',
      'decide', 'decided', 'decision', 'plan', 'planning', 'planned', 'reflect', 'reflected',
      'remember', 'remembered', 'memory', 'forget', 'forgot', 'learn', 'learned', 'learning'
    ],
    somatic: [
      'tired', 'heavy', 'tight', 'drained', 'body', 'breath', 'tense', 'tension', 'relaxed', 
      'relaxing', 'sore', 'pain', 'ache', 'aching', 'exhausted', 'exhaustion', 'sleep', 'sleepy', 
      'slept', 'awake', 'energy', 'energetic', 'sluggish', 'stiff', 'stiffness', 'numb',
      'feeling', 'felt', 'feel', 'chest', 'stomach', 'headache', 'eyes', 'rest', 'rested',
      'breathe', 'breathing', 'heart', 'muscle', 'muscles', 'sweat', 'shiver', 'cold', 'hot'
    ],
    relational: [
      'they', 'we', 'told', 'together', 'someone', 'people', 'her', 'him', 'she', 'he',
      'friend', 'friends', 'family', 'partner', 'wife', 'husband', 'mom', 'dad', 'brother', 
      'sister', 'colleague', 'team', 'talked', 'talking', 'said', 'saying', 'conversation',
      'meet', 'met', 'meeting', 'help', 'helped', 'helping', 'share', 'shared', 'sharing',
      'us', 'them', 'relationship', 'connect', 'connected', 'connection', 'social'
    ],
    aspirational: [
      'want', 'wants', 'wanted', 'wanting', 'hope', 'hopes', 'hoped', 'hoping', 'trying', 'try', 
      'tried', 'someday', 'wish', 'wishing', 'wished', 'could', 'maybe', 'goal', 'goals', 
      'dream', 'dreams', 'dreaming', 'achieve', 'achieved', 'future', 'tomorrow', 'next',
      'improve', 'improving', 'better', 'build', 'building', 'grow', 'growing', 'growth',
      'aspire', 'aspiration', 'create', 'creating', 'make', 'making'
    ]
  };

  const counts = {
    cognitive: 0,
    somatic: 0,
    relational: 0,
    aspirational: 0,
    total: 0
  };

  // Extract all words properly handling punctuation
  const words = allText.split(/[^a-z0-9'-]+/i).filter(Boolean);

  for (const word of words) {
    if (dictionaries.cognitive.includes(word)) counts.cognitive++;
    if (dictionaries.somatic.includes(word)) counts.somatic++;
    if (dictionaries.relational.includes(word)) counts.relational++;
    if (dictionaries.aspirational.includes(word)) counts.aspirational++;
  }

  // Ensure total handles empty gracefully. In a single entry, if no matched words, 
  // return at least 1 total so the UI shows 0% and doesn't break, or we can fallback
  counts.total = counts.cognitive + counts.somatic + counts.relational + counts.aspirational;
  
  return counts;
}

export interface RecurringWord {
  word: string;
  count: number;
}

export function getRecurringWords(entries: JournalEntry[]): RecurringWord[] {
  const allText = entries
    .map(e => [e.whatHappened, e.feelings, e.whatMatters, e.insight, e.freeWrite].join(' '))
    .join(' ')
    .toLowerCase();

  const stopwords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
    'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
    'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
    'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
    "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
    'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
    'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
    'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't",
    '-', 'like', 'really', 'much', 'even', 'get', 'got', 'day', 'today', 'time', 'thing', 'things', 'going',
    'still', 'always', 'never', 'also', 'around', 'back', 'go', 'make', 'see', 'way', 'well', 'good', 'bad'
  ]);

  const words = allText.split(/\W+/).filter(w => w.length > 2 && !stopwords.has(w));
  const counts: Record<string, number> = {};

  for (const word of words) {
    counts[word] = (counts[word] || 0) + 1;
  }

  // Remove singular vs plural duplicates naively
  // Keep the most frequent one
  const entriesArray = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entriesArray.slice(0, 5).map(([word, count]) => ({ word, count }));
}
