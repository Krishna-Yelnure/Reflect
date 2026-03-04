import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, TrendingUp, Eye } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { generateInsights, getInnerStateDistribution } from '@/app/utils/insights';
import { Card } from '@/app/components/ui/card';

interface InsightsProps {
  entries: JournalEntry[];
}

const insightIcons = {
  pattern: Lightbulb,
  trend: TrendingUp,
  observation: Eye,
};

// ── Inner State Chart ─────────────────────────────────────────────────────────
// Horizontal bar landscape — no percentages, no month-over-month comparison.
// Shows the distribution as visual texture, not a score. Copy Audit Standard.

function InnerStateChart({ entries }: { entries: JournalEntry[] }) {
  const dist = useMemo(() => getInnerStateDistribution(entries), [entries]);

  if (dist.total < 3) return null;  // not enough data to surface meaningfully

  const bars: { key: 'clear' | 'restless' | 'heavy'; label: string; colour: string; bg: string }[] = [
    { key: 'clear',    label: 'Clear',    colour: 'bg-emerald-300', bg: 'bg-emerald-50' },
    { key: 'restless', label: 'Restless', colour: 'bg-amber-300',   bg: 'bg-amber-50'   },
    { key: 'heavy',    label: 'Heavy',    colour: 'bg-slate-300',   bg: 'bg-slate-50'   },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8"
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-slate-700 mb-0.5">How your mind has felt</h3>
        <p className="text-xs text-slate-400">
          Based on {dist.total} {dist.total === 1 ? 'entry' : 'entries'} where you recorded inner state
        </p>
      </div>

      <div className="space-y-3">
        {bars.map(({ key, label, colour, bg }) => {
          const count = dist[key];
          if (count === 0) return null;
          const widthPct = Math.round((count / dist.total) * 100);
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-14 shrink-0">{label}</span>
              <div className={`flex-1 rounded-full h-2 ${bg} overflow-hidden`}>
                <motion.div
                  className={`h-full rounded-full ${colour}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <span className="text-xs text-slate-400 w-6 shrink-0 text-right tabular-nums">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Insights({ entries }: InsightsProps) {
  const insights = useMemo(() => generateInsights(entries), [entries]);

  if (entries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-slate-400 text-lg">
          Start journaling to discover patterns and insights about yourself.
        </p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl mb-2">Insights</h2>
          <p className="text-slate-600">Patterns and observations from your entries</p>
        </div>
        <InnerStateChart entries={entries} />
        <p className="text-slate-400 text-sm mt-8">
          Keep writing. Broader patterns will emerge over time.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Insights</h2>
        <p className="text-slate-600">
          Patterns and observations from your recent entries
        </p>
      </div>

      {/* Inner state distribution — shown before the insight cards */}
      <InnerStateChart entries={entries} />

      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insightIcons[insight.type];
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Icon className="size-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900">{insight.text}</p>
                    <p className="text-sm text-slate-500 mt-1 capitalize">
                      {insight.period}ly {insight.type}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-slate-50 rounded-lg">
        <h3 className="font-medium mb-2">About Insights</h3>
        <p className="text-sm text-slate-600">
          These observations are generated from your journal entries. They're meant to surface
          patterns you might not notice day-to-day. No judgments, no advice — just reflections
          of what you've written.
        </p>
      </div>
    </div>
  );
}
