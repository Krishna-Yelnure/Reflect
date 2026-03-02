import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Sparkles, Save, X, Zap, BookOpen, Edit3, ChevronLeft } from 'lucide-react';
import type { JournalEntry as JournalEntryType } from '@/app/types';
import { storage } from '@/app/utils/storage';
import { getSmartPrompt } from '@/app/utils/prompts';
import { getReflectionPrompt } from '@/app/utils/prompts-v2';
import { findSimilarEntries, createMemorySurface } from '@/app/utils/memory-surface';
import { preferences } from '@/app/utils/preferences';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { TagManager } from '@/app/components/TagManager';
import { MemorySurface } from '@/app/components/MemorySurface';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type WriteMode = 'quick' | 'guided' | 'deep';
type ReflectionType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface JournalEntryProps {
  selectedDate: string;
  onSave: () => void;
  onCancel: () => void;
  allEntries: JournalEntryType[];
  onViewEntry?: (date: string) => void;
  initialReflectionType?: ReflectionType;   // set by Timeline for weekly/monthly/yearly
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
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    glow: 'shadow-emerald-200/60',
    ring: 'ring-emerald-300',
    text: 'text-emerald-700',
  },
  {
    value: 'okay',
    label: 'Okay',
    emoji: '😐',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    glow: 'shadow-slate-200/60',
    ring: 'ring-slate-300',
    text: 'text-slate-600',
  },
  {
    value: 'low',
    label: 'Low',
    emoji: '😔',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    glow: 'shadow-blue-200/60',
    ring: 'ring-blue-200',
    text: 'text-blue-600',
  },
  {
    value: 'difficult',
    label: 'Difficult',
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
    badgeCls: 'bg-violet-100 text-violet-700',
    fields: [
      { key: 'whatHappened', label: 'What happened this week?',     placeholder: 'The events, moments, conversations…' },
      { key: 'feelings',     label: 'How did the week feel?',       placeholder: 'The emotional texture of the week…' },
      { key: 'whatMatters',  label: 'What mattered most?',          placeholder: "What you'd want to remember…" },
      { key: 'insight',      label: 'What did you learn?',          placeholder: 'A pattern, a realisation, a shift…' },
      { key: 'freeWrite',    label: 'Anything else',                placeholder: 'Whatever needs space…' },
    ],
  },
  monthly: {
    label: 'Monthly reflection',
    badge: 'This month',
    badgeCls: 'bg-sky-100 text-sky-700',
    fields: [
      { key: 'whatHappened', label: 'What defined this month?',     placeholder: 'The chapters, the turning points…' },
      { key: 'feelings',     label: 'What shifted emotionally?',    placeholder: 'How you changed, what softened or hardened…' },
      { key: 'whatMatters',  label: 'What mattered more than expected?', placeholder: 'Surprises in what moved you…' },
      { key: 'insight',      label: 'What do you understand now?',  placeholder: 'What the month taught you…' },
      { key: 'freeWrite',    label: 'What to carry forward',        placeholder: "What you're taking into next month…" },
    ],
  },
  yearly: {
    label: 'Yearly reflection',
    badge: 'This year',
    badgeCls: 'bg-rose-100 text-rose-700',
    fields: [
      { key: 'whatHappened', label: 'What defined this year?',      placeholder: 'The chapters that shaped it…' },
      { key: 'feelings',     label: 'How did you change?',          placeholder: 'Who you were in January vs now…' },
      { key: 'whatMatters',  label: 'What surprised you most?',     placeholder: "What you couldn't have anticipated…" },
      { key: 'insight',      label: 'What belief did you outgrow?', placeholder: "What you understand now that you didn't before…" },
      { key: 'freeWrite',    label: 'What to leave behind',         placeholder: "What you're not taking into next year…" },
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
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
            ${mode === m.id
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }
          `}
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
        className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl"
      >
        <span className="text-lg mt-0.5 flex-shrink-0">💬</span>
        <p className="text-sm text-slate-600 italic leading-relaxed">{continuityPrompt}</p>
      </motion.div>
    );
  }

  if (previousIntention) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-100 rounded-xl"
      >
        <span className="text-lg mt-0.5 flex-shrink-0">🔁</span>
        <p className="text-sm text-violet-800 italic leading-relaxed">{previousIntention}</p>
      </motion.div>
    );
  }

  if (prompt) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2.5 p-4 bg-slate-50 border border-slate-100 rounded-xl"
      >
        <Sparkles className="size-4 mt-0.5 flex-shrink-0 text-slate-400" />
        <p className="text-sm text-slate-600 italic leading-relaxed">{prompt}</p>
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
      className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50"
      onClick={onDone}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-center space-y-4 px-8"
      >
        <p className="text-slate-400 text-sm tracking-widest uppercase font-medium">
          {formatEntryDate(date)}
        </p>
        <p className="text-2xl text-slate-700 font-light" style={{ fontFamily: 'var(--font-display)' }}>{line}</p>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 1.8, ease: 'easeInOut' }}
          className="h-px w-24 bg-slate-200 mx-auto origin-left"
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
  allEntries,
  onViewEntry,
  initialReflectionType = 'daily',
}: JournalEntryProps) {
  const [mode, setMode] = useState<WriteMode>('guided');
  const [entry, setEntry] = useState<Partial<JournalEntryType>>({
    whatHappened: '',
    feelings: '',
    whatMatters: '',
    insight: '',
    freeWrite: '',
    mood: undefined,
    energy: undefined,
    tags: [],
    reflectionType: initialReflectionType,
    oneWord: '',
  });
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showClosingMoment, setShowClosingMoment] = useState(false);
  const [closingLine, setClosingLine] = useState('');
  const [similarEntries, setSimilarEntries] = useState<JournalEntryType[]>([]);
  const [memoryDismissed, setMemoryDismissed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const prefs = preferences.get();

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
    const existing = storage.getEntryByDate(selectedDate);
    if (existing) {
      setEntry(existing);
      setMode('guided');
    } else {
      setEntry({
        whatHappened: '',
        feelings: '',
        whatMatters: '',
        insight: '',
        freeWrite: '',
        mood: undefined,
        energy: undefined,
        tags: [],
        reflectionType: initialReflectionType,
        oneWord: '',
      });
      // Set prompt based on reflection type
      if (isReflection) {
        setPrompt(getReflectionPrompt(initialReflectionType as 'weekly' | 'monthly' | 'yearly'));
      } else {
        setPrompt(getSmartPrompt());
      }
      setMemoryDismissed(false);
      setHasUnsavedChanges(false);
    }
  }, [selectedDate, initialReflectionType]);

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

  const updateField = useCallback((field: keyof JournalEntryType, value: unknown) => {
    setEntry(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

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

    const existing = storage.getEntryByDate(selectedDate);

    if (existing) {
      storage.updateEntry(existing.id, entry);
    } else {
      const newEntry: JournalEntryType = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: selectedDate,
        ...(entry as JournalEntryType),
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
          className="fixed inset-0 bg-white z-40 flex flex-col"
        >
          {/* Deep mode toolbar */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-100">
            <button
              onClick={() => handleModeChange('guided')}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft className="size-4" />
              Back to Guided
            </button>
            <p className="text-sm text-slate-400">
              {formatEntryDate(selectedDate)}
            </p>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-1.5">
              <Save className="size-3.5" />
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
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
                className="w-full text-2xl font-light text-slate-700 placeholder:text-slate-300 border-none outline-none bg-transparent mb-8"
                style={{ fontFamily: 'var(--font-display)' }}
              />
              <textarea
                value={entry.freeWrite || ''}
                onChange={e => updateField('freeWrite', e.target.value)}
                placeholder="Write freely. No prompts, no fields. Just you and the page."
                className="w-full text-base leading-[2] text-slate-700 placeholder:text-slate-300 border-none outline-none bg-transparent resize-none"
                style={{ minHeight: '60vh', caretColor: '#f59e0b' }}
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
                  className="text-xs text-slate-300 tabular-nums"
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
              <h1 className="text-2xl font-light text-slate-700" style={{ fontFamily: 'var(--font-display)' }}>
                {formatEntryDate(selectedDate)}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">Quick capture</p>
            </div>
            <div className="flex items-center gap-2">
              <ModeSwitcher mode={mode} onChange={handleModeChange} />
              <button onClick={handleCancel} className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Mood */}
          <div className="mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-3">How are you?</p>
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
                        : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                      }
                    `}
                  >
                    <span className="text-2xl leading-none">{mood.emoji}</span>
                    <span className={`text-xs font-medium ${selected ? mood.text : 'text-slate-400'}`}>
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
              className="min-h-[80px] resize-none border-slate-200 focus:border-slate-400 text-base"
              autoFocus
            />
          </div>

          <div className="flex gap-3 justify-end">
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
            <h1 className="text-3xl font-light text-slate-800" style={{ fontFamily: 'var(--font-display)' }}>
              {formatEntryDate(selectedDate)}
            </h1>
            {reflectionMeta && (
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${reflectionMeta.badgeCls}`}>
                {reflectionMeta.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {!isReflection && <ModeSwitcher mode={mode} onChange={handleModeChange} />}
            <button
              onClick={handleCancel}
              className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cancel"
            >
              <X className="size-5" />
            </button>
          </div>
        </motion.div>

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

        {/* ── Mood & Energy — daily entries only ──────────────────────────── */}
        {!isReflection && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18 }}
          className="mb-8 space-y-8"
        >
          {/* Mood */}
          <div>
            <Label className="text-xs text-slate-400 mb-4 block tracking-widest uppercase font-medium">
              How are you feeling?
            </Label>
            <div className="flex gap-3 flex-wrap">
              {moods.map(mood => {
                const selected = entry.mood === mood.value;
                return (
                  <button
                    key={mood.value}
                    onClick={() => updateField('mood', selected ? undefined : mood.value)}
                    className={`
                      relative flex flex-col items-center gap-1.5 px-4 pt-4 pb-3
                      rounded-2xl border-2 transition-all duration-200 cursor-pointer
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                      ${selected
                        ? `${mood.bg} ${mood.border} shadow-lg ${mood.glow} scale-105 ring-2 ${mood.ring} ring-offset-1`
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm hover:shadow'
                      }
                    `}
                    aria-pressed={selected}
                    aria-label={mood.label}
                  >
                    <span
                      className={`text-3xl leading-none transition-transform duration-200 ${selected ? 'scale-110' : ''}`}
                      role="img"
                      aria-hidden="true"
                    >
                      {mood.emoji}
                    </span>
                    <span className={`text-xs font-medium transition-colors ${selected ? mood.text : 'text-slate-400'}`}>
                      {mood.label}
                    </span>
                    {selected && (
                      <motion.span
                        layoutId="mood-indicator"
                        className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${mood.border.replace('border-', 'bg-')}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy */}
          <div>
            <Label className="text-xs text-slate-400 mb-4 block tracking-widest uppercase font-medium">
              Energy level
            </Label>
            <div className="flex items-end gap-2" role="group" aria-label="Energy level">
              {energyLevels.map(level => {
                const selected = entry.energy !== undefined && level <= entry.energy;
                const isActive = entry.energy === level;
                const barHeight = 12 + level * 6;
                return (
                  <button
                    key={level}
                    onClick={() => updateField('energy', isActive ? undefined : level)}
                    aria-label={`Energy level ${level}`}
                    aria-pressed={isActive}
                    className="group flex flex-col items-center gap-2 focus:outline-none"
                  >
                    <motion.div
                      animate={{
                        backgroundColor: selected ? '#f59e0b' : '#e2e8f0',
                        opacity: selected ? 1 : 0.5,
                      }}
                      whileHover={{
                        backgroundColor: selected ? '#fbbf24' : '#cbd5e1',
                        opacity: 0.85,
                      }}
                      transition={{ duration: 0.15 }}
                      className="rounded-sm w-7 cursor-pointer"
                      style={{ height: `${barHeight}px` }}
                    />
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-amber-500 font-semibold"
                      >
                        {level}
                      </motion.span>
                    )}
                    {!isActive && (
                      <span className="text-xs text-transparent group-hover:text-slate-300 transition-colors select-none">
                        {level}
                      </span>
                    )}
                  </button>
                );
              })}
              {entry.energy !== undefined && (
                <button
                  onClick={() => updateField('energy', undefined)}
                  className="ml-2 text-xs text-slate-300 hover:text-slate-400 transition-colors self-center"
                  aria-label="Clear energy"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </motion.div>
        )} {/* end !isReflection mood+energy */}

        {/* ── Writing fields — reflection-aware ────────────────────────────── */}
        {(() => {
          const fields = reflectionMeta?.fields ?? [
            { key: 'whatHappened', label: 'What happened today?',       placeholder: 'No pressure. Just what comes to mind…' },
            { key: 'feelings',     label: 'How did it make you feel?',  placeholder: 'All feelings are welcome here…' },
            { key: 'whatMatters',  label: 'What mattered most?',        placeholder: 'What stood out or resonated…' },
            { key: 'insight',      label: 'One insight or lesson',      placeholder: 'Something you learned or noticed…' },
            { key: 'freeWrite',    label: 'Free write',                 placeholder: 'Anything else on your mind…' },
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
                    <Label htmlFor={key} className="text-sm text-slate-500 mb-2 block">
                      {label}
                    </Label>
                    <Textarea
                      id={key}
                      value={(entry[key as keyof JournalEntryType] as string) || ''}
                      onChange={e => updateField(key as keyof JournalEntryType, e.target.value)}
                      placeholder={placeholder}
                      className={`${minHeights[key] ?? 'min-h-[100px]'} resize-none border-slate-200 focus:border-slate-400 transition-colors`}
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
            className="mt-8 pt-6 border-t border-slate-100"
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
                  <Label htmlFor="intention" className="text-sm text-slate-500 mb-1 block">
                    {meta.label}
                  </Label>
                  <p className="text-xs text-slate-400 mb-3">
                    Not a goal. Not a commitment. Just a direction.
                  </p>
                  <Textarea
                    id="intention"
                    value={(entry.intention as string) || ''}
                    onChange={e => updateField('intention', e.target.value)}
                    placeholder={meta.placeholder}
                    className="min-h-[80px] resize-none border-slate-200 focus:border-slate-400"
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
            className="mt-6 pt-6 border-t border-slate-100"
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
                  <Label htmlFor="oneWord" className="text-sm text-slate-500 mb-1 block">
                    {meta.label}
                  </Label>
                  <p className="text-xs text-slate-400 mb-3">
                    Past-facing. Observational. No right answer.
                  </p>
                  <input
                    id="oneWord"
                    type="text"
                    value={(entry.oneWord as string) || ''}
                    onChange={e => {
                      // Only allow a single word — strip spaces after first word
                      const val = e.target.value.replace(/\s+.*/, '');
                      updateField('oneWord', val);
                    }}
                    placeholder={meta.placeholder}
                    maxLength={32}
                    className="w-full text-lg font-light text-slate-700 placeholder:text-slate-300 border-b border-slate-200 focus:border-slate-400 outline-none bg-transparent pb-2 transition-colors"
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
          className="pt-6 border-t border-slate-100 mb-8"
        >
          <Label className="text-sm text-slate-500 mb-3 block">Tags (optional)</Label>
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
          className="flex gap-3 justify-end"
        >
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="size-4" />
            {isSaving ? 'Saving…' : 'Save Entry'}
          </Button>
        </motion.div>
      </motion.div>
    </>
  );
}
