import type { JournalEntry } from '@/app/types';
import { format, parseISO } from 'date-fns';

// V2: Data export and privacy controls

export function exportToJSON(entries: JournalEntry[]): void {
  const data = {
    exportDate: new Date().toISOString(),
    version: '2.0',
    entriesCount: entries.length,
    entries: entries.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { 
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

export function exportToMarkdown(entries: JournalEntry[]): void {
  const sorted = [...entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let markdown = `# Journal Export\n\n`;
  markdown += `Exported: ${format(new Date(), 'MMMM d, yyyy')}\n`;
  markdown += `Total Entries: ${entries.length}\n\n`;
  markdown += `---\n\n`;

  sorted.forEach(entry => {
    markdown += `## ${format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')}\n\n`;
    
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
      markdown += `### What happened today?\n\n${entry.whatHappened}\n\n`;
    }

    if (entry.feelings) {
      markdown += `### How did it make you feel?\n\n${entry.feelings}\n\n`;
    }

    if (entry.whatMatters) {
      markdown += `### What mattered most?\n\n${entry.whatMatters}\n\n`;
    }

    if (entry.insight) {
      markdown += `### Insight\n\n${entry.insight}\n\n`;
    }

    if (entry.freeWrite) {
      markdown += `### Free write\n\n${entry.freeWrite}\n\n`;
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

export function importFromJSON(file: File): Promise<JournalEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.entries && Array.isArray(data.entries)) {
          resolve(data.entries);
        } else {
          reject(new Error('Invalid file format'));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}
