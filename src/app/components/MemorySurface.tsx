import { motion } from 'motion/react';
import { X, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { JournalEntry, MemorySurface as MemorySurfaceType } from '@/app/types';
import { Button } from '@/app/components/ui/button';

interface MemorySurfaceProps {
  memory: MemorySurfaceType;
  relatedEntry: JournalEntry;
  onDismiss: () => void;
  onViewEntry: () => void;
}

export function MemorySurface({ memory, relatedEntry, onDismiss, onViewEntry }: MemorySurfaceProps) {
  const preview = relatedEntry.whatHappened || relatedEntry.feelings || relatedEntry.freeWrite || '';
  const truncated = preview.slice(0, 120) + (preview.length > 120 ? '...' : '');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg p-4 mb-6"
      style={{ backgroundColor: 'var(--memory-bg)', border: '1px solid var(--memory-border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--memory-dot)' }} />
            <p className="text-sm" style={{ color: 'var(--memory-text)' }}>{memory.reason}</p>
          </div>
          <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>
            {format(parseISO(relatedEntry.date), 'MMMM d, yyyy')}
          </p>
          <p className="text-sm italic" style={{ color: 'var(--foreground)' }}>{truncated}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewEntry}
            style={{ color: 'var(--memory-link)' }}
          >
            <ExternalLink className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}