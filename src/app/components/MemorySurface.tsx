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
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <p className="text-sm text-blue-900">{memory.reason}</p>
          </div>
          <p className="text-sm text-slate-600 mb-1">
            {format(parseISO(relatedEntry.date), 'MMMM d, yyyy')}
          </p>
          <p className="text-sm text-slate-700 italic">{truncated}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewEntry}
            className="text-blue-700 hover:text-blue-800"
          >
            <ExternalLink className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}