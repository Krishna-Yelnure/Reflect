import { useEffect, useRef, useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TurndownService from 'turndown';

// ─── Markdown ↔ Tiptap bridge ──────────────────────────────────────────────

/** Minimal Markdown → HTML for initial content load */
function markdownToHtml(md: string): string {
  if (!md) return '';
  let html = md
    // Bold **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    // Italic *text* or _text_
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Strikethrough ~~text~~
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    // Blockquote > text
    .replace(/^>\s?(.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    // Unordered list - item
    .replace(/^[-*]\s(.+)$/gm, '<li>$1</li>')
    // Ordered list 1. item
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>(\n|$))+/g, (match) => `<ul>${match}</ul>`)
    // Paragraphs — split on double newline
    .split(/\n\n+/)
    .map(block => {
      if (block.startsWith('<blockquote>') || block.startsWith('<ul>') || block.startsWith('<ol>')) return block;
      // Single newlines become <br> within paragraphs
      const inner = block.replace(/\n/g, '<br>');
      return `<p>${inner}</p>`;
    })
    .join('');
  return html;
}

/** Turndown instance — HTML → Markdown */
const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' });
td.addRule('strikethrough', {
  filter: ['s', 'del', 'strike'] as unknown as string,
  replacement: (content: string) => `~~${content}~~`,
});

// ─── Types ─────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;                        // Markdown string in
  onChange: (markdown: string) => void; // Markdown string out
  placeholder?: string;
  className?: string;
  minHeight?: string;
  autoFocus?: boolean;
  showToolbar?: boolean;                // default: true — false = keyboard shortcuts only (Deep Write)
  showShortcutHint?: boolean;           // shows the ⌘ shortcut hint button (Quick + Deep modes)
  toolbarVariant?: 'full' | 'minimal'; // minimal = Bold + Italic only
  style?: React.CSSProperties;
  id?: string;
}

// ─── ShortcutHint ────────────────────────────────────────────────────────────
// A small ⌘ icon that opens a compact pop-up listing all keyboard shortcuts
// with click-to-apply buttons. Used in Quick and Deep modes.

interface ShortcutHintProps {
  editor: ReturnType<typeof useEditor>;
}

