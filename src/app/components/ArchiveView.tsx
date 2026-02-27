import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import type { JournalEntry } from '@/app/types';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

interface ArchiveViewProps {
  entries: JournalEntry[];
  onSelectEntry: (date: string) => void;
}

interface YearData {
  year: number;
  months: MonthData[];
  totalEntries: number;
}

interface MonthData {
  month: number;
  entries: JournalEntry[];
}

export function ArchiveView({ entries, onSelectEntry }: ArchiveViewProps) {
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([new Date().getFullYear()]));
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const archiveData = useMemo(() => {
    const yearsMap = new Map<number, Map<number, JournalEntry[]>>();

    entries.forEach(entry => {
      const date = parseISO(entry.date);
      const year = getYear(date);
      const month = getMonth(date);

      if (!yearsMap.has(year)) {
        yearsMap.set(year, new Map());
      }

      const yearMap = yearsMap.get(year)!;
      if (!yearMap.has(month)) {
        yearMap.set(month, []);
      }

      yearMap.get(month)!.push(entry);
    });

    const years: YearData[] = [];
    yearsMap.forEach((monthsMap, year) => {
      const months: MonthData[] = [];
      let totalEntries = 0;

      monthsMap.forEach((entries, month) => {
        months.push({ month, entries: entries.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )});
        totalEntries += entries.length;
      });

      years.push({
        year,
        months: months.sort((a, b) => b.month - a.month),
        totalEntries,
      });
    });

    return years.sort((a, b) => b.year - a.year);
  }, [entries]);

  const toggleYear = (year: number) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const toggleMonth = (yearMonth: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(yearMonth)) {
      newExpanded.delete(yearMonth);
    } else {
      newExpanded.add(yearMonth);
    }
    setExpandedMonths(newExpanded);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Archive</h2>
        <p className="text-slate-600">
          Your journal organized by time—a library, not a feed
        </p>
      </div>

      {archiveData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Your archive is empty. Start writing to build it.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {archiveData.map(yearData => {
            const isYearExpanded = expandedYears.has(yearData.year);

            return (
              <Card key={yearData.year} className="overflow-hidden">
                <button
                  onClick={() => toggleYear(yearData.year)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isYearExpanded ? (
                      <ChevronDown className="size-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="size-5 text-slate-400" />
                    )}
                    <h3 className="text-xl font-medium">{yearData.year}</h3>
                  </div>
                  <p className="text-sm text-slate-500">
                    {yearData.totalEntries} {yearData.totalEntries === 1 ? 'entry' : 'entries'}
                  </p>
                </button>

                {isYearExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-slate-200"
                  >
                    {yearData.months.map(monthData => {
                      const yearMonth = `${yearData.year}-${monthData.month}`;
                      const isMonthExpanded = expandedMonths.has(yearMonth);

                      return (
                        <div key={yearMonth} className="border-b border-slate-100 last:border-b-0">
                          <button
                            onClick={() => toggleMonth(yearMonth)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {isMonthExpanded ? (
                                <ChevronDown className="size-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="size-4 text-slate-400" />
                              )}
                              <p className="font-medium text-slate-700">
                                {monthNames[monthData.month]}
                              </p>
                            </div>
                            <p className="text-sm text-slate-500">
                              {monthData.entries.length}
                            </p>
                          </button>

                          {isMonthExpanded && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="px-6 pb-4 space-y-2"
                            >
                              {monthData.entries.map(entry => {
                                const preview =
                                  entry.whatHappened ||
                                  entry.feelings ||
                                  entry.freeWrite ||
                                  'No content';

                                return (
                                  <button
                                    key={entry.id}
                                    onClick={() => onSelectEntry(entry.date)}
                                    className="w-full text-left p-3 rounded-lg hover:bg-slate-100 transition-colors group"
                                  >
                                    <div className="flex items-start gap-3">
                                      <FileText className="size-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-600 mb-1">
                                          {format(parseISO(entry.date), 'EEEE, MMM d')}
                                        </p>
                                        <p className="text-sm text-slate-700 line-clamp-2">
                                          {preview}
                                        </p>
                                        {entry.mood && (
                                          <p className="text-xs text-slate-500 mt-1">
                                            Mood: {entry.mood}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
        <h3 className="font-medium mb-2">About the Archive</h3>
        <p className="text-sm text-slate-600">
          This view organizes your writing by year and month, letting you browse your life
          without opening every entry. Think of it as a library—structured, quiet, and yours.
        </p>
      </div>
    </div>
  );
}