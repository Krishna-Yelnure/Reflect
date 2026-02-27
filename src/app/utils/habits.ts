import { addDays, format, parseISO } from 'date-fns';
import type { Habit, GentleStart, HabitEngagement } from '@/app/types';

const HABITS_KEY = 'journal_habits';
const GENTLE_STARTS_KEY = 'journal_gentle_starts';
const ENGAGEMENTS_KEY = 'journal_habit_engagements';

export const habitsStorage = {
  // Habits
  getHabits(): Habit[] {
    try {
      const data = localStorage.getItem(HABITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveHabits(habits: Habit[]): void {
    try {
      localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  },

  addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>): Habit {
    const newHabit: Habit = {
      ...habit,
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const habits = this.getHabits();
    habits.push(newHabit);
    this.saveHabits(habits);
    return newHabit;
  },

  updateHabit(id: string, updates: Partial<Habit>): void {
    const habits = this.getHabits();
    const index = habits.findIndex(h => h.id === id);
    if (index !== -1) {
      habits[index] = {
        ...habits[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.saveHabits(habits);
    }
  },

  archiveHabit(id: string): void {
    this.updateHabit(id, { isArchived: true });
  },

  deleteHabit(id: string): void {
    const habits = this.getHabits().filter(h => h.id !== id);
    this.saveHabits(habits);
  },

  getActiveHabits(): Habit[] {
    return this.getHabits().filter(h => !h.isArchived);
  },

  // Gentle Starts
  getGentleStarts(): GentleStart[] {
    try {
      const data = localStorage.getItem(GENTLE_STARTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveGentleStarts(starts: GentleStart[]): void {
    try {
      localStorage.setItem(GENTLE_STARTS_KEY, JSON.stringify(starts));
    } catch (error) {
      console.error('Error saving gentle starts:', error);
    }
  },

  startGentleStart(habitId: string): GentleStart {
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addDays(new Date(), 21), 'yyyy-MM-dd');

    const newStart: GentleStart = {
      id: `gentlestart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      habitId,
      startDate,
      endDate,
      engagements: [],
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const starts = this.getGentleStarts();
    starts.push(newStart);
    this.saveGentleStarts(starts);
    return newStart;
  },

  getActiveGentleStart(habitId: string): GentleStart | undefined {
    const starts = this.getGentleStarts();
    return starts.find(
      s => s.habitId === habitId && !s.completed && parseISO(s.endDate) >= new Date()
    );
  },

  completeGentleStart(id: string): void {
    const starts = this.getGentleStarts();
    const start = starts.find(s => s.id === id);
    if (start) {
      start.completed = true;
      this.saveGentleStarts(starts);
    }
  },

  // Engagements
  getEngagements(): HabitEngagement[] {
    try {
      const data = localStorage.getItem(ENGAGEMENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveEngagements(engagements: HabitEngagement[]): void {
    try {
      localStorage.setItem(ENGAGEMENTS_KEY, JSON.stringify(engagements));
    } catch (error) {
      console.error('Error saving engagements:', error);
    }
  },

  addEngagement(
    engagement: Omit<HabitEngagement, 'id' | 'createdAt'>
  ): HabitEngagement {
    const newEngagement: HabitEngagement = {
      ...engagement,
      id: `engagement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    const engagements = this.getEngagements();
    engagements.push(newEngagement);
    this.saveEngagements(engagements);
    return newEngagement;
  },

  getEngagementsForHabit(habitId: string): HabitEngagement[] {
    return this.getEngagements().filter(e => e.habitId === habitId);
  },

  getEngagementsForDate(habitId: string, date: string): HabitEngagement[] {
    return this.getEngagements().filter(e => e.habitId === habitId && e.date === date);
  },

  hasEngagementToday(habitId: string): boolean {
    const today = format(new Date(), 'yyyy-MM-dd');
    return this.getEngagementsForDate(habitId, today).length > 0;
  },
};
