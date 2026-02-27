export interface JournalEntry {
  id: string;
  date: string; // ISO date string
  whatHappened?: string;
  feelings?: string;
  whatMatters?: string;
  insight?: string;
  freeWrite?: string;
  mood?: 'great' | 'good' | 'okay' | 'low' | 'difficult';
  energy?: 1 | 2 | 3 | 4 | 5;
  tags?: string[]; // v2: user-controlled themes
  reflectionType?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // v2: reflection mode
  eraId?: string; // v3: assigned to a life chapter
  visibility?: 'normal' | 'never-resurface' | 'request-only' | 'safe-to-revisit'; // v3: memory control
  isLongForm?: boolean; // v3: essay vs daily entry
  questionId?: string; // v3: response to a persistent question
  createdAt: string;
  updatedAt: string;
}

export interface MoodData {
  date: string;
  mood: string;
  energy?: number;
}

export interface Insight {
  type: 'pattern' | 'trend' | 'observation' | 'language' | 'memory'; // v2: added types
  text: string;
  period: 'week' | 'month' | 'year';
  relatedEntryIds?: string[]; // v2: link to relevant entries
  dismissible?: boolean;
}

// v2: Reflection Anchors
export interface ReflectionAnchor {
  id: string;
  type: 'value' | 'question' | 'intention';
  text: string;
  createdAt: string;
}

// v2: User Preferences
export interface UserPreferences {
  insightsEnabled: boolean;
  insightFrequency: 'weekly' | 'monthly' | 'off';
  memoryRemindersEnabled: boolean;
  languageAnalysisEnabled: boolean;
  lastInsightDate?: string;
}

// v2: Memory Surface
export interface MemorySurface {
  id: string;
  currentEntryId: string;
  relatedEntryId: string;
  reason: string;
  dismissed?: boolean;
  createdAt: string;
}

// v3: Personal Eras & Chapters
export interface Era {
  id: string;
  name: string;
  description?: string;
  startDate?: string; // Optional - can be open-ended
  endDate?: string; // Optional - can remain open
  color?: string; // Visual distinction
  createdAt: string;
  updatedAt: string;
}

// v3: Memory Threads (User-Assembled)
export interface MemoryThread {
  id: string;
  name: string;
  description?: string;
  entryIds: string[];
  createdAt: string;
  updatedAt: string;
}

// v3: Persistent Questions
export interface PersistentQuestion {
  id: string;
  question: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  lastReflectedAt?: string;
}

// v3: Long-Form Reflection (not date-bound)
export interface LongFormReflection {
  id: string;
  title: string;
  content: string;
  type: 'essay' | 'letter' | 'thinking' | 'belief';
  questionId?: string; // Optional link to persistent question
  tags?: string[];
  eraId?: string;
  createdAt: string;
  updatedAt: string;
}

// v3.1: Habit & 21-Day Gentle Start
export interface Habit {
  id: string;
  name: string;
  why: string; // Personal meaning
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

// v3.1: 21-Day Gentle Start (opt-in practice window)
export interface GentleStart {
  id: string;
  habitId: string;
  startDate: string;
  endDate: string; // Automatically calculated (21 days from start)
  engagements: HabitEngagement[];
  completed: boolean;
  createdAt: string;
}

// v3.1: Habit Engagement (participation model)
export interface HabitEngagement {
  id: string;
  habitId: string;
  gentleStartId?: string;
  date: string;
  type: 'performed' | 'reflected' | 'adjusted' | 'noted-difficulty';
  note?: string; // Optional reflection
  createdAt: string;
}

// v3.1: Habit Reflection (linked to prompts)
export interface HabitReflection {
  id: string;
  habitId: string;
  date: string;
  prompt: string;
  response: string;
  createdAt: string;
}