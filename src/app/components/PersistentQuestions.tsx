import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pause, Play, Trash2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { PersistentQuestion, JournalEntry } from '@/app/types';
import { questionsStorage } from '@/app/utils/questions';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';

interface PersistentQuestionsProps {
  entries: JournalEntry[];
  onWriteAbout?: (questionId: string) => void;
}

export function PersistentQuestions({ entries, onWriteAbout }: PersistentQuestionsProps) {
  const [questions, setQuestions] = useState<PersistentQuestion[]>(questionsStorage.getAll());
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ question: '', notes: '' });

  const handleAdd = () => {
    if (!formData.question.trim()) return;

    questionsStorage.add({
      question: formData.question,
      notes: formData.notes,
      isActive: true,
    });
    setQuestions(questionsStorage.getAll());
    setFormData({ question: '', notes: '' });
    setIsAdding(false);
    toast.success('Question added');
  };

  const toggleActive = (id: string, isActive: boolean) => {
    questionsStorage.update(id, { isActive: !isActive });
    setQuestions(questionsStorage.getAll());
    toast.success(isActive ? 'Question paused' : 'Question activated');
  };

  const handleDelete = (id: string) => {
    questionsStorage.delete(id);
    setQuestions(questionsStorage.getAll());
    toast.success('Question deleted');
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Persistent Questions</h2>
        <p className="text-slate-600">
          Questions you're exploring over time—no answers required
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {questions
            .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
            .map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className={`p-6 ${!question.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {question.isActive ? (
                          <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Paused</Badge>
                        )}
                      </div>
                      <p className="text-lg text-slate-900 mb-2">{question.question}</p>
                      {question.notes && (
                        <p className="text-sm text-slate-600 mb-3">{question.notes}</p>
                      )}
                      {question.lastReflectedAt && (
                        <p className="text-xs text-slate-400">
                          Last reflected{' '}
                          {formatDistanceToNow(new Date(question.lastReflectedAt), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {onWriteAbout && question.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onWriteAbout(question.id)}
                          className="gap-2 text-slate-600 hover:text-slate-900"
                        >
                          <FileText className="size-4" />
                          Write
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(question.id, question.isActive)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {question.isActive ? (
                          <Pause className="size-4" />
                        ) : (
                          <Play className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
        </AnimatePresence>

        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 space-y-4 border-2 border-slate-300">
              <div>
                <Input
                  value={formData.question}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  placeholder="What question are you exploring?"
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">
                  Examples: "What does a good life mean to me?" "What am I avoiding?"
                </p>
              </div>
              <Textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes or context..."
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!formData.question.trim()}>
                  Add Question
                </Button>
                <Button
                  variant="outline"
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
            className="w-full gap-2"
          >
            <Plus className="size-4" />
            Add Persistent Question
          </Button>
        )}
      </div>

      {questions.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            No questions yet. Add one to explore over time.
          </p>
        </div>
      )}

      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
        <h3 className="font-medium mb-2">About Persistent Questions</h3>
        <p className="text-sm text-slate-600 mb-3">
          These are questions you return to over months or years. The app doesn't expect
          answers—it just helps you notice how your thinking shifts.
        </p>
        <p className="text-sm text-slate-500">
          Pause questions when they no longer feel relevant. You can always reactivate them later.
        </p>
      </div>
    </div>
  );
}