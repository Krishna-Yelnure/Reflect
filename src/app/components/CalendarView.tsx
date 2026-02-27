import { useMemo } from 'react';
import { motion } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';
import type { JournalEntry } from '@/app/types';

interface CalendarViewProps {
  entries: JournalEntry[];
  onSelectDate: (date: string) => void;
  selectedMonth: Date;
}

const moodColors: Record<string, string> = {
  great: 'bg-emerald-400',
  good: 'bg-blue-400',
  okay: 'bg-slate-400',
  low: 'bg-amber-400',
  difficult: 'bg-red-400',
};

export function CalendarView({ entries, onSelectDate, selectedMonth }: CalendarViewProps) {
  const calendarDays = useMemo(() => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Pad the beginning with empty slots for proper day alignment
    const startDay = start.getDay();
    const paddedDays = Array(startDay).fill(null).concat(days);
    
    return paddedDays;
  }, [selectedMonth]);

  const entryMap = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    entries.forEach(entry => {
      map.set(entry.date, entry);
    });
    return map;
  }, [entries]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">{format(selectedMonth, 'MMMM yyyy')}</h2>
        <p className="text-slate-600">Your journaling calendar</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm text-slate-500 font-medium py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

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
                className={`
                  aspect-square rounded-lg border transition-all relative
                  ${isCurrentMonth ? 'text-slate-900' : 'text-slate-300'}
                  ${entry ? 'border-slate-300 bg-slate-50' : 'border-slate-200'}
                  ${isTodayDate ? 'ring-2 ring-slate-900 ring-offset-2' : ''}
                  hover:border-slate-400
                `}
              >
                <div className="absolute top-1 left-0 right-0 text-sm">
                  {format(day, 'd')}
                </div>
                {entry && (
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
                    {entry.mood && (
                      <div className={`w-2 h-2 rounded-full ${moodColors[entry.mood]}`} />
                    )}
                    {entry.energy && (
                      <div className="w-1 h-1 rounded-full bg-slate-400 self-center" />
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-50 border border-slate-300" />
          <span>Has entry</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full ring-2 ring-slate-900" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
