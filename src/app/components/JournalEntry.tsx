import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Sparkles, Save, X } from 'lucide-react';
import type { JournalEntry as JournalEntryType } from '@/app/types';
import { storage } from '@/app/utils/storage';
import { getSmartPrompt } from '@/app/utils/prompts';
import { getReflectionPrompt } from '@/app/utils/prompts-v2';
import { findSimilarEntries, createMemorySurface, memorySurfaceStorage } from '@/app/utils/memory-surface';
import { preferences } from '@/app/utils/preferences';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { TagManager } from '@/app/components/TagManager';
import { ReflectionModeSelector } from '@/app/components/ReflectionModeSelector';
import { MemorySurface } from '@/app/components/MemorySurface';
import { toast } from 'sonner';

interface JournalEntryProps {
  selectedDate: string;
  onSave: () => void;
  onCancel: () => void;
  allEntries: JournalEntry[];
  onViewEntry?: (date: string) => void;
}

const moods = [
  { value: 'great', label: 'Great', emoji: '✨' },
  { value: 'good', label: 'Good', emoji: '😊' },
  { value: 'okay', label: 'Okay', emoji: '😐' },
  { value: 'low', label: 'Low', emoji: '😔' },
  { value: 'difficult', label: 'Difficult', emoji: '😣' },
] as const;

const energyLevels = [1, 2, 3, 4, 5] as const;

