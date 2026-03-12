import { useMemo } from 'react';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import type { JournalEntry } from '@/app/types';

interface CalendarViewProps {
  entries: JournalEntry[];
  onSelectDate: (date: string) => void;
  selectedMonth: Date;
}

// Warm mood palette — all CSS variables from theme.css
const moodColors: Record<string, string> = {
  great:     'var(--mood-dot-great)',
  good:      'var(--mood-dot-good)',
  okay:      'var(--mood-dot-okay)',
  low:       'var(--mood-dot-low)',
  difficult: 'var(--mood-dot-difficult)',
};

export function CalendarView({ entries, onSelectDate, selectedMonth }: CalendarViewProps) {
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    const startDay = start.getDay();
    return Array(startDay).fill(null).concat(days);
  }, [selectedMonth]);

  const entryMap = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    entries.forEach(entry => map.set(entry.date, entry));
    return map;
  }, [entries]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">{format(selectedMonth, 'MMMM yyyy')}</h2>
        <p className="text-muted-foreground">Your journaling calendar</p>
      </div>

      <div
        className="rounded-lg p-6"
        style={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)' }}
      >
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium py-2 text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} className="aspect-square" />;

            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = entryMap.get(dateStr);
            const isCurrentMonth = isSameMonth(day, selectedMonth);
            const isTodayDate = isToday(day);

            return (
              <motion.button
                key={dateStr}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectDate(dateStr)}
                className="aspect-square rounded-lg border transition-all relative"
                style={{
                  color: isCurrentMonth ? 'var(--foreground)' : 'var(--ring)',
                  backgroundColor: entry ? 'var(--card)' : 'transparent',
                  borderColor: isTodayDate
                    ? 'var(--amber-accent)'
                    : entry
                      ? 'var(--border)'
                      : 'rgba(28,28,24,0.1)',
                  outline: isTodayDate ? '2px solid var(--amber-accent)' : undefined,
                  outlineOffset: isTodayDate ? '2px' : undefined,
                }}
              >
                <div className="absolute top-1 left-0 right-0 text-sm text-center">
                  {format(day, 'd')}
                </div>
                {entry && (
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                    {entry.mood && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: moodColors[entry.mood] }}
                      />
                    )}
                    {entry.energy && (
                      <div
                        className="w-1 h-1 rounded-full self-center"
                        style={{ backgroundColor: 'var(--muted-foreground)' }}
                      />
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }} />
          <span>Has entry</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ outline: '2px solid var(--amber-accent)', outlineOffset: '1px' }} />
          <span>Today</span>
        </div>
        {Object.entries(moodColors).map(([mood, color]) => (
          <div key={mood} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="capitalize">{mood}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
