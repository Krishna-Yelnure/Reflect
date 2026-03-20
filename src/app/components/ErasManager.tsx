// A7a — ErasManager redesign
// Decisions locked:
//   - Colour palette: 6 warm colours distinct from mood system
//   - Era assignment: auto by date in JournalEntry.tsx (this file unchanged for that)
//   - Overlap warning: inline under date fields
//   - Delete confirmation: inline Yes / No, no modal
//   - Empty state: "Your story has chapters even if they haven't been named yet."
//   - Info box at bottom: removed

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Era, JournalEntry } from '@/app/types';
import { erasStorage } from '@/app/utils/eras';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';

// ── Locked colour palette (A7a decisions) ─────────────────────────────────
// Warm, distinct from mood system (amber/emerald/slate/blue/stone).
// Used in A7b for heatmap era bands — nothing should fight mood dots.
export const ERA_COLOURS = [
  { hex: '#c2714f', label: 'Terracotta' },
  { hex: '#7c9a7e', label: 'Sage'       },
  { hex: '#b87d8a', label: 'Dusty rose' },
  { hex: '#6b6fa8', label: 'Warm indigo'},
  { hex: '#c49a3c', label: 'Ochre'      },
  { hex: '#7c6f8a', label: 'Slate violet'},
];

const DEFAULT_COLOUR = ERA_COLOURS[0].hex;

// ── Overlap detection ─────────────────────────────────────────────────────
function findOverlap(
  eras: Era[],
  startDate: string,
  endDate: string,
  excludeId?: string
): Era | null {
  if (!startDate) return null;
  const start = new Date(startDate).getTime();
  const end   = endDate ? new Date(endDate).getTime() : Infinity;

  return eras.find(era => {
    if (era.id === excludeId) return false;
    if (!era.startDate) return false;
    const eStart = new Date(era.startDate).getTime();
    const eEnd   = era.endDate ? new Date(era.endDate).getTime() : Infinity;
    return start <= eEnd && end >= eStart;
  }) ?? null;
}

interface ErasManagerProps {
  entries: JournalEntry[];
}

interface FormState {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  colour: string;
}

const EMPTY_FORM: FormState = {
  name: '', description: '', startDate: '', endDate: '', colour: DEFAULT_COLOUR,
};

