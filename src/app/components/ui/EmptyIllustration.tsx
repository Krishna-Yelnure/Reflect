/**
 * EmptyIllustration.tsx — A17
 *
 * Reusable inline SVG empty-state illustration component.
 * Hand-drawn line art style. Always subtle — opacity: 0.25, never decorative.
 * Gives the eye something to rest on while reading the empty state copy.
 *
 * Usage:
 *   <EmptyIllustration type="quill" />   // Timeline, no entries
 *   <EmptyIllustration type="camera" />  // MediaGallery, no photos
 *   <EmptyIllustration type="seedling" /> // Habits
 *   <EmptyIllustration type="lens" />    // Insights
 */

interface EmptyIllustrationProps {
  type: 'quill' | 'camera' | 'seedling' | 'lens';
  size?: number;
  className?: string;
}

// ── SVG paths (hand-drawn line art style, strokeWidth 1.5) ────────────────────

const SVGS = {
  quill: (
    <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Feather shaft */}
      <path
        d="M36 62 C34 50 28 38 18 24"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      {/* Feather vane — right side */}
      <path
        d="M36 62 C44 46 52 32 58 14"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      {/* Quill tip */}
      <path
        d="M18 24 C20 28 24 30 28 28"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      />
      {/* Barbs — left */}
      <path d="M30 52 C26 48 22 46 18 44" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M28 46 C24 42 20 40 16 38" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M26 40 C22 36 20 34 18 30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      {/* Barbs — right */}
      <path d="M40 52 C44 48 48 46 52 44" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M42 46 C46 42 50 40 54 38" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M44 40 C48 36 52 34 54 30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      {/* Ink line below */}
      <path d="M28 66 L44 66" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M31 69 L41 69" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.25" />
    </svg>
  ),

  camera: (
    <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Camera body */}
      <rect x="10" y="24" width="52" height="36" rx="5" stroke="currentColor" strokeWidth="1.5" />
      {/* Viewfinder bump */}
      <path d="M26 24 L28 16 L44 16 L46 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Lens circle */}
      <circle cx="36" cy="42" r="10" stroke="currentColor" strokeWidth="1.5" />
      {/* Inner lens */}
      <circle cx="36" cy="42" r="5.5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {/* Shutter button */}
      <circle cx="56" cy="32" r="3" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {/* Flash */}
      <rect x="14" y="30" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  ),

  seedling: (
    <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stem */}
      <path d="M36 64 L36 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* Left leaf */}
      <path
        d="M36 44 C28 40 20 32 22 22 C30 22 36 28 36 36"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"
      />
      {/* Right leaf */}
      <path
        d="M36 38 C44 34 52 26 50 16 C42 16 36 22 36 30"
        stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"
      />
      {/* Soil line */}
      <path d="M20 64 C24 62 32 60 36 64 C40 60 48 62 52 64" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Leaf vein — left */}
      <path d="M36 42 C32 38 28 34 24 26" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" opacity="0.4" />
      {/* Leaf vein — right */}
      <path d="M36 36 C40 32 44 28 48 20" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" opacity="0.4" />
    </svg>
  ),

  lens: (
    <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnifier circle */}
      <circle cx="30" cy="30" r="18" stroke="currentColor" strokeWidth="1.5" />
      {/* Inner circle */}
      <circle cx="30" cy="30" r="10" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Handle */}
      <path d="M44 44 L58 58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Reflection glint */}
      <path d="M22 22 C24 20 28 19 30 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* Data lines inside — hinting at analysis */}
      <path d="M24 30 L36 30" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" opacity="0.35" />
      <path d="M24 34 L33 34" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" opacity="0.25" />
      <path d="M24 26 L32 26" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round" opacity="0.2" />
    </svg>
  ),
};

// ── Component ─────────────────────────────────────────────────────────────────

export function EmptyIllustration({ type, size = 72, className = '' }: EmptyIllustrationProps) {
  return (
    <div
      className={`shrink-0 text-foreground ${className}`}
      style={{ width: size, height: size, opacity: 0.25 }}
      aria-hidden="true"
    >
      {SVGS[type]}
    </div>
  );
}

export default EmptyIllustration;
