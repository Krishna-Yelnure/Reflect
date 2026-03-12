import { useMemo } from 'react';
import { eachDayOfInterval, format, parseISO, differenceInDays, isToday, isFuture } from 'date-fns';
import type { GentleStart, HabitEngagement } from '@/app/types';

interface GentleStartTrackerProps {
  gentleStart: GentleStart;
  engagements: HabitEngagement[];
}

const MILESTONES: Record<number, string> = {
  7:  'One week in',
  14: 'Halfway there',
  21: 'Full exploration complete',
};

export function GentleStartTracker({ gentleStart, engagements }: GentleStartTrackerProps) {
  const days = useMemo(() =>
    eachDayOfInterval({
      start: parseISO(gentleStart.startDate),
      end:   parseISO(gentleStart.endDate),
    }).slice(0, 21),
    [gentleStart.startDate, gentleStart.endDate]
  );

  const engagedDates = useMemo(() => {
    const set = new Set<string>();
    engagements
      .filter(e => e.gentleStartId === gentleStart.id || e.habitId === gentleStart.habitId)
      .forEach(e => set.add(e.date));
    return set;
  }, [engagements, gentleStart.id, gentleStart.habitId]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const daysSinceStart = differenceInDays(new Date(), parseISO(gentleStart.startDate));
  const currentDay = Math.min(Math.max(daysSinceStart + 1, 1), 21);
  const engagedCount = engagedDates.size;
  const isComplete = gentleStart.completed || currentDay >= 21;

  // Detect re-engagement after a gap — true only when:
  // 1. The user has engaged at least once before
  // 2. Today they have engaged (they just came back)
  // 3. Yesterday they had NOT engaged (there was a real gap)
  // "Returning is the practice." surfaces on this condition only.
  const isReturning = useMemo(() => {
    if (engagedCount === 0) return false;
    if (!engagedDates.has(today)) return false;
    const yesterday = format(
      new Date(new Date().setDate(new Date().getDate() - 1)),
      'yyyy-MM-dd'
    );
    // Must have at least one past engaged day that is not today
    const hasPriorEngagement = [...engagedDates].some(d => d !== today);
    return hasPriorEngagement && !engagedDates.has(yesterday);
  }, [engagedDates, today, engagedCount]);

  // Rows: 3 rows × 7 cols
  const rows = [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21)];

  return (
    <div className="rounded-xl p-5 mt-4"
         style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(0,0,0,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium" style={{ color: '#2B2B2B' }}>
            {isComplete ? '21-day exploration complete' : `Day ${currentDay} of 21`}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            {isComplete
              ? `You showed up ${engagedCount} times. What did you learn?`
              : `${engagedCount} day${engagedCount !== 1 ? 's' : ''} engaged so far`}
          </p>
        </div>

        {/* Progress fraction */}
        <div className="text-right">
          <span className="text-2xl font-light text-stone-500">{engagedCount}</span>
          <span className="text-sm text-stone-400"> / 21</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full mb-5 overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(currentDay / 21) * 100}%`, backgroundColor: '#B8860B' }}
        />
      </div>

      {/* 21-cell grid — 3 rows × 7 cols */}
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((day, colIndex) => {
              const dayNum = rowIndex * 7 + colIndex + 1;
              const dateStr = format(day, 'yyyy-MM-dd');
              const isEngaged = engagedDates.has(dateStr);
              const isPast = dateStr < today;
              const isDayToday = isToday(day);
              const isFutureDay = isFuture(day) && !isDayToday;
              const isMilestone = dayNum in MILESTONES;

              return (
                <div key={dateStr} className="flex flex-col items-center gap-1 flex-1">
                  {/* Cell */}
                  <div
                    title={`Day ${dayNum} — ${format(day, 'MMM d')}${isEngaged ? ' (engaged)' : ''}`}
                    className="w-full aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200 relative"
                    style={
                      isEngaged
                        ? { backgroundColor: '#3C3C38', color: '#FFFEF9', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                        : isDayToday
                          ? { backgroundColor: 'var(--card)', border: '2px solid #B8860B', color: '#525252' }
                          : isPast
                            ? { backgroundColor: 'var(--card)', border: '1px solid rgba(0,0,0,0.10)', color: '#A3A3A3' }
                            : { backgroundColor: 'var(--card)', border: '1px solid rgba(0,0,0,0.05)', color: '#D4D4D4' }
                    }
                  >
                    {dayNum}
                    {/* Milestone dot */}
                    {isMilestone && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>

                  {/* Day label on bottom row */}
                  {rowIndex === 2 && (
                    <span className="text-[9px] text-stone-400">
                      {format(day, 'MMM d')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Milestone legend */}
      <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          <span className="text-xs text-stone-400">Milestone (day 7, 14, 21)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: '#3C3C38' }} />
          <span className="text-xs text-stone-400">Engaged</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded inline-block" style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(0,0,0,0.10)' }} />
          <span className="text-xs text-stone-400">Not yet</span>
        </div>
      </div>

      {/* Re-engagement — shown the day a user returns after a gap */}
      {isReturning && !isComplete && (
        <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p className="text-sm text-stone-500 italic" style={{ fontFamily: 'var(--font-display)' }}>
            Returning is the practice.
          </p>
        </div>
      )}

      {/* Celebration state */}
      {isComplete && (
        <div className="mt-4 p-3 rounded-lg text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <p className="text-sm font-medium" style={{ color: '#2B2B2B' }}>21 days explored ✦</p>
          <p className="text-xs text-stone-400 mt-1">
            Whether you showed up every day or a few times, you gave this a real try.
            What did you discover about yourself?
          </p>
        </div>
      )}
    </div>
  );
}
