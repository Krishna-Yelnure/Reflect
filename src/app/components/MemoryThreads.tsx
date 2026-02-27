import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { MemoryThread, JournalEntry } from '@/app/types';
import { threadsStorage } from '@/app/utils/threads';
import { storage } from '@/app/utils/storage';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';

interface MemoryThreadsProps {
  entries: JournalEntry[];
  onViewEntry?: (date: string) => void;
}

export function MemoryThreads({ entries, onViewEntry }: MemoryThreadsProps) {
  const [threads, setThreads] = useState<MemoryThread[]>(threadsStorage.getAll());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!formData.name.trim()) return;

    threadsStorage.add({
      name: formData.name,
      description: formData.description,
      entryIds: [],
    });
    setThreads(threadsStorage.getAll());
    setFormData({ name: '', description: '' });
    setIsAdding(false);
    toast.success('Thread created');
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim()) return;

    threadsStorage.update(editingId, formData);
    setThreads(threadsStorage.getAll());
    setEditingId(null);
    setFormData({ name: '', description: '' });
    toast.success('Thread updated');
  };

  const handleDelete = (id: string) => {
    threadsStorage.delete(id);
    setThreads(threadsStorage.getAll());
    toast.success('Thread deleted');
  };

  const startEdit = (thread: MemoryThread) => {
    setEditingId(thread.id);
    setFormData({
      name: thread.name,
      description: thread.description || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '' });
  };

  const getEntriesForThread = (thread: MemoryThread): JournalEntry[] => {
    return thread.entryIds
      .map(id => entries.find(e => e.id === id))
      .filter((e): e is JournalEntry => e !== undefined)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Memory Threads</h2>
        <p className="text-slate-600">
          Manually curate collections of entries that share meaning over time
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {threads.map((thread, index) => {
            const entries = getEntriesForThread(thread);
            const isExpanded = expandedId === thread.id;

            return (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                {editingId === thread.id ? (
                  <Card className="p-6 space-y-4 border-2 border-slate-300">
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Thread name..."
                      autoFocus
                    />
                    <Textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What connects these entries?"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdate}>Save Changes</Button>
                      <Button variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : thread.id)}
                          className="text-left w-full"
                        >
                          <h3 className="font-medium mb-1 hover:text-slate-700">
                            {thread.name}
                          </h3>
                        </button>
                        {thread.description && (
                          <p className="text-sm text-slate-600 mb-2">{thread.description}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                        </p>

                        <AnimatePresence>
                          {isExpanded && entries.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 space-y-2 pl-4 border-l-2 border-slate-200"
                            >
                              {entries.map(entry => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between group"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-600">
                                      {format(parseISO(entry.date), 'MMM d, yyyy')}
                                    </p>
                                    <p className="text-xs text-slate-400 line-clamp-1">
                                      {entry.whatHappened ||
                                        entry.feelings ||
                                        entry.freeWrite ||
                                        'No preview'}
                                    </p>
                                  </div>
                                  {onViewEntry && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onViewEntry(entry.date)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <ExternalLink className="size-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(thread)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(thread.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 space-y-4 border-2 border-slate-300">
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Thread name (e.g., 'My relationship with ambition')"
                autoFocus
              />
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="What connects these entries?"
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!formData.name.trim()}>
                  Create Thread
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
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
            Create New Thread
          </Button>
        )}
      </div>

      {threads.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            No threads yet. Create one to connect related entries over time.
          </p>
        </div>
      )}

      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
        <h3 className="font-medium mb-2">About Memory Threads</h3>
        <p className="text-sm text-slate-600 mb-3">
          Threads let you build your own narrative structure. They're manually curated—the
          app never auto-generates or auto-completes them.
        </p>
        <p className="text-sm text-slate-500">
          Add entries to threads from the entry detail view. Think of threads as personal
          themes you're tracking.
        </p>
      </div>
    </div>
  );
}