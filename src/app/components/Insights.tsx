import { useMemo, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { format, getWeekOfMonth } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { getInnerStateDistribution } from '@/app/utils/insights';
import { getLanguageFingerprint, getRecurringWords } from '@/app/utils/language-analysis';
import { generateSubtleReflections, generateOneThreadQuestion, SubtleReflection } from '@/app/utils/ai';
import { Button } from '@/app/components/ui/button';

interface InsightsProps {
  entries: JournalEntry[];
  sendPrompt?: (question: string) => void;
}

// ── Inner State Chart (Existing) ──────────────────────────────────────────────
function InnerStateChart({ entries }: { entries: JournalEntry[] }) {
  const dist = useMemo(() => getInnerStateDistribution(entries), [entries]);

  if (dist.total < 1) return null;

  const bars: { key: 'clear' | 'restless' | 'heavy'; label: string; colour: string; bg: string }[] = [
    { key: 'clear',    label: 'Clear',    colour: 'bg-stone-300', bg: 'bg-stone-50' },
    { key: 'restless', label: 'Restless', colour: 'bg-amber-300',   bg: 'bg-amber-50'   },
    { key: 'heavy',    label: 'Heavy',    colour: 'bg-stone-300',   bg: 'bg-stone-100'  },
  ];

  return (
    <div className="p-4 rounded-xl border border-stone-200/60" style={{ backgroundColor: 'rgba(253,252,248,0.7)' }}>
      <h3 className="text-sm font-medium mb-4 text-stone-600">Mind state this week</h3>
      <div className="flex gap-2 items-start justify-between">
        {bars.map(({ key, label }) => {
          const count = dist[key] || 0;
          const bgClass = key === 'clear' ? 'bg-[#3C3C38]' : key === 'restless' ? 'bg-indigo-50 border-indigo-200' : 'bg-[#3C3C38]';
          const textClass = key === 'clear' ? 'text-white' : key === 'restless' ? 'text-indigo-600' : 'text-white';
          const labelClass = key === 'clear' ? 'text-stone-300' : key === 'restless' ? 'text-indigo-400' : 'text-stone-300';
          
          return (
            <div key={key} className={`flex-1 flex flex-col items-center justify-center py-4 rounded-lg border border-transparent ${bgClass}`}>
              <span className={`text-2xl font-light ${textClass}`}>
                {count}
              </span>
              <span className={`text-xs mt-1 ${labelClass}`}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export function Insights({ entries, sendPrompt }: InsightsProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [reflections, setReflections] = useState<SubtleReflection[] | null>(null);
  const [threadQuestion, setThreadQuestion] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Filter entries based on selected time range
  const filteredEntries = useMemo(() => {
    if (timeRange === 'all') return entries;
    const now = new Date();
    const days = timeRange === 'week' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);
    return entries.filter(e => new Date(e.date) >= cutoff);
  }, [entries, timeRange]);

  useEffect(() => {
    let mounted = true;
    async function fetchAI() {
      setIsLoadingAI(true);
      try {
        const [refs, question] = await Promise.all([
          generateSubtleReflections(filteredEntries),
          generateOneThreadQuestion(filteredEntries)
        ]);
        if (mounted) {
          setReflections(refs);
          setThreadQuestion(question);
        }
      } catch (err) {
        console.error("AI error", err);
      } finally {
        if (mounted) setIsLoadingAI(false);
      }
    }
    
    if (filteredEntries.length > 0) {
      fetchAI();
    } else {
      setReflections([]);
      setThreadQuestion(null);
    }
    return () => { mounted = false; };
  }, [filteredEntries]);

  const dateStr = format(new Date(), 'MMMM yyyy');
  const weekNum = getWeekOfMonth(new Date());

  const totalEntries = filteredEntries.length;

  const moodCounts = filteredEntries.reduce((acc, entry) => {
    if (entry.mood) acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const dominantMood = Object.keys(moodCounts).length > 0 
    ? Object.entries(moodCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0] 
    : 'None';

  const clarityEntries = filteredEntries.filter(e => e.clarity !== undefined);
  const avgDepthNumber = clarityEntries.length > 0 
    ? (clarityEntries.reduce((sum, e) => sum + (e.clarity || 0), 0) / clarityEntries.length)
    : 0;
  const avgDepthText = avgDepthNumber > 0 ? `${Math.round(avgDepthNumber)} / 5` : '—';

  let deepestEntry: JournalEntry | null = null;
  let maxWords = 0;
  filteredEntries.forEach((e: JournalEntry) => {
    if (e.whatMatters) {
      const words = e.whatMatters.trim().split(/\s+/).length;
      if (words > maxWords) {
        maxWords = words;
        deepestEntry = e;
      }
    }
  });

  // Extract exactly one line excerpt
  const deepestExcerpt = deepestEntry?.whatMatters 
    ? deepestEntry.whatMatters.split('\n')[0].substring(0, 80) + (deepestEntry.whatMatters.length > 80 ? '...' : '') 
    : 'No entries yet';
  const deepestDate = deepestEntry ? format(new Date(deepestEntry.date), 'MMM d, yyyy') : '—';

  const fingerprint = useMemo(() => getLanguageFingerprint(filteredEntries), [filteredEntries]);
  const fpTotal = fingerprint.total > 0 ? fingerprint.total : 1;

  const recurringWords = useMemo(() => getRecurringWords(filteredEntries), [filteredEntries]);

  if (entries.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 min-h-[70vh] flex items-center justify-center">
        <div className="p-10 rounded-2xl border border-[rgba(0,0,0,0.04)] bg-white/60 shadow-sm text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-full border border-stone-100 bg-stone-50 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">Patterns emerge in time</h3>
          <p className="text-stone-500 leading-relaxed text-[15px]">
            Keep writing. Your insights dashboard will automatically organize and reflect your patterns once you have some entries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8" style={{ color: '#1C1C18' }}>
      
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[13px] font-medium tracking-wide text-stone-500 uppercase">
            {timeRange === 'week' ? `Week ${weekNum} of 4 • ${dateStr}` : timeRange === 'month' ? dateStr : 'All time history'}
          </p>
          <div className="flex gap-2 text-stone-400">
             <button onClick={() => setTimeRange('week')} className={`px-3 py-1 rounded-full border text-[11px] uppercase tracking-wider transition-colors ${timeRange === 'week' ? 'border-stone-300 text-stone-700 bg-white shadow-sm' : 'border-transparent hover:text-stone-600'}`}>Week</button>
             <button onClick={() => setTimeRange('month')} className={`px-3 py-1 rounded-full border text-[11px] uppercase tracking-wider transition-colors ${timeRange === 'month' ? 'border-stone-300 text-stone-700 bg-white shadow-sm' : 'border-transparent hover:text-stone-600'}`}>Month</button>
             <button onClick={() => setTimeRange('all')} className={`px-3 py-1 rounded-full border text-[11px] uppercase tracking-wider transition-colors ${timeRange === 'all' ? 'border-stone-300 text-stone-700 bg-white shadow-sm' : 'border-transparent hover:text-stone-600'}`}>All time</button>
          </div>
        </div>
        <h2 className="text-3xl tracking-tight text-stone-900" style={{ fontFamily: 'var(--font-display)' }}>Your insights so far</h2>
      </div>

      <div className="grid grid-cols-4 gap-6 pb-6 mt-6 border-b border-stone-200/50">
        <div>
          <p className="text-[13px] font-medium text-stone-500 mb-2">Entries</p>
          <p className="text-[28px] font-light text-stone-800">{totalEntries}</p>
        </div>
        <div>
          <p className="text-[13px] font-medium text-stone-500 mb-2">Dominant mood</p>
          <p className="text-[28px] font-light text-stone-800 capitalize">{dominantMood}</p>
        </div>
        <div>
          <p className="text-[13px] font-medium text-stone-500 mb-2">Avg. depth</p>
          <p className="text-[28px] font-light text-stone-800">{avgDepthText}</p>
        </div>
        <div>
          <p className="text-[13px] font-medium text-stone-500 mb-2">Deepest entry</p>
          {deepestEntry ? (
            <>
              <p className="text-xl font-light text-stone-800 -mt-0.5 leading-snug">{deepestDate}</p>
            </>
          ) : (
             <p className="text-[28px] font-light text-stone-800">—</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr,360px] gap-6">
        
        <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[rgba(253,252,248,0.7)]">
          <h3 className="text-sm font-medium mb-6 text-stone-600">Language fingerprint</h3>
          
          <div className="space-y-6">
            {[
              { label: 'Cognitive', count: fingerprint.cognitive, color: 'bg-indigo-500', bg: 'bg-indigo-100' },
              { label: 'Relational', count: fingerprint.relational, color: 'bg-emerald-500', bg: 'bg-emerald-100' },
              { label: 'Somatic', count: fingerprint.somatic, color: 'bg-[#E35D33]', bg: 'bg-amber-100' },
              { label: 'Aspirational', count: fingerprint.aspirational, color: 'bg-amber-400', bg: 'bg-amber-100/50' }
            ].map(({ label, count, color, bg }) => {
              const pct = Math.round((count / fpTotal) * 100);
              return (
                <div key={label} className="space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-stone-700">{label}</span>
                    <span className="text-stone-500 tabular-nums">{pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#EAE8E1] rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-stone-500 mt-6 pt-5 border-t border-[rgba(0,0,0,0.06)] flex items-center">
            You tend to process through {
              fingerprint.cognitive > fingerprint.somatic && fingerprint.cognitive > fingerprint.relational ? 'thinking first, feeling second.' :
              fingerprint.somatic > fingerprint.cognitive ? 'feeling first in the body.' :
              fingerprint.relational > fingerprint.cognitive ? 'connection with others.' :
              'a balanced blend of thought and feeling.'
            }
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[rgba(253,252,248,0.7)]">
            <h3 className="text-sm font-medium mb-4 text-stone-600">Recurring words</h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {recurringWords.length > 0 ? recurringWords.map((w: { word: string; count: number }, i: number) => {
                const isTop = i === 0;
                const isSecond = i === 1;
                const baseClass = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border";
                let styleClass = "bg-white border-stone-200 text-stone-600";
                if (isTop) styleClass = "bg-indigo-50 border-indigo-100 text-indigo-700";
                else if (isSecond) styleClass = "bg-emerald-50 border-emerald-100 text-emerald-700";
                else styleClass = "bg-[#FCFBF8] border-[rgba(0,0,0,0.06)] text-[#787068]";
                
                return (
                  <span key={w.word} className={`${baseClass} ${styleClass}`}>
                    {w.word} <span className="opacity-60 pl-1.5 leading-none mt-0.5 border-l border-current">×{w.count}</span>
                  </span>
                )
              }) : (
                <span className="text-sm text-stone-400">Not enough data yet.</span>
              )}
            </div>
          </div>
          
          <InnerStateChart entries={filteredEntries} />
        </div>

      </div>

      <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[rgba(253,252,248,0.7)] mt-2">
        <h3 className="text-sm font-medium mb-6 text-stone-700">Subtle reflections <span className="text-stone-400 font-normal">· from your entries</span></h3>
        
        {isLoadingAI && (!reflections || reflections.length === 0) ? (
          <div className="py-8 text-center border border-dashed border-stone-200 rounded-xl">
             <p className="text-sm text-stone-400 animate-pulse">Reading recent entries as a quiet witness...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {reflections && reflections.map((ref, i) => {
              const borderColors = ['border-indigo-400', 'border-emerald-400', 'border-amber-400', 'border-rose-400'];
              const bColor = borderColors[i % borderColors.length];
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.15 }}
                  className={`pl-4 border-l-2 ${bColor}`}
                >
                  <p className="text-stone-800 text-[15px] leading-relaxed mb-1">{ref.text}</p>
                  <p className="text-[13px] text-stone-500 italic">{ref.category}.</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {threadQuestion && (
        <div className="px-6 py-6 pb-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-[rgba(253,252,248,0.7)] mt-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="px-3 py-1 bg-[#F5F8E4] text-[#718A3A] text-[10px] uppercase font-bold tracking-wider rounded-full border border-[rgba(0,0,0,0.06)]">bridges to action</span>
          </div>
          
          <h3 className="text-sm font-medium mb-6 text-stone-600">One thread to pull</h3>
          
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
            className="text-[22px] text-stone-800 leading-snug pr-8 mb-8"
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
          >
            {threadQuestion}
          </motion.p>

          <Button 
            variant="outline"
            className="gap-2 bg-transparent hover:bg-[rgba(0,0,0,0.03)] border-stone-300 text-stone-800 rounded-lg shadow-sm"
            onClick={() => sendPrompt && sendPrompt(threadQuestion)}
          >
            Reflect on this <ArrowUpRight className="size-4" />
          </Button>
        </div>
      )}

    </div>
  );
}
