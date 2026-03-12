import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Archive, Play, Edit2, Trash2, CheckCircle2, Circle, Target } from 'lucide-react';
import { format, parseISO, differenceInDays, eachDayOfInterval } from 'date-fns';
import type { Habit, GentleStart, HabitEngagement, JournalEntry } from '@/app/types';
import { habitsStorage } from '@/app/utils/habits';
import { GentleStartTracker } from '@/app/components/GentleStartTracker';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';

/**
 * HabitBuilder Component (v3.1)
 * 
 * Design Philosophy:
 * - Acts as a "container for exploration, not a tracker for compliance"
 * - Helps users answer "Where am I in this practice?" not "Am I doing well?"
 * - If the visualization makes a user feel behind, it has failed
 * - Reflection always counts as engagement
 * - Missed days are neutral, returning is success
 * - No streaks, no performance metrics, no urgency language
 */

const reflectionPrompts = [
  'What helped today?',
  'What made this harder?',
  'Did this fit your life today?',
  'Would a smaller version feel better?',
  'What did you notice?',
  'How did this feel?',
];

interface HabitBuilderProps {
  entries: JournalEntry[];
}

export function HabitBuilder({ entries }: HabitBuilderProps) {
  const [habits, setHabits] = useState<Habit[]>(habitsStorage.getHabits());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', why: '' });
  const [showArchived, setShowArchived] = useState(false);
  const [engagingHabit, setEngagingHabit] = useState<string | null>(null);
  const [engagementNote, setEngagementNote] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string>(reflectionPrompts[0]);

  const activeHabits = habits.filter(h => !h.isArchived);
  const archivedHabits = habits.filter(h => h.isArchived);

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.why.trim()) return;

    habitsStorage.addHabit({
      name: formData.name,
      why: formData.why,
      isArchived: false,
    });
    setHabits(habitsStorage.getHabits());
    setFormData({ name: '', why: '' });
    setIsAdding(false);
    toast.success('Habit created');
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim() || !formData.why.trim()) return;

    habitsStorage.updateHabit(editingId, {
      name: formData.name,
      why: formData.why,
    });
    setHabits(habitsStorage.getHabits());
    setEditingId(null);
    setFormData({ name: '', why: '' });
    toast.success('Habit updated');
  };

  const startGentleStart = (habitId: string) => {
    habitsStorage.startGentleStart(habitId);
    toast.success('21-day gentle start begun');
    setHabits([...habits]); // Trigger re-render
  };

  const recordEngagement = (habitId: string, type: HabitEngagement['type']) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const gentleStart = habitsStorage.getActiveGentleStart(habitId);

    habitsStorage.addEngagement({
      habitId,
      gentleStartId: gentleStart?.id,
      date: today,
      type,
      note: engagementNote || undefined,
    });

    setEngagingHabit(null);
    setEngagementNote('');
    toast.success('Engagement recorded');
    setHabits([...habits]); // Trigger re-render
  };

  const archiveHabit = (habitId: string) => {
    habitsStorage.archiveHabit(habitId);
    setHabits(habitsStorage.getHabits());
    toast.success('Habit archived');
  };

  const startEdit = (habit: Habit) => {
    setEditingId(habit.id);
    setFormData({ name: habit.name, why: habit.why });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', why: '' });
  };

  const completeGentleStart = (startId: string) => {
    habitsStorage.completeGentleStart(startId);
    toast.success('Practice window completed');
    setHabits([...habits]); // Trigger re-render
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Habit Builder</h2>
        <p className="text-stone-600">
          Optional support for routines you want to explore
        </p>
      </div>

      {habits.length === 0 && !isAdding && (
        <Card className="p-8 text-center mb-6" style={{ backgroundColor: 'var(--card)' }}>
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Target className="size-8 text-amber-700" />
            </div>
          </div>
          <h3 className="text-lg font-medium mb-3">Welcome to Habit Builder</h3>
          <p className="text-stone-600 mb-4">
            This section is completely optional. It exists to help you build routines gently,
            if and when you want to.
          </p>
          <p className="text-sm text-stone-500 mb-6">
            Your journaling experience remains unchanged whether you use this or not.
          </p>
          <div style={{ backgroundColor: '#F0EBE2' }} className="p-4 rounded-lg border border-stone-200 text-left max-w-md mx-auto">
            <p className="text-sm font-medium mb-2">How it works:</p>
            <ol className="text-sm text-stone-600 space-y-2 list-decimal list-inside">
              <li>Create a habit you want to explore</li>
              <li>Add personal meaning (why it matters to you)</li>
              <li>Optionally start a 21-day gentle start window</li>
              <li>See the visualization appear as you engage</li>
            </ol>
          </div>
        </Card>
      )}

      {/* Active Habits */}
      <div className="space-y-4 mb-6">
        <AnimatePresence mode="popLayout">
          {activeHabits.map((habit, index) => {
            const gentleStart = habitsStorage.getActiveGentleStart(habit.id);
            const allEngagements = habitsStorage.getEngagementsForHabit(habit.id);
            const hasEngagedToday = habitsStorage.hasEngagementToday(habit.id);

            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                {editingId === habit.id ? (
                  <Card className="p-6 space-y-4 border-2 border-stone-300">
                    <div>
                      <Label className="text-sm mb-2 block">What you want to practice</Label>
                      <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Morning pages, Walk, Meditation"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Why this matters to you</Label>
                      <Textarea
                        value={formData.why}
                        onChange={e => setFormData({ ...formData, why: e.target.value })}
                        placeholder="Personal meaning helps habits stick..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdate}>Save Changes</Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg mb-1">{habit.name}</h3>
                        <p className="text-sm text-stone-600 mb-3">{habit.why}</p>
                        {gentleStart && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            21-Day Gentle Start
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(habit)}
                          className="text-stone-400 hover:text-stone-700"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => archiveHabit(habit.id)}
                          className="text-stone-400 hover:text-stone-600"
                        >
                          <Archive className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Gentle Start Progress */}
                    {gentleStart && (
                      <GentleStartTracker
                        gentleStart={gentleStart}
                        engagements={allEngagements.filter(e => e.gentleStartId === gentleStart.id)}
                      />
                    )}

                    {/* Engagement Actions */}
                    {engagingHabit === habit.id ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-3 p-4 rounded-lg" style={{ backgroundColor: '#E8E2D8' }}>
                        <Label className="text-sm">Optional reflection</Label>
                        <select
                          value={selectedPrompt}
                          onChange={e => setSelectedPrompt(e.target.value)}
                          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                        >
                          {reflectionPrompts.map(prompt => (
                            <option key={prompt} value={prompt}>
                              {prompt}
                            </option>
                          ))}
                        </select>
                        <Textarea
                          value={engagementNote}
                          onChange={e => setEngagementNote(e.target.value)}
                          placeholder="Your thoughts (optional)..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => recordEngagement(habit.id, 'performed')}
                          >
                            I did this today
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => recordEngagement(habit.id, 'reflected')}
                          >
                            Just reflecting
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => recordEngagement(habit.id, 'noted-difficulty')}
                          >
                            It was hard today
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEngagingHabit(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="mt-4 flex gap-2">
                        {!hasEngagedToday && (
                          <Button
                            size="sm"
                            onClick={() => setEngagingHabit(habit.id)}
                            className="gap-2"
                          >
                            <CheckCircle2 className="size-4" />
                            Record Today
                          </Button>
                        )}
                        {hasEngagedToday && (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="size-3" />
                            Engaged today
                          </Badge>
                        )}
                        {!gentleStart && allEngagements.length === 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startGentleStart(habit.id)}
                            className="gap-2"
                          >
                            <Play className="size-4" />
                            Start 21-Day Window
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add New Habit */}
        {isAdding ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 space-y-4 border-2 border-stone-300">
              <div>
                <Label className="text-sm mb-2 block">What you want to practice</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Morning pages, Walk, Meditation"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-sm mb-2 block">Why this matters to you</Label>
                <Textarea
                  value={formData.why}
                  onChange={e => setFormData({ ...formData, why: e.target.value })}
                  placeholder="Personal meaning helps habits stick..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAdd}
                  disabled={!formData.name.trim() || !formData.why.trim()}
                >
                  Create Habit
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full gap-2">
            <Plus className="size-4" />
            Add a Habit to Explore
          </Button>
        )}
      </div>

      {/* Archived Habits */}
      {archivedHabits.length > 0 && (
        <div className="mt-8">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-sm text-stone-500 hover:text-stone-700 mb-4"
          >
            {showArchived ? 'Hide' : 'Show'} archived habits ({archivedHabits.length})
          </button>
          <AnimatePresence>
            {showArchived && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {archivedHabits.map(habit => (
                  <Card key={habit.id} className="p-4 opacity-60">
                    <p className="font-medium">{habit.name}</p>
                    <p className="text-sm text-stone-600">{habit.why}</p>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Educational Footer */}
      <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: '#E8E2D8' }}>
        <h3 className="font-medium mb-2">About Habit Builder</h3>
        <p className="text-sm text-stone-600 mb-3">
          This space exists to support routine-building through reflection and meaning, not
          compliance. Missed days are neutral. Returning is success.
        </p>
        <p className="text-sm text-stone-500">
          The 21-day gentle start is a supported window to explore a habit—not a test of
          discipline. Reflection always counts as engagement.
        </p>
      </div>
    </div>
  );
}

interface GentleStartProgressProps {
  gentleStart: GentleStart;
  engagements: HabitEngagement[];
  onComplete: () => void;
  habitName: string;
  onReflect: () => void;
}

function GentleStartProgress({ gentleStart, engagements, onComplete, habitName, onReflect }: GentleStartProgressProps) {
  const days = eachDayOfInterval({
    start: parseISO(gentleStart.startDate),
    end: parseISO(gentleStart.endDate),
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const daysElapsed = differenceInDays(new Date(), parseISO(gentleStart.startDate));
  const isComplete = parseISO(gentleStart.endDate) < new Date();

  const engagementDates = new Set(engagements.map(e => e.date));

  // Phase-based orientation copy
  const getOrientationCopy = () => {
    if (daysElapsed <= 7) {
      return "You're at the beginning of this practice.";
    } else if (daysElapsed <= 14) {
      return "You've been checking in in your own way.";
    } else {
      return "This reflection window is coming to a close.";
    }
  };

  return (
    <div className="mt-4 p-4 rounded-lg border" style={{ backgroundColor: "var(--habit-track-bg, #F0E8D8)", borderColor: "var(--habit-track-border, #C8A87A)" }}>
      {/* Progress Tiles - No numbers, purely visual */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isEngaged = engagementDates.has(dayStr);
          const isPast = dayStr < today;
          const isToday = dayStr === today;

          return (
            <div
              key={dayStr}
              className={`
                aspect-square rounded-full flex items-center justify-center
                transition-all duration-300
                ${isEngaged ? 'bg-stone-700' : 'bg-transparent border-2 border-stone-300'}
                ${isToday && !isEngaged ? 'border-amber-500 border-dashed scale-110' : ''}
                ${!isPast && !isToday ? 'opacity-40' : ''}
              `}
              title={format(day, 'MMM d')}
            />
          );
        })}
      </div>

      {/* Orientation Copy - Phase-based, gentle */}
      {!isComplete && (
        <p className="text-sm text-stone-700 mb-3 text-center italic">
          {getOrientationCopy()}
        </p>
      )}

      {/* Reflection Tie-In */}
      {!isComplete && (
        <div className="space-y-2 mt-4 pt-4 border-t border-stone-300">
          <p className="text-sm text-stone-800 font-medium">
            What are you noticing so far?
          </p>
          {engagements.length > 0 && (
            <p className="text-xs text-stone-600 mb-2">
              You've engaged {engagements.length} {engagements.length === 1 ? 'time' : 'times'} during this window
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onReflect}
            className="w-full text-stone-600 border-stone-300 hover:bg-stone-100"
          >
            Write a reflection
          </Button>
        </div>
      )}

      {/* Completion State */}
      {isComplete && !gentleStart.completed && (
        <div className="space-y-3 mt-4 pt-4 border-t border-stone-300">
          <div style={{ backgroundColor: '#F0EBE2' }} className="p-4 rounded-lg">
            <p className="font-medium text-stone-800 mb-2">
              This 21-day Gentle Start is complete.
            </p>
            <p className="text-sm text-stone-700 mb-1">
              This wasn't about consistency.
            </p>
            <p className="text-sm text-stone-700">
              It was about learning how this habit fits into your life.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-stone-700 font-medium uppercase tracking-wide">
              What next?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onComplete}
                className="text-stone-600 border-stone-300 hover:bg-stone-100"
              >
                Complete & Continue
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onComplete}
                className="text-stone-600 border-stone-300 hover:bg-stone-100"
              >
                Archive Habit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Completed State */}
      {gentleStart.completed && (
        <div className="mt-4 pt-4 border-t border-stone-300">
          <p className="text-sm text-stone-600 font-medium text-center">
            Practice window completed ✓
          </p>
        </div>
      )}
    </div>
  );
}