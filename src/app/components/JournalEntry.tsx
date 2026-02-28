import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import { Sparkles, Save, X, Zap, BookOpen, Edit3, ChevronLeft } from 'lucide-react';
import type { JournalEntry as JournalEntryType } from '@/app/types';
import { storage } from '@/app/utils/storage';
import { getSmartPrompt } from '@/app/utils/prompts';
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

interface JournalEntryProps {
  selectedDate: string;
  onSave: () => void;
  onCancel: () => void;
  allEntries: JournalEntryType[];
  onViewEntry?: (date: string) => void;
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

// Closing moment lines — quiet, human, not celebratory
const closingLines = [
  'Another day, held.',
  'The witness remembers.',
  'This moment, kept.',
  'Something true, written.',
  'You showed up.',
  'The page holds it now.',
  'A thread in the story.',
  'Quietly remembered.',
  'Written. Kept. Yours.',
  'Today is part of the record.',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getClosingLine(): string {
  return closingLines[Math.floor(Math.random() * closingLines.length)];
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  onViewYearAgo,
}: {
  prompt: string;
  continuityPrompt: string | null;
  yearAgoEntry: JournalEntryType | null;
  onViewYearAgo: () => void;
}) {
  // Priority: year-ago memory > continuity > daily prompt
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
          {format(new Date(date + 'T12:00:00'), 'EEEE, MMMM d')}
        </p>
        <p className="text-2xl text-slate-700 font-light">{line}</p>
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
    reflectionType: 'daily',
  });
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showClosingMoment, setShowClosingMoment] = useState(false);
  const [closingLine, setClosingLine] = useState('');
  const [similarEntries, setSimilarEntries] = useState<JournalEntryType[]>([]);
  const [memoryDismissed, setMemoryDismissed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const prefs = preferences.get();

  // ── Contextual prompts ─────────────────────────────────────────────────────

  const continuityPrompt = getContinuityPrompt(allEntries, selectedDate);
  const yearAgoEntry = getOneYearAgoEntry(allEntries, selectedDate);

  // ── Load existing entry ────────────────────────────────────────────────────

  useEffect(() => {
    const existing = storage.getEntryByDate(selectedDate);
    if (existing) {
      setEntry(existing);
      setMode('guided'); // always start in guided for edits
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
        reflectionType: 'daily',
      });
      setPrompt(getSmartPrompt());
      setMemoryDismissed(false);
      setHasUnsavedChanges(false);
    }
  }, [selectedDate]);

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
      setClosingLine(getClosingLine());
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
              {format(new Date(selectedDate + 'T12:00:00'), 'MMMM d, yyyy')}
            </p>
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-1.5">
              <Save className="size-3.5" />
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>

          {/* Deep mode canvas */}
          <div className="flex-1 overflow-auto px-8 py-10 max-w-3xl mx-auto w-full">
            <input
              type="text"
              value={entry.whatMatters || ''}
              onChange={e => updateField('whatMatters', e.target.value)}
              placeholder="A title, if you want one…"
              className="w-full text-2xl font-light text-slate-700 placeholder:text-slate-300 border-none outline-none bg-transparent mb-8"
            />
            <textarea
              value={entry.freeWrite || ''}
              onChange={e => updateField('freeWrite', e.target.value)}
              placeholder="Write freely. No prompts, no fields. Just you and the page."
              className="w-full min-h-[60vh] text-base leading-loose text-slate-700 placeholder:text-slate-300 border-none outline-none bg-transparent resize-none"
              autoFocus
            />
          </div>
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
              <h1 className="text-2xl font-light text-slate-700">
                {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d')}
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-3xl mx-auto px-6 py-8"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light text-slate-800">
              {format(new Date(selectedDate + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <ModeSwitcher mode={mode} onChange={handleModeChange} />
            <button
              onClick={handleCancel}
              className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Cancel"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* ── Contextual prompt (year ago > continuity > daily prompt) ────── */}
        <div className="mb-8">
          <ContextualPrompt
            prompt={prompt}
            continuityPrompt={continuityPrompt}
            yearAgoEntry={yearAgoEntry}
            onViewYearAgo={() => yearAgoEntry && onViewEntry?.(yearAgoEntry.date)}
          />
        </div>

        {/* ── Mood & Energy ────────────────────────────────────────────────── */}
        <div className="mb-8 space-y-8">
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
        </div>

        {/* ── Writing fields ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div>
            <Label htmlFor="whatHappened" className="text-sm text-slate-500 mb-2 block">
              What happened today?
            </Label>
            <Textarea
              id="whatHappened"
              value={entry.whatHappened || ''}
              onChange={e => updateField('whatHappened', e.target.value)}
              placeholder="No pressure. Just what comes to mind…"
              className="min-h-[100px] resize-none border-slate-200 focus:border-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="feelings" className="text-sm text-slate-500 mb-2 block">
              How did it make you feel?
            </Label>
            <Textarea
              id="feelings"
              value={entry.feelings || ''}
              onChange={e => updateField('feelings', e.target.value)}
              placeholder="All feelings are welcome here…"
              className="min-h-[100px] resize-none border-slate-200 focus:border-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="whatMatters" className="text-sm text-slate-500 mb-2 block">
              What mattered most?
            </Label>
            <Textarea
              id="whatMatters"
              value={entry.whatMatters || ''}
              onChange={e => updateField('whatMatters', e.target.value)}
              placeholder="What stood out or resonated…"
              className="min-h-[100px] resize-none border-slate-200 focus:border-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="insight" className="text-sm text-slate-500 mb-2 block">
              One insight or lesson
            </Label>
            <Textarea
              id="insight"
              value={entry.insight || ''}
              onChange={e => updateField('insight', e.target.value)}
              placeholder="Something you learned or noticed…"
              className="min-h-[80px] resize-none border-slate-200 focus:border-slate-400"
            />
          </div>

          <div>
            <Label htmlFor="freeWrite" className="text-sm text-slate-500 mb-2 block">
              Free write
            </Label>
            <Textarea
              id="freeWrite"
              value={entry.freeWrite || ''}
              onChange={e => updateField('freeWrite', e.target.value)}
              placeholder="Anything else on your mind…"
              className="min-h-[120px] resize-none border-slate-200 focus:border-slate-400"
            />
          </div>
        </div>

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
        {/* NOTE: ReflectionModeSelector removed per A4 spec — reflection types
            are accessed via Timeline drill-down in A4b, not from Write. */}
        <div className="pt-6 border-t border-slate-100 mb-8">
          <Label className="text-sm text-slate-500 mb-3 block">Tags (optional)</Label>
          <TagManager
            selectedTags={entry.tags || []}
            onChange={(tags) => updateField('tags', tags)}
            allEntries={allEntries}
          />
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="size-4" />
            {isSaving ? 'Saving…' : 'Save Entry'}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
