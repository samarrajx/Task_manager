import React, { useEffect, useState, useCallback, useRef } from 'react';
import { habitApi } from '../services/api';
import type { SettingsData } from '../types';
import {
  Globe,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  Folder,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Download,
  Upload,
  Database,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC'
];

interface SettingsScreenProps {
  onSettingsSaved?: () => void;
}

interface ListMappingItem {
  listName: string;
  category: string;
  enabled: boolean;
}

/**
 * SettingsScreen – Configuration management for Timezone, Day-Cutoff Hour,
 * Google Tasks Lists sync toggles, Category-to-List mapping, and full JSON Data Backup & Restore flow.
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onSettingsSaved }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [refreshingLists, setRefreshingLists] = useState<boolean>(false);
  const [backingUp, setBackingUp] = useState<boolean>(false);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [resetConfirmText, setResetConfirmText] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [cutoffHour, setCutoffHour] = useState<number>(4);
  const [mappings, setMappings] = useState<ListMappingItem[]>([]);

  // API Credentials state
  const [customUrl, setCustomUrl] = useState<string>(() => {
    try { return localStorage.getItem('ht_custom_url') || ''; } catch { return ''; }
  });
  const [customToken, setCustomToken] = useState<string>(() => {
    try { return localStorage.getItem('ht_custom_token') || ''; } catch { return ''; }
  });

  // Add list state
  const [newListName, setNewListName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data: SettingsData = await habitApi.getSettings();
      if (data) {
        if (data.timezone) setTimezone(data.timezone);
        if (data.cutoffHour !== undefined) setCutoffHour(data.cutoffHour);

        const catMap = data.categoryMap || {};
        const mappingArray: ListMappingItem[] = Object.entries(catMap).map(([listName, category]) => ({
          listName,
          category,
          enabled: true
        }));

        if (mappingArray.length === 0) {
          mappingArray.push(
            { listName: 'My Tasks', category: 'General', enabled: true },
            { listName: 'Fitness & Health', category: 'Health', enabled: true },
            { listName: 'Work & Learning', category: 'Career', enabled: true }
          );
        }

        setMappings(mappingArray);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setErrorMsg('Could not fetch current settings from Google Sheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // 1️⃣ Refresh Google Tasks Lists Action
  const handleRefreshLists = async () => {
    setRefreshingLists(true);
    setErrorMsg(null);
    try {
      const fetchedLists = await habitApi.getTaskLists();
      if (Array.isArray(fetchedLists) && fetchedLists.length > 0) {
        setMappings(prev => {
          const existingNames = new Set(prev.map(m => m.listName.trim().toLowerCase()));
          const updated = [...prev];

          fetchedLists.forEach(l => {
            if (l.title && !existingNames.has(l.title.trim().toLowerCase())) {
              updated.push({
                listName: l.title.trim(),
                category: 'General',
                enabled: true
              });
              existingNames.add(l.title.trim().toLowerCase());
            }
          });

          return updated;
        });
        setSuccessMsg('Available Google Tasks lists refreshed successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg('No Google Tasks lists returned. Ensure you have lists created in Google Tasks.');
      }
    } catch (err: any) {
      console.error('Failed to refresh lists from Google Tasks:', err);
      setErrorMsg('Could not fetch lists from Google Tasks API.');
    } finally {
      setRefreshingLists(false);
    }
  };

  // 2️⃣ Backup Data JSON Export Action
  const handleBackupData = async () => {
    setBackingUp(true);
    setErrorMsg(null);
    try {
      const backupObj = await habitApi.getBackup();
      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      const fileName = `habit_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg('Complete habit tracking database exported as JSON!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Backup export failed:', err);
      setErrorMsg('Failed to download backup JSON from Google Sheets API.');
    } finally {
      setBackingUp(false);
    }
  };

  // 3️⃣ Import & Restore Backup JSON Action
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);

        if (!backupData || !backupData.sheets) {
          setErrorMsg('Invalid backup file structure. Ensure it is a valid Habit Tracker JSON backup.');
          return;
        }

        setRestoring(true);
        setErrorMsg(null);
        await habitApi.restoreBackup(backupData);
        setSuccessMsg('Backup restored successfully! Google Sheets database updated.');
        await loadSettings();
        if (onSettingsSaved) onSettingsSaved();
        setTimeout(() => setSuccessMsg(null), 5000);
      } catch (err: any) {
        console.error('Failed to parse or restore backup:', err);
        setErrorMsg('Error restoring backup file: ' + (err?.message || 'Invalid JSON format.'));
      } finally {
        setRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleToggleList = (index: number) => {
    setMappings(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], enabled: !copy[index].enabled };
      return copy;
    });
  };

  const handleCategoryChange = (index: number, newCat: string) => {
    setMappings(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], category: newCat };
      return copy;
    });
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddMapping = () => {
    if (!newListName.trim()) return;
    setMappings(prev => [
      ...prev,
      {
        listName: newListName.trim(),
        category: newCategory.trim() || 'General',
        enabled: true
      }
    ]);
    setNewListName('');
    setNewCategory('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const categoryMap: Record<string, string> = {};
    mappings.forEach(m => {
      if (m.enabled && m.listName.trim()) {
        categoryMap[m.listName.trim()] = m.category.trim() || 'General';
      }
    });

    try {
      await habitApi.updateSettings(timezone, Number(cutoffHour), categoryMap);
      setSuccessMsg('Settings updated successfully! Changes saved to the Config tab.');
      if (onSettingsSaved) onSettingsSaved();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      setErrorMsg(err?.message || 'Failed to save settings to Google Sheets.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="text-sm text-slate-400">Loading settings…</span>
      </div>
    );
  }

  const handleSaveApiCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (customUrl.trim()) {
        localStorage.setItem('ht_custom_url', customUrl.trim());
      } else {
        localStorage.removeItem('ht_custom_url');
      }

      if (customToken.trim()) {
        localStorage.setItem('ht_custom_token', customToken.trim());
      } else {
        localStorage.removeItem('ht_custom_token');
      }

      setSuccessMsg('API Credentials saved successfully to browser storage!');
      if (onSettingsSaved) onSettingsSaved();
      loadSettings();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg('Failed to save API Credentials to browser storage.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* SECTION 0: Web App API Credentials */}
      <div className="surface p-5 sm:p-6 rounded-2xl border border-indigo-500/40 bg-indigo-950/20 space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-900/50 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Google Apps Script API Connection</h2>
          </div>
          <span className="text-[11px] text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-1 rounded-full font-semibold">
            Browser Storage
          </span>
        </div>

        <form onSubmit={handleSaveApiCredentials} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400 block">
                The Web App URL generated when deploying your Apps Script backend as "Anyone".
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Secret Token
              </label>
              <input
                type="password"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                placeholder="Enter your 32+ character random secret token"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400 block">
                The 32+ character token set in Apps Script Script Properties.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="btn btn-primary text-xs flex items-center gap-1.5 px-4 py-2 cursor-pointer"
            >
              <Save size={14} />
              <span>Save API Credentials</span>
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: System & Timing Config */}
        <div className="surface p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders size={20} className="text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Timing & Timezone Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Timezone Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe size={14} className="text-indigo-400" />
                <span>Timezone</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {COMMON_TIMEZONES.map(tz => (
                  <option key={tz} value={tz} className="bg-slate-900 text-slate-200">
                    {tz}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 block">
                Controls date calculation for task completion and daily cutoff.
              </span>
            </div>

            {/* Day Cutoff Hour */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-400" />
                <span>Day-Cutoff Hour (0–23)</span>
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={cutoffHour}
                onChange={(e) => setCutoffHour(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-500 block">
                Hour when a new tracking day starts (e.g. 4 = 4:00 AM).
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Google Tasks Lists & Category Mapping */}
        <div className="surface p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Folder size={20} className="text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100">Google Tasks List Sync & Categories</h2>
            </div>

            {/* REFRESH AVAILABLE LISTS BUTTON */}
            <button
              type="button"
              onClick={handleRefreshLists}
              disabled={refreshingLists}
              className="btn btn-ghost text-xs flex items-center gap-2 border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 cursor-pointer min-h-[38px] px-3.5"
            >
              {refreshingLists ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Refresh available lists</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Select which Google Tasks lists to sync and map each list to a category. Click "Refresh available lists" above to automatically pull newly created lists from your Google account.
          </p>

          {/* List Mappings Items */}
          <div className="space-y-3">
            {mappings.map((item, index) => (
              <div
                key={index}
                className={`surface-elevated p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  item.enabled ? 'border-slate-800' : 'border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Sync Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggleList(index)}
                    className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer flex-shrink-0 ${
                      item.enabled ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                    title={item.enabled ? 'Enabled for sync' : 'Disabled'}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        item.enabled ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>

                  <div>
                    <span className="font-bold text-sm text-slate-100">{item.listName}</span>
                    <span className="text-xs text-slate-400 block">
                      {item.enabled ? 'Sync Active' : 'Sync Paused'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Category Name Input */}
                  <div className="flex items-center gap-2 flex-1 sm:flex-none">
                    <span className="text-xs text-slate-400 font-medium">Category:</span>
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => handleCategoryChange(index, e.target.value)}
                      disabled={!item.enabled}
                      placeholder="Category"
                      className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMapping(index)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Remove List Mapping"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New List Mapping Row */}
          <div className="surface p-4 rounded-xl border border-slate-800/80 space-y-3 pt-4">
            <span className="text-xs font-semibold text-slate-300 block">Add Manual List Mapping</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Google Tasks List Name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 sm:col-span-1"
              />
              <input
                type="text"
                placeholder="Category (e.g. Fitness)"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 sm:col-span-1"
              />
              <button
                type="button"
                onClick={handleAddMapping}
                className="btn btn-ghost text-xs flex items-center justify-center gap-1 cursor-pointer min-h-[38px]"
              >
                <Plus size={14} />
                <span>Add List</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: Backup & Restore Data */}
        <div className="surface p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Database size={20} className="text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">Database Backup & Restore</h2>
          </div>

          <p className="text-xs text-slate-400">
            Export a full JSON snapshot of all your habit tracker tabs (DailyTasks, Streaks, Config, Goals, Notes, Dashboard), or import a JSON file to restore your database.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Backup Button */}
            <div className="surface-elevated p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Download size={16} className="text-indigo-400" />
                  <span>Backup My Data</span>
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Downloads a complete single JSON file containing all sheet records.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackupData}
                disabled={backingUp}
                className="btn btn-ghost text-xs flex items-center justify-center gap-2 border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 cursor-pointer min-h-[40px] px-4 font-semibold self-start"
              >
                {backingUp ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                <span>Backup my data</span>
              </button>
            </div>

            {/* Import Backup Flow */}
            <div className="surface-elevated p-4 rounded-xl border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <Upload size={16} className="text-emerald-400" />
                  <span>Import Backup</span>
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  Upload a previously exported JSON file to restore all habit records to Google Sheets.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoring}
                  className="btn btn-ghost text-xs flex items-center justify-center gap-2 border border-emerald-800/80 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 cursor-pointer min-h-[40px] px-4 font-semibold self-start"
                >
                  {restoring ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  <span>Import backup file</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Danger Zone — Reset */}
        <div style={{
          border: '1.5px solid rgba(196 102 90 / 0.35)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: 'var(--status-red-bg)',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            borderBottom: '1px solid rgba(196 102 90 / 0.20)',
          }}>
            <AlertTriangle size={16} style={{ color: 'var(--status-red)', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--status-red)' }}>
              Danger Zone
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: '18px 20px', background: 'var(--bg-card)' }}>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
              <strong style={{ color: 'var(--text-1)' }}>Reset All Data</strong> permanently deletes all tracked habits,
              streaks, goals, and journal notes from Google Sheets. Your{' '}
              <strong>Config settings</strong> (timezone, token) are preserved.
              This cannot be undone.
            </p>

            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => { setShowResetConfirm(true); setResetConfirmText(''); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 'var(--r-sm)',
                  background: 'var(--status-red-bg)',
                  border: '1px solid rgba(196 102 90 / 0.4)',
                  color: 'var(--status-red)',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={14} />
                Reset All Data
              </button>
            ) : (
              <div style={{
                background: 'var(--status-red-bg)',
                border: '1px solid rgba(196 102 90 / 0.35)',
                borderRadius: 'var(--r-md)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <p style={{ fontSize: 13, color: 'var(--status-red)', fontWeight: 600, margin: 0 }}>
                  ⚠️ Type <strong>RESET</strong> to confirm permanent deletion:
                </p>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={e => setResetConfirmText(e.target.value)}
                  placeholder="Type RESET here"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--r-sm)',
                    border: '1.5px solid rgba(196 102 90 / 0.5)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-1)',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    outline: 'none',
                    width: '100%',
                  }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => { setShowResetConfirm(false); setResetConfirmText(''); }}
                    className="btn btn-ghost"
                    style={{ fontSize: 13, minHeight: 40 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resetConfirmText !== 'RESET' || resetting}
                    onClick={async () => {
                      if (resetConfirmText !== 'RESET') return;
                      setResetting(true);
                      setErrorMsg(null);
                      try {
                        await habitApi.resetAllData();
                        setShowResetConfirm(false);
                        setResetConfirmText('');
                        setSuccessMsg('✅ All data reset. Starting fresh!');
                        setTimeout(() => setSuccessMsg(null), 5000);
                      } catch (err: any) {
                        setErrorMsg('Reset failed: ' + (err?.message || 'Unknown error'));
                      } finally {
                        setResetting(false);
                      }
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 20px', borderRadius: 'var(--r-sm)',
                      background: resetConfirmText === 'RESET' ? 'var(--status-red)' : 'rgba(196 102 90 / 0.3)',
                      border: 'none',
                      color: '#fff',
                      fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
                      cursor: resetConfirmText === 'RESET' ? 'pointer' : 'not-allowed',
                      opacity: resetting ? 0.6 : 1,
                      transition: 'background 0.2s',
                    }}
                  >
                    {resetting
                      ? <Loader2 size={14} className="animate-spin" />
                      : <RotateCcw size={14} />}
                    Confirm Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Save Actions */}
        <div className="flex items-center justify-between surface p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Changes sync directly to Apps Script backend and Google Sheets Config tab.</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary text-xs flex items-center gap-2 cursor-pointer min-h-[44px] px-6"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
