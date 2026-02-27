import type { JournalEntry } from '@/app/types';

const STORAGE_KEY = 'journal_entries';

export const storage = {
  getEntries(): JournalEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading entries:', error);
      return [];
    }
  },

  saveEntries(entries: JournalEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving entries:', error);
    }
  },

  addEntry(entry: JournalEntry): void {
    const entries = this.getEntries();
    entries.push(entry);
    this.saveEntries(entries);
  },

  updateEntry(id: string, updates: Partial<JournalEntry>): void {
    const entries = this.getEntries();
    const index = entries.findIndex(e => e.id === id);
    if (index !== -1) {
      entries[index] = { ...entries[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveEntries(entries);
    }
  },

  deleteEntry(id: string): void {
    const entries = this.getEntries();
    const filtered = entries.filter(e => e.id !== id);
    this.saveEntries(filtered);
  },

  getEntryByDate(date: string): JournalEntry | undefined {
    const entries = this.getEntries();
    return entries.find(e => e.date === date);
  }
};
