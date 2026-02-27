import type { JournalEntry, MemorySurface } from '@/app/types';
import { parseISO, differenceInDays, format } from 'date-fns';

const MEMORY_STORAGE_KEY = 'journal_memories';

// V2: Gentle memory surfacing - find related past entries

export function findSimilarEntries(
  currentEntry: Partial<JournalEntry>,
  allEntries: JournalEntry[],
  limit = 3
): JournalEntry[] {
  if (!currentEntry.whatHappened && !currentEntry.feelings && !currentEntry.freeWrite) {
    return [];
  }

  const currentText = [
    currentEntry.whatHappened,
    currentEntry.feelings,
    currentEntry.freeWrite,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const currentWords = new Set(
    currentText
      .split(/\s+/)
      .filter(word => word.length > 4) // Skip short words
  );

  if (currentWords.size < 3) return [];

  // Score each past entry by word overlap
  const scored = allEntries
    .filter(entry => entry.id !== currentEntry.id)
    .map(entry => {
      const entryText = [
        entry.whatHappened,
        entry.feelings,
        entry.freeWrite,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const entryWords = new Set(entryText.split(/\s+/));
      
      let overlap = 0;
      currentWords.forEach(word => {
        if (entryWords.has(word)) overlap++;
      });

      const similarity = overlap / Math.sqrt(currentWords.size * entryWords.size);
      
      return { entry, similarity };
    })
    .filter(({ similarity }) => similarity > 0.15) // Threshold for relevance
    .sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, limit).map(({ entry }) => entry);
}

export function createMemorySurface(
  currentEntryId: string,
  relatedEntry: JournalEntry
): MemorySurface {
  const daysDiff = differenceInDays(new Date(), parseISO(relatedEntry.date));
  
  let reason = '';
  if (daysDiff < 30) {
    reason = `You wrote something similar ${daysDiff} days ago`;
  } else if (daysDiff < 365) {
    const months = Math.floor(daysDiff / 30);
    reason = `You wrote something similar ${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(daysDiff / 365);
    reason = `You wrote something similar ${years} year${years > 1 ? 's' : ''} ago`;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    currentEntryId,
    relatedEntryId: relatedEntry.id,
    reason,
    dismissed: false,
    createdAt: new Date().toISOString(),
  };
}

export const memorySurfaceStorage = {
  getAll(): MemorySurface[] {
    try {
      const data = localStorage.getItem(MEMORY_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(memories: MemorySurface[]): void {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
    } catch (error) {
      console.error('Error saving memories:', error);
    }
  },

  dismiss(id: string): void {
    const memories = this.getAll();
    const updated = memories.map(m => 
      m.id === id ? { ...m, dismissed: true } : m
    );
    this.save(updated);
  },

  getForEntry(entryId: string): MemorySurface[] {
    return this.getAll().filter(
      m => m.currentEntryId === entryId && !m.dismissed
    );
  },

  add(memory: MemorySurface): void {
    const memories = this.getAll();
    memories.push(memory);
    this.save(memories);
  },
};
