// A7a — thin shim. All logic lives in db/index.ts.
// Identical pattern to storage.ts shim from A2.
// In Phase 2 (Electron), only db/index.ts changes — this file stays identical.

import { db } from '@/app/db';
import type { Era } from '@/app/types';

export const erasStorage = {
  getAll: (): Era[]                                           => db.eras.getAll(),
  add:    (era: Omit<Era, 'id' | 'createdAt' | 'updatedAt'>) => db.eras.add(era),
  update: (id: string, updates: Partial<Era>)                 => db.eras.update(id, updates),
  delete: (id: string)                                        => db.eras.delete(id),
  getById:(id: string)                                        => db.eras.getById(id),
  getActive:()                                                => db.eras.getActive(),
};
