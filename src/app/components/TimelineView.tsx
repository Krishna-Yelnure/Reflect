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
import { ChevronLeft, ChevronRight, Edit, X, BookOpen } from 'lucide-react';
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
// Uses dynamic CSS variables defined in theme.css for perfect adaptation across all 5 themes.

const MOOD_CELL: Record<string, string> = {
  great:     'bg-mood-great',
  good:      'bg-mood-good',
  okay:      'bg-mood-okay',
  low:       'bg-mood-low',
  difficult: 'bg-mood-difficult',
};

// Inline styles for SVG shapes or inline backgrounds that require exact CSS variable strings
const MOOD_CELL_STYLE: Record<string, string> = {
  great:     'var(--mood-dot-great)',
  good:      'var(--mood-dot-good)',
  okay:      'var(--mood-dot-okay)',
  low:       'var(--mood-dot-low)',
  difficult: 'var(--mood-dot-difficult)',
};

const MOOD_LABEL: Record<string, string> = {
  great: 'Vibrant', good: 'Peaceful', okay: 'Balanced', low: 'Heavy', difficult: 'Hard',
};
const MOOD_ORDER: string[] = ['low', 'okay', 'good', 'great', 'difficult'];
const MOOD_EMOJI: Record<string, string> = {
  great: '✨', good: '🌿', okay: '○', low: '◌', difficult: '·',
};

const MOOD_BG: Record<string, string> = {
  great:     'bg-mood-great/10 border-mood-great/30',
  good:      'bg-mood-good/10 border-mood-good/30',
  okay:      'bg-mood-okay/10 border-mood-okay/30',
  low:       'bg-mood-low/10 border-mood-low/30',
  difficult: 'bg-mood-difficult/10 border-mood-difficult/30',
};

