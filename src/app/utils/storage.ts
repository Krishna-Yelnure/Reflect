/**
 * storage.ts — Legacy compatibility shim
 * All logic has moved to @/app/db
 * This file keeps existing imports working without changes.
 */
import { db } from '@/app/db';

export const storage = {
  getEntries:    () => db.entries.getAll(),
  saveEntries:   (e: Parameters<typeof db.entries.save>[0]) => db.entries.save(e),
  addEntry:      (e: Parameters<typeof db.entries.add>[0]) => db.entries.add(e),
  updateEntry:   (id: string, u: Parameters<typeof db.entries.update>[1]) => db.entries.update(id, u),
  deleteEntry:   (id: string) => db.entries.delete(id),
  getEntryByDate:(date: string) => db.entries.getByDate(date),
};
