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
  entries?: any[]; // Using any to avoid importing JournalEntryType directly right now, or we can use JournalEntry from types
  onViewEntry?: (date: string) => void;
}

export function InnerCompass({ onWriteAbout, entries = [], onViewEntry }: InnerCompassProps) {
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
          <QuestionsTab onWriteAbout={onWriteAbout} entries={entries} onViewEntry={onViewEntry} />
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
  entries: any[];
  onViewEntry?: (date: string) => void;
}

function QuestionsTab({ onWriteAbout, entries, onViewEntry }: QuestionsTabProps) {
  const [questions, setQuestions] = useState<PersistentQuestion[]>(questionsStorage.getAll());
  const [isAdding, setIsAdding] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ question: '', notes: '' });
  const [resolutionText, setResolutionText] = useState('');

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

  const handleResolve = (id: string) => {
    if (!resolutionText.trim()) return;
    questionsStorage.resolve(id, resolutionText);
    setQuestions(questionsStorage.getAll());
    
    // Ask to convert to value
    if (window.confirm('Would you like to save this resolution as a Core Value in your Inner Compass?')) {
      preferences.addAnchor({ type: 'value', text: resolutionText.trim() });
      toast.success('Question resolved and added to Values');
    } else {
      toast.success('Question resolved');
    }
    
    setResolvingId(null);
    setResolutionText('');
  };

  const getEntriesForQuestion = (qId: string) => entries
    .filter(e => e.questionId === qId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const activeQuestions = questions.filter(q => q.isActive);
  const pausedQuestions = questions.filter(q => !q.isActive && !q.resolvedAt);
  const resolvedQuestions = questions.filter(q => !q.isActive && q.resolvedAt);

  return (
    <div className="space-y-8">
      {/* Active & Paused Section */}
      <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {[...activeQuestions, ...pausedQuestions]
          .map((question, index) => {
            const q = question as any;
            const threadedEntries = getEntriesForQuestion(q.id);
            const isExpanded = expandedId === q.id;
            const isResolving = resolvingId === q.id;

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
                    <div className="flex-1 min-w-0">
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
                        <span className="text-xs text-stone-400">
                          {threadedEntries.length} {threadedEntries.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </div>
                      
                      <button onClick={() => setExpandedId(isExpanded ? null : q.id)} className="text-left w-full focus:outline-none">
                        <p className="text-lg hover:text-amber-800 transition-colors" style={{ color: 'var(--text-primary)' }}>{q.question || question.text}</p>
                      </button>

                      {q.notes && (
                        <p className="text-sm mt-2" style={{ color: 'var(--text-body)' }}>{q.notes}</p>
                      )}
                      {q.lastReflectedAt && (
                        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                          Last returned to{' '}
                          {formatDistanceToNow(new Date(q.lastReflectedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      )}

                      {/* Resolving UI */}
                      <AnimatePresence>
                        {isResolving && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50"
                          >
                            <p className="text-sm font-medium text-amber-900 mb-2">What clarity have you reached?</p>
                            <Textarea
                              value={resolutionText}
                              onChange={e => setResolutionText(e.target.value)}
                              placeholder="This question taught me..."
                              className="mb-3 border-amber-200 bg-white/50 focus:bg-white"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleResolve(q.id)} disabled={!resolutionText.trim()} className="button-primary">
                                Mark Resolved
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setResolvingId(null); setResolutionText(''); }} className="border-amber-200 text-amber-800 hover:bg-amber-100">
                                Cancel
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Threaded Entries */}
                      <AnimatePresence>
                        {isExpanded && threadedEntries.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 space-y-4 pl-4 border-l-2 border-amber-200/50"
                          >
                            <h4 className="text-xs font-medium uppercase tracking-wider text-stone-400">Question Thread</h4>
                            {threadedEntries.map(entry => (
                              <div key={entry.id} className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-medium text-stone-500">
                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                  {onViewEntry && (
                                    <Button variant="ghost" size="sm" onClick={() => onViewEntry(entry.date)} className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-stone-400 hover:text-amber-700">
                                      Open
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm text-stone-600 italic">
                                  "{entry.insight || entry.whatHappened || entry.freeWrite || 'Empty entry'}"
                                </p>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
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
                      {q.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setResolvingId(q.id); setExpandedId(q.id); }}
                          className="gap-2 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                        >
                          <Target className="size-4" />
                          Resolve
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
      </div>

      {/* Resolved Archive Section */}
      {resolvedQuestions.length > 0 && (
        <div className="mt-12 pt-8 border-t border-stone-200/60">
          <h3 className="font-medium text-stone-500 mb-4 px-2 tracking-wide uppercase text-xs">Resolved & Archived</h3>
          <div className="space-y-4">
            {resolvedQuestions.map(q => {
              const threadedEntries = getEntriesForQuestion(q.id);
              const isExpanded = expandedId === q.id;

              return (
                <Card key={q.id} className="p-5 opacity-75 hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                         <Badge variant="outline" className="text-stone-500 border-stone-300">Resolved</Badge>
                         {q.resolvedAt && (
                           <span className="text-xs text-stone-400">
                             {new Date(q.resolvedAt).toLocaleDateString()}
                           </span>
                         )}
                      </div>
                      <button onClick={() => setExpandedId(isExpanded ? null : q.id)} className="text-left w-full focus:outline-none">
                        <p className="text-lg line-through text-stone-400 mb-2">{q.question || q.text}</p>
                      </button>
                      
                      {q.resolution && (
                        <div className="mt-2 p-3 bg-white/40 rounded-lg italic text-sm text-stone-600 border border-stone-200/50">
                          {q.resolution}
                        </div>
                      )}

                      {/* Threaded Entries */}
                      <AnimatePresence>
                        {isExpanded && threadedEntries.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-6 space-y-4 pl-4 border-l-2 border-stone-300"
                          >
                            <h4 className="text-xs font-medium uppercase tracking-wider text-stone-400">Question Thread</h4>
                            {threadedEntries.map(entry => (
                              <div key={entry.id} className="group">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-medium text-stone-500">
                                    {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                  {onViewEntry && (
                                    <Button variant="ghost" size="sm" onClick={() => onViewEntry(entry.date)} className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-stone-400 hover:text-stone-700">
                                      Open
                                    </Button>
                                  )}
                                </div>
                                <p className="text-sm text-stone-500 italic">
                                  "{entry.insight || entry.whatHappened || entry.freeWrite || 'Empty entry'}"
                                </p>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(q.id)}
                        className="text-stone-400 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Block */}
      {questions.length > 0 && (
        <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--muted)' }}>
          <h3 className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>About Persistent Questions</h3>
          <p className="text-sm mb-3" style={{ color: 'var(--text-body)' }}>
            These are questions you return to over months or years. The app doesn't expect answers—it just helps you notice how your thinking shifts.
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            You can surface these questions while writing an entry. When clarity naturally arrives, mark them resolved to complete the cycle.
          </p>
        </div>
      )}
    </div>
  );
}
