import type { UserPreferences, ReflectionAnchor } from '@/app/types';

const PREFS_KEY = 'journal_preferences';
const ANCHORS_KEY = 'journal_anchors';

const defaultPreferences: UserPreferences = {
  insightsEnabled: true,
  insightFrequency: 'weekly',
  memoryRemindersEnabled: true,
  languageAnalysisEnabled: true,
};

export const preferences = {
  get(): UserPreferences {
    try {
      const data = localStorage.getItem(PREFS_KEY);
      return data ? { ...defaultPreferences, ...JSON.parse(data) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  },

  save(prefs: Partial<UserPreferences>): void {
    try {
      const current = this.get();
      const updated = { ...current, ...prefs };
      localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  },

  // Reflection Anchors
  getAnchors(): ReflectionAnchor[] {
    try {
      const data = localStorage.getItem(ANCHORS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAnchors(anchors: ReflectionAnchor[]): void {
    try {
      localStorage.setItem(ANCHORS_KEY, JSON.stringify(anchors));
    } catch (error) {
      console.error('Error saving anchors:', error);
    }
  },

  addAnchor(anchor: Omit<ReflectionAnchor, 'id' | 'createdAt'>): ReflectionAnchor {
    const newAnchor: ReflectionAnchor = {
      ...anchor,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    const anchors = this.getAnchors();
    anchors.push(newAnchor);
    this.saveAnchors(anchors);
    return newAnchor;
  },

  removeAnchor(id: string): void {
    const anchors = this.getAnchors().filter(a => a.id !== id);
    this.saveAnchors(anchors);
  },

  updateAnchor(id: string, updates: Partial<ReflectionAnchor>): void {
    const anchors = this.getAnchors();
    const index = anchors.findIndex(a => a.id === id);
    if (index !== -1) {
      anchors[index] = { ...anchors[index], ...updates };
      this.saveAnchors(anchors);
    }
  },
};
