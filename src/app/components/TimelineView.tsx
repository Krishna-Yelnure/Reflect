import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  format,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getMonth,
  getYear,
  getDay,
  isToday,
  parseISO,
  isSameMonth,
  getWeek,
} from 'date-fns';
import { ChevronLeft, Edit } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { Button } from '@/app/components/ui/button';
import { getSmartPrompt } from '@/app/utils/prompts';

type ReflectionEntryType = 'weekly' | 'monthly' | 'yearly';

interface TimelineViewProps {
  entries: JournalEntry[];
  onSelectDate: (date: string) => void;
  onEditEntry: (date: string) => void;
  onReflectionEntry: (date: string, type: ReflectionEntryType) => void;
  activeIntention?: { text: string; type: 'weekly' | 'monthly' };
}

// ── Mood colour system ─────────────────────────────────────────────────────
const MOOD_CELL: Record<string, string> = {
  great:     'bg-amber-300',
  good:      'bg-emerald-300',
  okay:      'bg-slate-300',
  low:       'bg-blue-300',
  difficult: 'bg-slate-500',
};
const MOOD_LABEL: Record<string, string> = {
  great: 'Great', good: 'Good', okay: 'Okay', low: 'Low', difficult: 'Difficult',
};
const MOOD_BG: Record<string, string> = {
  great:     'bg-amber-50 border-amber-200',
  good:      'bg-emerald-50 border-emerald-200',
  okay:      'bg-slate-50 border-slate-200',
  low:       'bg-blue-50 border-blue-200',
  difficult: 'bg-slate-100 border-slate-300',
};
const MOOD_TEXT: Record<string, string> = {
  great: 'text-amber-700', good: 'text-emerald-700', okay: 'text-slate-600',
  low: 'text-blue-700', difficult: 'text-slate-700',
};
const MOOD_EMOJI: Record<string, string> = {
  great: '✨', good: '😊', okay: '😐', low: '😔', difficult: '😣',
};

type DrillLevel = 'year' | 'month' | 'week' | 'day';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_LABELS  = ['S','M','T','W','T','F','S'];

// ── Helpers ────────────────────────────────────────────────────────────────
function buildEntryMap(entries: JournalEntry[]): Map<string, JournalEntry> {
  const map = new Map<string, JournalEntry>();
  entries.forEach(e => map.set(e.date, e));
  return map;
}

/** Returns the reflection entry for a given period, if one exists */
function findReflectionEntry(
  entries: JournalEntry[],
  type: ReflectionEntryType,
  periodKey: string   // 'YYYY-MM' for monthly, 'YYYY-MM-DD' (week start) for weekly, 'YYYY' for yearly
): JournalEntry | undefined {
  return entries.find(e => {
    if (e.reflectionType !== type) return false;
    if (type === 'monthly') return e.date === `reflection-monthly-${periodKey}`;
    if (type === 'yearly')  return e.date === `reflection-yearly-${periodKey}`;
    if (type === 'weekly')  return e.date === `reflection-weekly-${periodKey}`;
    return false;
  });
}

