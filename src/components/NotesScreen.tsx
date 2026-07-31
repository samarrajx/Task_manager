import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { NoteItem } from '../types';
import {
  BookOpen,
  Smile,
  Zap,
  Award,
  AlertCircle,
  Save,
  Loader2,
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface NotesScreenProps {
  onNoteAdded?: () => void;
}

const MOOD_OPTIONS = [
  { label: 'Great', emoji: '😄', bg: 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300' },
  { label: 'Good', emoji: '🙂', bg: 'bg-indigo-950/60 border-indigo-800/40 text-indigo-300' },
  { label: 'Neutral', emoji: '😐', bg: 'bg-slate-900 border-slate-800 text-slate-300' },
  { label: 'Low', emoji: '😔', bg: 'bg-amber-950/60 border-amber-800/40 text-amber-300' },
  { label: 'Stressed', emoji: '😫', bg: 'bg-rose-950/60 border-rose-800/40 text-rose-300' }
];

const ENERGY_OPTIONS = ['High', 'Medium', 'Low'];

/**
 * NotesScreen – Journal & Daily Notes feature.
 * Form for mood/energy/wins/challenges and reverse-chronological history list.
 */
export const NotesScreen: React.FC<NotesScreenProps> = ({ onNoteAdded }) => {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state
  const todayStr = new Date().toISOString().split('T')[0];
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formMood, setFormMood] = useState<string>('Good');
  const [formEnergy, setFormEnergy] = useState<string>('Medium');
  const [formWins, setFormWins] = useState<string>('');
  const [formChallenges, setFormChallenges] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  const loadNotes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await habitApi.getNotes();
      setNotes(data || []);
    } catch (err) {
      console.error('Failed to load notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(false);

    try {
      await habitApi.addNote(formDate, formMood, formEnergy, formWins, formChallenges);
      setSuccessMsg(true);
      setFormWins('');
      setFormChallenges('');
      if (onNoteAdded) onNoteAdded();
      await loadNotes();
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Reverse-chronological sorting
  const sortedNotes = [...notes].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* FORM CARD: Add Daily Reflection / Note */}
      <div className="surface p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-400" />
            <span>Daily Habit Reflection & Journal</span>
          </h2>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-slate-300">
            <Calendar size={13} className="text-indigo-400" />
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold text-xs focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Note saved successfully to your Google Sheet!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mood & Energy Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mood Pills */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Smile size={14} className="text-amber-400" />
                <span>Today's Mood</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setFormMood(m.label)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer min-h-[38px] ${
                      formMood === m.label
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Zap size={14} className="text-indigo-400" />
                <span>Energy Level</span>
              </label>
              <div className="flex items-center gap-2">
                {ENERGY_OPTIONS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormEnergy(level)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[38px] text-center ${
                      formEnergy === level
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Wins Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Award size={14} className="text-emerald-400" />
              <span>Today's Wins / Highlights</span>
            </label>
            <textarea
              rows={2}
              value={formWins}
              onChange={(e) => setFormWins(e.target.value)}
              placeholder="What went well today? Any breakthrough or habit success?"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Challenges Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-rose-400" />
              <span>Challenges / Obstacles</span>
            </label>
            <textarea
              rows={2}
              value={formChallenges}
              onChange={(e) => setFormChallenges(e.target.value)}
              placeholder="What made habits harder today? How can you adjust tomorrow?"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-xs flex items-center gap-2 cursor-pointer min-h-[44px]"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Save Reflection</span>
            </button>
          </div>
        </form>
      </div>

      {/* HISTORY SECTION: Reverse-Chronological Notes List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <BookOpen size={16} className="text-indigo-400" />
          <span>Reflection History ({sortedNotes.length})</span>
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-indigo-400" size={28} />
            <span className="ml-2 text-xs text-slate-400">Loading history…</span>
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="surface p-10 rounded-2xl text-center text-slate-400 text-xs">
            No daily reflections logged yet. Submit your first entry above!
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotes.map((note, index) => {
              const moodOpt = MOOD_OPTIONS.find(m => m.label.toLowerCase() === (note.mood || '').toLowerCase());
              const moodEmoji = moodOpt?.emoji || '📝';

              return (
                <div
                  key={`${note.date}-${index}`}
                  className="surface-elevated p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{moodEmoji}</span>
                      <span className="font-bold text-sm text-slate-100">{note.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {note.mood && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-semibold">
                          Mood: {note.mood}
                        </span>
                      )}
                      {note.energy && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-medium">
                          Energy: {note.energy}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Wins & Challenges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {note.wins && (
                      <div className="bg-emerald-950/20 border border-emerald-800/30 p-3 rounded-xl space-y-1">
                        <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
                          <Award size={13} />
                          <span>Wins & Highlights</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{note.wins}</p>
                      </div>
                    )}

                    {note.challenges && (
                      <div className="bg-rose-950/20 border border-rose-800/30 p-3 rounded-xl space-y-1">
                        <div className="text-rose-400 font-bold flex items-center gap-1.5 text-[11px]">
                          <AlertCircle size={13} />
                          <span>Challenges</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{note.challenges}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
