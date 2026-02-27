import { motion } from 'motion/react';
import { MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { analyzeLanguagePatterns, detectCommonPhrases } from '@/app/utils/language-analysis';
import { Card } from '@/app/components/ui/card';

interface LanguageInsightsProps {
  entries: JournalEntry[];
}

export function LanguageInsights({ entries }: LanguageInsightsProps) {
  const patterns = analyzeLanguagePatterns(entries);
  const phrases = detectCommonPhrases(entries);

  if (patterns.length === 0 && phrases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400">
          Not enough data yet. Keep writing to see language patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="font-medium mb-1">Language Patterns</h3>
        <p className="text-sm text-slate-600">
          Descriptive observations from your recent writing
        </p>
      </div>

      {patterns.length > 0 && (
        <div className="space-y-3">
          {patterns.map((pattern, index) => {
            const Icon = pattern.context === 'self-critical' 
              ? TrendingDown 
              : pattern.context === 'positive' 
              ? TrendingUp 
              : MessageSquare;

            const colorClass = pattern.context === 'self-critical'
              ? 'text-amber-600 bg-amber-50'
              : pattern.context === 'positive'
              ? 'text-emerald-600 bg-emerald-50'
              : 'text-blue-600 bg-blue-50';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900 capitalize">
                        {pattern.phrase} appears frequently
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        Detected {pattern.frequency} times in recent entries
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {phrases.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Common phrases</h4>
          <div className="flex flex-wrap gap-2">
            {phrases.map((phrase, index) => (
              <motion.div
                key={phrase}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-700"
              >
                "{phrase}"
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-600">
          These are descriptive observations, not diagnoses. Your writing patterns may shift
          naturally over time.
        </p>
      </div>
    </div>
  );
}