/** Small badge shown on month label / week number when a reflection entry exists */
function ReflectionDot({ type }: { type: ReflectionEntryType }) {
  const colours: Record<ReflectionEntryType, string> = {
    weekly:  'bg-violet-400',
    monthly: 'bg-sky-400',
    yearly:  'bg-amber-400',
  };
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ml-1 ${colours[type]} shrink-0 align-middle`}
      title={`${type} reflection written`}
    />
  );
}

function dominantMood(entries: JournalEntry[]): string | null {
  const counts: Record<string, number> = {};
  entries.forEach(e => { if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function summaryLine(entries: JournalEntry[]): string {
  const dailyEntries = entries.filter(e => !e.date.startsWith('reflection-'));
  const total = dailyEntries.length;
  if (total === 0) return '';
  const mood = dominantMood(dailyEntries);
  // Witness-compliant: never surface negative tallies, tender language for hard periods
  const MOOD_PHRASE: Record<string, string> = {
    great:     'A mostly great year so far',
    good:      'A mostly good year so far',
    okay:      'A steady year so far',
    low:       'A tender year so far',
    difficult: 'A tender year so far',
  };
  const moodStr = mood ? ` · ${MOOD_PHRASE[mood]}` : '';
  return `${total} ${total === 1 ? 'entry' : 'entries'}${moodStr}`;
}

/** Returns the day-of-week name the user writes most often — a pure witness observation */
function mostActiveDay(entries: JournalEntry[]): string | null {
  const daily = entries.filter(e => !e.date.startsWith('reflection-'));
  if (daily.length < 4) return null; // not enough data to be meaningful
  const counts: Record<number, number> = {};
  daily.forEach(e => {
    try {
      const dow = getDay(parseISO(e.date)); // 0 = Sun
      counts[dow] = (counts[dow] || 0) + 1;
    } catch { /* skip malformed dates */ }
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!sorted[0]) return null;
  const DAY_NAMES = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
  return DAY_NAMES[Number(sorted[0][0])];
}
export function TimelineView({ entries, onSelectDate, onEditEntry, onReflectionEntry, activeIntention }: TimelineViewProps) {
  const [year, setYear]         = useState(getYear(new Date()));
  const [level, setLevel]       = useState<DrillLevel>('year');
  const [focusMonth, setFocus]  = useState<number>(getMonth(new Date())); // 0-indexed
  const [focusWeek, setFocusW]  = useState<Date>(startOfWeek(new Date()));
  const [focusDay, setFocusDay] = useState<string | null>(null);

  // ── First-run empty state ──────────────────────────────────────────────
  const dailyEntries = useMemo(() => entries.filter(e => !e.date.startsWith('reflection-')), [entries]);
  const hasEntries = dailyEntries.length > 0;
  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => localStorage.getItem('journal_first_visit_dismissed') === 'true'
  );
  const showWelcome = !hasEntries && !welcomeDismissed;

  const handleDismissWelcome = () => {
    localStorage.setItem('journal_first_visit_dismissed', 'true');
    setWelcomeDismissed(true);
  };

  // ── Daily opening prompt ───────────────────────────────────────────────
  const [showDailyPrompt, setShowDailyPrompt] = useState(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const lastShown = localStorage.getItem('last_prompt_shown_date');
    if (lastShown !== today) {
      localStorage.setItem('last_prompt_shown_date', today);
      return true;
    }
    return false;
  });
  const [dailyPrompt] = useState(() => getSmartPrompt(entries));

  useEffect(() => {
    if (!showDailyPrompt) return;
    const timer = setTimeout(() => setShowDailyPrompt(false), 6000);
    return () => clearTimeout(timer);
  }, [showDailyPrompt]);

  const entryMap = useMemo(() => buildEntryMap(entries), [entries]);

  const yearEntries = useMemo(() =>
    entries.filter(e => getYear(parseISO(e.date)) === year),
    [entries, year]
  );

  // ── Breadcrumb nav ─────────────────────────────────────────────────────
  const YearNav = () => (
    <div className="flex items-center gap-1 mb-6 flex-wrap">
      {/* Year */}
      <button
        onClick={() => setLevel('year')}
        className={`text-lg font-medium transition-colors ${
          level === 'year' ? 'text-slate-800 cursor-default' : 'text-slate-400 hover:text-slate-700'
        }`}
      >
        {year}
      </button>

      {/* Month crumb */}
      {(level === 'month' || level === 'week' || level === 'day') && (
        <>
          <span className="text-slate-300 text-lg">/</span>
          <button
            onClick={() => setLevel('month')}
            className={`text-lg font-medium transition-colors ${
              level === 'month' ? 'text-slate-800 cursor-default' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {MONTH_NAMES[focusMonth]}
          </button>
        </>
      )}

      {/* Week crumb */}
      {(level === 'week' || level === 'day') && (
        <>
          <span className="text-slate-300 text-lg">/</span>
          <button
            onClick={() => setLevel('week')}
            className={`text-lg font-medium transition-colors ${
              level === 'week' ? 'text-slate-800 cursor-default' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {(() => {
              const wStart = startOfMonth(new Date(year, focusMonth, 1));
              const weeks  = eachWeekOfInterval({ start: wStart, end: endOfMonth(wStart) });
              const idx    = weeks.findIndex(w => format(w, 'yyyy-MM-dd') === format(focusWeek, 'yyyy-MM-dd'));
              return `Week ${idx >= 0 ? idx + 1 : 1}`;
            })()}
          </button>
        </>
      )}

      {/* Day crumb */}
      {level === 'day' && focusDay && (
        <>
          <span className="text-slate-300 text-lg">/</span>
          <span className="text-lg font-medium text-slate-800">
            {format(parseISO(focusDay), 'EEE d')}
          </span>
        </>
      )}

      {level !== 'day' && (
        <span className="ml-auto text-sm text-slate-400">{(() => {
          if (level === 'year')  return summaryLine(yearEntries);
          if (level === 'month') {
            const mEntries = dailyEntries.filter(e => {
              try { return getMonth(parseISO(e.date)) === focusMonth && getYear(parseISO(e.date)) === year; }
              catch { return false; }
            });
            const total = mEntries.length;
            if (total === 0) return '';
            const mood = dominantMood(mEntries);
            const MOOD_PHRASE: Record<string, string> = {
              great: 'A mostly great month', good: 'A mostly good month',
              okay: 'A steady month', low: 'A tender month', difficult: 'A tender month',
            };
            return `${total} ${total === 1 ? 'entry' : 'entries'}${mood ? ` · ${MOOD_PHRASE[mood]}` : ''}`;
          }
          if (level === 'week') {
            const wEnd = endOfWeek(focusWeek);
            const wEntries = dailyEntries.filter(e => {
              try {
                const d = parseISO(e.date);
                return d >= focusWeek && d <= wEnd;
              } catch { return false; }
            });
            const total = wEntries.length;
            if (total === 0) return '';
            const mood = dominantMood(wEntries);
            const MOOD_PHRASE: Record<string, string> = {
              great: 'Mostly great', good: 'Mostly good',
              okay: 'Steady', low: 'Tender', difficult: 'Tender',
            };
            return `${total} of 7 days · ${mood ? MOOD_PHRASE[mood] : 'Mixed'}`;
          }
          return '';
        })()}</span>
      )}
    </div>
  );

  // ── DAILY HEATMAP — tiny dot per day ──────────────────────────────────
  const DailyHeatmap = () => {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd   = endOfYear(new Date(year, 0, 1));
    const days      = eachDayOfInterval({ start: yearStart, end: yearEnd });

    const months = useMemo(() => {
      return MONTH_NAMES.map((name, mi) => {
        const monthDays = days.filter(d => getMonth(d) === mi);
        const paddingBefore = getDay(monthDays[0]);
        return { name, mi, monthDays, paddingBefore };
      });
    }, [days]);

    return (
      <div>
        <div className="grid grid-cols-6 gap-4">
          {months.map(({ name, mi, monthDays, paddingBefore }) => (
            <div key={mi} className="min-w-0">
              <button
                onClick={() => { setFocus(mi); setLevel('month'); }}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 mb-2 flex items-center transition-colors"
              >
                {name}
                {(() => {
                  const periodKey = `${year}-${String(mi + 1).padStart(2, '0')}`;
                  const hasMonthlyReflection = entries.some(
                    e => e.reflectionType === 'monthly' && e.date === `reflection-monthly-${periodKey}`
                  );
                  return hasMonthlyReflection ? <ReflectionDot type="monthly" /> : null;
                })()}
              </button>
              <div className="grid grid-cols-7 gap-0.5">
                {DAY_LABELS.map((d, i) => (
                  <div key={i} className="text-[8px] text-slate-300 text-center pb-0.5">{d}</div>
                ))}
                {Array(paddingBefore).fill(null).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {monthDays.map(day => {
                  const ds    = format(day, 'yyyy-MM-dd');
                  const entry = entryMap.get(ds);
                  const todayC = isToday(day);
                  return (
                    <motion.button
                      key={ds}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setFocus(mi);
                        setFocusW(startOfWeek(day));
                        if (entry) { setFocusDay(ds); setLevel('day'); }
                        else onSelectDate(ds);
                      }}
                      title={ds}
                      className={`
                        aspect-square rounded-sm transition-all
                        ${entry?.mood
                          ? MOOD_CELL[entry.mood]
                          : entry
                            ? 'bg-slate-200 ring-1 ring-slate-400 ring-offset-[1px] ring-dashed'
                            : 'bg-slate-100 hover:bg-slate-200'
                        }
                        ${todayC && !hasEntries ? 'ring-2 ring-amber-400 ring-offset-1 animate-pulse' : todayC ? 'ring-1 ring-slate-700 ring-offset-1' : ''}
                      `}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <MoodLegend />
      </div>
    );
  };

  // ── WELCOME CARD — first-run empty state ──────────────────────────────
  const WelcomeCard = () => (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl bg-amber-50 border border-amber-100 px-6 py-5 max-w-xl"
    >
      <p className="text-slate-600 leading-relaxed mb-4">
        This is your journal. Every day you write, a dot lights up in the colour of how you felt.
        Over time, this becomes a map of your emotional life.
      </p>
      <div className="flex items-center gap-4">
        <Button
          size="sm"
          className="bg-amber-400 hover:bg-amber-500 text-amber-900 border-0 font-medium"
          onClick={() => onSelectDate(format(new Date(), 'yyyy-MM-dd'))}
        >
          Write today's entry →
        </Button>
        <button
          onClick={handleDismissWelcome}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Got it
        </button>
      </div>
    </motion.div>
  );

  // ── BELOW HEATMAP — daily prompt + most-active-day + intention ────────
  const BelowHeatmap = () => {
    const activeDayStr = mostActiveDay(dailyEntries.filter(e => getYear(parseISO(e.date)) === year));
    const intentionLabel = activeIntention?.type === 'monthly' ? 'This month you intended:' : 'This week you intended:';

    return (
      <div className="mt-8 space-y-5 max-w-xl">
        {/* Daily opening prompt — fades after 6s, once per day */}
        <AnimatePresence>
          {showDailyPrompt && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="text-slate-400 text-sm italic leading-relaxed"
              onClick={() => setShowDailyPrompt(false)}
            >
              {dailyPrompt}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Witness observation — year-scoped, shown after prompt */}
        {activeDayStr && (
          <p className="text-sm text-slate-400">You write most on {activeDayStr}.</p>
        )}

        {/* Active intention — labelled correctly by type */}
        {activeIntention && (
          <div className="text-sm text-slate-500 leading-relaxed">
            <span className="text-slate-400">{intentionLabel}</span>
            <br />
            <span className="text-slate-600 italic">"{activeIntention.text}"</span>
          </div>
        )}
      </div>
    );
  };

  // ── Shared mood legend ─────────────────────────────────────────────────
  const MoodLegend = () => (
    <div className="mt-6 flex items-center gap-4 flex-wrap">
      <span className="text-xs text-slate-400">Mood:</span>
      {Object.entries(MOOD_CELL).map(([mood, cls]) => (
        <div key={mood} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-sm ${cls}`} />
          <span className="text-xs text-slate-500">{MOOD_LABEL[mood]}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200" />
        <span className="text-xs text-slate-400">No entry</span>
      </div>
    </div>
  );

  // ── REFLECTION PANEL — replaces flat banners in Month/Week/Year views ─
  const REFLECTION_PANEL_META: Record<ReflectionEntryType, {
    label: string;
    emptyLabel: string;
    emptyPrompt: string;
    accentBg: string;
    accentBorder: string;
    accentText: string;
    accentButton: string;
    dotCls: string;
  }> = {
    weekly: {
      label:        'Weekly reflection',
      emptyLabel:   'No weekly reflection yet',
      emptyPrompt:  'How did the week unfold? What mattered most?',
      accentBg:     'bg-violet-50',
      accentBorder: 'border-violet-100',
      accentText:   'text-violet-700',
      accentButton: 'text-violet-600 hover:text-violet-800 border-violet-200 hover:border-violet-400',
      dotCls:       'bg-violet-400',
    },
    monthly: {
      label:        'Monthly reflection',
      emptyLabel:   'No monthly reflection yet',
      emptyPrompt:  'What defined this month? What shifted?',
      accentBg:     'bg-sky-50',
      accentBorder: 'border-sky-100',
      accentText:   'text-sky-700',
      accentButton: 'text-sky-600 hover:text-sky-800 border-sky-200 hover:border-sky-400',
      dotCls:       'bg-sky-400',
    },
    yearly: {
      label:        'Yearly reflection',
      emptyLabel:   'No yearly reflection yet',
      emptyPrompt:  'What chapters defined this year? Who did you become?',
      accentBg:     'bg-amber-50',
      accentBorder: 'border-amber-100',
      accentText:   'text-amber-700',
      accentButton: 'text-amber-600 hover:text-amber-800 border-amber-200 hover:border-amber-400',
      dotCls:       'bg-amber-400',
    },
  };

  const ReflectionPanel = ({
    type,
    reflection,
    onWrite,
    onEdit,
  }: {
    type: ReflectionEntryType;
    reflection: JournalEntry | undefined;
    onWrite: () => void;
    onEdit: () => void;
  }) => {
    const meta = REFLECTION_PANEL_META[type];

    const FIELD_LABELS: Record<string, string> = {
      whatHappened: type === 'weekly'  ? 'This week'
                  : type === 'monthly' ? 'This month'
                  : 'This year',
      feelings:     'How it felt',
      whatMatters:  'What mattered most',
      insight:      'What I learned',
      freeWrite:    type === 'weekly'  ? 'Carrying forward'
                  : type === 'monthly' ? 'Carrying forward'
                  : 'Leaving behind',
    };

    if (!reflection) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border px-5 py-4 mb-5 ${meta.accentBg} ${meta.accentBorder}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${meta.accentText}`}>
                {meta.emptyLabel}
              </p>
              <p className="text-sm text-slate-500 italic">{meta.emptyPrompt}</p>
            </div>
            <button
              onClick={onWrite}
              className={`ml-4 shrink-0 text-xs px-3 py-1.5 rounded-lg border transition-colors ${meta.accentButton}`}
            >
              Write →
            </button>
          </div>
        </motion.div>
      );
    }

    // Written state — show full content
    const fields: { key: keyof JournalEntry; label: string }[] = [
      { key: 'whatHappened', label: FIELD_LABELS.whatHappened },
      { key: 'feelings',     label: FIELD_LABELS.feelings },
      { key: 'whatMatters',  label: FIELD_LABELS.whatMatters },
      { key: 'insight',      label: FIELD_LABELS.insight },
      { key: 'freeWrite',    label: FIELD_LABELS.freeWrite },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border px-5 py-4 mb-5 ${meta.accentBg} ${meta.accentBorder}`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotCls}`} />
            <p className={`text-xs font-semibold uppercase tracking-wide ${meta.accentText}`}>
              {meta.label}
            </p>
            {reflection.mood && (
              <span className="text-base leading-none ml-1">{MOOD_EMOJI[reflection.mood]}</span>
            )}
          </div>
          <button
            onClick={onEdit}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${meta.accentButton}`}
          >
            <Edit className="size-3" />
            Edit
          </button>
        </div>

        {/* Intention — prominent at top, shown before content */}
        {(reflection as JournalEntry & { intention?: string }).intention && (
          <div className={`mb-4 pb-3 border-b ${meta.accentBorder}`}>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Intention</p>
            <p className={`text-sm italic font-medium ${meta.accentText} leading-relaxed`}>
              "{(reflection as JournalEntry & { intention?: string }).intention}"
            </p>
          </div>
        )}

        {/* Content fields — below intention */}
        <div className="space-y-3">
          {fields.map(({ key, label }) => {
            const val = reflection[key] as string | undefined;
            if (!val) return null;
            return (
              <div key={String(key)}>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-4">
                  {val}
                </p>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // ── MONTH VIEW ─────────────────────────────────────────────────────────
  const MonthView = () => {
    const mStart = startOfMonth(new Date(year, focusMonth, 1));
    const mEnd   = endOfMonth(mStart);
    const weeks  = eachWeekOfInterval({ start: mStart, end: mEnd });
    const periodKey = format(mStart, 'yyyy-MM');
    const monthlyReflection = findReflectionEntry(entries, 'monthly', periodKey);

    return (
      <div className="space-y-3">
        {/* Monthly reflection panel */}
        <ReflectionPanel
          type="monthly"
          reflection={monthlyReflection}
          onWrite={() => onReflectionEntry(`reflection-monthly-${year}-${String(focusMonth + 1).padStart(2, '0')}`, 'monthly')}
          onEdit={() => onEditEntry(monthlyReflection!.date)}
        />
        {/* Monthly intention — shown above calendar only when written */}
        {(() => {
          const intention = (monthlyReflection as any)?.intention as string | undefined;
          if (!intention) return null;
          return (
            <div className="mb-3 px-1">
              <p className="text-xs text-slate-400 mb-0.5">This month you intended:</p>
              <p className="text-sm text-sky-700 italic">"{intention}"</p>
            </div>
          );
        })()}
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-1">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-xs text-center text-slate-400 font-medium">{d}</div>
          ))}
        </div>

        {weeks.map((weekStart, wi) => {
          const weekEnd    = endOfWeek(weekStart);
          const weekDays   = eachDayOfInterval({ start: weekStart, end: weekEnd });
          const weekEntries = weekDays
            .map(d => entryMap.get(format(d, 'yyyy-MM-dd')))
            .filter(Boolean) as JournalEntry[];

          return (
            <div key={wi} className="relative">
              {/* Week row header — click → drill into week, hold title for reflection */}
              {(() => {
                const weekKey = format(weekStart, 'yyyy-MM-dd');
                const hasWeeklyReflection = entries.some(
                  e => e.reflectionType === 'weekly' && e.date === `reflection-weekly-${weekKey}`
                );
                return (
                  <button
                    onClick={() => { setFocusW(weekStart); setLevel('week'); }}
                    className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-slate-300 hover:text-slate-500 transition-colors"
                    title="View this week"
                  >
                    W{getWeek(weekStart)}
                    {hasWeeklyReflection && <ReflectionDot type="weekly" />}
                  </button>
                );
              })()}

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => {
                  const ds       = format(day, 'yyyy-MM-dd');
                  const entry    = entryMap.get(ds);
                  const inMonth  = isSameMonth(day, mStart);
                  const todayC   = isToday(day);

                  return (
                    <motion.button
                      key={ds}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setFocusW(weekStart);
                        if (entry) { setFocusDay(ds); setLevel('day'); }
                        else onSelectDate(ds);
                      }}
                      className={`
                        aspect-square rounded-lg border transition-all flex flex-col items-center justify-center
                        text-sm relative
                        ${!inMonth ? 'opacity-25' : ''}
                        ${entry?.mood
                          ? `${MOOD_CELL[entry.mood]} border-transparent text-white font-medium`
                          : 'bg-white border-slate-100 hover:border-slate-300 text-slate-700'
                        }
                        ${todayC ? 'ring-2 ring-slate-800 ring-offset-1' : ''}
                      `}
                    >
                      <span>{format(day, 'd')}</span>
                      {entry?.mood && (
                        <span className="text-[10px] leading-none mt-0.5 opacity-80">{MOOD_EMOJI[entry.mood]}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── WEEK VIEW — vertical timeline dots ────────────────────────────────
  const WeekView = () => {
    const wEnd   = endOfWeek(focusWeek);
    const wDays  = eachDayOfInterval({ start: focusWeek, end: wEnd });
    const weekKey = format(focusWeek, 'yyyy-MM-dd');
    const weeklyReflection = findReflectionEntry(entries, 'weekly', weekKey);

    return (
      <div className="max-w-lg">
        {/* Weekly reflection panel */}
        <ReflectionPanel
          type="weekly"
          reflection={weeklyReflection}
          onWrite={() => onReflectionEntry(`reflection-weekly-${format(focusWeek, 'yyyy-MM-dd')}`, 'weekly')}
          onEdit={() => onEditEntry(weeklyReflection!.date)}
        />
        {/* Weekly intention — shown above timeline only when written */}
        {(() => {
          const intention = (weeklyReflection as any)?.intention as string | undefined;
          if (!intention) return null;
          return (
            <div className="mb-4 px-1">
              <p className="text-xs text-slate-400 mb-0.5">This week you intended:</p>
              <p className="text-sm text-violet-700 italic">"{intention}"</p>
            </div>
          );
        })()}

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[22px] top-4 bottom-4 w-px bg-slate-200" />

          <div className="space-y-4">
            {wDays.map((day, i) => {
              const ds    = format(day, 'yyyy-MM-dd');
              const entry = entryMap.get(ds);
              const today = isToday(day);
              const dotCls = entry?.mood ? MOOD_CELL[entry.mood] : today ? 'bg-slate-400' : 'bg-slate-200';

              return (
                <motion.div
                  key={ds}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-4"
                >
                  {/* Dot */}
                  <button
                    onClick={() => {
                      if (entry) { setFocusDay(ds); setLevel('day'); }
                      else onSelectDate(ds);
                    }}
                    className={`
                      w-[10px] h-[10px] rounded-full mt-3 shrink-0 relative z-10 transition-all
                      ${dotCls} ${entry ? 'scale-125 hover:scale-150' : 'hover:bg-slate-300'}
                      ${today ? 'ring-2 ring-slate-600 ring-offset-1' : ''}
                    `}
                    title={ds}
                  />

                  {/* Day content */}
                  <div className={`flex-1 rounded-xl border p-3 transition-all
                    ${entry ? 'bg-white border-slate-200 shadow-sm' : 'bg-transparent border-dashed border-slate-200'}
                  `}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${today ? 'text-slate-900' : 'text-slate-600'}`}>
                        {format(day, 'EEEE')}
                        <span className="font-normal text-slate-400 ml-1.5">{format(day, 'MMM d')}</span>
                      </span>
                      {entry?.mood && (
                        <span className="text-base">{MOOD_EMOJI[entry.mood]}</span>
                      )}
                    </div>

                    {entry ? (
                      <button
                        onClick={() => { setFocusDay(ds); setLevel('day'); }}
                        className="text-sm text-slate-500 text-left line-clamp-2 hover:text-slate-700 transition-colors"
                      >
                        {entry.whatHappened || entry.feelings || entry.freeWrite || 'Entry saved.'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectDate(ds)}
                        className="text-sm text-slate-300 hover:text-slate-400 transition-colors"
                      >
                        {today ? "Write today's entry →" : 'Nothing written.'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── DAY VIEW — full entry read mode ───────────────────────────────────
  const DayView = () => {
    if (!focusDay) return null;
    const entry = entryMap.get(focusDay);

    if (!entry) {
      return (
        <div className="max-w-lg text-center py-16 text-slate-400">
          <p className="mb-4">Nothing written for this day.</p>
          <Button onClick={() => onSelectDate(focusDay)} variant="outline" size="sm">
            Write an entry →
          </Button>
        </div>
      );
    }

    const moodStyle = entry.mood ? MOOD_BG[entry.mood] : 'bg-slate-50 border-slate-200';
    const moodText  = entry.mood ? MOOD_TEXT[entry.mood] : 'text-slate-600';

    const REFLECTION_BADGE: Record<string, { label: string; cls: string }> = {
      weekly:  { label: 'Weekly reflection', cls: 'bg-violet-100 text-violet-700' },
      monthly: { label: 'Monthly reflection', cls: 'bg-sky-100 text-sky-700' },
      yearly:  { label: 'Yearly reflection', cls: 'bg-amber-100 text-amber-700' },
    };
    const badge = entry.reflectionType && entry.reflectionType !== 'daily'
      ? REFLECTION_BADGE[entry.reflectionType]
      : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl space-y-5"
      >
        {/* Reflection type badge */}
        {badge && (
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* Mood + energy bar */}
        {(entry.mood || entry.energy) && (
          <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${moodStyle}`}>
            {entry.mood && (
              <span className={`text-sm font-medium flex items-center gap-2 ${moodText}`}>
                <span className="text-lg">{MOOD_EMOJI[entry.mood]}</span>
                {MOOD_LABEL[entry.mood]}
              </span>
            )}
            {entry.energy && (
              <div className="flex items-end gap-0.5 ml-auto">
                {[1,2,3,4,5].map(l => (
                  <div
                    key={l}
                    className={`w-1.5 rounded-sm transition-all ${l <= entry.energy! ? 'bg-amber-400' : 'bg-slate-200'}`}
                    style={{ height: `${6 + l * 3}px` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {entry.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content sections */}
        {[
          { key: 'whatHappened', label: 'What happened' },
          { key: 'feelings',     label: 'How it felt' },
          { key: 'whatMatters',  label: 'What mattered most' },
          { key: 'insight',      label: 'Insight' },
          { key: 'freeWrite',    label: 'Free write' },
        ].map(({ key, label }) => {
          const val = entry[key as keyof JournalEntry] as string;
          if (!val) return null;
          return (
            <div key={key}>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{val}</p>
            </div>
          );
        })}

        {/* Edit button */}
        <div className="pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditEntry(focusDay)}
            className="gap-2"
          >
            <Edit className="size-3.5" />
            Edit this entry
          </Button>
        </div>
      </motion.div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const currentYear = getYear(new Date());
  const yearsToShow = Array.from({ length: 6 }, (_, i) => currentYear - i); // newest first

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 flex gap-10">

      {/* ── Main heatmap area ── */}
      <div className="flex-1 min-w-0">
        <YearNav />

        <AnimatePresence mode="wait">
          {level === 'year' && (
            <motion.div key="year" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnimatePresence>
                {showWelcome && <WelcomeCard />}
              </AnimatePresence>
              <DailyHeatmap />
              {/* Yearly reflection panel — only shown when written. Empty state lives
                  behind the sidebar '+' button so it never appears uninvited. */}
              {(() => {
                const yearlyReflection = findReflectionEntry(entries, 'yearly', String(year));
                if (!yearlyReflection) return null;
                return (
                  <div className="mt-8 max-w-xl">
                    <ReflectionPanel
                      type="yearly"
                      reflection={yearlyReflection}
                      onWrite={() => onReflectionEntry(`reflection-yearly-${year}`, 'yearly')}
                      onEdit={() => onEditEntry(yearlyReflection.date)}
                    />
                  </div>
                );
              })()}
              <BelowHeatmap />
            </motion.div>
          )}
          {level === 'month' && (
            <motion.div key="month" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <MonthView />
            </motion.div>
          )}
          {level === 'week' && (
            <motion.div key="week" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <WeekView />
            </motion.div>
          )}
          {level === 'day' && (
            <motion.div key="day" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <DayView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Dynamic right sidebar — content changes per drill level ── */}
      <div className="flex flex-col gap-1 pt-1 shrink-0 min-w-[72px]">

        {/* YEAR level — show year list */}
        {level === 'year' && yearsToShow.map(y => {
          const yEntries = entries.filter(e => {
            try { return getYear(parseISO(e.date)) === y; } catch { return false; }
          });
          const mood = dominantMood(yEntries);
          const isActive = y === year;
          const yearlyReflection = findReflectionEntry(entries, 'yearly', String(y));
          return (
            <div key={y} className="group relative">
              <button
                onClick={() => { setYear(y); setLevel('year'); }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left w-full
                  ${isActive ? 'bg-slate-900 text-white font-medium' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}
                `}
              >
                <span>{y}</span>
                {yearlyReflection && !isActive && <ReflectionDot type="yearly" />}
                {mood && !isActive && !yearlyReflection && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${MOOD_CELL[mood]}`} title={MOOD_LABEL[mood]} />
                )}
              </button>
              <button
                onClick={() => onReflectionEntry(
                  yearlyReflection ? yearlyReflection.date : `reflection-yearly-${y}`, 'yearly'
                )}
                title={yearlyReflection ? 'Edit yearly reflection' : 'Write yearly reflection'}
                className={`
                  absolute right-1 top-1/2 -translate-y-1/2 text-[10px] opacity-0 group-hover:opacity-100
                  transition-opacity px-1.5 py-0.5 rounded
                  ${yearlyReflection ? 'text-amber-500 hover:text-amber-700' : 'text-slate-400 hover:text-slate-600'}
                `}
              >
                {yearlyReflection ? '✎' : '+'}
              </button>
            </div>
          );
        })}

        {/* MONTH level — show Jan–Dec for the active year */}
        {level === 'month' && MONTH_NAMES.map((name, mi) => {
          const mEntries = dailyEntries.filter(e => {
            try { return getMonth(parseISO(e.date)) === mi && getYear(parseISO(e.date)) === year; }
            catch { return false; }
          });
          const mood = dominantMood(mEntries);
          const isActive = mi === focusMonth;
          const hasReflection = entries.some(
            e => e.reflectionType === 'monthly' && e.date === `reflection-monthly-${year}-${String(mi + 1).padStart(2, '0')}`
          );
          return (
            <button
              key={mi}
              onClick={() => { setFocus(mi); setLevel('month'); }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left
                ${isActive ? 'bg-slate-900 text-white font-medium' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}
              `}
            >
              <span>{name}</span>
              {hasReflection && !isActive && <ReflectionDot type="monthly" />}
              {mood && !isActive && !hasReflection && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${MOOD_CELL[mood]}`} title={MOOD_LABEL[mood]} />
              )}
            </button>
          );
        })}

        {/* WEEK level — show 7 days of the focused week */}
        {level === 'week' && (() => {
          const wEnd  = endOfWeek(focusWeek);
          const wDays = eachDayOfInterval({ start: focusWeek, end: wEnd });
          return wDays.map(day => {
            const ds    = format(day, 'yyyy-MM-dd');
            const entry = entryMap.get(ds);
            const today = isToday(day);
            const isActive = focusDay === ds && level === 'week'; // highlight focused day
            return (
              <button
                key={ds}
                onClick={() => {
                  if (entry) { setFocusDay(ds); setLevel('day'); }
                  else onSelectDate(ds);
                }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left
                  ${today ? 'bg-slate-900 text-white font-medium' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}
                `}
              >
                <span className="w-7 shrink-0">{format(day, 'EEE')}</span>
                {entry?.mood
                  ? <span className={`w-2 h-2 rounded-full shrink-0 ${MOOD_CELL[entry.mood]}`} />
                  : entry
                    ? <span className="w-2 h-2 rounded-full shrink-0 bg-slate-400 ring-1 ring-slate-500 ring-dashed" />
                    : null
                }
              </button>
            );
          });
        })()}

        {/* DAY level — show the 7 days of that week for navigation */}
        {level === 'day' && (() => {
          const wEnd  = endOfWeek(focusWeek);
          const wDays = eachDayOfInterval({ start: focusWeek, end: wEnd });
          return wDays.map(day => {
            const ds    = format(day, 'yyyy-MM-dd');
            const entry = entryMap.get(ds);
            const today = isToday(day);
            const isCurrentDay = focusDay === ds;
            return (
              <button
                key={ds}
                onClick={() => {
                  if (entry) { setFocusDay(ds); setLevel('day'); }
                  else onSelectDate(ds);
                }}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left
                  ${isCurrentDay ? 'bg-slate-900 text-white font-medium' : today ? 'text-slate-700 bg-slate-100' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}
                `}
              >
                <span className="w-7 shrink-0">{format(day, 'EEE')}</span>
                {entry?.mood
                  ? <span className={`w-2 h-2 rounded-full shrink-0 ${MOOD_CELL[entry.mood]}`} />
                  : entry
                    ? <span className="w-2 h-2 rounded-full shrink-0 bg-slate-400 ring-1 ring-slate-500 ring-dashed" />
                    : null
                }
              </button>
            );
          });
        })()}

      </div>

    </div>
  );
}
