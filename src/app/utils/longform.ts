import type { LongFormReflection } from '@/app/types';

const LONGFORM_KEY = 'journal_longform';

export const longformStorage = {
  getAll(): LongFormReflection[] {
    try {
      const data = localStorage.getItem(LONGFORM_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(reflections: LongFormReflection[]): void {
    try {
      localStorage.setItem(LONGFORM_KEY, JSON.stringify(reflections));
    } catch (error) {
      console.error('Error saving long-form reflections:', error);
    }
  },

  add(reflection: Omit<LongFormReflection, 'id' | 'createdAt' | 'updatedAt'>): LongFormReflection {
    const newReflection: LongFormReflection = {
      ...reflection,
      id: `longform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const reflections = this.getAll();
    reflections.push(newReflection);
    this.save(reflections);
    return newReflection;
  },

  update(id: string, updates: Partial<LongFormReflection>): void {
    const reflections = this.getAll();
    const index = reflections.findIndex(r => r.id === id);
    if (index !== -1) {
      reflections[index] = {
        ...reflections[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save(reflections);
    }
  },

  delete(id: string): void {
    const reflections = this.getAll().filter(r => r.id !== id);
    this.save(reflections);
  },

  getById(id: string): LongFormReflection | undefined {
    return this.getAll().find(r => r.id === id);
  },

  getByQuestion(questionId: string): LongFormReflection[] {
    return this.getAll().filter(r => r.questionId === questionId);
  },

  getByEra(eraId: string): LongFormReflection[] {
    return this.getAll().filter(r => r.eraId === eraId);
  },
};
