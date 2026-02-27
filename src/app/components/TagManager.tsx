import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Tag } from 'lucide-react';
import type { JournalEntry } from '@/app/types';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';

interface TagManagerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  allEntries: JournalEntry[];
}

export function TagManager({ selectedTags, onChange, allEntries }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Extract all existing tags from entries
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    allEntries.forEach(entry => {
      entry.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allEntries]);

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed]);
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const handleSelectExisting = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
  };

  const suggestedTags = existingTags.filter(tag => !selectedTags.includes(tag));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <AnimatePresence mode="popLayout">
          {selectedTags.map(tag => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              layout
            >
              <Badge variant="secondary" className="gap-1.5 pr-1">
                <Tag className="size-3" />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:bg-slate-300 rounded-full p-0.5 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>

        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Input
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTag();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewTag('');
                }
              }}
              placeholder="Tag name..."
              className="h-8 w-32 text-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleAddTag}>
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewTag('');
              }}
            >
              Cancel
            </Button>
          </motion.div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
            className="gap-1.5 h-8"
          >
            <Plus className="size-3" />
            Add tag
          </Button>
        )}
      </div>

      {suggestedTags.length > 0 && !isAdding && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-2">Previous tags:</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {suggestedTags.slice(0, 8).map(tag => (
              <button
                key={tag}
                onClick={() => handleSelectExisting(tag)}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