const MOOD_TEXT: Record<string, string> = {
  great:     'text-mood-great',
  good:      'text-mood-good',
  okay:      'text-mood-okay',
  low:       'text-mood-low',
  difficult: 'text-mood-difficult',
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

/** Returns the day-of-week name the user writes most often - a pure witness observation */
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

  const handlePrevYear = () => setYear(y => y - 1);
  const handleNextYear = () => setYear(y => y + 1);
  const handleWriteToday = () => onSelectDate(format(new Date(), 'yyyy-MM-dd'));


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
  // Combined daily prompt pool - existing smart prompts + Gita-informed prompts (A8a)
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

  // ── SUB-COMPONENTS ──────────────────────────────────────────────────────
  


  const DailyHeatmap = () => {
    const FULL_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const isCurrentMonth = (mi: number) => mi === getMonth(new Date()) && year === getYear(new Date());

    return (
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-2 min-h-0 max-w-[1200px] mx-auto w-full overflow-y-auto pb-4">
        {FULL_MONTH_NAMES.map((name, mi) => {
          const mStart    = startOfMonth(new Date(year, mi, 1));
          const monthDays = eachDayOfInterval({ start: mStart, end: endOfMonth(mStart) });
          const padBefore = getDay(monthDays[0]);
          const isCurrent = isCurrentMonth(mi);

          return (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mi * 0.03 }}
              className="rounded-2xl p-4 flex flex-col cursor-pointer group transition-[transform,colors] duration-200"
              style={{
                backgroundColor: 'var(--card)',
                border: isCurrent ? '1.5px solid var(--primary)' : '1px solid var(--border-medium)',
                boxShadow: isCurrent
                  ? '0 4px 16px var(--selection-bg)'
                  : '0 1px 4px var(--border-light)',
              }}
              onClick={() => { setFocus(mi); setLevel('month'); }}
            >
              {/* Month name */}
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-[13px] font-semibold tracking-wide transition-colors"
                  style={{ fontFamily: 'var(--font-display)', color: isCurrent ? 'var(--primary)' : 'var(--foreground)' }}
                >
                  {name}
                </h3>
                <span className="opacity-0 group-hover:opacity-60 transition-opacity text-[12px]" style={{ color: 'var(--primary)' }}>→</span>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-[8px] text-center font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {/* Padding cells */}
                {Array(padBefore).fill(null).map((_, i) => (
                  <div key={`p-${i}`} />
                ))}

                {monthDays.map(day => {
                  const ds     = format(day, 'yyyy-MM-dd');
                  const entry  = entryMap.get(ds);
                  const todayC = isToday(day);
                  const moodColor = entry?.mood ? MOOD_CELL_STYLE[entry.mood] : null;

                  return (
                    <button
                      key={ds}
                      title={format(day, 'MMMM d')}
                      onClick={e => {
                        e.stopPropagation();
                        if (entry) { setFocus(mi); setFocusDay(ds); setLevel('day'); }
                        else onSelectDate(ds);
                      }}
                      className="relative flex items-center justify-center"
                      style={{ aspectRatio: '1' }}
                    >
                      {/* Mood circle or today ring */}
                      {moodColor ? (
                        <span
                          className="absolute inset-[1px] rounded-full"
                          style={{ backgroundColor: moodColor }}
                        />
                      ) : entry ? (
                        <span
                          className="absolute inset-[2px] rounded-full"
                          style={{ border: '1.5px dashed var(--text-muted)' }}
                        />
                      ) : todayC ? (
                        <span
                          className="absolute inset-[1px] rounded-full"
                          style={{ border: '1.5px solid var(--primary)' }}
                        />
                      ) : null}

                      {/* Day number */}
                      <span
                        className="relative z-10 text-[9px] leading-none font-medium"
                        style={{
                          color: moodColor
                            ? 'rgba(255,255,255,0.92)'
                            : todayC
                            ? 'var(--primary)'
                            : 'var(--muted-foreground)',
                        }}
                      >
                        {format(day, 'd')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };





  const LegendFooter = () => {
    const currentYearEra = eras.find(era => {
      const today = new Date().getTime();
      const st = new Date(era.startDate || '').getTime();
      const en = era.endDate ? new Date(era.endDate).getTime() : Infinity;
      return today >= st && today <= en;
    });

    // Remaining days in the currently viewed year
    const now = new Date();
    const msPerDay = 86400000;
    const yearEnd = new Date(year, 11, 31);
    const daysLeft = Math.max(0, Math.ceil((yearEnd.getTime() - now.getTime()) / msPerDay));
    const isCurrentViewYear = year === getYear(now);

    // Mood insight from recent entries
    const MOOD_SCORE: Record<string, number> = { great: 5, good: 4, okay: 3, low: 2, difficult: 1 };
    const recentDaily = entries
      .filter(e => e.date && !e.reflectionType && !e.date.startsWith('reflection-'))
      .sort((a, b) => b.date.localeCompare(a.date));

    const insight = (() => {
      if (recentDaily.length < 2) return null;
      const last3 = recentDaily.slice(0, 3).filter(e => e.mood).map(e => MOOD_SCORE[e.mood!] ?? 3);
      const prev3 = recentDaily.slice(3, 6).filter(e => e.mood).map(e => MOOD_SCORE[e.mood!] ?? 3);
      if (last3.length >= 2 && prev3.length >= 2) {
        const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
        const diff = avg(last3) - avg(prev3);
        if (diff >= 0.8)  return 'Mood has been rising this week.';
        if (diff <= -0.8) return 'Mood has been quieter lately.';
      }
      let streak = 0;
      let cursor = new Date();
      while (streak <= 60) {
        if (!recentDaily.find(e => e.date === format(cursor, 'yyyy-MM-dd'))) break;
        streak++;
        cursor = new Date(cursor.getTime() - msPerDay);
      }
      if (streak >= 3) return `${streak}-day writing streak.`;
      const moodCounts: Record<string, number> = {};
      recentDaily.slice(0, 14).forEach(e => { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
      const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const MOOD_PHRASE: Record<string, string> = { great: 'A vibrant stretch lately.', good: 'A peaceful stretch lately.', okay: 'A steady stretch lately.', low: 'A tender stretch lately.', difficult: 'A tender stretch lately.' };
      return topMood ? (MOOD_PHRASE[topMood] ?? null) : null;
    })();

    return (
      <div className="mt-3 shrink-0 max-w-[1200px] mx-auto w-full px-2 pb-2">
        {insight && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 mb-2 px-4"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Insight</span>
            <span className="text-[11px] text-muted-foreground">{insight}</span>
          </motion.div>
        )}
        <div className="flex items-center justify-between px-4 opacity-60">
          <div className="flex gap-1.5 items-center">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mr-1">Mood</span>
            <div className="w-[10px] h-[10px] rounded-full bg-border" title="No entry" />
            {MOOD_ORDER.map(m => (
              <div key={m} className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: MOOD_CELL_STYLE[m] }} title={MOOD_LABEL[m]} />
            ))}
          </div>
          {isCurrentViewYear && daysLeft > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              <span className="font-bold text-primary">{daysLeft}</span> days left in {year}
            </span>
          )}
          {currentYearEra && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Chapter:</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{currentYearEra.name}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BelowHeatmap = () => {
    const activeDayStr = mostActiveDay(entries.filter(e => e.date && !e.reflectionType && getYear(parseISO(e.date)) === year));
    return (
      <div className="mt-2 space-y-1 text-center max-w-md mx-auto">
        <AnimatePresence>
          {showDailyPrompt && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="text-stone-400 text-[12px] italic leading-relaxed cursor-pointer"
              onClick={() => setShowDailyPrompt(false)}
              style={{ fontFamily: 'ui-serif, Georgia, serif' }}
            >
              {dailyPrompt}
            </motion.p>
          )}
        </AnimatePresence>
        {activeDayStr && <p className="text-[9px] text-stone-400 font-medium uppercase tracking-widest">Mostly writing on {activeDayStr}</p>}
        {activeIntention && activeIntention.text.trim().length >= 3 && (
          <div className="pt-0.5">
            <p className="text-[9px] text-stone-400 font-medium uppercase tracking-widest">
              {activeIntention.type === 'monthly' ? 'Monthly' : 'Weekly'} Intent: "{activeIntention.text}"
            </p>
          </div>
        )}
      </div>
    );
  };

  const FilterStrip = () => {
    if (!activeTagFilter && !activeEraFilter) return null;
    const activeEra = activeEraFilter ? eras.find(e => e.id === activeEraFilter) : null;
    return (
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center items-center gap-3 mb-4">
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Filtered</span>
        {activeTagFilter && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] rounded-full font-medium">
            {activeTagFilter} <button onClick={() => setActiveTagFilter(null)} className="opacity-60 hover:opacity-100">×</button>
          </span>
        )}
        {activeEra && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border text-[10px] rounded-full font-medium" style={{ backgroundColor: activeEra.colour ? activeEra.colour + '15' : 'var(--selection-bg)', color: 'var(--foreground)' }}>
            {activeEra.name} <button onClick={() => setActiveEraFilter(null)} className="opacity-60 hover:opacity-100">×</button>
          </span>
        )}
        <button onClick={() => { setActiveTagFilter(null); setActiveEraFilter(null); }} className="text-[10px] underline hover:opacity-100 opacity-60 text-muted-foreground">clear</button>
      </motion.div>
    );
  };

  // ── REFLECTION PANEL - replaces flat banners in Month/Week/Year views ─
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
          className="rounded-[16px] p-6 bg-card border border-border shadow-sm mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[12px] font-medium uppercase tracking-wide mb-1 ${meta.accentText}`}>
                {meta.emptyLabel}
              </p>
              <p className="text-[14px] text-muted-foreground italic">"{meta.emptyPrompt}"</p>
            </div>
            <button
              onClick={onWrite}
              className={`ml-4 shrink-0 text-[13px] px-4 py-2 rounded-lg border transition-colors hover:bg-stone-50 ${meta.accentButton}`}
            >
              Write Reflection
            </button>
          </div>
        </motion.div>
      );
    }

    // Written state - show full content
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
        className="rounded-[16px] p-6 bg-card border border-border shadow-sm mb-6"
      >
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotCls}`} />
              <h2 className="text-[18px] font-semibold text-foreground leading-none">
                {meta.label}
              </h2>
              {reflection.mood && (
                <span className="text-[18px] leading-none ml-1">{MOOD_EMOJI[reflection.mood]}</span>
              )}
            </div>
            <p className="text-[14px] text-muted-foreground mt-2">
              Your thoughts for {type === 'monthly' ? MONTH_NAMES[focusMonth] : type === 'weekly' ? 'this week' : year}
            </p>
          </div>
          <button
            onClick={onEdit}
            className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border transition-colors ${meta.accentButton} hover:bg-stone-50`}
          >
            <Edit className="size-3.5" />
            Edit
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-6">
          {/* Intention - prominent at top */}
          {(reflection as JournalEntry & { intention?: string }).intention && (
            <div 
              onClick={onEdit}
              className="group cursor-pointer rounded-xl -mx-3 px-3 py-2 -my-2 transition-colors hover:bg-muted"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Intention</p>
                <Edit className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className={`text-[16px] italic font-medium ${meta.accentText} leading-[1.6]`}>
                "{(reflection as JournalEntry & { intention?: string }).intention}"
              </p>
            </div>
          )}

          {/* Content fields - below intention */}
          {fields.map(({ key, label }) => {
            const val = reflection[key] as string | undefined;
            if (!val) return null;
            return (
              <div 
                key={String(key)}
                onClick={onEdit}
                className="group cursor-pointer rounded-xl -mx-3 px-3 py-2 -my-2 transition-colors hover:bg-muted"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                  <Edit className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[16px] text-foreground leading-[1.6] whitespace-pre-wrap">
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
    const FULL_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const mStart = startOfMonth(new Date(year, focusMonth, 1));
    const mEnd   = endOfMonth(mStart);
    const weeks  = eachWeekOfInterval({ start: mStart, end: mEnd });
    const periodKey = format(mStart, 'yyyy-MM');
    const monthlyReflection = findReflectionEntry(entries, 'monthly', periodKey);
    const monthlyKey = `reflection-monthly-${periodKey}`;
    const [showReflection, setShowReflection] = useState(false);

    // Active era for the month footer — dynamic from Chapters/Eras feature
    const currentEra = eras.find(era => {
      const t = mStart.getTime();
      const st = new Date(era.startDate || '').getTime();
      const en = era.endDate ? new Date(era.endDate).getTime() : Infinity;
      return t >= st && t <= en;
    });

    // Nearby months for the sidebar scrubber
    const sidebarMonths = (() => {
      const result = [];
      for (let i = focusMonth - 2; i <= focusMonth + 2; i++) {
        const m = ((i % 12) + 12) % 12;
        const y = year + Math.floor(i / 12);
        // Explicitly show the year when crossing boundaries or on January to anchor the timeline
        const showYear = y !== year || m === 0;
        const label = showYear ? `${FULL_MONTH_NAMES[m]} ${y}` : FULL_MONTH_NAMES[m];
        result.push({ m, y, label });
      }
      return result;
    })();

    return (
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* ── Sidebar month scrubber ── */}
        <div className="flex flex-col justify-center gap-3 px-5 mr-2 shrink-0 min-w-[140px]">
          {sidebarMonths.map(({ m, y, label }, idx) => {
            const isActive = m === focusMonth && y === year;
            const dist = Math.abs(idx - 2); // 0=active, 1=adjacent, 2=far
            return (
              <button
                key={`${y}-${m}`}
                onClick={() => { setFocus(m); if (y !== year) setYear(y); }}
                className="text-left transition-all duration-200 leading-snug hover:opacity-100"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: isActive ? '22px' : dist === 1 ? '15px' : '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--foreground)' : dist === 1 ? 'var(--text-secondary)' : 'var(--text-muted)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Main calendar area ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden pr-6 -mr-4">
          {/* Header: title + Month/Week pill */}
          <div className="flex items-center justify-between mb-5 pt-1 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setFocus(m => ((m - 1 + 12) % 12))} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <ChevronLeft className="size-4" />
              </button>
              <h2 className="text-[26px] font-medium leading-none" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                {FULL_MONTH_NAMES[focusMonth]} {year}
              </h2>
              <button onClick={() => setFocus(m => ((m + 1) % 12))} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <ChevronRight className="size-4" />
              </button>
            </div>
            {/* Month / Week pill toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-full p-0.5 text-sm">
              <span className="px-3 py-1 rounded-full font-medium bg-background text-foreground">Month</span>
              <button
                onClick={() => setLevel('week')}
                className="px-3 py-1 rounded-full text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Week
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 shrink-0">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-[10px] text-center font-semibold uppercase tracking-widest text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Week rows */}
          <div className="flex flex-col gap-1.5 flex-1">
            {weeks.map((weekStart, wi) => {
              const weekEnd  = endOfWeek(weekStart);
              const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
              const weekKey  = format(weekStart, 'yyyy-MM-dd');
              const hasWeekReflection = entries.some(e => e.replectionType === 'weekly' && e.date === `reflection-weekly-${weekKey}`);

              return (
                <motion.div
                  key={wi}
                  className="relative group grid grid-cols-7 gap-1.5 rounded-xl cursor-pointer transition-colors"
                  whileHover="hover"
                  onClick={() => { setFocusW(weekStart); setLevel('week'); }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{ backgroundColor: 'var(--selection-bg)' }}
                    initial={{ opacity: 0 }}
                    variants={{ hover: { opacity: 1 } }}
                    transition={{ duration: 0.15 }}
                  />

                  {weekDays.map(day => {
                    const ds      = format(day, 'yyyy-MM-dd');
                    const entry   = entryMap.get(ds);
                    const inMonth = isSameMonth(day, mStart);
                    const todayC  = isToday(day);
                    const cellBg  = entry?.mood ? MOOD_CELL_STYLE[entry.mood] : inMonth ? 'var(--border)' : 'transparent';

                    return (
                      <div
                        key={ds}
                        className={`aspect-square rounded-lg flex items-center justify-center relative transition-all ${!inMonth ? 'opacity-0 pointer-events-none' : ''}`}
                        style={{ backgroundColor: inMonth ? cellBg : 'transparent' }}
                        onClick={e => {
                          e.stopPropagation();
                          if (entry) { setFocusDay(ds); setLevel('day'); }
                          else onSelectDate(ds);
                        }}
                      >
                        <span className={`text-[13px] font-medium leading-none ${entry?.mood ? 'text-white' : todayC ? 'text-primary' : 'text-muted-foreground'}`}>
                          {format(day, 'd')}
                        </span>
                        {todayC && (
                          <div className="absolute inset-0 rounded-lg pointer-events-none" style={{ border: '2px solid var(--primary)' }} />
                        )}
                        {entry && !entry.mood && (
                          <div className="absolute bottom-[3px] right-[3px] w-[4px] h-[4px] rounded-full bg-border" />
                        )}
                      </div>
                    );
                  })}

                  {/* › chevron on hover */}
                  <motion.div
                    className="absolute -right-5 top-1/2 -translate-y-1/2 text-primary pointer-events-none"
                    initial={{ opacity: 0, x: -4 }}
                    variants={{ hover: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight className="size-3.5" />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer: era name + reflection toggle */}
          <div className="mt-4 pt-3 border-t border-border shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {currentEra
                  ? <><span className="text-muted-foreground">Chapter: </span><span className="text-primary">{currentEra.name}</span></>
                  : `${FULL_MONTH_NAMES[focusMonth]} ${year}`}
              </span>
              <button
                onClick={() => setShowReflection(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  color: showReflection ? 'var(--primary)' : 'var(--muted-foreground)',
                  backgroundColor: showReflection ? 'var(--selection-bg)' : 'transparent',
                  border: '1px solid',
                  borderColor: showReflection ? 'var(--border)' : 'var(--border-light)',
                }}
              >
                {monthlyReflection ? (showReflection ? 'Hide reflection ↑' : 'Read reflection ↓') : (showReflection ? 'Cancel ↑' : 'Write reflection ↓')}
              </button>
            </div>

            {/* Inline reflection panel */}
            <AnimatePresence>
              {showReflection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <ReflectionPanel
                      type="monthly"
                      reflection={monthlyReflection}
                      onWrite={() => onReflectionEntry(monthlyKey, 'monthly')}
                      onEdit={() => monthlyReflection && onEditEntry(monthlyReflection.date)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };


  // ── WEEK VIEW - vertical timeline dots ────────────────────────────────


  const WeekView = () => {
    const wEnd   = endOfWeek(focusWeek);
    const wDays  = eachDayOfInterval({ start: focusWeek, end: wEnd });
    const weekKey = format(focusWeek, 'yyyy-MM-dd');
    const weeklyReflection = findReflectionEntry(entries, 'weekly', weekKey);

    // Scroll-triggered swap - timeline fades out when reflection sentinel enters viewport
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

    const weeklyKey = `reflection-weekly-${format(focusWeek, 'yyyy-MM-dd')}`;

    return (
      <div className="max-w-[720px] mx-auto w-full pb-12">
        {/* Week Header */}
        <div className="text-center mb-6">
          <h2 className="text-[32px] font-bold text-foreground leading-none mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Week {getWeek(focusWeek)}, {year}
          </h2>
          <p className="text-[15px] text-muted-foreground">Weekly overview and reflection</p>
        </div>

        <div className="mb-8">
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide pl-2 mb-3">Week Overview</p>
          <div className="bg-card border border-border rounded-[16px] p-5 shadow-sm">
            {/* Timeline */}
            <motion.div
              className="relative"
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Vertical line */}
              <div className="absolute left-[26px] top-4 bottom-4 w-px bg-stone-200" />

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
                      backgroundColor: 'var(--input-background)',
                      border: '1px solid var(--border)',
                      boxShadow: entry ? '0 1px 4px var(--border-light)' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${today ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, 'EEEE')}
                        <span className="font-normal text-muted-foreground ml-1.5">{format(day, 'MMM d')}</span>
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
          </div>
        </div>

        {/* Sentinel - reflection panel fades in as it enters viewport */}
        <div ref={sentinelRef} className="mt-8">
          <motion.div
            animate={{ opacity: 1, y: reflectionVisible ? 0 : 12 }}
            transition={{ duration: 0.5 }}
          >
            <ReflectionPanel
              type="weekly"
              reflection={weeklyReflection}
              onWrite={() => onReflectionEntry(weeklyKey, 'weekly')}
              onEdit={() => onEditEntry(weeklyReflection!.date)}
            />
          </motion.div>
        </div>
      </div>
    );
  };

  // ── DAY VIEW - full entry read mode ───────────────────────────────────
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
        {/* Date heading */}
        <div>
          <p
            className="text-3xl font-light leading-tight text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {format(parseISO(focusDay), 'EEEE, MMMM d')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 tracking-wide">
            {format(parseISO(focusDay), 'yyyy')}
          </p>
        </div>

        {badge && (
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium tracking-wide ${badge.cls}`}>
            {badge.label}
          </span>
        )}

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
                {[1, 2, 3, 4, 5].map(l => (
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
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs border ${stateStyle[entry.innerState!]}`}>
              {stateLabel[entry.innerState!]}
            </span>
          );
        })()}

        {entry.tags && entry.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {entry.tags.map((tag: string) => (
              <button
                key={tag}
                onClick={() => {
                  setActiveTagFilter(activeTagFilter === tag ? null : tag);
                  setLevel('year');
                }}
                className={`px-2.5 py-1 text-xs rounded-full tracking-wide transition-all
                  ${activeTagFilter === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-border hover:text-foreground'
                  }`}
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
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
                <p className="leading-relaxed whitespace-pre-wrap text-[0.95rem] text-foreground">{val}</p>
              </div>
            );
          })}
        </div>

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

  // ── (Consolidated above) ──────────────────────────────────────────────

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans bg-background text-foreground">
      <div className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full px-6 pt-3 pb-2 min-h-0">
        <div className={`flex flex-col items-center ${level === 'month' ? 'mb-0' : 'mb-[40px]'}`}>
          {level === 'year' && !showWelcome && (
            <div className="relative flex items-center justify-between w-full max-w-[1200px] mx-auto px-2 mb-4">
              {/* Year navigation */}
              <div className="flex items-center gap-3">
                <button onClick={handlePrevYear} className="hover:text-foreground transition-colors p-1 text-muted-foreground">
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-[18px] font-medium text-foreground" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
                  {year}
                </span>
                <button onClick={handleNextYear} className="hover:text-foreground transition-colors p-1 text-muted-foreground">
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Reflect logo — pinned to absolute center */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none select-none">
                <BookOpen className="size-[18px] text-primary" strokeWidth={1.75} />
                <span
                  className="text-[17px] font-semibold tracking-tight text-foreground"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
                >
                  Reflect
                </span>
              </div>

              {/* Write Today */}
              <Button
                onClick={handleWriteToday}
                className="text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl h-[36px] px-5 flex items-center gap-2 transition-all shadow-none font-medium text-[13px] border-0"
              >
                <Edit className="size-3.5" />
                <span>Write Today</span>
              </Button>
            </div>
          )}



          {level !== 'year' && level !== 'month' && (
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                onClick={() => setLevel('year')}
                className="hover:opacity-100 text-[11px] font-medium transition-colors uppercase tracking-widest text-muted-foreground"
              >
                {year}
              </button>
              
              {(level === 'month' || level === 'week' || level === 'day') && (
                <>
                  <span className="text-[10px] text-border">/</span>
                  <button
                    onClick={() => setLevel('month')}
                    className={`text-[11px] font-medium transition-colors uppercase tracking-widest ${
                      level === 'month' ? 'text-foreground cursor-default' : 'text-muted-foreground hover:opacity-100'
                    }`}
                  >
                    {MONTH_NAMES[focusMonth]}
                  </button>
                </>
              )}

              {(level === 'week' || level === 'day') && (
                <>
                  <span className="text-border text-[10px]">/</span>
                  <button
                    onClick={() => setLevel('week')}
                    className={`text-[11px] font-medium transition-colors uppercase tracking-widest ${
                      level === 'week' ? 'text-foreground cursor-default' : 'text-muted-foreground hover:text-foreground'
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

              {level === 'day' && focusDay && (
                <>
                  <span className="text-border text-[10px]">/</span>
                  <span className="text-[11px] font-medium text-foreground uppercase tracking-widest">
                    {format(parseISO(focusDay), 'EEE d')}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {level === 'year' && (
            <motion.div key="year" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
              {showWelcome ? (
                /* ── New-user: full-screen centred welcome, no calendar ── */
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="flex-1 flex flex-col items-center justify-center text-center px-6"
                >
                  <p
                    className="text-[13px] font-semibold uppercase tracking-[0.18em] mb-6"
                    style={{ color: '#B8663F' }}
                  >
                    Your Journal
                  </p>
                  <h1
                    className="text-[36px] font-light leading-snug mb-4 max-w-md"
                    style={{ fontFamily: 'var(--font-display)', color: '#2E2A26' }}
                  >
                    A place to witness<br />your own mind.
                  </h1>
                  <p
                    className="text-[15px] leading-relaxed max-w-sm mb-10 italic"
                    style={{ color: '#8C857B', fontFamily: 'ui-serif, Georgia, serif' }}
                  >
                    "Write without concern for how it sounds or what it achieves."
                  </p>
                  <button
                    onClick={handleWriteToday}
                    className="px-8 py-3 rounded-2xl text-white text-[15px] font-medium transition-all hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: '#B8663F' }}
                  >
                    Write today's entry →
                  </button>
                  <p
                    className="mt-5 text-[11px] uppercase tracking-widest"
                    style={{ color: '#C2B8AE' }}
                  >
                    {format(new Date(), 'EEEE, MMMM d')}
                  </p>
                </motion.div>
              ) : (
                /* ── Returning user: full calendar grid ── */
                <>
                  <FilterStrip />
                  <div className="flex-1 min-h-0 flex flex-col py-2">
                    <DailyHeatmap />
                  </div>
                  <div className="shrink-0 space-y-1 py-1">
                    <LegendFooter />
                    <BelowHeatmap />
                  </div>
                  {(() => {
                    const yearlyReflection = findReflectionEntry(entries, 'yearly', String(year));
                    if (!yearlyReflection) return null;
                    return (
                      <div className="mt-2 max-w-xl mx-auto w-full">
                        <ReflectionPanel
                          type="yearly"
                          reflection={yearlyReflection}
                          onWrite={() => onReflectionEntry(`reflection-yearly-${year}`, 'yearly')}
                          onEdit={() => onEditEntry(yearlyReflection.date)}
                        />
                      </div>
                    );
                  })()}
                </>
              )}
            </motion.div>
          )}


          {level === 'month' && (
            <motion.div key="month" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 min-h-0 flex flex-col">
              <MonthView />
            </motion.div>
          )}

          {level === 'week' && (
            <motion.div key="week" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-2xl mx-auto overflow-y-auto">
              <WeekView />
            </motion.div>
          )}

          {level === 'day' && (
            <motion.div key="day" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full max-w-2xl mx-auto overflow-y-auto">
              <DayView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
