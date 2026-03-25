import type { JournalEntry } from '@/app/types';

export interface SubtleReflection {
  category: string;
  text: string;
}

export async function generateSubtleReflections(entries: JournalEntry[]): Promise<SubtleReflection[]> {
  if (entries.length === 0) return [];

  const reflections: SubtleReflection[] = [];
  
  // Local heuristic 1: Focus on "What mattered most"
  const matterSum = entries.reduce((acc, e) => acc + (e.whatMatters ? e.whatMatters.length : 0), 0);
  const happenSum = entries.reduce((acc, e) => acc + (e.whatHappened ? e.whatHappened.length : 0), 0);
  
  if (matterSum > happenSum * 1.5) {
    reflections.push({
      category: "Finding depth",
      text: "You consistently write the most in 'What mattered most'. Meaning seems to be your natural anchor."
    });
  } else {
    reflections.push({
      category: "Processing style",
      text: "You tend to describe the events of your day in detail before moving into deeper reflections."
    });
  }

  // Local heuristic 2: Self-expectation ("should")
  const allText = entries.map(e => [e.whatHappened, e.feelings, e.whatMatters, e.insight].join(' ')).join(' ').toLowerCase();
  const shouldCount = (allText.match(/\bshould\b/g) || []).length;
  
  if (shouldCount > 3) {
    reflections.push({
      category: "Self-expectation",
      text: `"Should" appeared ${shouldCount} times recently. Noticing where your self-expectation lives.`
    });
  } else if ((allText.match(/\bwant\b|\bhope\b/g) || []).length > 3) {
    reflections.push({
      category: "Aspiration",
      text: "Words of desire ('want', 'hope') appear frequently, pointing toward a clear readiness for change."
    });
  } else {
    reflections.push({
      category: "Presence",
      text: "There is remarkably little 'should' or 'need to' in your recent entries, suggesting a state of allowing things to be as they are."
    });
  }

  // Local heuristic 3: Resistance or Delay
  const delayedEntries = entries.filter(e => (e.delay || 0) > 3).length;
  if (delayedEntries > 1) {
    reflections.push({
      category: "Friction",
      text: `You noted hesitation or delay in starting ${delayedEntries} times recently. Worth sitting with.`
    });
  } else {
    reflections.push({
      category: "Momentum",
      text: "You haven't recorded much hesitation around beginning your tasks lately. Movement feels steady."
    });
  }

  return reflections.slice(0, 3);
}

export async function generateOneThreadQuestion(entries: JournalEntry[]): Promise<string> {
  if (entries.length === 0) return "What is on your mind today?";
  
  // Local heuristic: Find recent entries with low mood or low clarity
  const recentDays = entries.slice(-5);
  
  const lowClarity = recentDays.find(e => e.clarity !== undefined && e.clarity <= 2);
  if (lowClarity && lowClarity.date) {
    return "On a recent day where things felt unclear, what did you learn by simply waiting it out?";
  }

  const highResistance = recentDays.find(e => e.resistance !== undefined && e.resistance >= 4);
  if (highResistance) {
    return "You recently noted strong resistance. If you didn't have to push through it, what would it look like to walk around it?";
  }

  const difficultMood = recentDays.find(e => e.mood === 'difficult' || e.mood === 'low');
  if (difficultMood) {
    return "You've had some heavier days recently. What is one small, quiet way you can protect your energy this week?";
  }

  const shouldCount = (entries.map(e => e.whatHappened).join(' ').match(/\bshould\b/gi) || []).length;
  
  if (shouldCount > 3) {
    return "Who is deciding what you 'should' be doing? Where did that voice come from?";
  }

  return "You have had a string of steady days. What is one thing you want to carry forward into the rest of the month?";
}