export function ErasManager({ entries }: ErasManagerProps) {
  const [eras, setEras]           = useState<Era[]>(() => erasStorage.getAll());
  const [isAdding, setIsAdding]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);

  const reload = () => setEras(erasStorage.getAll());

  const sorted = useMemo(() =>
    [...eras].sort((a, b) => {
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }),
    [eras]
  );

  // Overlap warning — computed live as user types dates
  const overlapWarning = useMemo(() => {
    if (!form.startDate) return null;
    const hit = findOverlap(eras, form.startDate, form.endDate, editingId ?? undefined);
    return hit ? hit.name : null;
  }, [eras, form.startDate, form.endDate, editingId]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleAdd = () => {
    if (!form.name.trim()) return;
    erasStorage.add({
      name:        form.name.trim(),
      description: form.description.trim() || undefined,
      startDate:   form.startDate || '',
      endDate:     form.endDate   || undefined,
      colour:      form.colour,
    } as Omit<Era, 'id' | 'createdAt' | 'updatedAt'>);
    reload();
    setForm(EMPTY_FORM);
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editingId || !form.name.trim()) return;
    erasStorage.update(editingId, {
      name:        form.name.trim(),
      description: form.description.trim() || undefined,
      startDate:   form.startDate || '',
      endDate:     form.endDate   || undefined,
      colour:      form.colour,
    });
    reload();
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = (id: string) => {
    erasStorage.delete(id);
    // Un-tag entries that belonged to this era — Witness-clean, no orphan eraIds
    // (entries.filter is read-only here; actual un-tagging happens via storage in JournalEntry.tsx
    //  auto-assign — deleting an era simply means future saves won't assign it)
    reload();
    setConfirmDeleteId(null);
  };

  const startEdit = (era: Era) => {
    setEditingId(era.id);
    setIsAdding(false);
    setForm({
      name:        era.name,
      description: era.description || '',
      startDate:   era.startDate   || '',
      endDate:     era.endDate     || '',
      colour:      era.colour      || DEFAULT_COLOUR,
    });
  };

  const cancelForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm(EMPTY_FORM);
  };

  // ── Shared form ──────────────────────────────────────────────────────────

  const EraForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-5 pt-1">
      {/* Name */}
      <div>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Enter') onSubmit(); if (e.key === 'Escape') cancelForm(); }}
          placeholder="Name this chapter…"
          autoFocus
          className="w-full text-base bg-transparent outline-none pb-1.5 transition-colors placeholder:text-stone-300"
          style={{
            border: 'none',
            borderBottom: '1px solid #c8c2b6',
            caretColor: '#f59e0b',
            color: '#1C1C18',
          }}
          onFocus={e => { e.currentTarget.style.borderBottomColor = '#a89e8e'; }}
          onBlur={e => { e.currentTarget.style.borderBottomColor = '#c8c2b6'; }}
        />
      </div>

      {/* Description */}
      <div>
        <textarea
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="A few words about this chapter (optional)"
          rows={2}
          className="w-full text-sm bg-transparent outline-none pb-1.5 resize-none transition-colors placeholder:text-stone-300 leading-relaxed"
          style={{
            border: 'none',
            borderBottom: '1px solid #c8c2b6',
            caretColor: '#f59e0b',
            color: '#1C1C18',
          }}
          onFocus={e => { e.currentTarget.style.borderBottomColor = '#a89e8e'; }}
          onBlur={e => { e.currentTarget.style.borderBottomColor = '#c8c2b6'; }}
        />
      </div>

      {/* Date fields */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1.5">Started</p>
          <input
            type="date"
            value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            className="w-full text-sm bg-transparent outline-none pb-1.5 transition-colors"
            style={{
              border: 'none',
              borderBottom: '1px solid #c8c2b6',
              caretColor: '#f59e0b',
              color: '#1C1C18',
            }}
            onFocus={e => { e.currentTarget.style.borderBottomColor = '#a89e8e'; }}
            onBlur={e => { e.currentTarget.style.borderBottomColor = '#c8c2b6'; }}
          />
        </div>
        <div>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-1.5">Ended <span className="normal-case not-italic text-stone-400">(leave empty if ongoing)</span></p>
          <input
            type="date"
            value={form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            className="w-full text-sm bg-transparent outline-none pb-1.5 transition-colors"
            style={{
              border: 'none',
              borderBottom: '1px solid #c8c2b6',
              caretColor: '#f59e0b',
              color: '#1C1C18',
            }}
            onFocus={e => { e.currentTarget.style.borderBottomColor = '#a89e8e'; }}
            onBlur={e => { e.currentTarget.style.borderBottomColor = '#c8c2b6'; }}
          />
        </div>
      </div>

      {/* Overlap warning — inline, non-blocking */}
      <AnimatePresence>
        {overlapWarning && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-stone-400 italic -mt-2"
          >
            This overlaps with "{overlapWarning}" — that's fine if both feel true.
          </motion.p>
        )}
      </AnimatePresence>

      {/* Colour palette */}
      <div>
        <p className="text-[10px] text-stone-400 uppercase tracking-widest mb-2.5">Colour</p>
        <div className="flex gap-2.5 flex-wrap">
          {ERA_COLOURS.map(({ hex, label }) => (
            <button
              key={hex}
              onClick={() => setForm(f => ({ ...f, colour: hex }))}
              title={label}
              className="w-6 h-6 rounded-full transition-all duration-150 focus:outline-none"
              style={{
                backgroundColor: hex,
                boxShadow: form.colour === hex
                  ? `0 0 0 2px #EDE8DF, 0 0 0 3.5px ${hex}`
                  : 'none',
                transform: form.colour === hex ? 'scale(1.15)' : 'scale(1)',
              }}
              aria-pressed={form.colour === hex}
              aria-label={label}
            />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onSubmit}
          disabled={!form.name.trim()}
          className="text-sm font-medium transition-colors disabled:opacity-30"
          style={{ color: form.name.trim() ? '#3C3C38' : undefined }}
        >
          {submitLabel}
        </button>
        <button
          onClick={cancelForm}
          className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-3xl font-light mb-1"
          style={{ fontFamily: 'var(--font-display)', color: '#1C1C18' }}
        >
          Life chapters
        </h1>
        <p className="text-sm text-stone-400">
          Name the periods that shaped you.
        </p>
      </div>

      {/* Empty state */}
      {eras.length === 0 && !isAdding && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-12 text-center"
        >
          <p
            className="text-xl font-light text-stone-400 mb-6 leading-relaxed"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Your story has chapters even if they haven't been named yet.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-stone-500 hover:text-stone-700 transition-colors underline underline-offset-4 decoration-stone-300"
          >
            Create your first era →
          </button>
        </motion.div>
      )}

      {/* Era list */}
      <div className="space-y-0">
        <AnimatePresence mode="popLayout">
          {sorted.map((era, index) => (
            <motion.div
              key={era.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.04 }}
              layout
              className="border-b border-stone-200/60 last:border-b-0"
            >
              {editingId === era.id ? (
                /* ── Edit form ── */
                <div className="py-6">
                  <EraForm onSubmit={handleUpdate} submitLabel="Save changes" />
                </div>
              ) : (
                /* ── Read state ── */
                <div className="group flex items-start gap-4 py-5">
                  {/* Colour dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: era.colour || DEFAULT_COLOUR }}
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base font-medium mb-0.5"
                      style={{ color: '#1C1C18' }}
                    >
                      {era.name}
                    </p>
                    {era.description && (
                      <p className="text-sm text-stone-500 mb-2 leading-relaxed">
                        {era.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      {era.startDate && (
                        <span>{format(parseISO(era.startDate), 'MMM yyyy')}</span>
                      )}
                      {era.startDate && <span className="text-stone-400">→</span>}
                      {era.endDate ? (
                        <span>{format(parseISO(era.endDate), 'MMM yyyy')}</span>
                      ) : era.startDate ? (
                        <span className="text-amber-600 font-medium">Present</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions — appear on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                    <button
                      onClick={() => startEdit(era)}
                      className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="size-3.5" />
                    </button>

                    <button
                      onClick={() => setConfirmDeleteId(era.id)}
                      className="p-1.5 rounded-md text-stone-400 hover:text-red-500 transition-colors"
                      title="Delete era"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="border-t border-stone-200/60 pt-6 mt-2"
          >
            <EraForm onSubmit={handleAdd} submitLabel="Create era" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button — only shown when not already adding */}
      {!isAdding && eras.length > 0 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => { setIsAdding(true); setEditingId(null); setForm(EMPTY_FORM); }}
          className="mt-8 flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors group"
        >
          <Plus className="size-4 transition-transform group-hover:rotate-90 duration-200" />
          Add another era
        </motion.button>
      )}

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this era?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Journal entries assigned to this era will no longer be attached to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) handleDelete(confirmDeleteId);
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
