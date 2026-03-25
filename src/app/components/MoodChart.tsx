import { useMemo } from 'react';
import { motion } from 'motion/react';
import { format, parseISO, subDays, eachDayOfInterval } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { JournalEntry } from '@/app/types';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface MoodChartProps {
  entries: JournalEntry[];
}

const moodValues: Record<string, number> = {
  great: 5,
  good: 4,
  okay: 3,
  low: 2,
  difficult: 1,
};

const moodColors: Record<string, string> = {
  great: '#B8860B',    /* Dark Gold — warm, premium */
  good: '#7c9a7e',     /* Sage — earthy, not clinical */
  okay: '#7A7060',     /* Warm stone — neutral */
  low: '#c49a3c',      /* Ochre — warm amber */
  difficult: '#b87d8a', /* Dusty rose — warm, not alarming */
};

export function MoodChart({ entries }: MoodChartProps) {
  const moodData = useMemo(() => {
    const now = new Date();
    const last30Days = eachDayOfInterval({
      start: subDays(now, 29),
      end: now,
    });

    return last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entries.find(e => e.date === dateStr);
      
      return {
        date: format(date, 'MMM d'),
        fullDate: dateStr,
        mood: entry?.mood ? moodValues[entry.mood] : null,
        energy: entry?.energy || null,
        moodLabel: entry?.mood || null,
      };
    });
  }, [entries]);

  const moodDistribution = useMemo(() => {
    const counts = entries.reduce((acc, entry) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([mood, count]) => ({
      mood: mood.charAt(0).toUpperCase() + mood.slice(1),
      count,
      fill: moodColors[mood],
    }));
  }, [entries]);

  const averageEnergy = useMemo(() => {
    const withEnergy = entries.filter(e => e.energy !== undefined);
    if (withEnergy.length === 0) return 0;
    return (withEnergy.reduce((sum, e) => sum + (e.energy || 0), 0) / withEnergy.length).toFixed(1);
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 min-h-[70vh] flex items-center justify-center">
        <div className="p-10 rounded-2xl border border-[rgba(0,0,0,0.04)] bg-white/60 shadow-sm text-center max-w-md w-full">
          <div className="w-12 h-12 rounded-full border border-stone-100 bg-stone-50 flex items-center justify-center mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-stone-800 mb-2">Track your emotional landscape</h3>
          <p className="text-stone-500 leading-relaxed text-[15px]">
            Your mood and energy patterns will appear here as you add entries. This space will become a visual history of how you've felt over time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Mood & Energy</h2>
        <p className="text-stone-600">Visual patterns from your journal</p>
      </div>

      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h3 className="font-medium mb-4">Mood Over Time (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={moodData}>
                  <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7A7060" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7A7060" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,58,52,0.12)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9A9690"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]}
                    stroke="#9A9690"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const data = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#F0EBE2' }} className="p-3 rounded-lg shadow-lg border border-stone-200">
                          <p className="text-sm font-medium mb-1">{data.date}</p>
                          {data.moodLabel && (
                            <p className="text-sm text-stone-600 capitalize">
                              Mood: {data.moodLabel}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#7A7060"
                    strokeWidth={2}
                    fill="url(#moodGradient)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h3 className="font-medium mb-4">Mood Distribution</h3>
              {moodDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={moodDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,58,52,0.12)" />
                    <XAxis dataKey="mood" stroke="#9A9690" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9A9690" style={{ fontSize: '12px' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        return (
                          <div style={{ backgroundColor: '#F0EBE2' }} className="p-3 rounded-lg shadow-lg border border-stone-200">
                            <p className="text-sm font-medium">{payload[0].payload.mood}</p>
                            <p className="text-sm text-stone-600">
                              {payload[0].value} entries
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-stone-400 text-center py-12">
                  No mood data yet. Start tracking moods in your entries.
                </p>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="energy" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6">
              <h3 className="font-medium mb-4">Energy Levels (Last 30 Days)</h3>
              <div className="mb-6 flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-light text-stone-800">{averageEnergy}</div>
                  <div className="text-sm text-stone-500">Average Energy</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={moodData}>
                  <defs>
                    <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B8860B" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#B8860B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(60,58,52,0.12)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9A9690"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    ticks={[1, 2, 3, 4, 5]}
                    stroke="#9A9690"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const data = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: '#F0EBE2' }} className="p-3 rounded-lg shadow-lg border border-stone-200">
                          <p className="text-sm font-medium mb-1">{data.date}</p>
                          {data.energy && (
                            <p className="text-sm text-stone-600">
                              Energy: {data.energy}/5
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="energy"
                    stroke="#B8860B"
                    strokeWidth={2}
                    fill="url(#energyGradient)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
