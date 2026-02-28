/**
 * habits.ts — Legacy compatibility shim
 * All logic has moved to @/app/db
 * This file keeps existing imports working without changes.
 */
import { db } from '@/app/db';

export const habitsStorage = {
  // Habits
  getHabits:       () => db.habits.getAll(),
  saveHabits:      (h: Parameters<typeof db.habits.save>[0]) => db.habits.save(h),
  addHabit:        (h: Parameters<typeof db.habits.add>[0]) => db.habits.add(h),
  updateHabit:     (id: string, u: Parameters<typeof db.habits.update>[1]) => db.habits.update(id, u),
  archiveHabit:    (id: string) => db.habits.archive(id),
  deleteHabit:     (id: string) => db.habits.delete(id),
  getActiveHabits: () => db.habits.getActive(),

  // Gentle Starts
  getGentleStarts:      () => db.gentleStarts.getAll(),
  saveGentleStarts:     (s: Parameters<typeof db.gentleStarts.save>[0]) => db.gentleStarts.save(s),
  startGentleStart:     (habitId: string) => db.gentleStarts.start(habitId),
  getActiveGentleStart: (habitId: string) => db.gentleStarts.getActive(habitId),
  completeGentleStart:  (id: string) => db.gentleStarts.complete(id),

  // Engagements
  getEngagements:        () => db.engagements.getAll(),
  saveEngagements:       (e: Parameters<typeof db.engagements.save>[0]) => db.engagements.save(e),
  addEngagement:         (e: Parameters<typeof db.engagements.add>[0]) => db.engagements.add(e),
  getEngagementsForHabit:(habitId: string) => db.engagements.forHabit(habitId),
  getEngagementsForDate: (habitId: string, date: string) => db.engagements.forDate(habitId, date),
  hasEngagementToday:    (habitId: string) => db.engagements.hasToday(habitId),
};
