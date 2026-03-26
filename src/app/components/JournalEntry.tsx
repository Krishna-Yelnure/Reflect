import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, parseISO } from 'date-fns';
import { Sparkles, Save, X, Zap, BookOpen, Edit3, ChevronLeft, Wind, HelpCircle } from 'lucide-react';
import type { JournalEntry as JournalEntryType, ReflectionAnchor } from '@/app/types';
import { storage } from '@/app/utils/storage';
import { erasStorage } from '@/app/utils/eras';
import { getReflectionPrompt, getContextAwarePrompt, computeJournalContext } from '@/app/utils/prompts-v2';
import { findSimilarEntries, createMemorySurface } from '@/app/utils/memory-surface';
import { preferences } from '@/app/utils/preferences';
import { questionsStorage } from '@/app/utils/questions';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { TagManager } from '@/app/components/TagManager';
import { MemorySurface } from '@/app/components/MemorySurface';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { BreathingOverlay } from '@/app/components/BreathingOverlay';
import { StartAssist, type AEEMetrics } from '@/app/components/StartAssist';

// ─── Types ────────────────────────────────────────────────────────────────────

type WriteMode = 'quick' | 'guided' | 'deep' | 'read';
type ReflectionType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface JournalEntryProps {
  selectedDate: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: (date: string) => void;
  allEntries: JournalEntryType[];
  onViewEntry?: (date: string) => void;
  initialReflectionType?: ReflectionType;   // set by Timeline for weekly/monthly/yearly
  initialQuestionId?: string;               // A8b — set by App when navigating from Compass
  initialMode?: WriteMode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const moods = [
  {
    value: 'great',
    label: 'Great',
    emoji: '✨',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    glow: 'shadow-amber-200/60',
    ring: 'ring-amber-300',
    text: 'text-amber-700',
  },
  {
    value: 'good',
    label: 'Good',
    emoji: '😊',
    bg: 'bg-stone-50',
    border: 'border-stone-300',
    glow: 'shadow-stone-200/60',
    ring: 'ring-stone-300',
    text: 'text-stone-600',
  },
  {
    value: 'okay',
    label: 'Okay',
    emoji: '😐',
    bg: 'bg-stone-50',
    border: 'border-stone-300',
    glow: 'shadow-stone-200/60',
    ring: 'ring-stone-300',
    text: 'text-stone-600',
  },
  {
    value: 'low',
    label: 'Low',
    emoji: '😔',
    bg: 'bg-stone-100',
    border: 'border-stone-300',
    glow: 'shadow-stone-200/60',
    ring: 'ring-stone-300',
    text: 'text-stone-500',
  },
  {
    value: 'difficult',
    label: 'Hard',
    emoji: '😣',
    bg: 'bg-stone-50',
    border: 'border-stone-300',
    glow: 'shadow-stone-200/60',
    ring: 'ring-stone-300',
    text: 'text-stone-500',
  },
] as const;

const energyLevels = [1, 2, 3, 4, 5] as const;

// Reflection type metadata — used to customise Guided mode when opened from Timeline
const REFLECTION_META: Record<string, {
  label: string;
  badge: string;
  badgeCls: string;
  fields: { key: string; label: string; placeholder: string }[];
}> = {
  weekly: {
    label: 'Weekly reflection',
    badge: 'This week',
    badgeCls: 'bg-amber-100 text-amber-700',
    fields: [
      { key: 'whatHappened',    label: 'What happened this week?',     placeholder: 'The events, moments, conversations…' },
      { key: 'feelings',        label: 'How did the week feel?',       placeholder: 'The emotional texture of the week…' },
      { key: 'whatMatters',     label: 'What mattered most?',          placeholder: "What you'd want to remember…" },
      { key: 'insight',         label: 'What did you learn?',          placeholder: 'A pattern, a realisation, a shift…' },
      { key: 'intentionAction', label: 'What will you act on next week?', placeholder: 'One specific direction or action…' },
      { key: 'intentionRelease',label: 'What will you release?',       placeholder: 'A habit, a worry, or a project that needs to rest…' },
      { key: 'freeWrite',       label: 'Anything else',                placeholder: 'Whatever needs space…' },
    ],
  },
  monthly: {
    label: 'Monthly reflection',
    badge: 'This month',
    badgeCls: 'bg-stone-200 text-stone-600',
    fields: [
      { key: 'whatHappened',    label: 'What defined this month?',     placeholder: 'The chapters, the turning points…' },
      { key: 'feelings',        label: 'What shifted emotionally?',    placeholder: 'How you changed, what softened or hardened…' },
      { key: 'whatMatters',     label: 'What mattered more than expected?', placeholder: 'Surprises in what moved you…' },
      { key: 'insight',         label: 'What do you understand now?',  placeholder: 'What the month taught you…' },
      { key: 'intentionAction', label: 'What is the focus for next month?', placeholder: 'Your primary direction…' },
      { key: 'intentionRelease',label: 'What are you letting go of?',   placeholder: 'Something that no longer serves you…' },
      { key: 'freeWrite',       label: 'What to carry forward',        placeholder: "What you're taking into next month…" },
    ],
  },
  yearly: {
    label: 'Yearly reflection',
    badge: 'This year',
    badgeCls: 'bg-rose-100 text-rose-700',
    fields: [
      { key: 'whatHappened',    label: 'What defined this year?',      placeholder: 'The chapters that shaped it…' },
      { key: 'whatIReleased',   label: 'What did you release this year?', placeholder: 'The burdens, roles, or habits you left behind…' },
      { key: 'feelings',        label: 'How did you change?',          placeholder: 'Who you were in January vs now…' },
      { key: 'whatMatters',     label: 'What surprised you most?',     placeholder: "What you couldn't have anticipated…" },
      { key: 'insight',         label: 'What belief did you outgrow?', placeholder: "What you understand now that you didn't before…" },
      { key: 'intentionAction', label: 'Your intention for next year',  placeholder: 'A direction, a word, a quiet promise…' },
      { key: 'intentionRelease',label: 'What will you let go of?',     placeholder: 'The weight you choose not to carry forward…' },
      { key: 'freeWrite',       label: 'Final thoughts',               placeholder: "Closing the chapter…" },
    ],
  },
};

// Closing moment lines — quiet, human, not celebratory. All pass Witness test.
const closingLines = [
  'Another day, held.',
  'The page holds it now.',
  'This moment, kept.',
  'Something true, written.',
  'You showed up.',
  'A thread in the story.',
  'Quietly remembered.',
  'Written. Kept. Yours.',
  'Today is part of the record.',
  'The story continues.',
  'Here. Now. Remembered.',
];



function getClosingLine(): string {
  return closingLines[Math.floor(Math.random() * closingLines.length)];
}

/** Count words in a string — used for quiet word count in Deep Write */
function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

/**
 * Build a continuity prompt from yesterday's entry.
 * Only fires if yesterday has an entry and has content worth referencing.
 */
function getContinuityPrompt(allEntries: JournalEntryType[], today: string): string | null {
  const yesterday = format(subDays(new Date(today + 'T12:00:00'), 1), 'yyyy-MM-dd');
  const yesterdayEntry = allEntries.find(e => e.date === yesterday);

  if (!yesterdayEntry) return null;

  // Don't show continuity prompt for the same entry being edited
  const snippets: string[] = [];
  if (yesterdayEntry.whatHappened) snippets.push(yesterdayEntry.whatHappened);
  if (yesterdayEntry.whatMatters) snippets.push(yesterdayEntry.whatMatters);
  if (yesterdayEntry.insight) snippets.push(yesterdayEntry.insight);
  if (yesterdayEntry.freeWrite) snippets.push(yesterdayEntry.freeWrite);

  if (snippets.length === 0) return null;

  // Take first 60 chars of most meaningful snippet
  const source = snippets[0].trim();
  const preview = source.length > 55 ? source.slice(0, 55).trim() + '…' : source;

  return `Yesterday you wrote: "${preview}" — how did it unfold?`;
}

/**
 * Find an entry from exactly one year ago (within ±3 days).
 */
function getOneYearAgoEntry(allEntries: JournalEntryType[], today: string): JournalEntryType | null {
  const todayDate = new Date(today + 'T12:00:00');
  const yearAgo = new Date(todayDate);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  // Search ±3 days for any entry near a year ago
  for (let offset = 0; offset <= 3; offset++) {
    for (const delta of [offset, -offset]) {
      if (offset === 0 && delta !== 0) continue;
      const candidate = new Date(yearAgo);
      candidate.setDate(candidate.getDate() + delta);
      const candidateStr = format(candidate, 'yyyy-MM-dd');
      const found = allEntries.find(e => e.date === candidateStr);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Finds the most recent prior-period reflection that has an intention set.
 * Returns a prompt string like "Last week you intended: '[X]' — how did that unfold?"
 * Only fires for reflection entries (weekly/monthly/yearly), never for daily.
 */
function getPreviousPeriodIntention(
  allEntries: JournalEntryType[],
  type: 'weekly' | 'monthly' | 'yearly'
): string | null {
  const prefix = `reflection-${type}-`;
  const periodEntries = allEntries
    .filter(e => e.date.startsWith(prefix) && e.intention && e.intention.trim().length > 0)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  if (periodEntries.length === 0) return null;

  const last = periodEntries[0];
  const intention = last.intention!.trim();
  const preview = intention.length > 80 ? intention.slice(0, 80).trim() + '…' : intention;

  const periodLabel: Record<string, string> = {
    weekly:  'Last week',
    monthly: 'Last month',
    yearly:  'Last year',
  };
  return `${periodLabel[type]} you intended: "${preview}" — how did that unfold?`;
}

/**
 * Finds the intentionActions for the last 2 periods of the same type.
 */
function getIntentionHistory(
  allEntries: JournalEntryType[],
  currentDate: string,
  type: string
): string[] {
  const prefix = `reflection-${type}-`;
  return allEntries
    .filter(e => e.date.startsWith(prefix) && e.date !== currentDate && e.intentionAction)
    .sort((a, b) => (b.date).localeCompare(a.date))
    .slice(0, 2)
    .map(e => e.intentionAction!);
}

/**
 * Format a date string for display — handles both real dates (yyyy-MM-dd)
 * and synthetic reflection keys (reflection-weekly-..., reflection-monthly-..., reflection-yearly-...)
 */
function formatEntryDate(dateKey: string): string {
  if (dateKey.startsWith('reflection-weekly-')) {
    const weekStart = dateKey.replace('reflection-weekly-', '');
    try {
      return `Week of ${format(new Date(weekStart + 'T12:00:00'), 'MMMM d, yyyy')}`;
    } catch { return 'Weekly reflection'; }
  }
  if (dateKey.startsWith('reflection-monthly-')) {
    const parts = dateKey.replace('reflection-monthly-', '').split('-'); // ['2026','02']
    try {
      return format(new Date(`${parts[0]}-${parts[1]}-01T12:00:00`), 'MMMM yyyy');
    } catch { return 'Monthly reflection'; }
  }
  if (dateKey.startsWith('reflection-yearly-')) {
    return dateKey.replace('reflection-yearly-', '');
  }
  // Regular date
  try {
    return format(new Date(dateKey + 'T12:00:00'), 'EEEE, MMMM d, yyyy');
  } catch { return dateKey; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Quiet mode toggle — three pill buttons */
function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: WriteMode;
  onChange: (m: WriteMode) => void;
}) {
  const modes: { id: WriteMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'quick', label: 'Quick', icon: <Zap className="size-3.5" />, desc: '30 seconds' },
    { id: 'guided', label: 'Guided', icon: <BookOpen className="size-3.5" />, desc: 'Default' },
    { id: 'deep', label: 'Deep', icon: <Edit3 className="size-3.5" />, desc: 'Longform' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: '#ddd8cf' }}>
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
            ${mode === m.id
              ? 'shadow-sm'
              : 'hover:text-stone-700'
            }
          `}
          style={{
            backgroundColor: mode === m.id ? '#EDE8DF' : 'transparent',
            color: mode === m.id ? '#3C3C38' : '#8a7f72',
          }}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
}

/** The contextual prompt strip — shows prompt, continuity, or memory surface notice */
function ContextualPrompt({
  prompt,
  continuityPrompt,
  yearAgoEntry,
  previousIntention,
  onViewYearAgo,
}: {
  prompt: string;
  continuityPrompt: string | null;
  yearAgoEntry: JournalEntryType | null;
  previousIntention: string | null;
  onViewYearAgo: () => void;
}) {
  // Priority: year-ago memory > continuity > previous intention > daily prompt
  if (yearAgoEntry) {
    const preview = yearAgoEntry.whatHappened || yearAgoEntry.freeWrite || yearAgoEntry.feelings || '';
    const snippet = preview.trim().slice(0, 80) + (preview.length > 80 ? '…' : '');
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl"
      >
        <span className="text-lg mt-0.5 flex-shrink-0">🕰</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-700 mb-0.5 uppercase tracking-wide">
            A year ago
          </p>
          {snippet && (
            <p className="text-sm text-amber-900 italic leading-relaxed mb-2">
              "{snippet}"
            </p>
          )}
          <button
            onClick={onViewYearAgo}
            className="text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2 transition-colors"
          >
            Read that entry
          </button>
        </div>
      </motion.div>
    );
  }

  if (continuityPrompt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 rounded-xl border border-stone-200/60"
        style={{ backgroundColor: '#e8e2d8' }}
      >
        <span className="text-lg mt-0.5 flex-shrink-0">💬</span>
        <p className="text-sm italic leading-relaxed" style={{ color: '#5a5550' }}>{continuityPrompt}</p>
      </motion.div>
    );
  }

  if (previousIntention) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
      >
        <span className="text-lg mt-0.5 flex-shrink-0">🔁</span>
        <p className="text-sm text-amber-900 italic leading-relaxed">{previousIntention}</p>
      </motion.div>
    );
  }

  if (prompt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2.5 p-4 rounded-xl border border-stone-200/60"
        style={{ backgroundColor: '#e8e2d8' }}
      >
        <Sparkles className="size-4 mt-0.5 flex-shrink-0 text-stone-400" />
        <p className="text-sm italic leading-relaxed" style={{ color: '#5a5550' }}>{prompt}</p>
      </motion.div>
    );
  }

  return null;
}

/** Closing moment — shown briefly after save before redirecting */
function ClosingMoment({
  date,
  line,
  onDone,
}: {
  date: string;
  line: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2800);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor: '#EDE8DF' }}
      onClick={onDone}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-center space-y-4 px-8"
      >
        <p className="text-stone-400 text-sm tracking-widest uppercase font-medium">
          {formatEntryDate(date)}
        </p>
        <p className="text-2xl font-light" style={{ fontFamily: 'var(--font-display)', color: '#1C1C18' }}>{line}</p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 1.8, ease: 'easeInOut' }}
          className="h-px w-24 bg-stone-300 mx-auto origin-left"
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function JournalEntry({
  selectedDate,
  onSave,
  onCancel,
  onDelete,
  allEntries,
  onViewEntry,
  initialReflectionType = 'daily',
  initialQuestionId,
  initialMode = 'guided',
}: JournalEntryProps) {
  const [mode, setMode] = useState<WriteMode>(initialMode);
  const [entry, setEntry] = useState<Partial<JournalEntryType>>({
    whatHappened: '',
    feelings: '',
    whatMatters: '',
    insight: '',
    freeWrite: '',
    mood: undefined,
    energy: undefined,
    innerState: undefined,
    tags: [],
    questionId: initialQuestionId,
    reflectionType: initialReflectionType,
    oneWord: '',
    intentionAction: '',
    intentionRelease: '',
    whatIReleased: '',
  });
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showClosingMoment, setShowClosingMoment] = useState(false);
  const [closingLine, setClosingLine] = useState('');
  const [similarEntries, setSimilarEntries] = useState<JournalEntryType[]>([]);
  const [memoryDismissed, setMemoryDismissed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showStartAssist, setShowStartAssist] = useState(false);

  const prefs = preferences.get();
  const coreValues = preferences.getAnchors().filter((a: ReflectionAnchor) => a.type === 'value' || a.type === 'intention');
  const activeQuestions = questionsStorage.getActive();

  // Derived — does this entry already exist in storage?
  const existing = useMemo(() => storage.getEntryByDate(selectedDate), [selectedDate]);

  // Derived — is this a reflection entry (not daily)?
  const isReflection = initialReflectionType !== 'daily';
  const reflectionMeta = isReflection ? REFLECTION_META[initialReflectionType] : null;

  // ── Contextual prompts ─────────────────────────────────────────────────────
  // Reflection entries have no "yesterday" or "year ago" — suppress those prompts
  const continuityPrompt = isReflection ? null : getContinuityPrompt(allEntries, selectedDate);
  const yearAgoEntry = isReflection ? null : getOneYearAgoEntry(allEntries, selectedDate);
  // For reflection entries: surface last period's intention as an opening prompt
  const previousIntention = isReflection
    ? getPreviousPeriodIntention(allEntries, initialReflectionType as 'weekly' | 'monthly' | 'yearly')
    : null;

  // ── Load existing entry ────────────────────────────────────────────────────

  useEffect(() => {
    if (existing) {
      setEntry(existing);
      setMode(initialMode !== 'guided' ? initialMode : 'read'); // Default to read mode for existing entries unless forced otherwise
    } else {
      setEntry({
        whatHappened: '',
        feelings: '',
        whatMatters: '',
        insight: '',
        freeWrite: '',
        mood: undefined,
        energy: undefined,
        innerState: undefined,
        tags: [],
        questionId: initialQuestionId,
        reflectionType: initialReflectionType,
        oneWord: '',
        intentionAction: '',
        intentionRelease: '',
        whatIReleased: '',
      });
      setMemoryDismissed(false);
      setHasUnsavedChanges(false);
    }

    // Set prompt based on reflection type
    if (isReflection) {
      setPrompt(getReflectionPrompt(initialReflectionType as 'weekly' | 'monthly' | 'yearly'));
    } else {
      if (allEntries.length === 0) {
        setPrompt("Welcome. This space is yours. What is the truest thing you can say today?");
      } else {
        const ctx = computeJournalContext(allEntries, selectedDate, !!existing);
        setPrompt(getContextAwarePrompt(ctx));
      }
    }
  }, [selectedDate, initialReflectionType, initialQuestionId, existing, isReflection, allEntries.length, initialMode]);

  // ── Memory surface (similar entries) ─────────────────────────────────────

  useEffect(() => {
    if (!prefs.memoryRemindersEnabled || memoryDismissed) {
      setSimilarEntries([]);
      return;
    }
    const timer = setTimeout(() => {
      const hasContent = entry.whatHappened || entry.feelings || entry.freeWrite;
      if (hasContent && allEntries.length > 3) {
        const similar = findSimilarEntries(entry, allEntries, 1);
        setSimilarEntries(similar);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [entry.whatHappened, entry.feelings, entry.freeWrite, allEntries, prefs.memoryRemindersEnabled, memoryDismissed]);

  // ── Mode change side effects ───────────────────────────────────────────────

  const handleModeChange = useCallback((newMode: WriteMode) => {
    setMode(newMode);
    if (newMode === 'deep') {
      // Deep mode: set isLongForm flag
      setEntry(prev => ({ ...prev, isLongForm: true }));
    } else {
      setEntry(prev => ({ ...prev, isLongForm: false }));
    }
  }, []);

  // ── Field updates ──────────────────────────────────────────────────────────

  const updateField = useCallback((field: keyof JournalEntryType, value: any) => {
    setEntry((prev: Partial<JournalEntryType>) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  const setMood = (mood: JournalEntryType['mood']) => {
    setEntry((prev: Partial<JournalEntryType>) => ({ ...prev, mood }));
    setHasUnsavedChanges(true);
  };

  const setEnergy = (energy: JournalEntryType['energy']) => {
    setEntry((prev: Partial<JournalEntryType>) => ({ ...prev, energy }));
    setHasUnsavedChanges(true);
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);

    const hasContent =
      entry.whatHappened ||
      entry.feelings ||
      entry.whatMatters ||
      entry.insight ||
      entry.freeWrite;

    if (!hasContent && !entry.mood) {
      toast.error('Add at least some thoughts or select a mood');
      setIsSaving(false);
      return;
    }

    // A7a — auto-assign eraId by date. Silent, zero friction.
    // Find the first era whose date range covers this entry's date.
    // Reflection entries (synthetic date keys) are skipped — they don't belong to a day.
    const autoEraId = (() => {
      if (selectedDate.startsWith('reflection-')) return undefined;
      const allEras = erasStorage.getAll();
      const entryTime = new Date(selectedDate).getTime();
      const match = allEras.find(era => {
        if (!era.startDate) return false;
        const start = new Date(era.startDate).getTime();
        const end   = era.endDate ? new Date(era.endDate).getTime() : Infinity;
        return entryTime >= start && entryTime <= end;
      });
      return match?.id;
    })();

    if (existing) {
      storage.updateEntry(existing.id, { ...entry, eraId: autoEraId ?? existing.eraId });
    } else {
      const newEntry: JournalEntryType = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: selectedDate,
        ...(entry as JournalEntryType),
        eraId: autoEraId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storage.addEntry(newEntry);
    }

    setIsSaving(false);
    setHasUnsavedChanges(false);

    // Show closing moment for new entries, not for quick edits
    if (!existing) {
      // Special first-entry closing moment — one time only
      const isFirstEntry = allEntries.filter(e => !e.date.startsWith('reflection-')).length === 0;
      const line = isFirstEntry ? 'Your first entry. The map has begun.' : getClosingLine();
      setClosingLine(line);
      setShowClosingMoment(true);
    } else {
      toast.success('Entry updated');
      onSave();
    }
  };

  const handleClosingDone = useCallback(() => {
    setShowClosingMoment(false);
    onSave();
  }, [onSave]);

  // ── Unsaved changes guard ──────────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Leave without saving?')) return;
    }
    onCancel();
  }, [hasUnsavedChanges, onCancel]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Deep Write mode
  // ─────────────────────────────────────────────────────────────────────────

  if (mode === 'deep') {
    const wordCount = countWords(entry.freeWrite || '');

    return (
      <>
        <AnimatePresence>
          {showClosingMoment && (
            <ClosingMoment date={selectedDate} line={closingLine} onDone={handleClosingDone} />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex flex-col"
          style={{ backgroundColor: '#EDE8DF' }}
        >
          {/* Deep mode toolbar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-stone-200/60">
            <button
              onClick={() => handleModeChange('guided')}
              className="flex items-center gap-1.5 text-sm transition-colors text-stone-500 hover:text-stone-700"
            >
              <ChevronLeft className="size-4" />
              Back to Guided
            </button>
            <p className="text-sm font-medium" style={{ color: '#1A1A1A' }}>
              {formatEntryDate(selectedDate)}
            </p>
            <div className="flex items-center gap-3">
              {!isSaving && existing && onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Delete Entry"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </button>
              )}
              <button
                onClick={() => setShowBreathing(true)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
                title="Box Breathing"
              >
                <Wind className="size-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="button-primary flex items-center gap-1.5"
              >
                <Save className="size-3.5" />
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Deep mode canvas — typewriter scroll via scroll-pt + overflow-y-auto */}
          <div
            className="flex-1 overflow-y-auto"
            style={{ scrollPaddingTop: '40vh' }}
          >
            <div className="px-8 pt-[20vh] pb-[50vh] max-w-3xl mx-auto w-full">
              <input
                type="text"
                value={entry.whatMatters || ''}
                onChange={e => updateField('whatMatters', e.target.value)}
                placeholder="A title, if you want one…"
                className="w-full h2 mb-8 bg-transparent border-none outline-none parchment-input"
                style={{ fontFamily: 'var(--font-display)', caretColor: '#B8860B' }}
              />
              <textarea
                value={entry.freeWrite || ''}
                onChange={e => updateField('freeWrite', e.target.value)}
                placeholder="Write freely. No prompts, no fields. Just you and the page."
                className="w-full deep-write-textarea p"
                style={{ minHeight: '60vh', fontFamily: 'var(--font-body)' }}
                autoFocus
                onKeyDown={e => {
                  // On Enter, scroll caret into vertical centre
                  if (e.key === 'Enter') {
                    requestAnimationFrame(() => {
                      const el = e.target as HTMLTextAreaElement;
                      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Word count — quiet, bottom-right, fades in once writing starts */}
          <AnimatePresence>
            {wordCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="fixed bottom-6 right-8 pointer-events-none"
              >
                <span
                  className="text-xs text-stone-300 tabular-nums"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {wordCount} {wordCount === 1 ? 'word' : 'words'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Read Mode
  // ─────────────────────────────────────────────────────────────────────────

  if (mode === 'read') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="max-w-2xl mx-auto px-6 py-12"
      >
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleModeChange('guided')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-stone-200/60"
              style={{ color: '#8a7f72' }}
            >
              <Edit3 className="size-4" />
              Edit
            </button>
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete Entry"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
            )}
          </div>
        </div>

        <article className="prose prose-stone max-w-none">
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-light mb-2" style={{ fontFamily: 'var(--font-display)', color: '#1C1C18' }}>
              {formatEntryDate(selectedDate)}
            </h1>
            {reflectionMeta && (
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${reflectionMeta.badgeCls}`}>
                {reflectionMeta.label}
              </span>
            )}
            {entry.whatMatters && !reflectionMeta && (
              <p className="text-xl italic text-stone-600 mt-4" style={{ fontFamily: 'var(--font-display)' }}>
                {entry.whatMatters}
              </p>
            )}
          </header>

          <div className="space-y-8 text-lg leading-relaxed text-stone-800" style={{ fontFamily: 'var(--font-body)' }}>
            {entry.freeWrite ? (
              <div className="whitespace-pre-wrap">{entry.freeWrite}</div>
            ) : (
              // Structured content display
              <>
                {entry.whatHappened && (
                  <section>
                    {reflectionMeta && <h3 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-3">{reflectionMeta.fields[0].label}</h3>}
                    <div className="whitespace-pre-wrap">{entry.whatHappened}</div>
                  </section>
                )}
                {entry.feelings && (
                  <section>
                    {reflectionMeta && <h3 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-3 mb-3">{reflectionMeta.fields[1].label}</h3>}
                    <div className="whitespace-pre-wrap">{entry.feelings}</div>
                  </section>
                )}
                {reflectionMeta && entry.whatMatters && (
                  <section>
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-3">{reflectionMeta.fields[2].label}</h3>
                    <div className="whitespace-pre-wrap">{entry.whatMatters}</div>
                  </section>
                )}
                {entry.insight && (
                  <section>
                    {reflectionMeta && <h3 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-3">{reflectionMeta.fields[3].label}</h3>}
                    <div className="whitespace-pre-wrap">{entry.insight}</div>
                  </section>
                )}
                {entry.whatIReleased && (
                  <section>
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-3">Released this year</h3>
                    <div className="whitespace-pre-wrap italic opacity-90">{entry.whatIReleased}</div>
                  </section>
                )}
                {entry.intentionAction && (
                  <section className="pt-6 border-t border-stone-200">
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-3">Next Step (Action)</h3>
                    <div className="whitespace-pre-wrap italic opacity-90">{entry.intentionAction}</div>
                  </section>
                )}
                {entry.intentionRelease && (
                  <section className="pt-6 border-t border-stone-200">
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-3">To Release</h3>
                    <div className="whitespace-pre-wrap italic opacity-90">{entry.intentionRelease}</div>
                  </section>
                )}
                {entry.intention && (
                  <section className="pt-6 border-t border-stone-200">
                    <h3 className="text-sm font-medium text-stone-500 uppercase tracking-widest mb-3">Intention</h3>
                    <div className="whitespace-pre-wrap italic opacity-90">{entry.intention}</div>
                  </section>
                )}
              </>
            )}
          </div>

          <footer className="mt-16 pt-8 border-t border-stone-200/60 flex items-center justify-between text-sm text-stone-500">
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex gap-2">
                {entry.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-stone-100 rounded-md">#{tag}</span>
                ))}
              </div>
            )}
          </footer>
        </article>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Quick Capture mode
  // ─────────────────────────────────────────────────────────────────────────

  if (mode === 'quick') {
    return (
      <>
        <AnimatePresence>
          {showClosingMoment && (
            <ClosingMoment date={selectedDate} line={closingLine} onDone={handleClosingDone} />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-2xl mx-auto px-6 py-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-light" style={{ fontFamily: 'var(--font-display)', color: '#1C1C18' }}>
                {formatEntryDate(selectedDate)}
              </h1>
              <p className="text-sm text-stone-400 mt-0.5">Quick capture</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBreathing(true)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
                title="Box Breathing"
              >
                <Wind className="size-5" />
              </button>
              <ModeSwitcher mode={mode} onChange={handleModeChange} />
              <button onClick={handleCancel} className="ml-1 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors">
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Mood */}
          <div className="mb-6">
            <p className="text-xs text-stone-500 uppercase tracking-wide font-medium mb-3">How are you?</p>
            <div className="flex gap-2 flex-wrap">
              {moods.map(mood => {
                const selected = entry.mood === mood.value;
                return (
                  <button
                    key={mood.value}
                    onClick={() => updateField('mood', selected ? undefined : mood.value)}
                    className={`
                      flex flex-col items-center gap-1 px-3 pt-3 pb-2 rounded-2xl border-2 transition-all duration-200
                      ${selected
                        ? `${mood.bg} ${mood.border} shadow-md ${mood.glow} scale-105 ring-2 ${mood.ring} ring-offset-1`
                        : 'border-stone-200 hover:border-stone-300 shadow-sm'
                      }
                    `}
                  >
                    <span className="text-2xl leading-none">{mood.emoji}</span>
                    <span className={`text-xs font-medium ${selected ? mood.text : 'text-stone-400'}`}>
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* One line */}
          <div className="mb-8">
            <Textarea
              value={entry.whatHappened || ''}
              onChange={e => updateField('whatHappened', e.target.value)}
              placeholder="One thing from today…"
              className="min-h-[80px] resize-none text-base transition-colors placeholder:text-stone-400"
              style={{
                border: 'none',
                borderBottom: '1px solid #c8c2b6',
                borderRadius: 0,
                background: 'transparent',
                outline: 'none',
                boxShadow: 'none',
                caretColor: '#f59e0b',
                color: '#1C1C18',
              }}
              onFocus={e => { e.currentTarget.style.borderBottomColor = '#a89e8e'; }}
              onBlur={e => { e.currentTarget.style.borderBottomColor = '#c8c2b6'; }}
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end items-center">
            {!isSaving && existing && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete Entry"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              </button>
            )}
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="size-4" />
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </motion.div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — Guided mode (default)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <AnimatePresence>
        {showClosingMoment && (
          <ClosingMoment date={selectedDate} line={closingLine} onDone={handleClosingDone} />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-3xl mx-auto px-6 py-8"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="flex items-start justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-light" style={{ fontFamily: 'var(--font-display)', color: '#1C1C18' }}>
              {formatEntryDate(selectedDate)}
            </h1>
            {reflectionMeta && (
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${reflectionMeta.badgeCls}`}>
                {reflectionMeta.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {!isReflection && (
              <>
                <button
                  onClick={() => setShowStartAssist(prev => !prev)}
                  className="p-1.5 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  title="Start Assist"
                >
                  <Zap className="size-5" />
                </button>
                <button
                  onClick={() => setShowBreathing(true)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
                  title="Box Breathing"
                >
                  <Wind className="size-5" />
                </button>
              </>
            )}
            {!isReflection && <ModeSwitcher mode={mode} onChange={handleModeChange} />}
            <button
              onClick={handleCancel}
              className="ml-1 p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors"
              aria-label="Cancel"
            >
              <X className="size-5" />
            </button>
          </div>
        </motion.div>

        {/* ── Core Values (North Star) ──────────────────────────────────────── */}
        {coreValues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
            className="mb-6"
          >
            <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
              Your values: {coreValues.map((v: ReflectionAnchor) => v.text).join(' · ')}
            </p>
          </motion.div>
        )}

        {/* ── Optional Question Exploration ─────────────────────────────────── */}
        {!isReflection && activeQuestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.10 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Explore a question:</span>
              <div className="w-80">
                <Select
                  value={entry.questionId || 'none'}
                  onValueChange={val => updateField('questionId', val === 'none' ? undefined : val)}
                >
                  <SelectTrigger className="h-8 text-sm bg-transparent border-none shadow-none hover:bg-stone-200/50 focus:ring-0 px-2" style={{ color: entry.questionId ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    <SelectValue placeholder="Select a question (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="italic text-stone-500">None</SelectItem>
                    {activeQuestions.map(q => (
                      <SelectItem key={q.id} value={q.id} className="py-2 pr-8">
                        <span className="block truncate max-w-[280px]" title={q.text}>{q.text}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Contextual prompt (year ago > continuity > daily prompt) ────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="mb-8"
        >
          <ContextualPrompt
            prompt={prompt}
            continuityPrompt={continuityPrompt}
            yearAgoEntry={yearAgoEntry}
            previousIntention={previousIntention}
            onViewYearAgo={() => yearAgoEntry && onViewEntry?.(yearAgoEntry.date)}
          />
        </motion.div>

        {/* ── Start Assist Flow ───────────────────────────────────────────── */}
        <AnimatePresence>
          {showStartAssist && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <StartAssist
                taskText={entry.intentionAction || entry.whatHappened || prompt}
                onChange={(metrics: AEEMetrics) => {
                  setEntry(prev => ({ ...prev, ...metrics }));
                  setHasUnsavedChanges(true);
                }}
                onFocusComplete={() => {
                  toast.success('5-Minute Focus Complete');
                  setShowStartAssist(false);
                }}
                onCancel={() => setShowStartAssist(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 3-Week Intention Pivot Hint ────────────────────────────── */}
        {(() => {
          if (initialReflectionType !== 'weekly' || !entry.intentionAction) return null;
          const history = getIntentionHistory(allEntries, selectedDate, 'weekly');
          if (history.length < 2) return null;
          
          const isRepeating = history.every(h => h.trim().toLowerCase() === entry.intentionAction?.trim().toLowerCase());
          if (!isRepeating) return null;

          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 rounded-xl border-2 border-amber-200 bg-amber-50/50 flex items-start gap-3"
            >
              <HelpCircle className="size-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">This intention has been carried for 3 weeks.</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  In the Gita philosophy, if an intention is stuck, it's often a sign that it needs deeper exploration. 
                  Would you like to pivot this into a Persistent Question instead?
                </p>
                <Button 
                   size="sm" 
                   variant="outline" 
                   onClick={() => {
                     questionsStorage.add({ question: entry.intentionAction!, isActive: true, notes: 'Pivoted from weekly intention.' });
                     updateField('intentionAction', '');
                     toast.success('Pivoted to Persistent Question');
                   }}
                   className="mt-3 bg-white border-amber-200 text-amber-800 hover:bg-amber-100"
                >
                  Pivot to Question
                </Button>
              </div>
            </motion.div>
          );
        })()}

        {/* ── Mood & Energy — compact single row, daily entries only ─────── */}
        {!isReflection && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          className="mb-8 flex items-center gap-4"
        >
          {/* Mood — 5 tight emoji buttons */}
          <div className="flex items-center gap-1">
            {moods.map(mood => {
              const selected = entry.mood === mood.value;
              return (
                <button
                  key={mood.value}
                  onClick={() => updateField('mood', selected ? undefined : mood.value)}
                  aria-pressed={selected}
                  aria-label={mood.label}
                  title={mood.label}
                  className={`
                    relative flex items-center gap-1.5 rounded-full transition-all duration-200
                    focus:outline-none
                    ${selected
                      ? `${mood.bg} ${mood.border} border px-2.5 py-1`
                      : 'px-1.5 py-1 hover:bg-stone-200/60'
                    }
                  `}
                >
                  <span className={`leading-none transition-all duration-200 ${selected ? 'text-xl' : 'text-lg'}`}>
                    {mood.emoji}
                  </span>
                  <AnimatePresence>
                    {selected && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`text-xs font-medium overflow-hidden whitespace-nowrap ${mood.text}`}
                      >
                        {mood.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-stone-300 shrink-0" />

          {/* Energy — bars only, no labels */}
          <div className="flex items-end gap-1" role="group" aria-label="Energy level">
            {energyLevels.map(level => {
              const filled = entry.energy !== undefined && level <= entry.energy;
              const isActive = entry.energy === level;
              const barHeight = 8 + level * 4;
              return (
                <button
                  key={level}
                  onClick={() => updateField('energy', isActive ? undefined : level)}
                  aria-label={`Energy level ${level}`}
                  aria-pressed={isActive}
                  className="focus:outline-none"
                >
                  <motion.div
                    animate={{
                      backgroundColor: filled ? '#f59e0b' : '#b8b0a4',
                      opacity: filled ? 1 : 0.5,
                    }}
                    whileHover={{
                      backgroundColor: filled ? '#fbbf24' : '#9a9088',
                      opacity: 0.9,
                    }}
                    transition={{ duration: 0.15 }}
                    className="w-3.5 rounded-sm cursor-pointer"
                    style={{ height: `${barHeight}px` }}
                  />
                </button>
              );
            })}
            {entry.energy !== undefined && (
              <button
                onClick={() => updateField('energy', undefined)}
                className="ml-1 text-xs text-stone-400 hover:text-stone-600 transition-colors self-center leading-none"
                aria-label="Clear energy"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>
        )} {/* end !isReflection mood+energy */}

        {/* ── Inner State — optional, daily + reflection entries ────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.22 }}
          className="mb-8"
        >
          <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-2.5">
            How did your mind feel?
          </p>
          <div className="flex items-center gap-2">
            {(
              [
                { value: 'clear',    label: 'Clear',    desc: 'Purposeful, grounded' },
                { value: 'restless', label: 'Restless', desc: 'Driven, scattered'    },
                { value: 'heavy',    label: 'Heavy',    desc: 'Stuck, depleted'      },
              ] as const
            ).map(state => {
              const selected = entry.innerState === state.value;
              const colours: Record<string, string> = {
                clear:    selected ? 'bg-stone-100 border-stone-400 text-stone-700' : 'border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700',
                restless: selected ? 'bg-amber-50 border-amber-300 text-amber-700'      : 'border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700',
                heavy:    selected ? 'bg-stone-200 border-stone-400 text-stone-700'     : 'border-stone-300 text-stone-500 hover:border-stone-400 hover:text-stone-700',
              };
              return (
                <button
                  key={state.value}
                  onClick={() => updateField('innerState', selected ? undefined : state.value)}
                  aria-pressed={selected}
                  title={state.desc}
                  className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 focus:outline-none ${colours[state.value]}`}
                >
                  {state.label}
                </button>
              );
            })}
          </div>
        </motion.div>
        {(() => {
          const fields = reflectionMeta?.fields ?? [
            { key: 'whatHappened', label: 'What happened today?',       placeholder: 'No pressure. Just what comes to mind…' },
            { key: 'feelings',     label: 'How did it make you feel?',  placeholder: 'All feelings are welcome here…' },
            { key: 'whatMatters',  label: 'What mattered most?',        placeholder: 'What stood out or resonated…' },
            { key: 'insight',      label: 'One insight or lesson',      placeholder: 'Something you learned or noticed…' },
            { key: 'freeWrite',    label: 'Anything else?',                 placeholder: 'Anything else on your mind…' },
          ];
          const minHeights: Record<string, string> = {
            freeWrite: 'min-h-[120px]',
            insight:   'min-h-[80px]',
          };

          // Use custom field definitions for reflection types, default for daily
          return (
            <div className="space-y-6">
              {fields.map(({ key, label, placeholder }, index) => {
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                  >
                    <Label htmlFor={key} className="text-sm mb-2 block font-medium" style={{ color: '#5a5550' }}>
                      {label}
                    </Label>
                    <Textarea
                      id={key}
                      value={(entry[key as keyof JournalEntryType] as string) || ''}
                      onChange={e => updateField(key as keyof JournalEntryType, e.target.value)}
                      placeholder={placeholder}
                      className={`${minHeights[key] ?? 'min-h-[100px]'} w-full parchment-input`}
                      style={{
                        borderRadius: 8,
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          );
        })()}

        {/* ── Intention field — reflection entries only ─────────────────────── */}
        {isReflection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mt-8 pt-6 border-t border-stone-200/60"
          >
            {(() => {
              const intentionMeta: Record<string, { label: string; placeholder: string }> = {
                weekly:  { label: 'An intention for next week',      placeholder: 'One thing you want to carry forward or try…' },
                monthly: { label: 'An intention for next month',     placeholder: 'Something you want to explore or lean into…' },
                yearly:  { label: 'An intention for the year ahead', placeholder: 'A direction, a word, a quiet promise to yourself…' },
              };
              const meta = intentionMeta[initialReflectionType] ?? intentionMeta.weekly;
              return (
                <>
                  <Label htmlFor="intention" className="text-sm mb-1 block font-medium" style={{ color: '#5a5550' }}>
                    {meta.label}
                  </Label>
                  <p className="text-xs text-stone-400 mb-3">
                    Not a goal. Not a commitment. Just a direction.
                  </p>
                  <Textarea
                    id="intention"
                    value={(entry.intention as string) || ''}
                    onChange={e => updateField('intention', e.target.value)}
                    placeholder={meta.placeholder}
                    className="min-h-[80px] w-full parchment-input"
                    style={{
                      borderRadius: 8,
                    }}
                  />
                </>
              );
            })()}
          </motion.div>
        )}

        {/* ── One word — reflection entries only ────────────────────────────── */}
        {isReflection && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-6 pt-6 border-t border-stone-200/60"
          >
            {(() => {
              const oneWordMeta: Record<string, { label: string; placeholder: string }> = {
                weekly:  { label: 'A word for how this week felt', placeholder: 'Unsettled. Warm. Alive. Yours.' },
                monthly: { label: 'A word for how this month felt', placeholder: 'Heavy. Hopeful. Shifting. Yours.' },
                yearly:  { label: 'A word for this year',           placeholder: 'Becoming. Surviving. Opening. Yours.' },
              };
              const meta = oneWordMeta[initialReflectionType] ?? oneWordMeta.weekly;
              return (
                <>
                  <Label htmlFor="oneWord" className="text-sm mb-1 block font-medium" style={{ color: '#5a5550' }}>
                    {meta.label}
                  </Label>
                  <p className="text-xs text-stone-400 mb-3">
                    Past-facing. Observational. No right answer.
                  </p>
                  <input
                    id="oneWord"
                    type="text"
                    value={(entry.oneWord as string) || ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\s+.*/, '');
                      updateField('oneWord', val);
                    }}
                    placeholder={meta.placeholder}
                    maxLength={32}
                    className="w-full text-lg font-light placeholder:text-stone-400 outline-none bg-transparent pb-2 transition-colors"
                    style={{
                      border: 'none',
                      borderBottom: '1px solid #c8c2b6',
                      caretColor: '#f59e0b',
                      color: '#1C1C18',
                    }}
                    onFocus={e => { e.currentTarget.style.borderBottomColor = '#a89e8e'; }}
                    onBlur={e => { e.currentTarget.style.borderBottomColor = '#c8c2b6'; }}
                  />
                </>
              );
            })()}
          </motion.div>
        )}

        {/* ── Memory Surface (similar past entries) ────────────────────────── */}
        <AnimatePresence>
          {similarEntries.length > 0 && !memoryDismissed && (
            <MemorySurface
              memory={createMemorySurface(entry.id || '', similarEntries[0])}
              relatedEntry={similarEntries[0]}
              onViewEntry={() => onViewEntry?.(similarEntries[0].date)}
              onDismiss={() => setMemoryDismissed(true)}
            />
          )}
        </AnimatePresence>

        {/* ── Tags ─────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="pt-6 border-t border-stone-200/60 mb-8"
        >
          <Label className="text-sm mb-3 block font-medium" style={{ color: '#5a5550' }}>Tags (optional)</Label>
          <TagManager
            selectedTags={entry.tags || []}
            onChange={(tags) => updateField('tags', tags)}
            allEntries={allEntries}
          />
        </motion.div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex items-center justify-end gap-3"
        >
          {allEntries.length === 0 && (
            <span className="text-xs text-stone-400 italic mr-auto">You can always come back and edit this later.</span>
          )}
          <Button variant="outline" onClick={handleCancel} className="button-secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="button-primary gap-2">
            <Save className="size-4" />
            {isSaving ? 'Saving…' : 'Save Entry'}
          </Button>
        </motion.div>
      </motion.div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The entry will be permanently removed from your journal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false);
                if (onDelete && selectedDate) {
                  onDelete(selectedDate);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BreathingOverlay isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
    </>
  );
}
