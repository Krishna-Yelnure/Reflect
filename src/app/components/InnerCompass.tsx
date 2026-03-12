import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Heart, Target, HelpCircle, Pause, Play, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ReflectionAnchor, PersistentQuestion } from '@/app/types';
import { preferences } from '@/app/utils/preferences';
import { questionsStorage } from '@/app/utils/questions';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';

interface InnerCompassProps {
  onWriteAbout?: (questionId: string) => void;
}

export function InnerCompass({ onWriteAbout }: InnerCompassProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>Inner Compass</h2>
        <p style={{ color: 'var(--text-body)' }}>
          Your core values and the questions you're exploring
        </p>
      </div>

      <Tabs defaultValue="values" className="w-full">
        <TabsList className="mb-6 bg-transparent p-0 border-b border-stone-200/50 w-full justify-start h-auto rounded-none">
          <TabsTrigger 
            value="values" 
            className="flex-none px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-stone-800 text-stone-600 bg-transparent disabled:opacity-50"
          >
            Values
          </TabsTrigger>
          <TabsTrigger 
            value="questions"
            className="flex-none px-6 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-stone-800 text-stone-600 bg-transparent disabled:opacity-50"
          >
            Questions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="values" className="mt-0 outline-none">
          <ValuesTab />
        </TabsContent>

        <TabsContent value="questions" className="mt-0 outline-none">
          <QuestionsTab onWriteAbout={onWriteAbout} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Values Tab ──────────────────────────────────────────────────────────────

function ValuesTab() {
  const [anchors, setAnchors] = useState<ReflectionAnchor[]>(preferences.getAnchors().filter(a => a.type !== 'question'));
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newValue.trim()) return;
    
    preferences.addAnchor({ type: 'value', text: newValue });
    setAnchors(preferences.getAnchors().filter(a => a.type !== 'question'));
    setNewValue('');
    setIsAdding(false);
    toast.success('Value added to compass');
  };

  const handleRemove = (id: string) => {
    preferences.removeAnchor(id);
    setAnchors(preferences.getAnchors().filter(a => a.type !== 'question'));
    toast.success('Value removed');
  };

  const anchorIcons = {
    value: Heart,
    intention: Target,
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {anchors.map((anchor, index) => {
          const Icon = anchorIcons[anchor.type as keyof typeof anchorIcons] || Heart;
          return (
            <motion.div
              key={anchor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              layout
            >
              <Card className="p-4" style={{ backgroundColor: 'var(--card)' }}>
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(104, 92, 74, 0.08)' }}>
                    <Icon className="size-5" style={{ color: 'var(--text-primary)' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-secondary)' }}>
                      {anchor.type === 'intention' ? 'Intention' : 'Core Value'}
                    </p>
                    <p style={{ color: 'var(--text-body)' }}>{anchor.text}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(anchor.id)}
                    className="text-stone-400 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {isAdding ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 space-y-4 border-2" style={{ borderColor: 'var(--border-medium)', backgroundColor: 'var(--card)' }}>
            <div>
              <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>What value matters to you?</p>
              <Input
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') setIsAdding(false);
                }}
                placeholder="e.g., Clarity, Craft, Family..."
                className="parchment-input"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!newValue.trim()} className="button-primary">
                Add Value
              </Button>
              <Button variant="outline" onClick={() => setIsAdding(false)} className="button-secondary">
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="w-full gap-2 button-secondary"
        >
          <Plus className="size-4" />
          Add Core Value
        </Button>
      )}

      {anchors.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-muted)' }}>
            Your compass is empty. Add a value to guide your journey.
          </p>
        </div>
      )}

      {anchors.length > 0 && (
        <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
          <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>About Values</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-body)' }}>
            These are your North Stars. The journal doesn't score you on them, nor does it ask if you lived up to them today.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            They are simply held present while you write.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Questions Tab ───────────────────────────────────────────────────────────

interface QuestionsTabProps {
  onWriteAbout?: (questionId: string) => void;
}

function QuestionsTab({ onWriteAbout }: QuestionsTabProps) {
  const [questions, setQuestions] = useState<PersistentQuestion[]>(questionsStorage.getAll());
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ question: '', notes: '' });

  const handleAdd = () => {
    if (!formData.question.trim()) return;

    questionsStorage.add({
      question: formData.question,
      notes: formData.notes,
      isActive: true,
    } as any); // Type cast due to runtime properties
    setQuestions(questionsStorage.getAll());
    setFormData({ question: '', notes: '' });
    setIsAdding(false);
    toast.success('Question added');
  };

  const toggleActive = (id: string, isActive: boolean) => {
    questionsStorage.update(id, { isActive: !isActive } as any);
    setQuestions(questionsStorage.getAll());
    toast.success(isActive ? 'Question paused' : 'Question activated');
  };

  const handleDelete = (id: string) => {
    questionsStorage.delete(id);
    setQuestions(questionsStorage.getAll());
    toast.success('Question deleted');
  };

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {questions
          .sort((a, b) => {
            const aActive = (a as any).isActive;
            const bActive = (b as any).isActive;
            return aActive === bActive ? 0 : aActive ? -1 : 1;
          })
          .map((question, index) => {
            const q = question as any;
            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className={`p-6 ${!q.isActive ? 'opacity-60' : ''}`} style={{ backgroundColor: 'var(--card)' }}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {q.isActive ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                            Exploring
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-stone-200 text-stone-600 border-none">
                            Paused
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{q.question || question.text}</p>
                      {q.notes && (
                        <p className="text-sm mb-3" style={{ color: 'var(--text-body)' }}>{q.notes}</p>
                      )}
                      {q.lastReflectedAt && (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          Last returned to{' '}
                          {formatDistanceToNow(new Date(q.lastReflectedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {onWriteAbout && q.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onWriteAbout(question.id)}
                          className="gap-2 text-stone-600 hover:text-stone-800"
                        >
                          <FileText className="size-4" />
                          Write
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(question.id, q.isActive)}
                        className="text-stone-400 hover:text-stone-700"
                        title={q.isActive ? "Pause exploration" : "Resume exploration"}
                      >
                        {q.isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        className="text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {isAdding ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 space-y-4 border-2" style={{ borderColor: 'var(--border-medium)', backgroundColor: 'var(--card)' }}>
            <div>
              <Input
                value={formData.question}
                onChange={e => setFormData({ ...formData, question: e.target.value })}
                placeholder="What question are you exploring?"
                className="parchment-input"
                autoFocus
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Examples: "What does a good life mean to me?" "What am I avoiding?"
              </p>
            </div>
            <Textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional context or why you want to explore this..."
              className="parchment-input"
              rows={2}
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!formData.question.trim()} className="button-primary">
                Add Question
              </Button>
              <Button
                variant="outline"
                className="button-secondary"
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ question: '', notes: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setIsAdding(true)}
          className="w-full gap-2 button-secondary"
        >
          <Plus className="size-4" />
          Add Persistent Question
        </Button>
      )}

      {questions.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--text-muted)' }}>
            No questions yet. Add one to explore over time.
          </p>
        </div>
      )}

      {questions.length > 0 && (
        <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
          <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>About Persistent Questions</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-body)' }}>
            These are questions you return to over months or years. The app doesn't expect answers—it just helps you notice how your thinking shifts.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            You can surface these questions while writing an entry to bring them into present focus.
          </p>
        </div>
      )}
    </div>
  );
}
