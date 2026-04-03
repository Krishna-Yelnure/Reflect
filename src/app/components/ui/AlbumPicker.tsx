/**
 * AlbumPicker.tsx — A14-followup
 *
 * Inline album-linking UI for JournalEntry (guided + deep modes).
 *
 * States:
 *   1. Collapsed — quiet "Link to an album →" text link
 *   2. Open      — list of existing albums + inline "New album" creation field
 *   3. Linked    — shows chips for each linked album (click × to unlink)
 *
 * Witness principle: this is secondary to writing. It stays quiet,
 * appears below the photo uploader, and never demands attention.
 */

import { useState, useRef, useEffect } from 'react';
import { X, Plus, FolderOpen, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { db } from '@/app/db';
import type { PhotoAlbum } from '@/app/types';

// ── Props ─────────────────────────────────────────────────────────────────────

interface AlbumPickerProps {
  linkedAlbumIds: string[];
  onChange: (albumIds: string[]) => void;
}

// ── AlbumPicker ───────────────────────────────────────────────────────────────

export function AlbumPicker({ linkedAlbumIds, onChange }: AlbumPickerProps) {
  const [open, setOpen]           = useState(false);
  const [allAlbums, setAllAlbums] = useState<PhotoAlbum[]>([]);
  const [newName, setNewName]     = useState('');
  const [creating, setCreating]   = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const panelRef                  = useRef<HTMLDivElement>(null);

  // Load albums when picker opens
  useEffect(() => {
    if (open) {
      setAllAlbums(db.albums.getAll());
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus new-album input when creating
  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  function toggleAlbum(albumId: string) {
    const isLinked = linkedAlbumIds.includes(albumId);
    onChange(isLinked
      ? linkedAlbumIds.filter(id => id !== albumId)
      : [...linkedAlbumIds, albumId]
    );
  }

  function handleCreateAlbum() {
    const name = newName.trim();
    if (!name) return;
    const album = db.albums.add(name);
    setAllAlbums(db.albums.getAll());
    onChange([...linkedAlbumIds, album.id]);
    setNewName('');
    setCreating(false);
  }

  function handleUnlink(albumId: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(linkedAlbumIds.filter(id => id !== albumId));
  }

  // ── Derived state ────────────────────────────────────────────────────────────

  const linkedAlbums = db.albums.getForEntry(linkedAlbumIds);
  const hasLinked    = linkedAlbums.length > 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div ref={panelRef} className="relative">

      {/* Trigger row */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 transition-colors duration-150 select-none"
        style={{ color: open || hasLinked ? '#5a5550' : '#a89e8e' }}
      >
        <FolderOpen size={13} strokeWidth={1.75} className="shrink-0" />
        <span className="text-xs">
          {hasLinked
            ? `${linkedAlbums.length} album${linkedAlbums.length > 1 ? 's' : ''} linked`
            : 'Link to an album'}
        </span>
        {open
          ? <ChevronUp  size={11} className="opacity-60" />
          : <ChevronDown size={11} className="opacity-40" />
        }
      </button>

      {/* Linked chips — always visible if albums linked */}
      {hasLinked && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {linkedAlbums.map(album => (
            <span
              key={album.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs select-none"
              style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                color: '#5a5550',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              <span>📷</span>
              <span>{album.name}</span>
              {album.mediaIds.length > 0 && (
                <span style={{ color: '#a89e8e', fontSize: 10 }}>
                  {album.mediaIds.length}
                </span>
              )}
              <button
                type="button"
                onClick={e => handleUnlink(album.id, e)}
                className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                aria-label={`Unlink ${album.name}`}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-20 rounded-xl overflow-hidden"
          style={{
            backgroundColor: '#FAFAF8',
            border: '1px solid rgba(0,0,0,0.10)',
            minWidth: 220,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest"
            style={{ color: '#a89e8e', borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            Albums
          </div>

          {/* Album list */}
          <div className="py-1 max-h-52 overflow-y-auto">
            {allAlbums.length === 0 && !creating && (
              <p className="px-3 py-2 text-xs italic" style={{ color: '#b8b0a4' }}>
                No albums yet. Create one below.
              </p>
            )}
            {allAlbums.map(album => {
              const isLinked = linkedAlbumIds.includes(album.id);
              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => toggleAlbum(album.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-100"
                  style={{
                    color: '#5a5550',
                    backgroundColor: isLinked ? 'rgba(0,0,0,0.04)' : 'transparent',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = isLinked ? 'rgba(0,0,0,0.04)' : 'transparent'; }}
                >
                  {/* Checkmark */}
                  <span
                    className="flex items-center justify-center rounded shrink-0"
                    style={{
                      width: 16,
                      height: 16,
                      border: isLinked ? 'none' : '1.5px solid rgba(0,0,0,0.18)',
                      backgroundColor: isLinked ? '#5a5550' : 'transparent',
                      color: 'white',
                    }}
                  >
                    {isLinked && <Check size={10} strokeWidth={3} />}
                  </span>

                  {/* Album name */}
                  <span className="flex-1 truncate">{album.name}</span>

                  {/* Photo count */}
                  {album.mediaIds.length > 0 && (
                    <span className="text-[10px] shrink-0" style={{ color: '#b8b0a4' }}>
                      {album.mediaIds.length} 📷
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* New album creation */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {creating ? (
              <div className="flex items-center gap-2 px-3 py-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateAlbum();
                    if (e.key === 'Escape') { setCreating(false); setNewName(''); }
                  }}
                  placeholder="Album name…"
                  maxLength={48}
                  className="flex-1 text-sm bg-transparent outline-none"
                  style={{ color: '#1C1C18', caretColor: '#f59e0b' }}
                />
                <button
                  type="button"
                  onClick={handleCreateAlbum}
                  disabled={!newName.trim()}
                  className="text-xs px-2 py-0.5 rounded-md transition-colors disabled:opacity-40"
                  style={{
                    backgroundColor: newName.trim() ? '#5a5550' : 'rgba(0,0,0,0.06)',
                    color: newName.trim() ? 'white' : '#a89e8e',
                  }}
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => { setCreating(false); setNewName(''); }}
                  className="opacity-50 hover:opacity-80 transition-opacity"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
                style={{ color: '#8a7f72' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.03)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                <Plus size={13} strokeWidth={2} />
                New album
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AlbumPicker;
