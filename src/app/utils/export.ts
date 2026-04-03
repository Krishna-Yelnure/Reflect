import type { JournalEntry, ReflectionAnchor, Habit, HabitEngagement, MemoryThread } from '@/app/types';
import { format, parseISO } from 'date-fns';

import { db } from '@/app/db';
import { mediaDb } from '@/app/utils/mediaDb';

export function exportToJSON(): void {
  const jsonString = db.backup.exportAll();
  const blob = new Blob([jsonString], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `journal-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export journal + all photo blobs as a single JSON file.
 * Returns an estimated file size string so the caller can show a warning before triggering.
 */
export async function exportWithMedia(): Promise<void> {
  const jsonString = db.backup.exportAll();
  const base64Map  = await mediaDb.exportAllAsBase64();

  const fullSnapshot = {
    ...JSON.parse(jsonString),
    media: base64Map,   // { [mediaId]: 'data:image/jpeg;base64,...' }
  };

  const blob = new Blob([JSON.stringify(fullSnapshot, null, 2)], {
    type: 'application/json',
  });

  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.download = `journal-full-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Estimate the size of an exportWithMedia export before running it.
 * Returns a human-readable string like "~14 MB".
 */
export async function estimateMediaExportSize(): Promise<string> {
  const base64Map   = await mediaDb.exportAllAsBase64();
  const totalBase64 = Object.values(base64Map).reduce((sum, s) => sum + s.length, 0);
  // base64 inflates by ~33%; raw size ≈ totalBase64 * 0.75
  const estimatedBytes = totalBase64 * 0.75;
  if (estimatedBytes < 1024 * 1024) {
    return `~${Math.round(estimatedBytes / 1024)} KB`;
  }
  return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function exportToMarkdown(): void {
  const entries = db.entries.getAll();
  const sorted = [...entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const eras = db.eras.getAll();
  const anchors = db.anchors.getAll();
  const habits = db.habits.getAll();
  const engagements = db.engagements.getAll();
  const threads = db.threads.getAll();

  let markdown = `# Journal Export\n\n`;
  markdown += `Exported: ${format(new Date(), 'MMMM d, yyyy')}\n\n`;
  markdown += `---\n\n`;

  // --- CORE VALUES & INTENTIONS ---
  if (anchors.length > 0) {
    markdown += `## Core Values & Intentions\n\n`;
    anchors.forEach((a: ReflectionAnchor) => {
      markdown += `- **${a.type === 'value' ? 'Value' : 'Intention'}:** ${a.text}\n`;
    });
    markdown += `\n---\n\n`;
  }

  // --- ERAS ---
  if (eras.length > 0) {
    markdown += `## Life Eras\n\n`;
    const sortedEras = [...eras].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    sortedEras.forEach(e => {
      const end = e.endDate ? format(parseISO(e.endDate), 'MMM d, yyyy') : 'Present';
      markdown += `- **${e.name}** (${format(parseISO(e.startDate), 'MMM d, yyyy')} – ${end})\n`;
      if (e.description) markdown += `  > ${e.description}\n`;
    });
    markdown += `\n---\n\n`;
  }

  // --- HABITS ---
  if (habits.length > 0) {
    markdown += `## Habits\n\n`;
    habits.forEach((h: Habit) => {
      const count = engagements.filter((eng: HabitEngagement) => eng.habitId === h.id).length;
      markdown += `- **${h.name}** ${h.isArchived ? '(Archived)' : ''}\n`;
      if (h.why) markdown += `  - *Why:* ${h.why}\n`;
      markdown += `  - *Engaged:* ${count} times\n`;
    });
    markdown += `\n---\n\n`;
  }

  // --- THREADS ---
  if (threads.length > 0) {
    markdown += `## Memory Threads\n\n`;
    threads.forEach((t: MemoryThread) => {
      markdown += `- **${t.name}** (${t.entryIds.length} entries stitched together)\n`;
      if (t.description) markdown += `  > ${t.description}\n`;
    });
    markdown += `\n---\n\n`;
  }

  // --- ENTRIES ---
  markdown += `## Journal Entries\n\n`;
  markdown += `Total Entries: ${entries.length}\n\n`;

  sorted.forEach(entry => {
    let dateStr = entry.date;
    try {
      if (!dateStr.startsWith('reflection-')) {
        dateStr = format(parseISO(dateStr), 'EEEE, MMMM d, yyyy');
      } else {
        if (dateStr.startsWith('reflection-weekly-')) dateStr = `Week of ${format(parseISO(dateStr.replace('reflection-weekly-', '')), 'MMM d, yyyy')}`;
        else if (dateStr.startsWith('reflection-monthly-')) dateStr = `Month of ${dateStr.replace('reflection-monthly-', '')}`;
      }
    } catch { /* keep original */ }

    markdown += `### ${dateStr}\n\n`;
    
    if (entry.mood) {
      markdown += `**Mood:** ${entry.mood}`;
      if (entry.energy) {
        markdown += ` | **Energy:** ${entry.energy}/5`;
      }
      markdown += `\n\n`;
    }

    if (entry.tags && entry.tags.length > 0) {
      markdown += `**Tags:** ${entry.tags.join(', ')}\n\n`;
    }

    if (entry.reflectionType && entry.reflectionType !== 'daily') {
      markdown += `**Type:** ${entry.reflectionType} reflection\n\n`;
    }

    if (entry.whatHappened) {
      markdown += `**What happened?**\n${entry.whatHappened}\n\n`;
    }

    if (entry.feelings) {
      markdown += `**How did it feel?**\n${entry.feelings}\n\n`;
    }

    if (entry.whatMatters) {
      markdown += `**What mattered most?**\n${entry.whatMatters}\n\n`;
    }

    if (entry.insight) {
      markdown += `**Insight**\n${entry.insight}\n\n`;
    }

    if (entry.intention) {
      markdown += `**Intention**\n*${entry.intention}*\n\n`;
    }

    if (entry.freeWrite) {
      markdown += `**Free write**\n${entry.freeWrite}\n\n`;
    }

    // A14 — note photo count in markdown (blobs can't be inlined in .md)
    if (entry.mediaIds && entry.mediaIds.length > 0) {
      markdown += `*[${entry.mediaIds.length} photo${entry.mediaIds.length > 1 ? 's' : ''} attached — use JSON export to include media]*\n\n`;
    }

    markdown += `---\n\n`;
  });

  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `journal-export-${format(new Date(), 'yyyy-MM-dd')}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importFromJSON(file: File): Promise<{ entriesAdded: number; erasAdded: number; habitsAdded: number; anchorsAdded: number; questionsAdded: number; threadsAdded: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const result = db.backup.mergeAll(jsonString);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

/**
 * Import a full JSON snapshot that includes media blobs (produced by exportWithMedia).
 * Restores both text data (via db.backup.mergeAll) and photos (via mediaDb.importFromBase64).
 */
export async function importWithMedia(file: File): Promise<{
  entriesAdded: number;
  erasAdded: number;
  habitsAdded: number;
  anchorsAdded: number;
  questionsAdded: number;
  threadsAdded: number;
  photosRestored: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonString = e.target?.result as string;
        const snapshot   = JSON.parse(jsonString);

        // Restore text data
        const result = db.backup.mergeAll(JSON.stringify(snapshot));

        // Restore photo blobs if present
        let photosRestored = 0;
        if (snapshot.media && typeof snapshot.media === 'object') {
          await mediaDb.importFromBase64(snapshot.media);
          photosRestored = Object.keys(snapshot.media).length;
        }

        resolve({ ...result, photosRestored });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}
