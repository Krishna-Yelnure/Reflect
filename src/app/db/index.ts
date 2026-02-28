/**
 * db/index.ts — Unified Storage Abstraction Layer
 *
 * ALL data access goes through this module.
 * In Phase 1 (web): backed by localStorage.
 * In Phase 2 (Electron): swap the implementation here only — nothing else changes.
 *
 * NEVER import localStorage directly anywhere else in the app.
 */

import { addDays, format, parseISO } from 'date-fns';
import type {
  JournalEntry,
  Habit,
  GentleStart,
  HabitEngagement,
  UserPreferences,
  ReflectionAnchor,
  Era,
  MemoryThread,
  PersistentQuestion,
  LongFormReflection,
} from '@/app/types';

// ── Storage keys ────────────────────────────────────────────────────────────

const KEYS = {
  ENTRIES:       'journal_entries',
  HABITS:        'journal_habits',
  GENTLE_STARTS: 'journal_gentle_starts',
  ENGAGEMENTS:   'journal_habit_engagements',
  PREFERENCES:   'journal_preferences',
  ANCHORS:       'journal_anchors',
  ERAS:          'journal_eras',
  THREADS:       'journal_threads',
  QUESTIONS:     'journal_questions',
  LONGFORM:      'journal_longform',
} as const;

