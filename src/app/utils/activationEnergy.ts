/**
 * Activation Energy Engine (AEE) Logic
 * Rules:
 * - score = (6 - clarity) + resistance + Math.log(delay + 1)
 * - 0–4 -> LOW
 * - 5–8 -> MEDIUM
 * - 9+ -> HIGH
 */

export function calculateScore(clarity: number, resistance: number, delay: number): number {
  return (6 - clarity) + resistance + Math.log(delay + 1);
}

export function getLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score <= 4) return 'LOW';
  if (score <= 8) return 'MEDIUM';
  return 'HIGH';
}

export function generateFirstStep(taskText: string): string {
  if (!taskText || taskText.trim() === '') {
    return "Open materials related to this task";
  }
  
  const text = taskText.toLowerCase();
  
  if (text.includes('study') || text.includes('read')) {
    return 'Open the book or document to the first page';
  }
  if (text.includes('write') || text.includes('essay') || text.includes('report')) {
    return 'Write the title or first sentence';
  }
  if (text.includes('code') || text.includes('program')) {
    return 'Open the code editor and write a comment';
  }
  if (text.includes('email') || text.includes('reply')) {
    return 'Open the composer and type "Hi"';
  }
  if (text.includes('clean') || text.includes('tidy')) {
    return 'Pick up exactly one item and put it away';
  }
  if (text.includes('workout') || text.includes('exercise') || text.includes('run')) {
    return 'Put on your workout shoes';
  }

  // Fallback for everything else
  return `Set up your environment to start: ${taskText.slice(0, 30)}${taskText.length > 30 ? '...' : ''}`;
}

export function getBlockerMessages(clarity: number, resistance: number, delay: number): string[] {
  const blockers: string[] = [];
  if (clarity <= 2) blockers.push('Unclear first step');
  if (resistance >= 4) blockers.push('High emotional resistance');
  if (delay >= 10) blockers.push('High starting friction');
  return blockers;
}
