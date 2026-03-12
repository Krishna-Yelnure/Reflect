import { useState, useMemo, useEffect, useRef } from 'react';
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
import type { JournalEntry, Era } from '@/app/types';
import { Button } from '@/app/components/ui/button';
import { erasStorage } from '@/app/utils/eras';
import { getSmartPrompt } from '@/app/utils/prompts';
import { getGitaDailyPrompt } from '@/app/utils/prompts-v2';

type ReflectionEntryType = 'weekly' | 'monthly' | 'yearly';

interface TimelineViewProps {
  entries: JournalEntry[];
  onSelectDate: (date: string) => void;
  onEditEntry: (date: string) => void;
  onReflectionEntry: (date: string, type: ReflectionEntryType) => void;
  activeIntention?: { text: string; type: 'weekly' | 'monthly' };
}

// ── Mood colour system ─────────────────────────────────────────────────────
// Decision 3 (agreed): faint dot colours deepened so they're visible on parchment.
// okay: slate-300 → slate-400 (was ghostly), difficult: slate-400 → slate-500
// Decision 3 (agreed): faint dot colours deepened so they're visible on parchment.
const MOOD_CELL: Record<string, string> = {
  great:     'bg-amber-400',
  good:      'bg-stone-400',
  okay:      'bg-stone-300',
  low:       'bg-stone-400',
  difficult: 'bg-stone-500',
};
// Inline styles for mood cells that need exact warm palette colors
const MOOD_CELL_STYLE: Record<string, string> = {
  great:     '#C4762A',
  good:      '#6A9B62',
  okay:      '#8A9BAA',
  low:       '#8A8078',
  difficult: '#6B5C4E',
};
const MOOD_LABEL: Record<string, string> = {
  great: 'Great', good: 'Good', okay: 'Okay', low: 'Low', difficult: 'Hard',
};
const MOOD_BG: Record<string, string> = {
  great:     'bg-amber-50 border-amber-200',
  good:      'bg-stone-50 border-stone-200',
  okay:      'bg-stone-50 border-stone-200',
  low:       'bg-stone-100 border-stone-200',
  difficult: 'bg-stone-100 border-stone-300',
};
const MOOD_TEXT: Record<string, string> = {
  great: 'text-amber-700', good: 'text-stone-600', okay: 'text-stone-500',
  low: 'text-stone-500', difficult: 'text-stone-600',
};
const MOOD_EMOJI: Record<string, string> = {
  great: '✨', good: '🌿', okay: '○', low: '◌', difficult: '·',
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
    weekly:  'bg-amber-500',
    monthly: 'bg-stone-400',
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
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [activeEraFilter, setActiveEraFilter] = useState<string | null>(null);
  const [eras, setEras] = useState<Era[]>([]);

  useEffect(() => {
    setEras(erasStorage.getAll());
  }, []);

  const activeErasThisYear = useMemo(() => {
    const ys = startOfYear(new Date(year, 0, 1)).getTime();
    const ye = endOfYear(new Date(year, 0, 1)).getTime();
    return eras.filter(era => {
      if (!era.startDate) return false;
      const st = parseISO(era.startDate).getTime();
      const en = era.endDate ? parseISO(era.endDate).getTime() : Infinity;
      return st <= ye && en >= ys;
    });
  }, [eras, year]);

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
  // Combined daily prompt pool — existing smart prompts + Gita-informed prompts (A8a)
  // 50/50 split gives both pools equal rotation weight without changing the once-per-day gate
  const [dailyPrompt] = useState(() =>
    Math.random() < 0.5 ? getSmartPrompt(entries) : getGitaDailyPrompt()
  );

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

  // ── Active Era per Drill-down Context ──────────────────────────────────
  const activeFocusDay = useMemo(() => {
    if (level === 'day' && focusDay) return parseISO(focusDay);
    if (level === 'week') return focusWeek;
    if (level === 'month') return new Date(year, focusMonth, 1);
    return null;
  }, [level, focusDay, focusWeek, year, focusMonth]);

  const activeFocusEra = useMemo(() => {
    if (!activeFocusDay) return null;
    const t = activeFocusDay.getTime();
    return eras.find(era => {
      if (!era.startDate) return false;
      const st = parseISO(era.startDate).getTime();
      const en = era.endDate ? parseISO(era.endDate).getTime() : Infinity;
      return t >= st && t <= en;
    });
  }, [activeFocusDay, eras]);

  // ── Breadcrumb nav ─────────────────────────────────────────────────────
  const YearNav = () => (
    <div className="flex items-center gap-1.5 mb-8 flex-wrap">
      {/* Year */}
      <button
        onClick={() => setLevel('year')}
        className={`transition-colors leading-none ${
          level === 'year'
            ? 'cursor-default text-2xl font-light'
            : 'text-stone-400 hover:text-stone-700 text-xl'
        }`}
        style={{ fontFamily: 'var(--font-display)', color: level === 'year' ? '#3C3C38' : undefined }}
      >
        {year}
      </button>

      {/* Month crumb */}
      {(level === 'month' || level === 'week' || level === 'day') && (
        <>
          <span className="text-stone-200 text-lg">/</span>
          <button
            onClick={() => setLevel('month')}
            className={`transition-colors leading-none ${
              level === 'month'
                ? 'cursor-default text-2xl font-light'
                : 'text-stone-400 hover:text-stone-700 text-xl'
            }`}
            style={{ fontFamily: 'var(--font-display)', color: level === 'month' ? '#3C3C38' : undefined }}
          >
            {MONTH_NAMES[focusMonth]}
          </button>
        </>
      )}

      {/* Week crumb */}
      {(level === 'week' || level === 'day') && (
        <>
          <span className="text-stone-200 text-lg">/</span>
          <button
            onClick={() => setLevel('week')}
            className={`transition-colors leading-none ${
              level === 'week'
                ? 'cursor-default text-2xl font-light'
                : 'text-stone-400 hover:text-stone-700 text-xl'
            }`}
            style={{ fontFamily: 'var(--font-display)', color: level === 'week' ? '#3C3C38' : undefined }}
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
          <span className="text-stone-200 text-lg">/</span>
          <span
            className="text-2xl font-light leading-none"
            style={{ fontFamily: 'var(--font-display)', color: '#3C3C38' }}
          >
            {format(parseISO(focusDay), 'EEE d')}
          </span>
        </>
      )}

      {/* Chapter Label */}
      {activeFocusEra && level !== 'year' && (
        <span className="ml-3 px-2 py-0.5 mt-0.5 text-[11px] rounded-md font-medium tracking-wide border" 
              style={{ backgroundColor: (activeFocusEra.colour || '#c2714f') + '15', color: '#5a5550', borderColor: (activeFocusEra.colour || '#c2714f') + '25' }}>
          Chapter: {activeFocusEra.name}
        </span>
      )}

      {level !== 'day' && (
        <span className="ml-auto text-xs text-stone-400 tracking-wide">{(() => {
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
        <div className="grid grid-cols-6 gap-5">
          {months.map(({ name, mi, monthDays, paddingBefore }) => (
            <div key={mi} className="min-w-0">
              <button
                onClick={() => { setFocus(mi); setLevel('month'); }}
                className="text-[11px] font-medium text-stone-400 hover:text-stone-600 mb-2 flex items-center gap-0.5 transition-colors tracking-wider uppercase"
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
                  <div key={i} className="text-[7px] text-stone-400 text-center pb-0.5 font-medium">{d}</div>
                ))}
                {Array(paddingBefore).fill(null).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {monthDays.map(day => {
                  const ds    = format(day, 'yyyy-MM-dd');
                  const entry = entryMap.get(ds);
                  const todayC = isToday(day);
                  const tagMatch = !activeTagFilter || (entry?.tags?.includes(activeTagFilter) ?? false);
                  
                  const activeEras = eras.filter(era => {
                    if (!era.startDate) return false;
                    const t = day.getTime();
                    const st = parseISO(era.startDate).getTime();
                    const en = era.endDate ? parseISO(era.endDate).getTime() : Infinity;
                    return t >= st && t <= en;
                  });
                  const activeEra = activeEras[0]; // Primary era
                  const eraMatch = !activeEraFilter || (activeEra?.id === activeEraFilter);
                  
                  return (
                    <div key={ds} className="relative aspect-square overflow-hidden rounded-sm" style={activeEra && eraMatch ? { backgroundColor: activeEra.colour + '33' } : undefined}>
                      <motion.button
                        whileHover={{ scale: 1.4 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => {
                          setFocus(mi);
                          setFocusW(startOfWeek(day));
                          if (entry) { setFocusDay(ds); setLevel('day'); }
                          else onSelectDate(ds);
                        }}
                        title={ds}
                        className={`
                          w-full h-full transition-all flex items-center justify-center
                          ${!entry?.mood
                            ? entry
                              ? 'bg-stone-400 ring-1 ring-stone-500 ring-offset-[1px] ring-dashed rounded-sm'
                              : activeEra
                                ? 'bg-transparent hover:bg-black/10 rounded-sm'
                                : 'bg-stone-300/80 hover:bg-stone-400/60 rounded-sm'
                            : 'rounded-sm'
                          }
                          ${todayC && !hasEntries ? 'ring-2 ring-amber-400 ring-offset-1 animate-pulse z-10 rounded-sm' : todayC ? 'ring-1 ring-stone-500 ring-offset-1 z-10 rounded-sm' : ''}
                          ${(activeTagFilter && !tagMatch) || (activeEraFilter && !eraMatch) ? 'opacity-20' : ''}
                        `}
                        style={entry?.mood ? { backgroundColor: MOOD_CELL_STYLE[entry.mood] } : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <MoodLegend />
        <EraLegend />
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
      className="mb-8 rounded-2xl bg-amber-50 border border-amber-100 px-6 py-6 max-w-xl"
    >
      <p
        className="text-stone-700 text-xl font-light leading-snug mb-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Every day you write, a dot lights up.
      </p>
      <p className="text-stone-500 text-sm leading-relaxed mb-5">
        Over time this becomes a map of your emotional life — colours for how you felt, a record only you can read.
      </p>
      <div className="flex items-center gap-4">
        <Button
          size="sm"
          className="bg-amber-400 hover:bg-amber-500 text-amber-900 border-0 font-medium shadow-none"
          onClick={() => onSelectDate(format(new Date(), 'yyyy-MM-dd'))}
        >
          Write today's entry →
        </Button>
        <button
          onClick={handleDismissWelcome}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
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
      <div className="mt-10 space-y-4 max-w-md">
        {/* Daily opening prompt — fades after 6s, once per day */}
        <AnimatePresence>
          {showDailyPrompt && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-stone-400 text-sm italic leading-relaxed cursor-pointer"
              onClick={() => setShowDailyPrompt(false)}
              style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}
            >
              {dailyPrompt}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Witness observation — quiet, factual, no judgement */}
        {activeDayStr && (
          <p className="text-xs text-stone-400 tracking-wide">You tend to write on {activeDayStr}.</p>
        )}

        {/* Active intention — only shown when there's real content (Decision 5: hide if < 3 chars) */}
        {activeIntention && activeIntention.text.trim().length >= 3 && (
          <div className="pt-1 border-t border-stone-200/60">
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1">{intentionLabel}</p>
            <p
              className="text-stone-500 italic text-sm leading-relaxed"
              style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}
            >
              "{activeIntention.text}"
            </p>
          </div>
        )}
      </div>
    );
  };

  // ── Shared mood legend ─────────────────────────────────────────────────
  const MoodLegend = () => (
    <div className="mt-5 flex items-center gap-3 flex-wrap">
      {/* Decision 3: legend dots enlarged (w-3/h-3) for visibility */}
      {Object.entries(MOOD_CELL).map(([mood, cls]) => (
        <div key={mood} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-sm ${cls}`} />
          <span className="text-[10px] text-stone-500 tracking-wide">{MOOD_LABEL[mood]}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-sm bg-stone-300/80 border border-stone-400/60" />
        <span className="text-[10px] text-stone-500 tracking-wide">No entry</span>
      </div>
    </div>
  );

  // ── Era Legend ─────────────────────────────────────────────────────────
  const EraLegend = () => {
    if (activeErasThisYear.length === 0) return null;
    return (
      <div className="mt-3 flex items-center gap-x-4 gap-y-2 flex-wrap pt-3 border-t border-stone-200/50">
        <span className="text-[10px] text-stone-400 uppercase tracking-widest pl-1">Chapters</span>
        {activeErasThisYear.map(era => (
          <button
            key={era.id}
            onClick={() => setActiveEraFilter(activeEraFilter === era.id ? null : era.id)}
            className={`flex items-center gap-1.5 transition-opacity ${activeEraFilter && activeEraFilter !== era.id ? 'opacity-40' : 'hover:opacity-80'}`}
          >
            <div className="w-5 h-2 rounded-sm" style={{ backgroundColor: (era.colour || '#c2714f') + '40' }} />
            <span className="text-[11px] font-medium" style={{ color: '#5a5550' }}>{era.name}</span>
          </button>
        ))}
      </div>
    );
  };

  // ── TAG & ERA FILTER STRIP ──────────────────────────────────────────────
  const FilterStrip = () => {
    if (!activeTagFilter && !activeEraFilter) return null;
    
    const activeEra = activeEraFilter ? eras.find(e => e.id === activeEraFilter) : null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className="flex items-center gap-2 mb-6 -mt-2"
      >
        <span className="text-[11px] text-stone-400 uppercase tracking-widest">Filtered by</span>
        
        {activeTagFilter && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium"
            style={{ backgroundColor: '#3C3C38', color: '#EDE8DF' }}>
            {activeTagFilter}
            <button
              onClick={() => setActiveTagFilter(null)}
              className="text-stone-400 hover:text-white transition-colors ml-0.5"
              aria-label="Clear tag filter"
            >
              ×
            </button>
          </span>
        )}
        
        {activeEra && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium border"
            style={{ backgroundColor: (activeEra.colour || '#c2714f') + '15', color: '#3C3C38', borderColor: (activeEra.colour || '#c2714f') + '40' }}>
            Chapter: {activeEra.name}
            <button
              onClick={() => setActiveEraFilter(null)}
              className="text-stone-500 hover:text-stone-800 transition-colors ml-0.5"
              aria-label="Clear era filter"
            >
              ×
            </button>
          </span>
        )}

        <button
          onClick={() => { setActiveTagFilter(null); setActiveEraFilter(null); }}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors ml-2"
        >
          clear {activeTagFilter && activeEraFilter ? 'all' : ''}
        </button>
      </motion.div>
    );
  };

  // ── REFLECTION PANEL — replaces flat banners in Month/Week/Year views ─
  const REFLECTION_PANEL_META: Record<ReflectionEntryType, {
    label: string;
    emptyLabel: string;
    emptyPrompt: string;
    accentText: string;
    accentButton: string;
    dotCls: string;
  }> = {
    weekly: {
      label:        'Weekly reflection',
      emptyLabel:   'No weekly reflection yet',
      emptyPrompt:  'How did the week unfold? What mattered most?',
      accentText:   'text-amber-700',
      accentButton: 'text-stone-500 hover:text-stone-700 border-stone-200 hover:border-stone-400',
      dotCls:       'bg-amber-500',
    },
    monthly: {
      label:        'Monthly reflection',
      emptyLabel:   'No monthly reflection yet',
      emptyPrompt:  'What defined this month? What shifted?',
      accentText:   'text-stone-600',
      accentButton: 'text-stone-500 hover:text-stone-700 border-stone-200 hover:border-stone-400',
      dotCls:       'bg-stone-400',
    },
    yearly: {
      label:        'Yearly reflection',
      emptyLabel:   'No yearly reflection yet',
      emptyPrompt:  'What chapters defined this year? Who did you become?',
      accentText:   'text-amber-600',
      accentButton: 'text-stone-500 hover:text-stone-700 border-stone-200 hover:border-stone-400',
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
          className="rounded-2xl px-5 py-4 mb-5"
          style={{
            backgroundColor: 'var(--card)',
            border: '1.5px solid rgba(28,28,24,0.22)',
            boxShadow: '0 2px 8px rgba(28,28,24,0.10)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${meta.accentText}`}>
                {meta.emptyLabel}
              </p>
              <p className="text-sm text-stone-400 italic">{meta.emptyPrompt}</p>
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
        className="rounded-2xl px-5 py-4 mb-5"
        style={{
          backgroundColor: 'var(--card)',
          border: '1.5px solid rgba(28,28,24,0.22)',
          boxShadow: '0 2px 8px rgba(28,28,24,0.10)',
        }}
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
          <div className="mb-4 pb-3 border-b border-stone-200/60">
            <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-1">Intention</p>
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
                <p className="text-[10px] text-stone-400 uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap line-clamp-4">
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

    // Scroll-triggered swap — calendar fades out when reflection sentinel enters viewport
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [reflectionVisible, setReflectionVisible] = useState(false);

    useEffect(() => {
      const el = sentinelRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => setReflectionVisible(entry.isIntersecting),
        { threshold: 0.15 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div className="space-y-3">
        {/* Calendar — fades out when reflection scrolls into view */}
        <motion.div
          animate={{ opacity: reflectionVisible ? 0.15 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-1">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-xs text-center text-stone-400 font-medium">{d}</div>
            ))}
          </div>

          {weeks.map((weekStart, wi) => {
            const weekEnd    = endOfWeek(weekStart);
            const weekDays   = eachDayOfInterval({ start: weekStart, end: weekEnd });
            const weekEntries = weekDays
              .map(d => entryMap.get(format(d, 'yyyy-MM-dd')))
              .filter(Boolean) as JournalEntry[];
            void weekEntries;

            return (
              <div key={wi} className="relative mb-3">
                {/* Week row header — click → drill into week */}
                {(() => {
                  const weekKey = format(weekStart, 'yyyy-MM-dd');
                  const hasWeeklyReflection = entries.some(
                    e => e.reflectionType === 'weekly' && e.date === `reflection-weekly-${weekKey}`
                  );
                  return (
                    <button
                      onClick={() => { setFocusW(weekStart); setLevel('week'); }}
                      className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-stone-400 hover:text-stone-500 transition-colors"
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
                    const tagMatch = !activeTagFilter || (entry?.tags?.includes(activeTagFilter) ?? false);

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
                          aspect-square rounded-lg transition-all flex flex-col items-center justify-center
                          text-sm relative
                          ${!inMonth ? 'opacity-20' : ''}
                          ${entry?.mood
                            ? 'text-stone-800 font-medium'
                            : entry
                              ? 'text-stone-600'
                              : 'text-stone-400 hover:text-stone-500'
                          }
                          ${todayC ? 'ring-2 ring-amber-500 ring-offset-1' : ''}
                          ${activeTagFilter && !tagMatch && inMonth ? 'opacity-20' : ''}
                        `}
                        style={
                          entry?.mood
                            ? {
                                backgroundColor: MOOD_CELL_STYLE[entry.mood] + 'AA',
                                border: '1.5px solid rgba(28,28,24,0.18)',
                                boxShadow: '0 1px 4px rgba(28,28,24,0.10)',
                              }
                            : entry
                              ? {
                                  backgroundColor: 'var(--card)',
                                  border: '1.5px solid rgba(28,28,24,0.20)',
                                  boxShadow: '0 1px 4px rgba(28,28,24,0.10)',
                                }
                              : {
                                  backgroundColor: 'var(--card)',
                                  border: '1px solid rgba(28,28,24,0.12)',
                                  opacity: 0.5,
                                }
                        }
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
        </motion.div>

        {/* Sentinel — reflection panel fades in as it enters viewport */}
        <div ref={sentinelRef} className="mt-6">
          <motion.div
            animate={{ opacity: reflectionVisible ? 1 : 0, y: reflectionVisible ? 0 : 12 }}
            transition={{ duration: 0.5 }}
          >
            <ReflectionPanel
              type="monthly"
              reflection={monthlyReflection}
              onWrite={() => onReflectionEntry(`reflection-monthly-${year}-${String(focusMonth + 1).padStart(2, '0')}`, 'monthly')}
              onEdit={() => onEditEntry(monthlyReflection!.date)}
            />
          </motion.div>
        </div>
      </div>
    );
  };

  // ── WEEK VIEW — vertical timeline dots ────────────────────────────────
  const WeekView = () => {
    const wEnd   = endOfWeek(focusWeek);
    const wDays  = eachDayOfInterval({ start: focusWeek, end: wEnd });
    const weekKey = format(focusWeek, 'yyyy-MM-dd');
    const weeklyReflection = findReflectionEntry(entries, 'weekly', weekKey);

    // Scroll-triggered swap — timeline fades out when reflection sentinel enters viewport
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [reflectionVisible, setReflectionVisible] = useState(false);

    useEffect(() => {
      const el = sentinelRef.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => setReflectionVisible(entry.isIntersecting),
        { threshold: 0.15 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    return (
      <div className="max-w-lg">
        {/* Timeline — fades out when reflection scrolls into view */}
        <motion.div
          className="relative"
          animate={{ opacity: reflectionVisible ? 0.15 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Vertical line */}
          <div className="absolute left-[22px] top-4 bottom-4 w-px bg-stone-200" />

          <div className="space-y-4">
            {wDays.map((day, i) => {
              const ds    = format(day, 'yyyy-MM-dd');
              const entry = entryMap.get(ds);
              const today = isToday(day);
              const dotCls = entry?.mood ? '' : today ? 'bg-stone-400' : 'bg-stone-200';
              const dotStyle = entry?.mood ? { backgroundColor: MOOD_CELL_STYLE[entry.mood] } : undefined;
              const tagMatch = !activeTagFilter || (entry?.tags?.includes(activeTagFilter) ?? false);

              return (
                <motion.div
                  key={ds}
                  className={`flex items-start gap-4 transition-opacity ${activeTagFilter && !tagMatch ? 'opacity-25' : ''}`}
                >
                  {/* Dot */}
                  <button
                    onClick={() => {
                      if (entry) { setFocusDay(ds); setLevel('day'); }
                      else onSelectDate(ds);
                    }}
                    className={`
                      w-[10px] h-[10px] rounded-full mt-3 shrink-0 relative z-10 transition-all
                      ${dotCls} ${entry ? 'scale-125 hover:scale-150' : 'hover:bg-stone-300'}
                      ${today ? 'ring-2 ring-stone-500 ring-offset-1' : ''}
                    `}
                    style={dotStyle}
                    title={ds}
                  />

                  {/* Day content */}
                  <div
                    className="flex-1 rounded-xl p-3 transition-all"
                    style={{
                      backgroundColor: 'var(--card)',
                      border: entry
                        ? '1px solid rgba(28,28,24,0.18)'
                        : '1px solid rgba(28,28,24,0.10)',
                      boxShadow: entry ? '0 1px 4px rgba(28,28,24,0.08)' : undefined,
                      opacity: entry ? 1 : 0.6,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${today ? '' : 'text-stone-500'}`}
                        style={today ? { color: '#3C3C38' } : undefined}>
                        {format(day, 'EEEE')}
                        <span className="font-normal text-stone-400 ml-1.5">{format(day, 'MMM d')}</span>
                      </span>
                      {entry?.mood && (
                        <span className="text-base">{MOOD_EMOJI[entry.mood]}</span>
                      )}
                    </div>

                    {entry ? (
                      <button
                        onClick={() => { setFocusDay(ds); setLevel('day'); }}
                        className="text-sm text-stone-400 text-left line-clamp-2 hover:text-stone-600 transition-colors"
                      >
                        {entry.whatHappened || entry.feelings || entry.freeWrite || 'Entry saved.'}
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectDate(ds)}
                        className="text-sm text-stone-400 hover:text-stone-500 transition-colors"
                      >
                        {today ? "Write today's entry →" : 'Nothing written.'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Sentinel — reflection panel fades in as it enters viewport */}
        <div ref={sentinelRef} className="mt-6">
          <motion.div
            animate={{ opacity: reflectionVisible ? 1 : 0, y: reflectionVisible ? 0 : 12 }}
            transition={{ duration: 0.5 }}
          >
            <ReflectionPanel
              type="weekly"
              reflection={weeklyReflection}
              onWrite={() => onReflectionEntry(`reflection-weekly-${format(focusWeek, 'yyyy-MM-dd')}`, 'weekly')}
              onEdit={() => onEditEntry(weeklyReflection!.date)}
            />
          </motion.div>
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
        <div className="max-w-lg py-16">
          <p className="text-stone-400 text-sm mb-4">Nothing written for this day.</p>
          <Button onClick={() => onSelectDate(focusDay)} variant="outline" size="sm">
            Write an entry →
          </Button>
        </div>
      );
    }

    const moodStyle = entry.mood ? MOOD_BG[entry.mood] : 'bg-stone-50 border-stone-200';
    const moodText  = entry.mood ? MOOD_TEXT[entry.mood] : 'text-stone-500';

    const REFLECTION_BADGE: Record<string, { label: string; cls: string }> = {
      weekly:  { label: 'Weekly reflection', cls: 'bg-amber-100 text-amber-700' },
      monthly: { label: 'Monthly reflection', cls: 'bg-stone-200 text-stone-600' },
      yearly:  { label: 'Yearly reflection',  cls: 'bg-amber-100 text-amber-700' },
    };
    const badge = entry.reflectionType && entry.reflectionType !== 'daily'
      ? REFLECTION_BADGE[entry.reflectionType]
      : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl space-y-6"
      >
        {/* Date heading — display font */}
        <div>
          <p
            className="text-3xl font-light leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: '#3C3C38' }}
          >
            {format(parseISO(focusDay), 'EEEE, MMMM d')}
          </p>
          <p className="text-xs text-stone-400 mt-0.5 tracking-wide">
            {format(parseISO(focusDay), 'yyyy')}
          </p>
        </div>

        {/* Reflection type badge */}
        {badge && (
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${badge.cls}`}>
            {badge.label}
          </span>
        )}

        {/* Mood + energy bar */}
        {(entry.mood || entry.energy) && (
          <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${moodStyle}`}>
            {entry.mood && (
              <span className={`text-sm font-medium flex items-center gap-2 ${moodText}`}>
                <span className="text-base">{MOOD_EMOJI[entry.mood]}</span>
                {MOOD_LABEL[entry.mood]}
              </span>
            )}
            {entry.energy && (
              <div className="flex items-end gap-0.5 ml-auto">
                {[1,2,3,4,5].map(l => (
                  <div
                    key={l}
                    className={`w-1.5 rounded-sm transition-all ${l <= entry.energy! ? 'bg-amber-400' : 'bg-stone-200'}`}
                    style={{ height: `${6 + l * 3}px` }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Inner state — shown as a quiet pill when present */}
        {entry.innerState && (() => {
          const stateStyle: Record<string, string> = {
            clear:    'bg-stone-100 text-stone-600 border-stone-200',
            restless: 'bg-amber-50 text-amber-700 border-amber-100',
            heavy:    'bg-stone-100 text-stone-500 border-stone-200',
          };
          const stateLabel: Record<string, string> = {
            clear:    'Clear mind',
            restless: 'Restless mind',
            heavy:    'Heavy mind',
          };
          return (
            <div>
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${stateStyle[entry.innerState!]}`}>
                {stateLabel[entry.innerState!]}
              </span>
            </div>
          );
        })()}

        {/* Tags — clickable to filter */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {entry.tags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  setActiveTagFilter(activeTagFilter === tag ? null : tag);
                  setLevel('year');
                }}
                className={`px-2.5 py-1 text-xs rounded-full tracking-wide transition-all
                  ${activeTagFilter === tag
                    ? 'text-parchment'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700'
                  }`}
                style={activeTagFilter === tag ? { backgroundColor: '#3C3C38', color: '#EDE8DF' } : undefined}
                title={activeTagFilter === tag ? 'Clear filter' : `Filter by "${tag}"`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Content sections */}
        <div className="space-y-5">
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
                <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-2">{label}</p>
                <p className="leading-relaxed whitespace-pre-wrap text-[0.95rem]" style={{ color: '#3C3C38' }}>{val}</p>
              </div>
            );
          })}
        </div>

        {/* Edit button */}
        <div className="pt-5 border-t border-stone-200/60">
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

        <AnimatePresence>
          <FilterStrip />
        </AnimatePresence>

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
                  flex items-center gap-2 px-3 py-1.5 rounded-r-md text-sm transition-all text-left w-full
                  border-l-2
                  ${isActive
                    ? 'border-amber-500 text-amber-700 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-700'}
                `}
              >
                <span>{y}</span>
                {yearlyReflection && !isActive && <ReflectionDot type="yearly" />}
                {mood && !isActive && !yearlyReflection && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MOOD_CELL_STYLE[mood] }} title={MOOD_LABEL[mood]} />
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
                  ${yearlyReflection ? 'text-amber-500 hover:text-amber-700' : 'text-stone-400 hover:text-stone-600'}
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
                flex items-center gap-2 px-3 py-1.5 rounded-r-md text-sm transition-all text-left
                border-l-2
                ${isActive
                  ? 'border-amber-500 text-amber-700 font-semibold'
                  : 'border-transparent text-stone-500 hover:text-stone-700'}
              `}
            >
              <span>{name}</span>
              {hasReflection && !isActive && <ReflectionDot type="monthly" />}
              {mood && !isActive && !hasReflection && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MOOD_CELL_STYLE[mood] }} title={MOOD_LABEL[mood]} />
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
                  flex items-center gap-2 px-3 py-1.5 rounded-r-md text-sm transition-all text-left
                  border-l-2
                  ${today
                    ? 'border-amber-500 text-stone-700 font-medium'
                    : 'border-transparent text-stone-400 hover:text-stone-700'}
                `}
              >
                <span className="w-7 shrink-0">{format(day, 'EEE')}</span>
                {entry?.mood
                  ? <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MOOD_CELL_STYLE[entry.mood] }} />
                  : entry
                    ? <span className="w-2 h-2 rounded-full shrink-0 bg-stone-400 ring-1 ring-stone-500 ring-dashed" />
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
                  flex items-center gap-2 px-3 py-1.5 rounded-r-md text-sm transition-all text-left
                  border-l-2
                  ${isCurrentDay
                    ? 'border-amber-500 text-stone-700 font-medium'
                    : today
                      ? 'border-stone-300 text-stone-600'
                      : 'border-transparent text-stone-400 hover:text-stone-700'}
                `}
              >
                <span className="w-7 shrink-0">{format(day, 'EEE')}</span>
                {entry?.mood
                  ? <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MOOD_CELL_STYLE[entry.mood] }} />
                  : entry
                    ? <span className="w-2 h-2 rounded-full shrink-0 bg-stone-400 ring-1 ring-stone-500 ring-dashed" />
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
