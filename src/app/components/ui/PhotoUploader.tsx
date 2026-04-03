/**
 * PhotoUploader.tsx — A14
 *
 * Drag-and-drop or click-to-upload photo component for JournalEntry.
 *
 * Responsibilities:
 * - Accept image files via drag-drop or file input
 * - Compress to max 1200px / 80% JPEG quality using canvas
 * - Extract dominant colour for loading placeholder
 * - Save blob to IndexedDB (mediaDb) and metadata to localStorage (db.media)
 * - Enforce 3-photo limit per entry
 * - Update parent via onChange(mediaIds)
 *
 * Does NOT render the photo strip — that's PhotoStrip.tsx.
 */

import { useRef, useState, useCallback } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { db } from '@/app/db';
import { mediaDb } from '@/app/utils/mediaDb';

// ── Constants ─────────────────────────────────────────────────────────────────

const MAX_PHOTOS   = 9;
const MAX_DIMENSION = 1200;   // px — max width or height after compression
const JPEG_QUALITY = 0.8;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sample the canvas at 1px resolution to get an average RGB colour. */
function extractDominantColour(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'rgb(180,170,160)'; // parchment fallback
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let r = 0, g = 0, b = 0, count = 0;
  // Sample every 16th pixel for speed on large images
  for (let i = 0; i < d.length; i += 16) {
    r += d[i]; g += d[i + 1]; b += d[i + 2]; count++;
  }
  if (count === 0) return 'rgb(180,170,160)';
  return `rgb(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)})`;
}

/**
 * Compress an image File to a Blob + extract dimensions + dominant colour.
 * Returns a JPEG Blob scaled to MAX_DIMENSION at JPEG_QUALITY.
 */
async function compressImage(file: File): Promise<{
  blob: Blob;
  width: number;
  height: number;
  dominantColour: string;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Calculate target dimensions, preserving aspect ratio
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width  = MAX_DIMENSION;
        } else {
          width  = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas    = document.createElement('canvas');
      canvas.width    = width;
      canvas.height   = height;
      const ctx       = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      const dominantColour = extractDominantColour(canvas);

      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          resolve({ blob, width, height, dominantColour });
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image failed to load'));
    };

    img.src = objectUrl;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PhotoUploaderProps {
  entryId: string;
  existingMediaIds: string[];
  onChange: (mediaIds: string[]) => void;
  maxPhotos?: number;
}

export function PhotoUploader({
  entryId,
  existingMediaIds,
  onChange,
  maxPhotos = MAX_PHOTOS,
}: PhotoUploaderProps) {
  const inputRef          = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const remaining = maxPhotos - existingMediaIds.length;
  const isFull    = remaining <= 0;

  // ── Core upload handler ──────────────────────────────────────────────────

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (isFull) {
        toast.info(`Max ${maxPhotos} photos per entry`);
        return;
      }

      const toProcess = Array.from(files)
        .filter(f => f.type.startsWith('image/'))
        .slice(0, remaining); // don't exceed limit

      if (toProcess.length === 0) {
        toast.error('Please select image files only');
        return;
      }

      setIsUploading(true);
      const newIds: string[] = [];

      for (const file of toProcess) {
        try {
          // 1. Compress
          const { blob, width, height, dominantColour } = await compressImage(file);

          // 2. Save blob to IndexedDB first — if this fails, abort
          const meta = db.media.add({
            entryId,
            mimeType: 'image/jpeg',
            sizeBytes: blob.size,
            width,
            height,
            dominantColour,
          });

          await mediaDb.saveBlob(meta.id, blob);
          newIds.push(meta.id);
        } catch (err) {
          console.error('[PhotoUploader] Upload failed:', err);
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          if (errMsg.includes('storage') || errMsg.includes('quota')) {
            toast.error("Photos can't be saved in this browser mode");
          } else {
            toast.error('Failed to save photo — please try again');
          }
        }
      }

      setIsUploading(false);

      if (newIds.length > 0) {
        onChange([...existingMediaIds, ...newIds]);
      }
    },
    [entryId, existingMediaIds, isFull, maxPhotos, onChange, remaining]
  );

  // ── Drag handlers ────────────────────────────────────────────────────────

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isFull) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  // Don't render at all if already at the limit
  if (isFull) return null;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Add photo to entry (${remaining} remaining)`}
      onClick={() => !isUploading && inputRef.current?.click()}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isUploading) inputRef.current?.click(); }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed',
        'text-sm transition-colors cursor-pointer select-none',
        isDragging
          ? 'border-stone-400 bg-stone-100 text-stone-600'
          : 'border-stone-300 text-stone-400 hover:border-stone-400 hover:text-stone-500 hover:bg-stone-50',
        isUploading ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      {isUploading ? (
        <Loader2 size={15} className="animate-spin shrink-0" />
      ) : (
        <ImagePlus size={15} className="shrink-0" />
      )}
      <span>
        {isUploading
          ? 'Saving photo…'
          : remaining === maxPhotos
          ? 'Add a photo'
          : `Add photo (${remaining} left)`}
      </span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={remaining > 1}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
        // Reset so the same file can be re-selected after deletion
        onClick={e => { (e.target as HTMLInputElement).value = ''; }}
      />
    </div>
  );
}
