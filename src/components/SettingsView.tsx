import React, { useState } from 'react';
import type { SettingsData, TaskItem } from '../types';
import { Settings, Download, Save, ShieldAlert, Globe, Clock } from 'lucide-react';

interface SettingsViewProps {
  settings: SettingsData | null;
  tasks: TaskItem[];
  onUpdateSettings: (timezone: string, cutoffHour: number) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, tasks, onUpdateSettings }) => {
  const [timezone, setTimezone] = useState<string>(settings?.timezone || 'America/New_York');
  const [cutoffHour, setCutoffHour] = useState<number>(settings?.cutoffHour ?? 4);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await onUpdateSettings(timezone, cutoffHour);
      setMsg('Settings updated successfully!');
    } catch (err: any) {
      setMsg('Failed to update settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (tasks.length === 0) {
      alert('No task history to export yet.');
      return;
    }

    const headers = ['Date', 'Google Task ID', 'Task Name', 'Status', 'Completed At', 'Priority', 'Category', 'Is Optional'];
    const rows = tasks.map(t => [
      t.date,
      `"${t.taskId || ''}"`,
      `"${(t.taskName || '').replace(/"/g, '""')}"`,
      t.status,
      t.completedAt || '',
      t.priority,
      t.category,
      t.isOptional ? 'TRUE' : 'FALSE'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `habit_tracker_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-400" />
          <span>Settings & Data Export</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure Timezone, Day Cutoff Hour, and download client-side CSV data exports.
        </p>
      </div>

      {/* Security Architecture Note */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-800/40 bg-amber-950/20 space-y-2">
        <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Architecture & Security Honesty Note</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          This frontend app is hosted on <strong>GitHub Pages ($0 hosting)</strong>. Since the repository is public, JavaScript source code is visible in browser dev tools. The shared secret token is enforced server-side by Apps Script as a deterrent against unauthorized web requests, but should not be treated as enterprise OAuth security.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-100">Preferences</h3>

        {msg && (
          <div className={`p-3 rounded-xl text-xs font-medium ${msg.includes('Failed') ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Timezone</span>
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York or UTC"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Day Cutoff Hour (0–12)</span>
            </label>
            <input
              type="number"
              min="0"
              max="12"
              value={cutoffHour}
              onChange={(e) => setCutoffHour(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              e.g. 4 means tasks completed before 4:00 AM count towards the previous day's habits.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition cursor-pointer disabled:opacity-50 min-h-[44px]"
        >
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </button>
      </form>

      {/* CSV Export Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <span>Export Data as CSV</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Generates a client-side CSV file containing your habit history for external reporting or spreadsheets.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition cursor-pointer min-h-[44px]"
        >
          <Download className="w-4 h-4" />
          <span>Download CSV</span>
        </button>
      </div>
    </div>
  );
};
