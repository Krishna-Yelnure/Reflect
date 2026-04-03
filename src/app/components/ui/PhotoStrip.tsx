/**
 * PhotoStrip.tsx — A14
 *
 * Horizontal scrollable strip of photo thumbnails.
 * Used in JournalEntry (write + read modes) below the text content.
 *
 * - Variable-width thumbnails: fixed height 80px, width auto (preserves aspect ratio)
 * - Dominant colour placeholder while blob loads (no white flash)
 * - Peek effect: last thumbnail is slightly cut off to signal scrollability
 * - Delete button on hover in edit mode only
 * - Click → triggers onLightbox(id)
 */

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

import { db } from '@/app/db';
import { mediaDb } from '@/app/utils/mediaDb';
import type { MediaMeta } from '@/app/types';

// ── Single thumbnail ──────────────────────────────────────────────────────────

interface ThumbProps {
  meta:        MediaMeta;
  onLightbox:  (id: string) => void;
  onDelete?:   (id: string) => void;  // undefined = read mode, no delete
}

function Thumb({ meta, onLightbox, onDelete }: ThumbProps) {
  const [blobUrl, setBlobUrl]       = useState<string | null>(null);
  const [loaded, setLoaded]         = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Load blob URL on mount
  useEffect(() => {
    let revoked = false;
    mediaDb.getBlobUrl(meta.id).then(url => {
      if (!revoked && url) setBlobUrl(url);
    });
    return () => {
      revoked = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.id]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(meta.id);
    },
    [meta.id, onDelete]
  );

  return (
    <div
      className="relative flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
      style={{
        height: 80,
        width: blobUrl ? 'auto' : Math.round((meta.width / meta.height) * 80),
        maxWidth: 120,
        minWidth: 60,
        // Dominant colour placeholder — shows until image loads
        backgroundColor: meta.dominantColour,
      }}
      onClick={() => onLightbox(meta.id)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      title={meta.caption || 'Photo'}
    >
      {blobUrl && (
        <img
          src={blobUrl}
          alt={meta.caption || 'Journal photo'}
          className="photo-thumb"
          style={{
            height: 80,
            width: 'auto',
            maxWidth: 120,
            objectFit: 'cover',
            display: 'block',
            // Crossfade from dominant colour placeholder
            opacity: loaded ? 1 : 0,
            transition: 'opacity 200ms ease',
          }}
          onLoad={() => setLoaded(true)}
        />
      )}

      {/* Delete button — edit mode only, on hover */}
      {onDelete && (showDelete || !blobUrl) && (
        <button
          onClick={handleDelete}
          className={[
            'absolute top-1 right-1 w-5 h-5 rounded-full',
            'bg-stone-900/70 text-white flex items-center justify-center',
            'hover:bg-stone-900 transition-colors',
            showDelete ? 'opacity-100' : 'opacity-0',
          ].join(' ')}
          aria-label="Remove photo"
          title="Remove photo"
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

// ── PhotoStrip ────────────────────────────────────────────────────────────────

interface PhotoStripProps {
  mediaIds:   string[];
  onDelete?:  (id: string) => void;   // undefined = read mode
  onLightbox: (id: string) => void;
}

export function PhotoStrip({ mediaIds, onDelete, onLightbox }: PhotoStripProps) {
  const [metas, setMetas] = useState<MediaMeta[]>([]);

  useEffect(() => {
    if (mediaIds.length === 0) { setMetas([]); return; }
    // Get metadata for each ID, preserving insertion order
    const allMeta = db.media.getAll();
    const ordered = mediaIds
      .map(id => allMeta.find(m => m.id === id))
      .filter((m): m is MediaMeta => m !== undefined);
    setMetas(ordered);
  }, [mediaIds]);

  if (metas.length === 0) return null;

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      style={{
        // Peek: padding-right creates a partial-cut-off on the last thumb
        // (only visible when there are multiple thumbs and horizontal scroll exists)
        paddingRight: metas.length > 2 ? 40 : 0,
        scrollbarWidth: 'none',       // Firefox
        msOverflowStyle: 'none',      // IE/Edge
        scrollSnapType: 'x mandatory',
      }}
      // Hide scrollbar in WebKit
      // (can't use CSS-in-JS here without more infrastructure; handled by global CSS if needed)
    >
      {metas.map(meta => (
        <div key={meta.id} style={{ scrollSnapAlign: 'start' }}>
          <Thumb
            meta={meta}
            onLightbox={onLightbox}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  );
}
