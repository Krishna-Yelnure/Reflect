// ── Journal Entry ─────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  date: string;                         // yyyy-MM-dd for daily; synthetic key for reflections
  whatHappened?: string;
  feelings?: string;
  whatMatters?: string;
  insight?: string;
  freeWrite?: string;
  mood?: 'great' | 'good' | 'okay' | 'low' | 'difficult';
  energy?: 1 | 2 | 3 | 4 | 5;
  // A8b — Inner state quality (Guna dimension). Optional, never mandatory.
  // Plain English labels: 'clear' = Sattva, 'restless' = Rajas, 'heavy' = Tamas.
  // Sanskrit never shown in UI — progressive disclosure only in A8c.
  innerState?: 'clear' | 'restless' | 'heavy';
  tags?: string[];
  reflectionType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  eraId?: string;
  visibility?: 'private' | 'legacy';
  isLongForm?: boolean;
  questionId?: string;
  intention?: string;                   // Legacy - to be migrated
  intentionAction?: string;             // A9c - Specific action for next period
  intentionRelease?: string;            // A9c - What to release/stop doing
  whatIReleased?: string;               // A9c - Past-facing release (Yearly)
  oneWord?: string;                     // A5a — past-facing closing word, reflection entries only
  createdAt?: string;
  updatedAt?: string;

  // ── A14 — Media ────────────────────────────────────────────────────────────
  // Ordered list of MediaMeta IDs attached directly to this entry.
  // Blobs live in IndexedDB (mediaDb.ts); metadata lives in localStorage (db.media).
  mediaIds?: string[];

  // A14-followup — Album Linking
  // IDs of PhotoAlbums this entry is linked to.
  // Albums are shared across entries (e.g. a trip spanning multiple days).
  albumIds?: string[];

  // ── Activation Energy Engine (AEE) fields ──
  clarity?: number;
  resistance?: number;
  delay?: number;
  activationScore?: number;
  activationLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  firstStep?: string;
  startedAt?: string;
}

// ── Media ─────────────────────────────────────────────────────────────────────
// A14 — Photo metadata stored in localStorage (db.media namespace).
// The actual binary Blob lives in IndexedDB (mediaDb.ts), keyed by id.

export interface MediaMeta {
  id: string;
  entryId: string;            // links to JournalEntry.id
  mimeType: string;           // always 'image/jpeg' after compression
  sizeBytes: number;          // compressed size in bytes
  caption?: string;
  width: number;              // compressed image dimensions
  height: number;
  dominantColour: string;     // rgb(r,g,b) sampled at upload — used as placeholder while blob loads
  createdAt: string;
}

// ── Photo Albums ──────────────────────────────────────────────────────────────
// A14-followup — named collections of photos that span multiple entries.
// Multiple entries can share the same album (e.g. a 3-day trip).
// The album holds photos; entries hold words. Both reference each other.

export interface PhotoAlbum {
  id: string;
  name: string;         // user-chosen label: "Greece 2026", "Mum's 70th"
  mediaIds: string[];   // ordered list of photo IDs (blobs in IndexedDB)
  createdAt: string;
  updatedAt: string;
}

// ── Insight ───────────────────────────────────────────────────────────────────

export interface Insight {
  type: 'pattern' | 'trend' | 'observation';
  text: string;
  period: 'week' | 'month' | 'quarter';
  dismissible?: boolean;
}

// ── Habit ─────────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  why?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GentleStart {
  id: string;
  habitId: string;
  startDate: string;
  endDate: string;
  engagements: string[];
  completed: boolean;
  createdAt: string;
}

export interface HabitEngagement {
  id: string;
  habitId: string;
  date: string;
  note?: string;
  // ── AEE fields ──
  clarity?: number;
  resistance?: number;
  delay?: number;
  activationScore?: number;
  activationLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  firstStep?: string;
  startedAt?: string;
  createdAt: string;
}

// ── User Preferences ──────────────────────────────────────────────────────────

export interface UserPreferences {
  insightsEnabled: boolean;
  insightFrequency: 'daily' | 'weekly' | 'monthly';
  memoryRemindersEnabled: boolean;
  languageAnalysisEnabled: boolean;
}

// ── Reflection Anchors ────────────────────────────────────────────────────────

export interface ReflectionAnchor {
  id: string;
  type: 'value' | 'intention' | 'question';
  text: string;
  createdAt: string;
}

// ── Eras ──────────────────────────────────────────────────────────────────────

export interface Era {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  colour?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Memory Threads ────────────────────────────────────────────────────────────

export interface MemoryThread {
  id: string;
  title: string;
  entryIds: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Persistent Questions ──────────────────────────────────────────────────────

export interface PersistentQuestion {
  id: string;
  text: string;
  notes?: string;
  isActive: boolean;
  resolvedAt?: string;
  resolution?: string;
  lastReflectedAt?: string;
  isDeferred?: boolean;                 // A9c - For questions that aren't active but aren't resolved
  createdAt: string;
}

// ── Long-Form Reflections ─────────────────────────────────────────────────────

export interface LongFormReflection {
  id: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ── Memory Surface ────────────────────────────────────────────────────────────

export interface MemorySurfaceItem {
  id: string;
  entryId: string;
  relatedEntryId: string;
  relevanceScore: number;
  createdAt: string;
}
