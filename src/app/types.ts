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
  intention?: string;                   // A4c — forward-looking, reflection entries only
  oneWord?: string;                     // A5a — past-facing closing word, reflection entries only
  createdAt?: string;
  updatedAt?: string;
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
  isOpen: boolean;
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
