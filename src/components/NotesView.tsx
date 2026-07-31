import React, { useState } from 'react';
import type { NoteItem } from '../types';
import { BookOpen, PlusCircle, Smile, Zap, Award, AlertCircle, Save, Loader2 } from 'lucide-react';

interface NotesViewProps {
  notes: NoteItem[];
  onAddNote: (date: string, mood: string, energy: string, wins: string, challenges: string) => Promise<void>;
}

export const NotesView: React.FC<NotesViewProps> = ({ notes, onAddNote }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [mood, setMood] = useState<string>('Energized');
  const [energy, setEnergy] = useState<string>('High');
  const [wins, setWins] = useState<string>('');
  const [challenges, setChallenges] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await onAddNote(date, mood, energy, wins, challenges);
      setMessage('Note logged successfully!');
      setWins('');
      setChallenges('');
    } catch (err: any) {
      setMessage('Error saving note: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 md:pb-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          <span>Daily Journal & Mood Log</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Record daily mood, energy levels, wins, and challenges saved to the Notes sheet tab.
        </p>
      </div>

      {/* New Note Logger Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-400" />
          <span>Log New Journal Entry</span>
        </h3>

        {message && (
          <div className={`p-3 rounded-xl text-xs font-medium ${message.includes('Error') ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5 text-amber-400" />
              <span>Mood</span>
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="Energized">⚡ Energized</option>
              <option value="Happy">😊 Happy</option>
              <option value="Focused">🎯 Focused</option>
              <option value="Calm">🧘 Calm</option>
              <option value="Tired">😴 Tired</option>
              <option value="Stressed">😖 Stressed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Energy Level</span>
            </label>
            <select
              value={energy}
              onChange={(e) => setEnergy(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="High">High (80-100%)</option>
              <option value="Medium">Medium (50-79%)</option>
              <option value="Low">Low (&lt;50%)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Daily Wins</span>
            </label>
            <textarea
              rows={2}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="What went well today?"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Challenges / Obstacles</span>
            </label>
            <textarea
              rows={2}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="What blocked or challenged you?"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 min-h-[44px]"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Journal Entry</span>
        </button>
      </form>

      {/* Past Entries Log */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-100">Past Journal Logs</h3>

        {notes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No journal entries recorded yet. Use the form above to add your first log!
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((n, idx) => (
              <div key={idx} className="glass-card p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-indigo-400">
                  <span>{n.date}</span>
                  <div className="flex items-center gap-3">
                    <span className="bg-amber-950/40 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-800/40">{n.mood}</span>
                    <span className="bg-indigo-950/40 text-indigo-300 px-2.5 py-0.5 rounded-md border border-indigo-800/40">Energy: {n.energy}</span>
                  </div>
                </div>

                {n.wins && (
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-emerald-400">Wins:</span> {n.wins}
                  </div>
                )}
                {n.challenges && (
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-rose-400">Challenges:</span> {n.challenges}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
