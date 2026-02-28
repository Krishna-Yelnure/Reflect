/**
 * preferences.ts — Legacy compatibility shim
 * All logic has moved to @/app/db
 * This file keeps existing imports working without changes.
 */
import { db } from '@/app/db';
import type { UserPreferences, ReflectionAnchor } from '@/app/types';

export const preferences = {
  get:          () => db.prefs.get(),
  save:         (p: Partial<UserPreferences>) => db.prefs.save(p),
  getAnchors:   () => db.anchors.getAll(),
  saveAnchors:  (a: ReflectionAnchor[]) => db.anchors.save(a),
  addAnchor:    (a: Parameters<typeof db.anchors.add>[0]) => db.anchors.add(a),
  removeAnchor: (id: string) => db.anchors.remove(id),
  updateAnchor: (id: string, u: Parameters<typeof db.anchors.update>[1]) => db.anchors.update(id, u),
};
