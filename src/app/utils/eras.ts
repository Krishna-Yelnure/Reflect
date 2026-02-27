import type { Era } from '@/app/types';

const ERAS_KEY = 'journal_eras';

export const erasStorage = {
  getAll(): Era[] {
    try {
      const data = localStorage.getItem(ERAS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(eras: Era[]): void {
    try {
      localStorage.setItem(ERAS_KEY, JSON.stringify(eras));
    } catch (error) {
      console.error('Error saving eras:', error);
    }
  },

  add(era: Omit<Era, 'id' | 'createdAt' | 'updatedAt'>): Era {
    const newEra: Era = {
      ...era,
      id: `era-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const eras = this.getAll();
    eras.push(newEra);
    this.save(eras);
    return newEra;
  },

  update(id: string, updates: Partial<Era>): void {
    const eras = this.getAll();
    const index = eras.findIndex(e => e.id === id);
    if (index !== -1) {
      eras[index] = {
        ...eras[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.save(eras);
    }
  },

  delete(id: string): void {
    const eras = this.getAll().filter(e => e.id !== id);
    this.save(eras);
  },

  getById(id: string): Era | undefined {
    return this.getAll().find(e => e.id === id);
  },

  // Get active era (no end date)
  getActive(): Era | undefined {
    const eras = this.getAll();
    return eras.find(e => !e.endDate);
  },
};