function ShortcutHint({ editor }: ShortcutHintProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!editor) return null;

  const actions = [
    {
      label: 'Bold',
      shortcut: '⌘B',
      active: editor.isActive('bold'),
      apply: () => { editor.chain().focus().toggleBold().run(); },
      preview: <strong style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>B</strong>,
    },
    {
      label: 'Italic',
      shortcut: '⌘I',
      active: editor.isActive('italic'),
      apply: () => { editor.chain().focus().toggleItalic().run(); },
      preview: <em style={{ fontFamily: 'var(--font-body)', fontSize: 13 }}>I</em>,
    },
    {
      label: 'Strikethrough',
      shortcut: '⌘⇧X',
      active: editor.isActive('strike'),
      apply: () => { editor.chain().focus().toggleStrike().run(); },
      preview: <s style={{ fontFamily: 'var(--font-body)', fontSize: 13, textDecorationColor: 'currentColor' }}>S</s>,
    },
    {
      label: 'Bullet list',
      shortcut: '⌘⇧8',
      active: editor.isActive('bulletList'),
      apply: () => { editor.chain().focus().toggleBulletList().run(); },
      preview: (
        <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="1.5" cy="3" r="1" fill="currentColor" stroke="none"/>
          <line x1="4" y1="3" x2="11" y2="3"/>
          <circle cx="1.5" cy="6" r="1" fill="currentColor" stroke="none"/>
          <line x1="4" y1="6" x2="11" y2="6"/>
          <circle cx="1.5" cy="9" r="1" fill="currentColor" stroke="none"/>
          <line x1="4" y1="9" x2="11" y2="9"/>
        </svg>
      ),
    },
    {
      label: 'Blockquote',
      shortcut: '⌘⇧B',
      active: editor.isActive('blockquote'),
      apply: () => { editor.chain().focus().toggleBlockquote().run(); },
      preview: (
        <svg width="13" height="13" viewBox="0 0 12 12" fill="currentColor">
          <rect x="0" y="1" width="2" height="10" rx="1"/>
          <rect x="4" y="1" width="2" height="10" rx="1"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="absolute bottom-2 right-2" style={{ zIndex: 10 }}>
      {/* Trigger button — ⌘ glyph, subtle, always visible */}
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={e => { e.preventDefault(); setOpen(prev => !prev); }}
        title="Formatting shortcuts"
        aria-label="Show formatting shortcuts"
        className="flex items-center justify-center rounded-md transition-all duration-150 select-none"
        style={{
          width: 22,
          height: 22,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          backgroundColor: open ? 'rgba(0,0,0,0.10)' : 'rgba(0,0,0,0.04)',
          color: open ? '#5a5550' : '#a89e8e',
          border: '1px solid',
          borderColor: open ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.07)',
          lineHeight: 1,
        }}
      >
        ⌘
      </button>

      {/* Shortcut panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute bottom-full right-0 mb-2 rounded-xl shadow-lg overflow-hidden"
          style={{
            backgroundColor: '#FAFAF8',
            border: '1px solid rgba(0,0,0,0.10)',
            minWidth: 210,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header */}
          <div
            className="px-3 py-2 text-[10px] font-medium uppercase tracking-widest"
            style={{
              color: '#a89e8e',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            Formatting
          </div>

          {/* Actions */}
          <div className="py-1">
            {actions.map(action => (
              <button
                key={action.label}
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  action.apply();
                  // Keep panel open so user can chain formats
                }}
                className="w-full flex items-center gap-3 px-3 py-1.5 text-left transition-colors duration-100"
                style={{
                  backgroundColor: action.active ? 'rgba(0,0,0,0.05)' : 'transparent',
                  color: action.active ? 'var(--text-primary)' : '#5a5550',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = action.active ? 'rgba(0,0,0,0.05)' : 'transparent'; }}
              >
                {/* Format preview icon */}
                <span
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    backgroundColor: action.active ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)',
                    color: action.active ? 'var(--text-primary)' : '#8a7f72',
                  }}
                >
                  {action.preview}
                </span>

                {/* Label */}
                <span className="flex-1 text-sm">{action.label}</span>

                {/* Shortcut badge */}
                <span
                  className="text-[10px] tabular-nums"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: '#a89e8e',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '1px 5px',
                    borderRadius: 4,
                  }}
                >
                  {action.shortcut}
                </span>
              </button>
            ))}
          </div>

          {/* Footer tip */}
          <div
            className="px-3 py-2 text-[10px] italic"
            style={{
              color: '#b8b0a4',
              borderTop: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            Select text first, then apply a format
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ────────────────────────────────────────────────────────────────

interface ToolbarProps {
  editor: ReturnType<typeof useEditor>;
  variant: 'full' | 'minimal';
}

function Toolbar({ editor, variant }: ToolbarProps) {
  if (!editor) return null;

  const btn = (
    active: boolean,
    onClick: () => void,
    title: string,
    children: React.ReactNode
  ) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      aria-pressed={active}
      className={`
        inline-flex items-center justify-center w-6 h-6 rounded text-xs transition-all duration-150
        ${active
          ? 'text-[var(--text-primary)] bg-stone-200/80'
          : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100/70'
        }
      `}
    >
      {children}
    </button>
  );

  return (
    <div
      className="flex items-center gap-0.5 px-1 py-1 mb-1 opacity-0 focus-within:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      aria-label="Text formatting"
    >
      {/* Bold */}
      {btn(
        editor.isActive('bold'),
        () => editor.chain().focus().toggleBold().run(),
        'Bold (⌘B)',
        <strong style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>B</strong>
      )}
      {/* Italic */}
      {btn(
        editor.isActive('italic'),
        () => editor.chain().focus().toggleItalic().run(),
        'Italic (⌘I)',
        <em style={{ fontFamily: 'var(--font-body)', fontSize: 12 }}>I</em>
      )}

      {variant === 'full' && (
        <>
          {/* Separator */}
          <span className="w-px h-3.5 bg-stone-200 mx-0.5" />
          {/* Strikethrough */}
          {btn(
            editor.isActive('strike'),
            () => editor.chain().focus().toggleStrike().run(),
            'Strikethrough (⌘⇧X)',
            <s style={{ fontFamily: 'var(--font-body)', fontSize: 12, textDecorationColor: 'currentColor' }}>S</s>
          )}
          {/* Bullet list */}
          {btn(
            editor.isActive('bulletList'),
            () => editor.chain().focus().toggleBulletList().run(),
            'Bullet list',
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="1.5" cy="3" r="1" fill="currentColor" stroke="none"/>
              <line x1="4" y1="3" x2="11" y2="3"/>
              <circle cx="1.5" cy="6" r="1" fill="currentColor" stroke="none"/>
              <line x1="4" y1="6" x2="11" y2="6"/>
              <circle cx="1.5" cy="9" r="1" fill="currentColor" stroke="none"/>
              <line x1="4" y1="9" x2="11" y2="9"/>
            </svg>
          )}
          {/* Blockquote */}
          {btn(
            editor.isActive('blockquote'),
            () => editor.chain().focus().toggleBlockquote().run(),
            'Blockquote',
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="0" y="1" width="2" height="10" rx="1"/>
              <rect x="4" y="1" width="2" height="10" rx="1"/>
            </svg>
          )}
        </>
      )}
    </div>
  );
}

// ─── RichTextEditor ────────────────────────────────────────────────────────

export function RichTextEditor({
  value,
  onChange,
  placeholder = '',
  className = '',
  minHeight = '80px',
  autoFocus = false,
  showToolbar = true,
  showShortcutHint = false,
  toolbarVariant = 'full',
  style,
  id,
}: RichTextEditorProps) {
  // Track if we're the source of changes to avoid re-init loops
  const isInternalChange = useRef(false);
  const lastMarkdown = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading — Reflect controls typography, user controls structure
        heading: false,
        // Keep: bold, italic, strike, bulletList, orderedList, blockquote, code, hardBreak, history
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
    ],
    content: markdownToHtml(value),
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: 'rte-content prose-journal focus:outline-none',
        ...(id ? { id } : {}),
        style: `min-height: ${minHeight}; font-family: var(--font-body); color: var(--text-primary); caret-color: #f59e0b;`,
      },
    },
    onUpdate: ({ editor }) => {
      isInternalChange.current = true;
      const html = editor.getHTML();
      const markdown = td.turndown(html);
      lastMarkdown.current = markdown;
      onChange(markdown);
    },
  });

  // Sync external value changes (e.g. mode switch, load from storage)
  // Only update if not triggered by our own onUpdate
  useEffect(() => {
    if (!editor) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    // Only reset content if value meaningfully differs from what we last emitted
    if (value !== lastMarkdown.current) {
      lastMarkdown.current = value;
      editor.commands.setContent(markdownToHtml(value), false);
    }
  }, [value, editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { editor?.destroy(); };
  }, [editor]);

  const handleContainerClick = useCallback(() => {
    editor?.commands.focus();
  }, [editor]);

  return (
    <div
      className={`rte-wrapper group ${className}`}
      style={{ ...style, position: 'relative' }}
      onClick={handleContainerClick}
    >
      {showToolbar && editor && (
        <Toolbar editor={editor} variant={toolbarVariant} />
      )}
      <EditorContent editor={editor} />
      {showShortcutHint && !showToolbar && editor && (
        <ShortcutHint editor={editor} />
      )}
    </div>
  );
}

export default RichTextEditor;