export function JournalEntry({ selectedDate, onSave, onCancel, allEntries, onViewEntry }: JournalEntryProps) {
  const [entry, setEntry] = useState<Partial<JournalEntryType>>({
    whatHappened: '',
    feelings: '',
    whatMatters: '',
    insight: '',
    freeWrite: '',
    mood: undefined,
    energy: undefined,
    tags: [],
    reflectionType: 'daily',
  });
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [similarEntries, setSimilarEntries] = useState<JournalEntryType[]>([]);
  const [memoryDismissed, setMemoryDismissed] = useState(false);
  const prefs = preferences.get();

  useEffect(() => {
    // Load existing entry if it exists
    const existing = storage.getEntryByDate(selectedDate);
    if (existing) {
      setEntry(existing);
      setPrompt(''); // Don't show prompt for existing entries
    } else {
      const defaultPrompt = getSmartPrompt();
      setPrompt(defaultPrompt);
      setMemoryDismissed(false);
    }
  }, [selectedDate]);

  // Find similar entries for memory surfacing
  useEffect(() => {
    if (!prefs.memoryRemindersEnabled || memoryDismissed) {
      setSimilarEntries([]);
      return;
    }

    const timer = setTimeout(() => {
      const hasContent = entry.whatHappened || entry.feelings || entry.freeWrite;
      if (hasContent && allEntries.length > 3) {
        const similar = findSimilarEntries(entry, allEntries, 1);
        setSimilarEntries(similar);
      }
    }, 2000); // Delay to avoid interrupting writing

    return () => clearTimeout(timer);
  }, [entry.whatHappened, entry.feelings, entry.freeWrite, allEntries, prefs.memoryRemindersEnabled, memoryDismissed]);

  const handleReflectionTypeChange = (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setEntry(prev => ({ ...prev, reflectionType: type }));
    
    // Update prompt based on reflection type
    if (type !== 'daily') {
      const reflectionPrompt = getReflectionPrompt(type);
      setPrompt(reflectionPrompt);
    } else {
      setPrompt(getSmartPrompt());
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const hasContent = entry.whatHappened || entry.feelings || entry.whatMatters || 
                      entry.insight || entry.freeWrite;

    if (!hasContent && !entry.mood) {
      toast.error('Add at least some thoughts or select a mood');
      setIsSaving(false);
      return;
    }

    const existing = storage.getEntryByDate(selectedDate);
    
    if (existing) {
      storage.updateEntry(existing.id, entry);
      toast.success('Entry updated');
    } else {
      const newEntry: JournalEntryType = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: selectedDate,
        ...entry as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      storage.addEntry(newEntry);
      toast.success('Entry saved');
    }

    setIsSaving(false);
    onSave();
  };

  const updateField = (field: keyof JournalEntryType, value: any) => {
    setEntry(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto px-6 py-8"
    >
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</h1>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="size-5" />
          </Button>
        </div>
        {prompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-2 text-slate-600 mt-4 p-4 bg-slate-50 rounded-lg"
          >
            <Sparkles className="size-5 mt-0.5 flex-shrink-0 text-slate-400" />
            <p className="italic">{prompt}</p>
          </motion.div>
        )}
      </div>

      {/* Mood & Energy */}
      <div className="mb-8 space-y-6">
        <div>
          <Label className="text-sm text-slate-600 mb-3 block">How are you feeling?</Label>
          <div className="flex gap-2 flex-wrap">
            {moods.map(mood => (
              <button
                key={mood.value}
                onClick={() => updateField('mood', mood.value)}
                className={`px-4 py-2 rounded-full border transition-all ${
                  entry.mood === mood.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="mr-2">{mood.emoji}</span>
                {mood.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm text-slate-600 mb-3 block">Energy level</Label>
          <div className="flex gap-2">
            {energyLevels.map(level => (
              <button
                key={level}
                onClick={() => updateField('energy', level)}
                className={`w-12 h-12 rounded-full border transition-all flex items-center justify-center ${
                  entry.energy === level
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Writing Prompts */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="whatHappened" className="text-sm text-slate-600 mb-2 block">
            What happened today?
          </Label>
          <Textarea
            id="whatHappened"
            value={entry.whatHappened || ''}
            onChange={e => updateField('whatHappened', e.target.value)}
            placeholder="No pressure. Just what comes to mind..."
            className="min-h-[100px] resize-none border-slate-200 focus:border-slate-400"
          />
        </div>

        <div>
          <Label htmlFor="feelings" className="text-sm text-slate-600 mb-2 block">
            How did it make you feel?
          </Label>
          <Textarea
            id="feelings"
            value={entry.feelings || ''}
            onChange={e => updateField('feelings', e.target.value)}
            placeholder="All feelings are welcome here..."
            className="min-h-[100px] resize-none border-slate-200 focus:border-slate-400"
          />
        </div>

        <div>
          <Label htmlFor="whatMatters" className="text-sm text-slate-600 mb-2 block">
            What mattered most?
          </Label>
          <Textarea
            id="whatMatters"
            value={entry.whatMatters || ''}
            onChange={e => updateField('whatMatters', e.target.value)}
            placeholder="What stood out or resonated..."
            className="min-h-[100px] resize-none border-slate-200 focus:border-slate-400"
          />
        </div>

        <div>
          <Label htmlFor="insight" className="text-sm text-slate-600 mb-2 block">
            One insight or lesson
          </Label>
          <Textarea
            id="insight"
            value={entry.insight || ''}
            onChange={e => updateField('insight', e.target.value)}
            placeholder="Something you learned or noticed..."
            className="min-h-[80px] resize-none border-slate-200 focus:border-slate-400"
          />
        </div>

        <div>
          <Label htmlFor="freeWrite" className="text-sm text-slate-600 mb-2 block">
            Free write
          </Label>
          <Textarea
            id="freeWrite"
            value={entry.freeWrite || ''}
            onChange={e => updateField('freeWrite', e.target.value)}
            placeholder="Anything else on your mind..."
            className="min-h-[120px] resize-none border-slate-200 focus:border-slate-400"
          />
        </div>
      </div>

      {/* Memory Surface */}
      <AnimatePresence>
        {similarEntries.length > 0 && !memoryDismissed && (
          <MemorySurface
            memory={createMemorySurface(entry.id || '', similarEntries[0])}
            relatedEntry={similarEntries[0]}
            onViewEntry={() => onViewEntry?.(similarEntries[0].date)}
            onDismiss={() => setMemoryDismissed(true)}
          />
        )}
      </AnimatePresence>

      {/* V2: Reflection Mode & Tags */}
      <div className="space-y-6 mb-8 pt-6 border-t border-slate-200">
        <ReflectionModeSelector
          selectedMode={entry.reflectionType || 'daily'}
          onChange={handleReflectionTypeChange}
        />

        <div>
          <Label className="text-sm text-slate-600 mb-3 block">Tags (optional)</Label>
          <TagManager
            selectedTags={entry.tags || []}
            onChange={(tags) => updateField('tags', tags)}
            allEntries={allEntries}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-8 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="size-4" />
          {isSaving ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>
    </motion.div>
  );
}