/**
 * PhotoLightbox.tsx — A14
 *
 * Full-screen overlay lightbox for viewing journal photos.
 *
 * - Blurred backdrop
 * - Image fills 90% viewport, letterboxed with dominant colour (not black bars)
 * - Swipe left/right (Framer Motion drag) to navigate between photos of same entry
 * - Dot indicators below image
 * - Double-click to zoom 2× / zoom out
 * - Caption display (read-only — editing via PhotoStrip in future)
 * - Escape or click-outside to close
 * - Privacy-mode aware (inherits blur from parent via CSS class)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

import { db } from '@/app/db';
import { mediaDb } from '@/app/utils/mediaDb';
import type { MediaMeta } from '@/app/types';

// ── Component ─────────────────────────────────────────────────────────────────

interface PhotoLightboxProps {
  mediaIds:  string[];       // all IDs for this entry (for prev/next)
  initialId: string;         // which photo to open first
  onClose:   () => void;
}

export function PhotoLightbox({ mediaIds, initialId, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, mediaIds.indexOf(initialId))
  );
  const [metas, setMetas]     = useState<MediaMeta[]>([]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loaded, setLoaded]   = useState(false);
  const [zoomed, setZoomed]   = useState(false);

  const currentId = mediaIds[currentIndex];

  // Load all metas once
  useEffect(() => {
    const all = db.media.getAll();
    const ordered = mediaIds
      .map(id => all.find(m => m.id === id))
      .filter((m): m is MediaMeta => m !== undefined);
    setMetas(ordered);
  }, [mediaIds]);

  // Load blob for current photo
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setBlobUrl(null);
    setZoomed(false);

    mediaDb.getBlobUrl(currentId).then(url => {
      if (!cancelled && url) setBlobUrl(url);
    });

    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < mediaIds.length - 1) setCurrentIndex(i => i + 1);
  }, [currentIndex, mediaIds.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goPrev, goNext]);

  const currentMeta = metas[currentIndex];
  const bgColour    = currentMeta?.dominantColour ?? 'rgb(30,30,28)';
  const caption     = currentMeta?.caption;
  const hasMultiple = mediaIds.length > 1;

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}   // click outside image closes
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
          aria-label="Close lightbox"
        >
          <X size={18} />
        </button>

        {/* Prev / Next arrows */}
        {hasMultiple && currentIndex > 0 && (
          <button
            onClick={e => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {hasMultiple && currentIndex < mediaIds.length - 1 && (
          <button
            onClick={e => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Next photo"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Image container — stops backdrop click from propagating */}
        <motion.div
          key={currentId}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.18 }}
          drag={hasMultiple ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.x < -80) goNext();
            if (info.offset.x > 80)  goPrev();
          }}
          className="flex items-center justify-center"
          style={{
            // Letterbox fills with dominant colour instead of black
            backgroundColor: loaded ? bgColour : 'transparent',
            borderRadius: 8,
            overflow: 'hidden',
            maxWidth: '90vw',
            maxHeight: '82vh',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Dominant colour placeholder until blob loads */}
          {!loaded && currentMeta && (
            <div
              style={{
                width: Math.min(currentMeta.width, window.innerWidth * 0.9),
                height: Math.min(currentMeta.height, window.innerHeight * 0.82),
                backgroundColor: currentMeta.dominantColour,
                borderRadius: 8,
              }}
            />
          )}

          {blobUrl && (
            <img
              src={blobUrl}
              alt={caption || 'Journal photo'}
              onLoad={() => setLoaded(true)}
              onDoubleClick={() => setZoomed(z => !z)}
              style={{
                maxWidth: '90vw',
                maxHeight: '82vh',
                objectFit: 'contain',
                display: 'block',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 200ms ease, transform 200ms ease',
                transform: zoomed ? 'scale(2)' : 'scale(1)',
                cursor: zoomed ? 'zoom-out' : 'zoom-in',
                borderRadius: 8,
              }}
            />
          )}
        </motion.div>

        {/* Caption */}
        {caption && loaded && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-white/70 text-sm text-center max-w-lg px-4"
          >
            {caption}
          </motion.p>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="flex gap-1.5 mt-4">
            {mediaIds.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setCurrentIndex(i); }}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: 'white',
                  opacity: i === currentIndex ? 1 : 0.3,
                }}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
