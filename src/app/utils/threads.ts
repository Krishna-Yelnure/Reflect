import type { MemoryThread } from '@/app/types';

const THREADS_KEY = 'journal_threads';

export const threadsStorage = {
  getAll(): MemoryThread[] {
    try {
      const data = localStorage.getItem(THREADS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(threads: MemoryThread[]): void {
    try {
      localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    } catch (error) {
      console.error('Error saving threads:', error);
    }
  },

  add(thread: Omit<MemoryThread, 'id' | 'createdAt' | 'updatedAt'>): MemoryThread {
    const newThread: MemoryThread = {
      ...thread,
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const threads = this.getAll();
    threads.push(newThread);
    this.save(threads);
    return newThread;
  },

  update(id: string, updates: Partial<MemoryThread>): void {
    const threads = this.getAll();
    const index = threads.findIndex(t => t.id === id);
    if (index !== -1) {
      threads[index] = {
        ...threads[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save(threads);
    }
  },

  delete(id: string): void {
    const threads = this.getAll().filter(t => t.id !== id);
    this.save(threads);
  },

  addEntryToThread(threadId: string, entryId: string): void {
    const threads = this.getAll();
    const thread = threads.find(t => t.id === threadId);
    if (thread && !thread.entryIds.includes(entryId)) {
      thread.entryIds.push(entryId);
      thread.updatedAt = new Date().toISOString();
      this.save(threads);
    }
  },

  removeEntryFromThread(threadId: string, entryId: string): void {
    const threads = this.getAll();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.entryIds = thread.entryIds.filter(id => id !== entryId);
      thread.updatedAt = new Date().toISOString();
      this.save(threads);
    }
  },

  getThreadsForEntry(entryId: string): MemoryThread[] {
    return this.getAll().filter(thread => thread.entryIds.includes(entryId));
  },
};
