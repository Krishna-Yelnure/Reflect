import { useState, useMemo } from 'react';
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

interface TimelineViewProps {
  entries: JournalEntry[];
  onSelectDate: (date: string) => void;   // opens Write with that date
  onEditEntry: (date: string) => void;    // opens Write pre-filled
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

function dominantMood(entries: JournalEntry[]): string | null {
  const counts: Record<string, number> = {};
  entries.forEach(e => { if (e.mood) counts[e.mood] = (counts[e.mood] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

function summaryLine(entries: JournalEntry[]): string {
  const total = entries.length;
  if (total === 0) return 'No entries yet.';
  const mood = dominantMood(entries);
  const moodStr = mood ? `, mostly ${MOOD_LABEL[mood].toLowerCase()}` : '';
  const lows = entries.filter(e => e.mood === 'low' || e.mood === 'difficult').length;
  const lowStr = lows > 0 ? `, ${lows} ${lows === 1 ? 'hard day' : 'hard days'}` : '';
  return `${total} ${total === 1 ? 'entry' : 'entries'}${moodStr}${lowStr}`;
}

// ── Main component ─────────────────────────────────────────────────────────
export function TimelineView({ entries, onSelectDate, onEditEntry }: TimelineViewProps) {
  const [year, setYear]         = useState(getYear(new Date()));
  const [level, setLevel]       = useState<DrillLevel>('year');
  const [focusMonth, setFocus]  = useState<number>(getMonth(new Date())); // 0-indexed
  const [focusWeek, setFocusW]  = useState<Date>(startOfWeek(new Date()));
  const [focusDay, setFocusDay] = useState<string | null>(null);

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

      <span className="ml-auto text-sm text-slate-400">{summaryLine(yearEntries)}</span>
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
                className="text-xs font-medium text-slate-500 hover:text-slate-800 mb-2 block transition-colors"
              >
                {name}
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
                        ${entry?.mood ? MOOD_CELL[entry.mood] : 'bg-slate-100 hover:bg-slate-200'}
                        ${todayC ? 'ring-1 ring-slate-700 ring-offset-1' : ''}
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

  // ── MONTH VIEW ─────────────────────────────────────────────────────────
  const MonthView = () => {
    const mStart = startOfMonth(new Date(year, focusMonth, 1));
    const mEnd   = endOfMonth(mStart);
    const weeks  = eachWeekOfInterval({ start: mStart, end: mEnd });

    return (
      <div className="space-y-3">
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
              {/* Week row header — click → drill into week */}
              <button
                onClick={() => { setFocusW(weekStart); setLevel('week'); }}
                className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] text-slate-300 hover:text-slate-500 transition-colors"
                title="View this week"
              >
                W{getWeek(weekStart)}
              </button>

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

    return (
      <div className="max-w-lg">
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

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl space-y-5"
      >
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
              <DailyHeatmap />
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

      {/* ── Year selector sidebar (right) ── */}
      <div className="flex flex-col gap-1 pt-1 shrink-0">
        {yearsToShow.map(y => {
          const yEntries = entries.filter(e => getYear(parseISO(e.date)) === y);
          const mood     = dominantMood(yEntries);
          const isActive = y === year;
          return (
            <button
              key={y}
              onClick={() => { setYear(y); setLevel('year'); }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all text-left
                ${isActive
                  ? 'bg-slate-900 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              <span>{y}</span>
              {mood && !isActive && (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${MOOD_CELL[mood]}`}
                  title={MOOD_LABEL[mood]}
                />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
