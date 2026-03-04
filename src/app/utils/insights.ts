import type { JournalEntry, Insight } from '@/app/types';
import { format, subDays, subMonths, isWithinInterval, parseISO } from 'date-fns';

// ── Inner state distribution ──────────────────────────────────────────────────
// Returns counts for each inner state across a set of entries.
// Entries with undefined innerState are excluded — backward compatible.
// Never returns percentages or month-over-month comparison (Copy Audit Standard).

export interface InnerStateDistribution {
  clear: number;
  restless: number;
  heavy: number;
  total: number;          // entries that have innerState set (not total entries)
}

export function getInnerStateDistribution(entries: JournalEntry[]): InnerStateDistribution {
  const dist = { clear: 0, restless: 0, heavy: 0, total: 0 };
  entries.forEach(e => {
    if (e.innerState === 'clear')    { dist.clear++;    dist.total++; }
    if (e.innerState === 'restless') { dist.restless++; dist.total++; }
    if (e.innerState === 'heavy')    { dist.heavy++;    dist.total++; }
  });
  return dist;
}

// ── Existing insight generation (unchanged) ───────────────────────────────────

export function generateInsights(entries: JournalEntry[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  // Get entries from last week
  const weekEntries = entries.filter(entry => 
    isWithinInterval(parseISO(entry.date), {
      start: subDays(now, 7),
      end: now
    })
  );

  // Get entries from last month
  const monthEntries = entries.filter(entry =>
    isWithinInterval(parseISO(entry.date), {
      start: subMonths(now, 1),
      end: now
    })
  );

  // Get entries from last 3 months for deeper patterns
  const quarterEntries = entries.filter(entry =>
    isWithinInterval(parseISO(entry.date), {
      start: subMonths(now, 3),
      end: now
    })
  );

  // V2: Tag-based insights
  if (monthEntries.length >= 3) {
    const tagCounts = monthEntries.reduce((acc, entry) => {
      entry.tags?.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topTag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0];
    if (topTag && topTag[1] >= 3) {
      insights.push({
        type: 'pattern',
        text: `"${topTag[0]}" appears frequently in your recent entries`,
        period: 'month',
        dismissible: true,
      });
    }
  }

  // Analyze mood patterns
  const moodCounts = monthEntries.reduce((acc, entry) => {
    if (entry.mood) {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantMood && dominantMood[1] >= 3) {
    // Mood language rule: difficult/low → Witness-compliant copy, never the raw label
    const moodText = (dominantMood[0] === 'difficult' || dominantMood[0] === 'low')
      ? "This has been a tender month"
      : `You've mostly felt ${dominantMood[0]} this month`;
    insights.push({
      type: 'pattern',
      text: moodText,
      period: 'month'
    });
  }

  // Detect day-of-week patterns
  const dayPatterns = monthEntries.reduce((acc, entry) => {
    const day = format(parseISO(entry.date), 'EEEE');
    if (!acc[day]) acc[day] = [];
    acc[day].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  Object.entries(dayPatterns).forEach(([day, dayEntries]) => {
    const commonWords = extractCommonThemes(dayEntries);
    if (commonWords.length > 0 && dayEntries.length >= 2) {
      insights.push({
        type: 'observation',
        text: `You often write about ${commonWords[0]} on ${day}s`,
        period: 'month'
      });
    }
  });

  // Track energy trends
  const recentEnergy = weekEntries
    .filter(e => e.energy !== undefined)
    .map(e => e.energy as number);
  
  if (recentEnergy.length >= 3) {
    const avgEnergy = recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length;
    if (avgEnergy >= 4) {
      insights.push({
        type: 'trend',
        text: 'Your energy has been high this week',
        period: 'week'
      });
    }
    // Note: low energy is not surfaced — absence/negative observations violate Witness philosophy.
  }

  // Detect writing frequency changes
  if (weekEntries.length >= 5) {
    insights.push({
      type: 'observation',
      text: `You've journaled ${weekEntries.length} times this week`,
      period: 'week'
    });
  }

  // Look for gratitude mentions
  const gratitudeCount = monthEntries.filter(entry =>
    (entry.whatMatters?.toLowerCase().includes('grateful') ||
     entry.whatMatters?.toLowerCase().includes('thankful') ||
     entry.freeWrite?.toLowerCase().includes('grateful'))
  ).length;

  if (gratitudeCount >= 3) {
    insights.push({
      type: 'pattern',
      text: 'Gratitude has been a recurring theme',
      period: 'month'
    });
  }

  return insights.slice(0, 5); // Return top 5 insights
}

function extractCommonThemes(entries: JournalEntry[]): string[] {
  const allText = entries
    .map(e => [e.whatHappened, e.feelings, e.whatMatters, e.insight, e.freeWrite].join(' '))
    .join(' ')
    .toLowerCase();

  const commonThemes = ['work', 'family', 'friends', 'sleep', 'exercise', 'stress', 'anxiety', 'joy', 'creativity'];
  
  return commonThemes
    .filter(theme => allText.includes(theme))
    .sort((a, b) => {
      const countA = (allText.match(new RegExp(a, 'g')) || []).length;
      const countB = (allText.match(new RegExp(b, 'g')) || []).length;
      return countB - countA;
    });
}