// ── Low-level read/write ─────────────────────────────────────────────────────

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[db] Failed to write key "${key}":`, error);
  }
}

// ── ID generator ─────────────────────────────────────────────────────────────

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULT_PREFERENCES: UserPreferences = {
  insightsEnabled: true,
  insightFrequency: 'weekly',
  memoryRemindersEnabled: true,
  languageAnalysisEnabled: true,
};

// ── Journal Entries ───────────────────────────────────────────────────────────

const entries = {
  getAll(): JournalEntry[] {
    return read<JournalEntry[]>(KEYS.ENTRIES, []);
  },

  save(entries: JournalEntry[]): void {
    write(KEYS.ENTRIES, entries);
  },

  add(entry: JournalEntry): void {
    const all = this.getAll();
    all.push(entry);
    this.save(all);
  },

  update(id: string, updates: Partial<JournalEntry>): void {
    const all = this.getAll();
    const index = all.findIndex(e => e.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: nowISO() };
      this.save(all);
    }
  },

  delete(id: string): void {
    this.save(this.getAll().filter(e => e.id !== id));
  },

  getByDate(date: string): JournalEntry | undefined {
    return this.getAll().find(e => e.date === date);
  },
};

// ── Habits ────────────────────────────────────────────────────────────────────

const habits = {
  getAll(): Habit[] {
    return read<Habit[]>(KEYS.HABITS, []);
  },

  save(habits: Habit[]): void {
    write(KEYS.HABITS, habits);
  },

  add(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Habit {
    const newHabit: Habit = {
      ...habit,
      id: newId('habit'),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
    const all = this.getAll();
    all.push(newHabit);
    this.save(all);
    return newHabit;
  },

  update(id: string, updates: Partial<Habit>): void {
    const all = this.getAll();
    const index = all.findIndex(h => h.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: nowISO() };
      this.save(all);
    }
  },

  archive(id: string): void {
    this.update(id, { isArchived: true });
  },

  delete(id: string): void {
    this.save(this.getAll().filter(h => h.id !== id));
  },

  getActive(): Habit[] {
    return this.getAll().filter(h => !h.isArchived);
  },
};

// ── Gentle Starts (21-day windows) ───────────────────────────────────────────

const gentleStarts = {
  getAll(): GentleStart[] {
    return read<GentleStart[]>(KEYS.GENTLE_STARTS, []);
  },

  save(starts: GentleStart[]): void {
    write(KEYS.GENTLE_STARTS, starts);
  },

  start(habitId: string): GentleStart {
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), 21), 'yyyy-MM-dd');
    const newStart: GentleStart = {
      id: newId('gentlestart'),
      habitId,
      startDate,
      endDate,
      engagements: [],
      completed: false,
      createdAt: nowISO(),
    };
    const all = this.getAll();
    all.push(newStart);
    this.save(all);
    return newStart;
  },

  getActive(habitId: string): GentleStart | undefined {
    return this.getAll().find(
      s => s.habitId === habitId && !s.completed && parseISO(s.endDate) >= new Date()
    );
  },

  complete(id: string): void {
    const all = this.getAll();
    const start = all.find(s => s.id === id);
    if (start) {
      start.completed = true;
      this.save(all);
    }
  },
};

// ── Habit Engagements ─────────────────────────────────────────────────────────

const engagements = {
  getAll(): HabitEngagement[] {
    return read<HabitEngagement[]>(KEYS.ENGAGEMENTS, []);
  },

  save(engagements: HabitEngagement[]): void {
    write(KEYS.ENGAGEMENTS, engagements);
  },

  add(engagement: Omit<HabitEngagement, 'id' | 'createdAt'>): HabitEngagement {
    const newEngagement: HabitEngagement = {
      ...engagement,
      id: newId('engagement'),
      createdAt: nowISO(),
    };
    const all = this.getAll();
    all.push(newEngagement);
    this.save(all);
    return newEngagement;
  },

  forHabit(habitId: string): HabitEngagement[] {
    return this.getAll().filter(e => e.habitId === habitId);
  },

  forDate(habitId: string, date: string): HabitEngagement[] {
    return this.getAll().filter(e => e.habitId === habitId && e.date === date);
  },

  hasToday(habitId: string): boolean {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.forDate(habitId, today).length > 0;
  },
};

// ── Preferences ───────────────────────────────────────────────────────────────

const prefs = {
  get(): UserPreferences {
    return { ...DEFAULT_PREFERENCES, ...read<Partial<UserPreferences>>(KEYS.PREFERENCES, {}) };
  },

  save(updates: Partial<UserPreferences>): void {
    write(KEYS.PREFERENCES, { ...this.get(), ...updates });
  },
};

// ── Reflection Anchors ────────────────────────────────────────────────────────

const anchors = {
  getAll(): ReflectionAnchor[] {
    return read<ReflectionAnchor[]>(KEYS.ANCHORS, []);
  },

  save(anchors: ReflectionAnchor[]): void {
    write(KEYS.ANCHORS, anchors);
  },

  add(anchor: Omit<ReflectionAnchor, 'id' | 'createdAt'>): ReflectionAnchor {
    const newAnchor: ReflectionAnchor = {
      ...anchor,
      id: newId('anchor'),
      createdAt: nowISO(),
    };
    const all = this.getAll();
    all.push(newAnchor);
    this.save(all);
    return newAnchor;
  },

  update(id: string, updates: Partial<ReflectionAnchor>): void {
    const all = this.getAll();
    const index = all.findIndex(a => a.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates };
      this.save(all);
    }
  },

  remove(id: string): void {
    this.save(this.getAll().filter(a => a.id !== id));
  },
};

// ── Eras ──────────────────────────────────────────────────────────────────────

const eras = {
  getAll(): Era[] {
    return read<Era[]>(KEYS.ERAS, []);
  },

  save(eras: Era[]): void {
    write(KEYS.ERAS, eras);
  },

  add(era: Omit<Era, 'id' | 'createdAt' | 'updatedAt'>): Era {
    const newEra: Era = { ...era, id: newId('era'), createdAt: nowISO(), updatedAt: nowISO() };
    const all = this.getAll();
    all.push(newEra);
    this.save(all);
    return newEra;
  },

  update(id: string, updates: Partial<Era>): void {
    const all = this.getAll();
    const index = all.findIndex(e => e.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: nowISO() };
      this.save(all);
    }
  },

  delete(id: string): void {
    this.save(this.getAll().filter(e => e.id !== id));
  },
};

// ── Memory Threads ────────────────────────────────────────────────────────────

const threads = {
  getAll(): MemoryThread[] {
    return read<MemoryThread[]>(KEYS.THREADS, []);
  },

  save(threads: MemoryThread[]): void {
    write(KEYS.THREADS, threads);
  },

  add(thread: Omit<MemoryThread, 'id' | 'createdAt' | 'updatedAt'>): MemoryThread {
    const newThread: MemoryThread = { ...thread, id: newId('thread'), createdAt: nowISO(), updatedAt: nowISO() };
    const all = this.getAll();
    all.push(newThread);
    this.save(all);
    return newThread;
  },

  update(id: string, updates: Partial<MemoryThread>): void {
    const all = this.getAll();
    const index = all.findIndex(t => t.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: nowISO() };
      this.save(all);
    }
  },

  delete(id: string): void {
    this.save(this.getAll().filter(t => t.id !== id));
  },
};

// ── Persistent Questions ──────────────────────────────────────────────────────

const questions = {
  getAll(): PersistentQuestion[] {
    return read<PersistentQuestion[]>(KEYS.QUESTIONS, []);
  },

  save(questions: PersistentQuestion[]): void {
    write(KEYS.QUESTIONS, questions);
  },

  add(question: Omit<PersistentQuestion, 'id' | 'createdAt'>): PersistentQuestion {
    const newQ: PersistentQuestion = { ...question, id: newId('question'), createdAt: nowISO() };
    const all = this.getAll();
    all.push(newQ);
    this.save(all);
    return newQ;
  },

  update(id: string, updates: Partial<PersistentQuestion>): void {
    const all = this.getAll();
    const index = all.findIndex(q => q.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates };
      this.save(all);
    }
  },

  delete(id: string): void {
    this.save(this.getAll().filter(q => q.id !== id));
  },
};

// ── Long-Form Reflections ─────────────────────────────────────────────────────

const longform = {
  getAll(): LongFormReflection[] {
    return read<LongFormReflection[]>(KEYS.LONGFORM, []);
  },

  save(items: LongFormReflection[]): void {
    write(KEYS.LONGFORM, items);
  },

  add(item: Omit<LongFormReflection, 'id' | 'createdAt' | 'updatedAt'>): LongFormReflection {
    const newItem: LongFormReflection = { ...item, id: newId('longform'), createdAt: nowISO(), updatedAt: nowISO() };
    const all = this.getAll();
    all.push(newItem);
    this.save(all);
    return newItem;
  },

  update(id: string, updates: Partial<LongFormReflection>): void {
    const all = this.getAll();
    const index = all.findIndex(i => i.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updates, updatedAt: nowISO() };
      this.save(all);
    }
  },

  delete(id: string): void {
    this.save(this.getAll().filter(i => i.id !== id));
  },
};

// ── Full Export / Import ──────────────────────────────────────────────────────

const backup = {
  /**
   * Export ALL data as a single JSON snapshot.
   * This is the user's complete journal — every piece of data.
   */
  exportAll(): string {
    const snapshot = {
      exportedAt: nowISO(),
      version: '1.0',
      data: {
        entries:       entries.getAll(),
        habits:        habits.getAll(),
        gentleStarts:  gentleStarts.getAll(),
        engagements:   engagements.getAll(),
        preferences:   prefs.get(),
        anchors:       anchors.getAll(),
        eras:          eras.getAll(),
        threads:       threads.getAll(),
        questions:     questions.getAll(),
        longform:      longform.getAll(),
      },
    };
    return JSON.stringify(snapshot, null, 2);
  },

  /**
   * Import a full JSON snapshot, replacing all current data.
   * Returns true on success, false on failure.
   */
  importAll(json: string): boolean {
    try {
      const snapshot = JSON.parse(json);
      const d = snapshot.data;
      if (!d) throw new Error('Invalid backup format');

      if (d.entries)      entries.save(d.entries);
      if (d.habits)       habits.save(d.habits);
      if (d.gentleStarts) gentleStarts.save(d.gentleStarts);
      if (d.engagements)  engagements.save(d.engagements);
      if (d.preferences)  prefs.save(d.preferences);
      if (d.anchors)      anchors.save(d.anchors);
      if (d.eras)         eras.save(d.eras);
      if (d.threads)      threads.save(d.threads);
      if (d.questions)    questions.save(d.questions);
      if (d.longform)     longform.save(d.longform);

      return true;
    } catch (error) {
      console.error('[db] Import failed:', error);
      return false;
    }
  },

  /**
   * Wipe all data. Irreversible.
   */
  deleteAll(): void {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
  },
};

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * db — the single data access interface for the entire app.
 *
 * Usage:
 *   import { db } from '@/app/db';
 *   const allEntries = db.entries.getAll();
 *   db.habits.add({ name: 'Morning walk', why: 'Clears my head', isArchived: false });
 */
export const db = {
  entries,
  habits,
  gentleStarts,
  engagements,
  prefs,
  anchors,
  eras,
  threads,
  questions,
  longform,
  backup,
};
