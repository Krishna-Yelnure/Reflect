import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, TrendingUp, Eye } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { generateInsights, getInnerStateDistribution } from '@/app/utils/insights';
import { LanguageInsights } from '@/app/components/LanguageInsights';
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
// Horizontal bars — emotional texture, never a score.
// No percentages, no comparison language. Presence only. Copy Audit Standard.

function InnerStateChart({ entries }: { entries: JournalEntry[] }) {
  const dist = useMemo(() => getInnerStateDistribution(entries), [entries]);

  if (dist.total < 3) return null;

  const bars: { key: 'clear' | 'restless' | 'heavy'; label: string; colour: string; bg: string }[] = [
    { key: 'clear',    label: 'Clear',    colour: 'bg-emerald-300', bg: 'bg-emerald-50' },
    { key: 'restless', label: 'Restless', colour: 'bg-amber-300',   bg: 'bg-amber-50'   },
    { key: 'heavy',    label: 'Heavy',    colour: 'bg-stone-300',   bg: 'bg-stone-100'  },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8"
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-0.5" style={{ color: '#1C1C18' }}>How your mind has felt</h3>
        <p className="text-xs" style={{ color: '#787068' }}>
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
              <span className="text-xs w-14 shrink-0" style={{ color: '#787068' }}>{label}</span>
              <div className={`flex-1 rounded-full h-2 ${bg} overflow-hidden`}>
                <motion.div
                  className={`h-full rounded-full ${colour}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                />
              </div>
              <span className="text-xs w-6 shrink-0 text-right tabular-nums" style={{ color: '#787068' }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Tiered empty states ────────────────────────────────────────────────────────
// Three states by data density — never a void, never alarming.

function BuildingState({ entryCount }: { entryCount: number }) {
  const message = entryCount === 0
    ? "Keep writing. Patterns take a little time to surface."
    : entryCount < 5
    ? "Keep writing. Patterns take a little time to surface."
    : "Your story is starting to take shape.";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-12 text-center"
    >
      <p className="text-base" style={{ color: '#787068' }}>{message}</p>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Insights({ entries }: InsightsProps) {
  const insights = useMemo(() => generateInsights(entries), [entries]);

  // Data threshold — need at least 5 entries before surfacing patterns
  const sufficientData = entries.length >= 5;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2" style={{ color: '#1C1C18' }}>Insights</h2>
        <p style={{ color: '#4A4844' }}>Patterns and observations from your entries</p>
      </div>

      {/* Inner state — shows whenever there's enough inner state data, regardless of threshold */}
      <InnerStateChart entries={entries} />

      {!sufficientData ? (
        <BuildingState entryCount={entries.length} />
      ) : (
        <>
          {insights.length > 0 && (
            <div className="space-y-4 mb-10">
              {insights.map((insight, index) => {
                const Icon = insightIcons[insight.type];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className="p-6"
                      style={{ backgroundColor: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                          <Icon className="size-5" style={{ color: '#4A4844' }} />
                        </div>
                        <div className="flex-1">
                          <p style={{ color: '#1C1C18' }}>{insight.text}</p>
                          <p className="text-sm mt-1 capitalize" style={{ color: '#787068' }}>
                            {insight.period}ly {insight.type}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Language patterns — absorbed from LanguageInsights standalone view */}
          <div className="mt-2">
            <LanguageInsights entries={entries} />
          </div>

          {insights.length === 0 && (
            <p className="text-sm mt-8" style={{ color: '#787068' }}>
              Keep writing. Broader patterns will emerge over time.
            </p>
          )}
        </>
      )}

      {/* About section — only shown when there's something to show */}
      {sufficientData && (
        <div className="mt-12 p-6 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
          <h3 className="font-medium mb-2" style={{ color: '#1C1C18' }}>About Insights</h3>
          <p className="text-sm" style={{ color: '#4A4844' }}>
            These observations surface from what you've written. No judgements, no advice —
            patterns that were always there, made visible.
          </p>
        </div>
      )}
    </div>
  );
}
