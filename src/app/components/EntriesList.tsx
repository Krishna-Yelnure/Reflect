import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { Button } from '@/app/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';

interface EntriesListProps {
  entries: JournalEntry[];
  onEdit: (date: string) => void;
  onDelete: (id: string) => void;
}

const moodEmojis: Record<string, string> = {
  great: '✨',
  good: '😊',
  okay: '😐',
  low: '😔',
  difficult: '😣',
};

export function EntriesList({ entries, onEdit, onDelete }: EntriesListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [entries]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (entries.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-stone-400 text-lg" style={{ fontFamily: 'var(--font-display)' }}>Your story is waiting to begin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-2xl mb-6">Your Entries</h2>
      
      <div className="space-y-4">
        <AnimatePresence>
          {sortedEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg overflow-hidden transition-colors" style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <button
                onClick={() => toggleExpand(entry.id)}
                className="w-full px-6 py-4 flex items-start justify-between text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">
                      {format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    {entry.mood && (
                      <span className="text-lg">{moodEmojis[entry.mood]}</span>
                    )}
                    {entry.energy && (
                      <span className="text-sm text-stone-400">Energy: {entry.energy}/5</span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 line-clamp-2">
                    {entry.whatHappened || entry.feelings || entry.freeWrite || 'No content'}
                  </p>
                </div>
                <div className="ml-4">
                  {expandedId === entry.id ? (
                    <ChevronUp className="size-5 text-stone-400" />
                  ) : (
                    <ChevronDown className="size-5 text-stone-400" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedId === entry.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}
                  >
                    <div className="px-6 py-4 space-y-4">
                      {entry.whatHappened && (
                        <div>
                          <h4 className="text-xs text-stone-400 mb-1">What happened today?</h4>
                          <p className="text-stone-700 whitespace-pre-wrap">{entry.whatHappened}</p>
                        </div>
                      )}
                      {entry.feelings && (
                        <div>
                          <h4 className="text-xs text-stone-400 mb-1">How did it make you feel?</h4>
                          <p className="text-stone-700 whitespace-pre-wrap">{entry.feelings}</p>
                        </div>
                      )}
                      {entry.whatMatters && (
                        <div>
                          <h4 className="text-xs text-stone-400 mb-1">What mattered most?</h4>
                          <p className="text-stone-700 whitespace-pre-wrap">{entry.whatMatters}</p>
                        </div>
                      )}
                      {entry.insight && (
                        <div>
                          <h4 className="text-xs text-stone-400 mb-1">Insight</h4>
                          <p className="text-stone-700 whitespace-pre-wrap">{entry.insight}</p>
                        </div>
                      )}
                      {entry.freeWrite && (
                        <div>
                          <h4 className="text-xs text-stone-400 mb-1">Free write</h4>
                          <p className="text-stone-700 whitespace-pre-wrap">{entry.freeWrite}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(entry.date)}
                          className="gap-2"
                        >
                          <Edit className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(entry.id)}
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this journal entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
