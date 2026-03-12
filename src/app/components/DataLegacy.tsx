import { FileText, Download, AlertTriangle } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import type { JournalEntry } from '@/app/types';

interface DataLegacyProps {
  entries: JournalEntry[];
}

export function DataLegacy({ entries }: DataLegacyProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Data Legacy</h2>
        <p className="text-stone-600">
          Understanding your data and planning for the future
        </p>
      </div>

      <div className="space-y-6">
        {/* Where your data lives */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#DDD8CE' }}>
              <FileText className="size-5 text-stone-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-2">Where Your Data Lives</h3>
              <p className="text-sm text-stone-600 mb-4">
                All your journal entries are stored locally in your browser's localStorage.
                This means:
              </p>
              <ul className="text-sm text-stone-600 space-y-2">
                <li>• Your data never leaves this device</li>
                <li>• No cloud storage, no external servers</li>
                <li>• Data is tied to this specific browser on this device</li>
                <li>• Clearing browser data will delete all entries</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Export regularly */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: "#F5EAD8" }}>
              <Download className="size-5" style={{ color: "#C4762A" }} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-2">Export Regularly</h3>
              <p className="text-sm text-stone-600 mb-4">
                Because your data is browser-specific, we recommend:
              </p>
              <ul className="text-sm text-stone-600 space-y-2">
                <li>• Export your journal monthly or quarterly</li>
                <li>• Save exports in a secure location (encrypted drive, password-protected folder)</li>
                <li>• Keep multiple backup copies in different locations</li>
                <li>• Test imports occasionally to ensure backups work</li>
              </ul>
              <p className="text-sm text-stone-500 mt-4">
                Go to Privacy & Data → Export to download your complete journal.
              </p>
            </div>
          </div>
        </Card>

        {/* Device changes */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="size-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-2">Changing Devices or Browsers</h3>
              <p className="text-sm text-stone-600 mb-4">
                If you plan to switch devices or browsers:
              </p>
              <ol className="text-sm text-stone-600 space-y-2 list-decimal list-inside">
                <li>Export your journal from the current browser</li>
                <li>Save the export file securely</li>
                <li>On the new device/browser, import the file</li>
                <li>Verify all entries transferred correctly</li>
              </ol>
              <p className="text-sm text-amber-600 font-medium mt-4">
                Do not assume data will sync automatically—it won't.
              </p>
            </div>
          </div>
        </Card>

        {/* Long-term thinking */}
        <Card className="p-6 border-stone-200" style={{ backgroundColor: '#E8E2D8' }}>
          <h3 className="font-medium mb-3">Long-Term Data Philosophy</h3>
          <div className="text-sm text-stone-600 space-y-3">
            <p>
              This app is designed to last as long as you need it—but software and browsers
              evolve. We believe your writing should outlive any specific tool.
            </p>
            <p className="font-medium">Our commitment:</p>
            <ul className="space-y-2 pl-4">
              <li>• Exports use standard, readable formats (JSON, Markdown)</li>
              <li>• No proprietary lock-in</li>
              <li>• No dependency on external services</li>
              <li>• Your data remains yours, always</li>
            </ul>
            <p className="pt-3 border-t border-stone-200">
              Think of exports as "journal insurance"—a way to preserve your thoughts
              regardless of what happens to this app, your device, or the web itself.
            </p>
          </div>
        </Card>

        {/* Optional: Passing it on */}
        <Card className="p-6">
          <h3 className="font-medium mb-3">Passing Your Journal Forward</h3>
          <p className="text-sm text-stone-600 mb-4">
            If you want your journal to be accessible after you're gone, or to specific
            people in the future:
          </p>
          <ul className="text-sm text-stone-600 space-y-2">
            <li>
              • Store exported files in a location with clear access instructions
            </li>
            <li>
              • Consider encrypted exports if privacy is essential, with password instructions
              stored separately
            </li>
            <li>
              • Document how to import the files (this app or any text editor for Markdown)
            </li>
            <li>• Remember: This is entirely under your control</li>
          </ul>
          <p className="text-sm text-stone-500 mt-4 italic">
            The app doesn't manage succession planning—that's intentional. You decide what
            happens to your words.
          </p>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-stone-800 text-stone-100 rounded-lg">
        <h3 className="font-medium mb-2">Remember</h3>
        <p className="text-sm text-stone-400">
          You may outlive this software. That's why ownership, portability, and standard
          formats matter. Export regularly. Keep backups. Your thoughts deserve to persist.
        </p>
      </div>
    </div>
  );
}