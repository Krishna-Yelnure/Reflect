import { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Upload, Shield, Trash2, FileText } from 'lucide-react';
import type { JournalEntry, UserPreferences } from '@/app/types';
import { preferences } from '@/app/utils/preferences';
import { storage } from '@/app/utils/storage';
import { exportToJSON, exportToMarkdown, importFromJSON } from '@/app/utils/export';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Card } from '@/app/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';

interface PrivacySettingsProps {
  entries: JournalEntry[];
  onImport: () => void;
}

export function PrivacySettings({ entries, onImport }: PrivacySettingsProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(preferences.get());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    preferences.save({ [key]: value });
    toast.success('Preference updated');
  };

  const handleExportJSON = () => {
    exportToJSON(entries);
    toast.success('Journal exported');
  };

  const handleExportMarkdown = () => {
    exportToMarkdown(entries);
    toast.success('Journal exported');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedEntries = await importFromJSON(file);
      
      // Merge with existing entries, avoiding duplicates
      const existing = storage.getEntries();
      const existingIds = new Set(existing.map(e => e.id));
      const newEntries = importedEntries.filter(e => !existingIds.has(e.id));
      
      storage.saveEntries([...existing, ...newEntries]);
      onImport();
      toast.success(`Imported ${newEntries.length} entries`);
    } catch (error) {
      toast.error('Failed to import journal');
    }
    
    // Reset input
    event.target.value = '';
  };

  const handleDeleteAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl mb-2">Privacy & Data</h2>
        <p className="text-slate-600">
          Your data never leaves this device. You have complete control.
        </p>
      </div>

      <div className="space-y-6">
        {/* Insights Preferences */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <Shield className="size-5 text-slate-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Insights & Analysis</h3>
              <p className="text-sm text-slate-600">
                Control how the app analyzes your entries
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label htmlFor="insights-enabled">Enable insights</Label>
                <p className="text-sm text-slate-500">Surface patterns and observations</p>
              </div>
              <Switch
                id="insights-enabled"
                checked={prefs.insightsEnabled}
                onCheckedChange={(checked) => handlePreferenceChange('insightsEnabled', checked)}
              />
            </div>

            {prefs.insightsEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pl-6 space-y-4 border-l-2 border-slate-200"
              >
                <div>
                  <Label className="text-sm text-slate-600 mb-2 block">Insight frequency</Label>
                  <div className="flex gap-2">
                    {(['weekly', 'monthly', 'off'] as const).map(freq => (
                      <Button
                        key={freq}
                        variant={prefs.insightFrequency === freq ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePreferenceChange('insightFrequency', freq)}
                        className="capitalize"
                      >
                        {freq}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="language-analysis">Language pattern analysis</Label>
                    <p className="text-sm text-slate-500">Detect writing patterns</p>
                  </div>
                  <Switch
                    id="language-analysis"
                    checked={prefs.languageAnalysisEnabled}
                    onCheckedChange={(checked) => handlePreferenceChange('languageAnalysisEnabled', checked)}
                  />
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex-1">
                <Label htmlFor="memory-reminders">Memory surfacing</Label>
                <p className="text-sm text-slate-500">Show related past entries</p>
              </div>
              <Switch
                id="memory-reminders"
                checked={prefs.memoryRemindersEnabled}
                onCheckedChange={(checked) => handlePreferenceChange('memoryRemindersEnabled', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Data Export */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <Download className="size-5 text-slate-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Export Your Data</h3>
              <p className="text-sm text-slate-600">
                Download all your journal entries
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleExportJSON}
              className="gap-2 flex-1"
              disabled={entries.length === 0}
            >
              <FileText className="size-4" />
              Export as JSON
            </Button>
            <Button
              variant="outline"
              onClick={handleExportMarkdown}
              className="gap-2 flex-1"
              disabled={entries.length === 0}
            >
              <FileText className="size-4" />
              Export as Markdown
            </Button>
          </div>
        </Card>

        {/* Data Import */}
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <Upload className="size-5 text-slate-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium mb-1">Import Data</h3>
              <p className="text-sm text-slate-600">
                Restore from a previous export
              </p>
            </div>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('import-file')?.click()}
              className="gap-2"
            >
              <Upload className="size-4" />
              Choose File to Import
            </Button>
          </div>
        </Card>

        {/* Delete All Data */}
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-4 mb-4">
            <Trash2 className="size-5 text-red-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900 mb-1">Delete All Data</h3>
              <p className="text-sm text-red-700">
                Permanently erase all journal entries and settings. This cannot be undone.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
          >
            Delete Everything
          </Button>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
        <h3 className="font-medium mb-2">Privacy Guarantee</h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li>• All data is stored locally in your browser</li>
          <li>• Nothing is sent to external servers</li>
          <li>• No analytics or tracking</li>
          <li>• No accounts or authentication</li>
          <li>• You own your data completely</li>
        </ul>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all journal data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your journal entries, settings, and preferences.
              This action cannot be undone. Consider exporting your data first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
