// ─── MarkdownRenderer ──────────────────────────────────────────────────────
// Display-only component. Renders a Markdown string as clean, styled HTML.
// Used in Read mode to display formatted journal content.
// No Tiptap instance — pure transformation + dangerouslySetInnerHTML.

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Markdown → safe HTML
 * Supports: **bold**, *italic*, ~~strike~~, - lists, 1. lists, > blockquote
 * No headings (Reflect controls typography), no inline HTML passthrough.
 */
function renderMarkdown(md: string): string {
  if (!md) return '';

  // Escape any raw HTML that might have ended up in storage
  const escaped = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = escaped.split('\n');
  const result: string[] = [];
  let inList = false;
  let inBlockquote = false;
  let pendingParagraph: string[] = [];

  const flushParagraph = () => {
    if (pendingParagraph.length > 0) {
      const text = pendingParagraph.join('<br>');
      if (text.trim()) result.push(`<p>${text}</p>`);
      pendingParagraph = [];
    }
  };

  const flushList = () => {
    if (inList) { result.push('</ul>'); inList = false; }
  };

  const flushBlockquote = () => {
    if (inBlockquote) { result.push('</blockquote>'); inBlockquote = false; }
  };

  const inlineFormat = (text: string): string =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      // restore &gt; that was an intentional > in blockquote content
      .replace(/&gt;/g, '>');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Blank line — flush everything
    if (line.trim() === '') {
      flushParagraph();
      flushList();
      flushBlockquote();
      continue;
    }

    // Blockquote
    if (/^&gt;\s?/.test(line)) {
      flushParagraph();
      flushList();
      if (!inBlockquote) { result.push('<blockquote>'); inBlockquote = true; }
      const content = inlineFormat(line.replace(/^&gt;\s?/, ''));
      result.push(`<p>${content}</p>`);
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      flushParagraph();
      flushBlockquote();
      if (!inList) { result.push('<ul>'); inList = true; }
      const content = inlineFormat(line.replace(/^[-*]\s/, ''));
      result.push(`<li>${content}</li>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      flushParagraph();
      flushBlockquote();
      // treat as ul for simplicity — visual difference handled by CSS
      if (!inList) { result.push('<ul class="ordered">'); inList = true; }
      const content = inlineFormat(line.replace(/^\d+\.\s/, ''));
      result.push(`<li>${content}</li>`);
      continue;
    }

    // Regular line — accumulate as paragraph
    flushList();
    flushBlockquote();
    pendingParagraph.push(inlineFormat(line));
  }

  flushParagraph();
  flushList();
  flushBlockquote();

  return result.join('\n');
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div
      className={`markdown-content ${className}`}
      // Safe: content came from our own journal (local-only), HTML escaped before processing
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}

export default MarkdownRenderer;
