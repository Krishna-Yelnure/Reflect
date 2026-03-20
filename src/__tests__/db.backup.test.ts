/**
 * Smoke tests — db.backup (mergeAll, exportAll, deleteAll)
 *
 * Tests the complete import/export lifecycle that backs the
 * Privacy & Data → Export / Import feature.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/app/db';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides = {}) {
  return {
    id:   `entry-${Date.now()}-${Math.random()}`,
    date: '2024-03-10',
    whatHappened: 'Tested the app',
    feelings: 'Focused',
    whatMatters: 'Quality',
    insight: 'Tests give confidence',
    freeWrite: '',
    mood: 'good',
    energy: 3,
    tags: ['testing'],
    reflectionType: 'daily',
    ...overrides,
  };
}

function makeHabit(overrides = {}) {
  return {
    id:         `habit-${Date.now()}-${Math.random()}`,
    name:       'Morning walk',
    why:        'Clears my head',
    isArchived: false,
    createdAt:  new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('db.backup — exportAll', () => {
  it('returns a valid JSON string', () => {
    const json = db.backup.exportAll();
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('includes a version field and data object', () => {
    const snap = JSON.parse(db.backup.exportAll());
    expect(snap).toHaveProperty('version');
    expect(snap).toHaveProperty('data');
    expect(snap.data).toHaveProperty('entries');
    expect(snap.data).toHaveProperty('habits');
    expect(snap.data).toHaveProperty('eras');
  });

  it('includes entries that were saved', () => {
    const entry = makeEntry();
    db.entries.save([entry]);
    const snap = JSON.parse(db.backup.exportAll());
    expect(snap.data.entries).toHaveLength(1);
    expect(snap.data.entries[0].id).toBe(entry.id);
  });
});

describe('db.backup — mergeAll (no prior data)', () => {
  it('imports entries from a valid JSON backup', () => {
    const entry = makeEntry();
    // Build a snapshot manually
    const snapshot = {
      version: 1,
      data: { entries: [entry], habits: [], eras: [], anchors: [], threads: [], questions: [], engagements: [], gentleStarts: [], longform: [] },
    };
    const result = db.backup.mergeAll(JSON.stringify(snapshot));
    expect(result.entriesAdded).toBe(1);
    expect(db.entries.getAll()).toHaveLength(1);
  });

  it('imports habits and reports them separately', () => {
    const habit = makeHabit();
    const snapshot = {
      version: 1,
      data: { entries: [], habits: [habit], eras: [], anchors: [], threads: [], questions: [], engagements: [], gentleStarts: [], longform: [] },
    };
    const result = db.backup.mergeAll(JSON.stringify(snapshot));
    expect(result.habitsAdded).toBe(1);
    expect(db.habits.getAll()).toHaveLength(1);
  });
});

describe('db.backup — mergeAll (deduplication)', () => {
  it('does not duplicate an entry that already exists', () => {
    const entry = makeEntry();
    db.entries.save([entry]);

    const snapshot = {
      version: 1,
      data: { entries: [entry], habits: [], eras: [], anchors: [], threads: [], questions: [], engagements: [], gentleStarts: [], longform: [] },
    };
    const result = db.backup.mergeAll(JSON.stringify(snapshot));
    expect(result.entriesAdded).toBe(0);
    expect(db.entries.getAll()).toHaveLength(1); // still 1, not 2
  });

  it('adds only truly new entries when merging a mixed backup', () => {
    const existing = makeEntry({ id: 'old-entry' });
    const fresh    = makeEntry({ id: 'new-entry' });
    db.entries.save([existing]);

    const snapshot = {
      version: 1,
      data: { entries: [existing, fresh], habits: [], eras: [], anchors: [], threads: [], questions: [], engagements: [], gentleStarts: [], longform: [] },
    };
    const result = db.backup.mergeAll(JSON.stringify(snapshot));
    expect(result.entriesAdded).toBe(1);
    expect(db.entries.getAll()).toHaveLength(2);
  });
});

describe('db.backup — mergeAll (error handling)', () => {
  it('throws on invalid JSON', () => {
    expect(() => db.backup.mergeAll('not json')).toThrow();
  });

  it('throws on JSON without a data field', () => {
    expect(() => db.backup.mergeAll(JSON.stringify({ wrong: 'format' }))).toThrow();
  });
});

describe('db.backup — deleteAll', () => {
  it('removes all data', () => {
    db.entries.save([makeEntry()]);
    db.backup.deleteAll();
    expect(db.entries.getAll()).toHaveLength(0);
    expect(db.habits.getAll()).toHaveLength(0);
  });
});

describe('db.backup — round-trip (export → delete → import)', () => {
  it('fully restores data after a round-trip', () => {
    const entry = makeEntry({ id: 'roundtrip-entry' });
    const habit = makeHabit({ id: 'roundtrip-habit' });
    db.entries.save([entry]);
    db.habits.save([habit]);

    const backup = db.backup.exportAll();
    db.backup.deleteAll();

    expect(db.entries.getAll()).toHaveLength(0);
    expect(db.habits.getAll()).toHaveLength(0);

    // importAll for a full restore (not mergeAll)
    const ok = db.backup.importAll(backup);
    expect(ok).toBe(true);
    expect(db.entries.getAll()).toHaveLength(1);
    expect(db.habits.getAll()).toHaveLength(1);
    expect(db.entries.getAll()[0].id).toBe('roundtrip-entry');
  });
});
