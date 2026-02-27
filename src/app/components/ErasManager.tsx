import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Circle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Era, JournalEntry } from '@/app/types';
import { erasStorage } from '@/app/utils/eras';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';

const eraColors = [
  '#64748b', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'
];

interface ErasManagerProps {
  entries: JournalEntry[];
}

export function ErasManager({ entries }: ErasManagerProps) {
  const [eras, setEras] = useState<Era[]>(erasStorage.getAll());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    color: eraColors[0],
  });

  const handleAdd = () => {
    if (!formData.name.trim()) return;

    erasStorage.add(formData);
    setEras(erasStorage.getAll());
    setFormData({ name: '', description: '', startDate: '', endDate: '', color: eraColors[0] });
    setIsAdding(false);
    toast.success('Era created');
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim()) return;

    erasStorage.update(editingId, formData);
    setEras(erasStorage.getAll());
    setEditingId(null);
    setFormData({ name: '', description: '', startDate: '', endDate: '', color: eraColors[0] });
    toast.success('Era updated');
  };

  const handleDelete = (id: string) => {
    erasStorage.delete(id);
    setEras(erasStorage.getAll());
    toast.success('Era deleted');
  };

  const startEdit = (era: Era) => {
    setEditingId(era.id);
    setFormData({
      name: era.name,
      description: era.description || '',
      startDate: era.startDate || '',
      endDate: era.endDate || '',
      color: era.color || eraColors[0],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ name: '', description: '', startDate: '', endDate: '', color: eraColors[0] });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Life Chapters</h2>
        <p className="text-slate-600">
          Define periods of your life to contextualize your thoughts over time
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {eras
            .sort((a, b) => {
              if (!a.startDate) return 1;
              if (!b.startDate) return -1;
              return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
            })
            .map((era, index) => (
              <motion.div
                key={era.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                {editingId === era.id ? (
                  <Card className="p-6 space-y-4 border-2 border-slate-300">
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Era name..."
                      autoFocus
                    />
                    <Textarea
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description (optional)"
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-slate-500">Start date (optional)</Label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">End date (optional)</Label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-2 block">Color</Label>
                      <div className="flex gap-2">
                        {eraColors.map(color => (
                          <button
                            key={color}
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-8 h-8 rounded-full border-2 ${
                              formData.color === color ? 'border-slate-900' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdate}>Save Changes</Button>
                      <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: era.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1">{era.name}</h3>
                        {era.description && (
                          <p className="text-sm text-slate-600 mb-2">{era.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {era.startDate && (
                            <span>{format(parseISO(era.startDate), 'MMM yyyy')}</span>
                          )}
                          {era.startDate && era.endDate && <span>→</span>}
                          {era.endDate ? (
                            <span>{format(parseISO(era.endDate), 'MMM yyyy')}</span>
                          ) : era.startDate ? (
                            <span className="text-emerald-600 font-medium">Present</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(era)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(era.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            ))}
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
                placeholder="Era name (e.g., 'Early Career', 'Recovery', 'New Direction')"
                autoFocus
              />
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description (optional)"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">Start date (optional)</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">End date (leave empty if ongoing)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-2 block">Color</Label>
                <div className="flex gap-2">
                  {eraColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-slate-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!formData.name.trim()}>
                  Create Era
                </Button>
                <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
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
            Create New Era
          </Button>
        )}
      </div>

      {eras.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            No life chapters defined yet. Create one to organize your journey.
          </p>
        </div>
      )}

      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
        <h3 className="font-medium mb-2">About Life Chapters</h3>
        <p className="text-sm text-slate-600 mb-3">
          Eras help you contextualize thoughts instead of judging them. A difficult period
          isn't failure—it's a chapter. You can assign entries to eras manually or
          retroactively.
        </p>
        <p className="text-sm text-slate-500">
          Leave end dates empty for ongoing chapters. The app will never close them for you.
        </p>
      </div>
    </div>
  );
}