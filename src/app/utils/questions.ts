import type { PersistentQuestion } from '@/app/types';

const QUESTIONS_KEY = 'journal_questions';

export const questionsStorage = {
  getAll(): PersistentQuestion[] {
    try {
      const data = localStorage.getItem(QUESTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(questions: PersistentQuestion[]): void {
    try {
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  },

  add(question: Omit<PersistentQuestion, 'id' | 'createdAt'>): PersistentQuestion {
    const newQuestion: PersistentQuestion = {
      ...question,
      id: `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    const questions = this.getAll();
    questions.push(newQuestion);
    this.save(questions);
    return newQuestion;
  },

  update(id: string, updates: Partial<PersistentQuestion>): void {
    const questions = this.getAll();
    const index = questions.findIndex(q => q.id === id);
    if (index !== -1) {
      questions[index] = { ...questions[index], ...updates };
      this.save(questions);
    }
  },

  delete(id: string): void {
    const questions = this.getAll().filter(q => q.id !== id);
    this.save(questions);
  },

  getActive(): PersistentQuestion[] {
    return this.getAll().filter(q => q.isActive);
  },

  markReflected(id: string): void {
    this.update(id, { lastReflectedAt: new Date().toISOString() });
  },
};
