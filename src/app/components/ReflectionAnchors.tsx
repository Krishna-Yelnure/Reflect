import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Heart, HelpCircle, Target } from 'lucide-react';
import type { ReflectionAnchor } from '@/app/types';
import { preferences } from '@/app/utils/preferences';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Card } from '@/app/components/ui/card';
import { toast } from 'sonner';

export function ReflectionAnchors() {
  const [anchors, setAnchors] = useState<ReflectionAnchor[]>(preferences.getAnchors());
  const [isAdding, setIsAdding] = useState(false);
  const [newAnchor, setNewAnchor] = useState({ type: 'value' as const, text: '' });

  const handleAdd = () => {
    if (!newAnchor.text.trim()) return;
    
    const anchor = preferences.addAnchor(newAnchor);
    setAnchors(preferences.getAnchors());
    setNewAnchor({ type: 'value', text: '' });
    setIsAdding(false);
    toast.success('Anchor added');
  };

  const handleRemove = (id: string) => {
    preferences.removeAnchor(id);
    setAnchors(preferences.getAnchors());
    toast.success('Anchor removed');
  };

  const anchorIcons = {
    value: Heart,
    question: HelpCircle,
    intention: Target,
  };

  const anchorLabels = {
    value: 'Value',
    question: 'Question',
    intention: 'Intention',
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Reflection Anchors</h2>
        <p className="text-slate-600">
          Values, questions, or intentions you want to track over time
        </p>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {anchors.map((anchor, index) => {
            const Icon = anchorIcons[anchor.type];
            return (
              <motion.div
                key={anchor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Icon className="size-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-1 capitalize">
                        {anchorLabels[anchor.type]}
                      </p>
                      <p className="text-slate-900">{anchor.text}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(anchor.id)}
                      className="text-slate-400 hover:text-red-600"
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 space-y-4">
              <div>
                <p className="text-sm text-slate-600 mb-2">Type</p>
                <div className="flex gap-2">
                  {(['value', 'question', 'intention'] as const).map(type => (
                    <Button
                      key={type}
                      variant={newAnchor.type === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewAnchor({ ...newAnchor, type })}
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">
                  {newAnchor.type === 'value' && 'What value matters to you?'}
                  {newAnchor.type === 'question' && 'What question are you exploring?'}
                  {newAnchor.type === 'intention' && 'What intention are you holding?'}
                </p>
                <Input
                  value={newAnchor.text}
                  onChange={e => setNewAnchor({ ...newAnchor, text: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') setIsAdding(false);
                  }}
                  placeholder="Enter your anchor..."
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!newAnchor.text.trim()}>
                  Add Anchor
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
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
            Add Reflection Anchor
          </Button>
        )}
      </div>

      {anchors.length === 0 && !isAdding && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            No anchors yet. Add values, questions, or intentions to track.
          </p>
        </div>
      )}

      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
        <h3 className="font-medium mb-2">About Anchors</h3>
        <p className="text-sm text-slate-600">
          Reflection anchors are personal reference points. The app may gently surface when
          your journal entries relate to these anchors, helping you notice patterns and
          continuity over time.
        </p>
      </div>
    </div>
  );
}
