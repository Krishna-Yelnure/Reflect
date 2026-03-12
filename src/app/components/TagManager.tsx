import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import type { JournalEntry } from '@/app/types';

interface TagManagerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  allEntries: JournalEntry[];
}

/** Normalise a single tag — trim, lowercase */
function normaliseTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export function TagManager({ selectedTags, onChange, allEntries }: TagManagerProps) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // All unique normalised tags from existing entries, excluding already selected
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    allEntries.forEach(entry => {
      entry.tags?.forEach(tag => {
        const n = normaliseTag(tag);
        if (n) tagSet.add(n);
      });
    });
    return Array.from(tagSet).sort();
  }, [allEntries]);

  // Suggestions — existing tags filtered by input, excluding already selected
  const suggestions = useMemo(() => {
    const query = normaliseTag(input);
    return existingTags.filter(tag =>
      !selectedTags.includes(tag) &&
      (query === '' || tag.includes(query))
    ).slice(0, 6);
  }, [input, existingTags, selectedTags]);

  const addTag = (raw: string) => {
    const tag = normaliseTag(raw);
    if (!tag || selectedTags.includes(tag)) return;
    onChange([...selectedTags, tag]);
    setInput('');
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (input.trim()) addTag(input);
    }
    if (e.key === 'Backspace' && input === '' && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
    if (e.key === 'Escape') {
      setInput('');
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const showDropdown = focused && suggestions.length > 0;

  return (
    <div className="relative">
      {/* Tag pills + input — all inline */}
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[38px] px-3 py-2 rounded-lg transition-colors cursor-text"
        style={{
          backgroundColor: 'var(--card)',
          border: focused ? '1px solid rgba(0,0,0,0.20)' : '1px solid rgba(0,0,0,0.10)',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence mode="popLayout">
          {selectedTags.map(tag => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.12 }}
              layout
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md"
              style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: '#525252' }}
            >
              {tag}
              <button
                onClick={e => { e.stopPropagation(); removeTag(tag); }}
                className="text-stone-400 hover:text-stone-600 transition-colors ml-0.5"
                aria-label={`Remove ${tag}`}
              >
                <X className="size-2.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={selectedTags.length === 0 ? 'Add tags…' : ''}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
          style={{ color: '#2B2B2B' }}
        />
      </div>

      {/* Helper text */}
      {focused && (
        <p className="text-[10px] text-stone-400 mt-1 ml-0.5">
          Press Enter or comma to add · Backspace to remove last
        </p>
      )}

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 top-full mt-1 rounded-lg shadow-sm z-20 overflow-hidden"
            style={{ backgroundColor: 'var(--card)', border: '1px solid rgba(0,0,0,0.10)' }}
          >
            {suggestions.map(tag => (
              <button
                key={tag}
                onMouseDown={e => { e.preventDefault(); addTag(tag); }}
                className="w-full text-left px-3 py-2 text-sm text-stone-500 hover:bg-stone-50 transition-colors flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
                {tag}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
