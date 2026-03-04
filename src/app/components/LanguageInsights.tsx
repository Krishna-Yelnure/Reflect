import { motion } from 'motion/react';
import { MessageSquare } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { analyzeLanguagePatterns, detectCommonPhrases } from '@/app/utils/language-analysis';
import { Card } from '@/app/components/ui/card';

interface LanguageInsightsProps {
  entries: JournalEntry[];
}

// ── Language Insights ─────────────────────────────────────────────────────────
// Descriptive observations only. No diagnostic labels. No coloured context
// signals (amber = bad, green = good). The app names what's present — not what
// it means. Copy Audit Standard: every string passes the presence guard.

export function LanguageInsights({ entries }: LanguageInsightsProps) {
  const patterns = analyzeLanguagePatterns(entries);
  const phrases = detectCommonPhrases(entries);

  if (patterns.length === 0 && phrases.length === 0) {
    return null; // Parent (Insights.tsx) handles the empty state
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="font-medium mb-1" style={{ color: '#3C3C38' }}>Writing patterns</h3>
        <p className="text-sm" style={{ color: '#6b6b64' }}>
          Observations from your recent writing
        </p>
      </div>

      {patterns.length > 0 && (
        <div className="space-y-3">
          {patterns.map((pattern, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4" style={{ backgroundColor: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                    <MessageSquare className="size-4" style={{ color: '#6b6b64' }} />
                  </div>
                  <div className="flex-1">
                    <p style={{ color: '#3C3C38' }} className="capitalize">
                      {pattern.phrase} appears in recent entries
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#8a8a82' }}>
                      {pattern.frequency} occurrences in the last 30 days
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {phrases.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-3" style={{ color: '#6b6b64' }}>Phrases that appear often</h4>
          <div className="flex flex-wrap gap-2">
            {phrases.map((phrase, index) => (
              <motion.div
                key={phrase}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-1.5 rounded-full text-sm"
                style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#3C3C38' }}
              >
                "{phrase}"
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
        <p className="text-xs" style={{ color: '#8a8a82' }}>
          These are observations, not assessments. Writing patterns shift naturally over time.
        </p>
      </div>
    </div>
  );
}
