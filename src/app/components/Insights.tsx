import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Lightbulb, TrendingUp, Eye } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { generateInsights } from '@/app/utils/insights';
import { Card } from '@/app/components/ui/card';

interface InsightsProps {
  entries: JournalEntry[];
}

const insightIcons = {
  pattern: Lightbulb,
  trend: TrendingUp,
  observation: Eye,
};

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
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-slate-400 text-lg">
          Keep writing. Insights will emerge as patterns develop.
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
          patterns you might not notice day-to-day. No judgments, no advice—just reflections
          of what you've written.
        </p>
      </div>
    </div>
  );
}
