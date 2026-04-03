/**
 * MediaGallery.tsx — A14 (updated: search + tag filter)
 *
 * Witness principle: words above photos.
 * Features:
 * - Year + Month dropdown filters — jump instantly, no scrolling
 * - Tag filter pills — all tags used across photo entries
 * - Active-filter banner showing what's active, one-click clear
 * - Lazy blob loading via IntersectionObserver
 * - Dominant colour placeholder while blob loads
 * - Click any photo → PhotoLightbox
 * - Click entry date/excerpt → navigates to that entry
 * - Privacy mode: photos blurred when active
 * - Empty state with helpful message
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, parseISO, getYear, getMonth } from 'date-fns';
import { Image as ImageIcon, X, ChevronDown, Tag } from 'lucide-react';
import { EmptyIllustration } from '@/app/components/ui/EmptyIllustration';

import { db } from '@/app/db';
import { mediaDb } from '@/app/utils/mediaDb';
import { PhotoLightbox } from '@/app/components/ui/PhotoLightbox';
import type { JournalEntry, MediaMeta, PhotoAlbum } from '@/app/types';

// ── Lazy blob thumbnail hook ──────────────────────────────────────────────────

function useLazyBlobUrl(mediaId: string) {
  const [url, setUrl]   = useState<string | null>(null);
  const ref             = useRef<HTMLDivElement>(null);
  const revokeRef       = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect();
          mediaDb.getBlobUrl(mediaId).then(blobUrl => {
            if (blobUrl) {
              revokeRef.current = blobUrl;
              setUrl(blobUrl);
            }
          });
        }
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);

    return () => {
      obs.disconnect();
      if (revokeRef.current) URL.revokeObjectURL(revokeRef.current);
    };
  }, [mediaId]);

  return { ref, url };
}

// ── Single lazy thumbnail ─────────────────────────────────────────────────────

function LazyThumb({
  meta,
  onClick,
  privacyMode,
}: {
  meta: MediaMeta;
  onClick: () => void;
  privacyMode: boolean;
}) {
  const { ref, url } = useLazyBlobUrl(meta.id);
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="rounded-xl overflow-hidden cursor-pointer group relative"
      style={{
        backgroundColor: meta.dominantColour,
        aspectRatio: `${meta.width} / ${meta.height}`,
        flex: '1 1 120px',
        maxWidth: 200,
        minWidth: 90,
      }}
      title={meta.caption || 'Photo'}
    >
      {url && (
        <img
          src={url}
          alt={meta.caption || 'Journal photo'}
          onLoad={() => setLoaded(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          style={{
            opacity: loaded ? 1 : 0,
            transition: 'opacity 200ms ease, transform 300ms ease',
            filter: privacyMode ? 'blur(16px)' : 'none',
          }}
        />
      )}
      {/* Caption overlay on hover */}
      {meta.caption && loaded && !privacyMode && (
        <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 text-[10px] text-white leading-tight truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}>
          {meta.caption}
        </div>
      )}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface EntryGroup {
  entry: JournalEntry;
  metas: MediaMeta[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatGroupDate(dateKey: string): string {
  if (dateKey.startsWith('reflection-')) return 'Reflection';
  try { return format(parseISO(dateKey), 'EEEE, MMMM d, yyyy'); }
  catch { return dateKey; }
}

function getExcerpt(entry: JournalEntry): string {
  const src = entry.whatHappened || entry.freeWrite || entry.feelings || entry.whatMatters || '';
  const stripped = src.replace(/[*_~>#\-]/g, '').trim();
  return stripped.length > 100 ? stripped.slice(0, 100) + '…' : stripped;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ── Filter Bar ────────────────────────────────────────────────────────────────

interface FilterBarProps {
  allYears:      number[];
  allTags:       string[];
  filterYear:    number | null;
  filterMonth:   number | null;   // 0-indexed
  filterTag:     string | null;
  onSetYear:     (y: number | null) => void;
  onSetMonth:    (m: number | null) => void;
  onSetTag:      (t: string | null) => void;
}

function FilterBar({
  allYears, allTags,
  filterYear, filterMonth, filterTag,
  onSetYear, onSetMonth, onSetTag,
}: FilterBarProps) {
  const hasFilter = filterYear !== null || filterMonth !== null || filterTag !== null;

  return (
    <div className="space-y-3 mb-8">
      {/* Row 1: date dropdowns + clear */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Year dropdown */}
        <div className="relative">
          <select
            value={filterYear ?? ''}
            onChange={e => {
              const v = e.target.value;
              onSetYear(v ? Number(v) : null);
              if (!v) onSetMonth(null); // clear month if year cleared
            }}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm border transition-colors cursor-pointer"
            style={{
              backgroundColor: filterYear ? 'var(--primary)' : 'rgba(0,0,0,0.04)',
              color: filterYear ? '#fff' : '#5a5550',
              borderColor: filterYear ? 'var(--primary)' : 'rgba(0,0,0,0.10)',
            }}
          >
            <option value="">All years</option>
            {allYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none"
            style={{ color: filterYear ? '#fff' : '#8a7f72' }} />
        </div>

        {/* Month dropdown — only visible when a year is selected */}
        {filterYear !== null && (
          <div className="relative">
            <select
              value={filterMonth !== null ? filterMonth : ''}
              onChange={e => {
                const v = e.target.value;
                onSetMonth(v !== '' ? Number(v) : null);
              }}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg text-sm border transition-colors cursor-pointer"
              style={{
                backgroundColor: filterMonth !== null ? '#3C3C38' : 'rgba(0,0,0,0.04)',
                color: filterMonth !== null ? '#fff' : '#5a5550',
                borderColor: filterMonth !== null ? '#3C3C38' : 'rgba(0,0,0,0.10)',
              }}
            >
              <option value="">All months</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 pointer-events-none"
              style={{ color: filterMonth !== null ? '#fff' : '#8a7f72' }} />
          </div>
        )}

        {/* Clear all */}
        {hasFilter && (
          <button
            onClick={() => { onSetYear(null); onSetMonth(null); onSetTag(null); }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <X className="size-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* Row 2: tag pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <Tag className="size-3.5 text-stone-400 flex-shrink-0" />
          {allTags.map(tag => {
            const active = filterTag === tag;
            return (
              <button
                key={tag}
                onClick={() => onSetTag(active ? null : tag)}
                className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150"
                style={{
                  backgroundColor: active ? 'var(--primary)' : 'rgba(0,0,0,0.04)',
                  color:           active ? '#fff'     : '#5a5550',
                  borderColor:     active ? 'var(--primary)' : 'rgba(0,0,0,0.09)',
                }}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Active filter banner */}
      {hasFilter && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{ backgroundColor: 'rgba(28,28,24,0.06)' }}>
          <span className="text-stone-500">Showing photos</span>
          {filterTag   && <span className="font-medium text-stone-700">tagged #{filterTag}</span>}
          {filterTag && (filterYear || filterMonth !== null) && <span className="text-stone-400">·</span>}
          {filterYear  && <span className="font-medium text-stone-700">from {filterYear}</span>}
          {filterMonth !== null && filterYear && <span className="font-medium text-stone-700">, {MONTHS[filterMonth]}</span>}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface MediaGalleryProps {
  entries:     JournalEntry[];
  onViewEntry: (date: string) => void;
  privacyMode: boolean;
}

export function MediaGallery({ entries, onViewEntry, privacyMode }: MediaGalleryProps) {
  const [allGroups, setAllGroups]   = useState<EntryGroup[]>([]);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [lightboxGroup, setLightboxGroup] = useState<EntryGroup | null>(null);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [albums, setAlbums]         = useState<PhotoAlbum[]>([]); // A14-followup
  const [albumLightboxIds, setAlbumLightboxIds] = useState<string[] | null>(null); // tracks which album is open in lightbox

  // Filter state
  const [filterYear,  setFilterYear]  = useState<number | null>(null);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterTag,   setFilterTag]   = useState<string | null>(null);

  // Build all groups once entries change
  useEffect(() => {
    const allMeta = db.media.getAll();
    setTotalPhotos(allMeta.length);

    const entriesWithPhotos = entries
      .filter(e => e.mediaIds && e.mediaIds.length > 0)
      .sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date));

    const built: EntryGroup[] = entriesWithPhotos.map(entry => ({
      entry,
      metas: (entry.mediaIds ?? [])
        .map(id => allMeta.find(m => m.id === id))
        .filter((m): m is MediaMeta => m !== undefined),
    })).filter(g => g.metas.length > 0);

    setAllGroups(built);

    // A14-followup: load albums
    setAlbums(db.albums.getAll());
  }, [entries]);

  // Derived: unique years across all groups
  const allYears = useMemo<number[]>(() => {
    const years = new Set<number>();
    allGroups.forEach(g => {
      if (!g.entry.date.startsWith('reflection-')) {
        try { years.add(getYear(parseISO(g.entry.date))); } catch { /* skip */ }
      }
    });
    return Array.from(years).sort((a, b) => b - a); // newest first
  }, [allGroups]);

  // Derived: union of all tags across photo-entries
  const allTags = useMemo<string[]>(() => {
    const tags = new Set<string>();
    allGroups.forEach(g => (g.entry.tags ?? []).forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [allGroups]);

  // Derived: filtered groups
  const groups = useMemo<EntryGroup[]>(() => {
    return allGroups.filter(g => {
      // Tag filter
      if (filterTag && !(g.entry.tags ?? []).includes(filterTag)) return false;

      // Date filter — skip reflection entries for date matching
      if ((filterYear !== null || filterMonth !== null) && g.entry.date.startsWith('reflection-')) return false;

      if (filterYear !== null || filterMonth !== null) {
        try {
          const d = parseISO(g.entry.date);
          if (filterYear  !== null && getYear(d)  !== filterYear)  return false;
          if (filterMonth !== null && getMonth(d) !== filterMonth)  return false;
        } catch { return false; }
      }

      return true;
    });
  }, [allGroups, filterYear, filterMonth, filterTag]);

  const openLightbox  = useCallback((group: EntryGroup, mediaId: string) => {
    setLightboxGroup(group);
    setLightboxId(mediaId);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxGroup(null);
    setLightboxId(null);
  }, []);

  const hasFilter = filterYear !== null || filterMonth !== null || filterTag !== null;

  // ── Empty state (no photos at all) ────────────────────────────────────────
  if (allGroups.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="flex justify-center mb-6">
          <EmptyIllustration type="camera" size={72} />
        </div>
        <h2 className="text-xl font-light mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          Your photos will appear here
        </h2>
        <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
          Photos you add to entries stay on your device. They\'ll appear here, grouped by the moment they belong to.
        </p>
      </div>
    );
  }

  // ── Gallery ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-3xl font-light" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Media
          </h1>
          <p className="text-sm text-stone-400">
            {totalPhotos} {totalPhotos === 1 ? 'photo' : 'photos'} across {allGroups.length} {allGroups.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>

        {/* ── Albums section — A14-followup ──────────────────────────────── */}
        {albums.length > 0 && (
          <div className="mb-10">
            <p className="text-[10px] font-medium uppercase tracking-widest mb-4" style={{ color: '#a89e8e' }}>
              Albums
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {albums.map(album => {
                const allMeta = db.media.getAll();
                const albumMetas = album.mediaIds
                  .map(id => allMeta.find(m => m.id === id))
                  .filter((m): m is MediaMeta => m !== undefined)
                  .slice(0, 3); // max 3 preview thumbs

                return (
                  <div
                    key={album.id}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.03)',
                      border: '1px solid rgba(0,0,0,0.07)',
                    }}
                    onClick={() => {
                      if (album.mediaIds.length > 0) {
                        setAlbumLightboxIds(album.mediaIds);
                        setLightboxId(album.mediaIds[0]);
                      }
                    }}
                  >
                    {/* Preview strip — first 3 thumbs stacked */}
                    <div className="flex -space-x-2 shrink-0">
                      {albumMetas.length > 0 ? albumMetas.map((meta: MediaMeta, i: number) => (
                        <div
                          key={meta.id}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            border: '2px solid #FAFAF8',
                            zIndex: albumMetas.length - i,
                            position: 'relative',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <LazyThumb
                            meta={meta}
                            privacyMode={privacyMode}
                            onClick={() => {
                              setAlbumLightboxIds(album.mediaIds);
                              setLightboxId(meta.id);
                            }}
                          />
                        </div>
                      )) : (
                        <div
                          className="flex items-center justify-center rounded-lg"
                          style={{ width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.06)' }}
                        >
                          <ImageIcon size={14} style={{ color: '#a89e8e' }} />
                        </div>
                      )}
                    </div>

                    {/* Album info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {album.name}
                      </p>
                      <p className="text-xs" style={{ color: '#a89e8e' }}>
                        {album.mediaIds.length} {album.mediaIds.length === 1 ? 'photo' : 'photos'}
                      </p>
                    </div>

                    {/* Count chip */}
                    {album.mediaIds.length > 3 && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: 'rgba(0,0,0,0.06)', color: '#8a7f72' }}
                      >
                        +{album.mediaIds.length - 3}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter bar */}
        <FilterBar
          allYears={allYears}
          allTags={allTags}
          filterYear={filterYear}
          filterMonth={filterMonth}
          filterTag={filterTag}
          onSetYear={y => { setFilterYear(y); if (!y) setFilterMonth(null); }}
          onSetMonth={setFilterMonth}
          onSetTag={setFilterTag}
        />

        {/* No results for current filter */}
        {groups.length === 0 && hasFilter ? (
          <div className="py-16 text-center">
            <p className="text-stone-400 text-sm mb-3">No photos match this filter.</p>
            <button
              onClick={() => { setFilterYear(null); setFilterMonth(null); setFilterTag(null); }}
              className="text-xs text-stone-500 underline underline-offset-2 hover:text-stone-700 transition-colors"
            >
              Clear and show all photos
            </button>
          </div>
        ) : (
          /* Entry groups */
          <div className="space-y-10">
            {groups.map(group => {
              const excerpt = getExcerpt(group.entry);
              return (
                <div key={group.entry.id}>
                  {/* Entry header — text above photos (Witness principle) */}
                  <button
                    onClick={() => onViewEntry(group.entry.date)}
                    className="text-left mb-3 group w-full"
                  >
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-1">
                      {formatGroupDate(group.entry.date)}
                    </p>
                    {excerpt && (
                      <p className="text-sm text-stone-500 leading-relaxed group-hover:text-stone-800 transition-colors line-clamp-2 italic">
                        "{excerpt}"
                      </p>
                    )}
                    {/* Tags row */}
                    {(group.entry.tags ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(group.entry.tags ?? []).map(t => (
                          <button
                            key={t}
                            onClick={e => { e.stopPropagation(); setFilterTag(filterTag === t ? null : t); }}
                            className="px-2 py-0.5 rounded-full text-[10px] border transition-colors"
                            style={{
                              backgroundColor: filterTag === t ? 'var(--primary)' : 'rgba(0,0,0,0.04)',
                              color:           filterTag === t ? '#fff'     : '#787068',
                              borderColor:     filterTag === t ? 'var(--primary)' : 'rgba(0,0,0,0.08)',
                            }}
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Photo row */}
                  <div className="flex flex-wrap gap-2">
                    {group.metas.map(meta => (
                      <LazyThumb
                        key={meta.id}
                        meta={meta}
                        privacyMode={privacyMode}
                        onClick={() => openLightbox(group, meta.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox — entry photos */}
      {lightboxGroup && lightboxId && !albumLightboxIds && (
        <PhotoLightbox
          mediaIds={lightboxGroup.metas.map(m => m.id)}
          initialId={lightboxId}
          onClose={closeLightbox}
        />
      )}

      {/* Lightbox — album photos */}
      {albumLightboxIds && lightboxId && (
        <PhotoLightbox
          mediaIds={albumLightboxIds}
          initialId={lightboxId}
          onClose={() => { setAlbumLightboxIds(null); setLightboxId(null); }}
        />
      )}
    </>
  );
}
