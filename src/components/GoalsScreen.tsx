import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { GoalItem, TaskItem } from '../types';
import {
  Target,
  Plus,
  Edit2,
  CheckCircle2,
  Loader2,
  RotateCcw,
  X,
  Calendar,
  Sparkles
} from 'lucide-react';

/**
 * GoalsScreen – Displays habit target goals, tracks period progress,
 * and provides a modal/form to add or edit habit goals.
 */
export const GoalsScreen: React.FC = () => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [todayTasks, setTodayTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formTask, setFormTask] = useState<string>('');
  const [formPeriod, setFormPeriod] = useState<string>('Daily');
  const [formTarget, setFormTarget] = useState<number>(1);
  const [formUnit, setFormUnit] = useState<string>('times');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [goalsData, tasksData] = await Promise.all([
        habitApi.getGoals().catch(() => []),
        habitApi.getToday().catch(() => [])
      ]);
      setGoals(goalsData || []);
      setTodayTasks(tasksData || []);
    } catch (err) {
      console.error('Failed to load goals:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setFormTask(todayTasks[0]?.taskName || '');
    setFormPeriod('Daily');
    setFormTarget(1);
    setFormUnit('times');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: GoalItem) => {
    setFormTask(goal.task);
    setFormPeriod(goal.period || 'Daily');
    setFormTarget(goal.target || 1);
    setFormUnit(goal.unit || 'times');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTask.trim()) {
      setFormError('Please enter a task name.');
      return;
    }
    if (formTarget <= 0) {
      setFormError('Target must be greater than 0.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await habitApi.setGoal(formTask.trim(), formPeriod, Number(formTarget), formUnit.trim() || 'times');
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Failed to save goal:', err);
      setFormError(err?.message || 'Failed to save goal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="text-sm text-slate-400">Loading active goals…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface p-10 rounded-2xl text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center justify-center mx-auto">
          <Target size={24} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-200">Unable to load goals</h3>
          <p className="text-xs text-slate-400 mt-1">
            Failed to retrieve goal configurations from Google Sheets.
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn btn-ghost mx-auto flex items-center gap-2 text-xs"
        >
          <RotateCcw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Add Button */}
      <div className="surface p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Target size={20} className="text-indigo-400" />
            <span>Habit Target Goals</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Set daily, weekly, or monthly targets for your habits and monitor your progress.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2 text-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add / Set Goal</span>
        </button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="surface p-12 text-center rounded-2xl space-y-3">
          <Target size={36} className="text-indigo-400 mx-auto opacity-60" />
          <h3 className="text-base font-bold text-slate-200">No Target Goals Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't defined any targets yet. Click "Add / Set Goal" above to create your first goal.
          </p>
          <button
            onClick={openAddModal}
            className="btn btn-primary mx-auto flex items-center gap-2 text-xs"
          >
            <Plus size={16} />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            // Find today task if applicable
            const matchingTask = todayTasks.find(t => t.taskName === g.task);
            const isCompletedToday = matchingTask?.status === 'Completed';

            // Calculate current value based on completed task
            const currentCount = isCompletedToday ? 1 : 0;
            const targetVal = g.target || 1;
            const progressPct = Math.round((currentCount / targetVal) * 100);
            const isAchieved = currentCount >= targetVal;

            return (
              <div
                key={`${g.task}-${g.period}`}
                className="surface-elevated p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-100 truncate">{g.task}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/50 font-semibold flex items-center gap-1">
                        <Calendar size={11} />
                        {g.period}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Target: <strong className="text-slate-200">{g.target} {g.unit || 'times'}</strong> / {g.period.toLowerCase()}
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(g)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center flex-shrink-0"
                    title="Edit Goal"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                {/* Progress Bar & Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Period Progress</span>
                    <span className={`font-bold ${isAchieved ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {currentCount} / {g.target} {g.unit || 'times'} ({progressPct}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                    />
                  </div>
                </div>

                {isAchieved && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                    <CheckCircle2 size={14} />
                    <span>Target achieved for current period! 🎉</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="surface-elevated rounded-2xl w-full max-w-md p-6 border border-slate-800 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                <span>Configure Habit Goal</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Task Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Habit Task Name</label>
                {todayTasks.length > 0 ? (
                  <select
                    value={formTask}
                    onChange={(e) => setFormTask(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {todayTasks.map((t) => (
                      <option key={t.taskId || t.taskName} value={t.taskName} className="bg-slate-900 text-slate-200">
                        {t.taskName} ({t.category || 'General'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formTask}
                    onChange={(e) => setFormTask(e.target.value)}
                    placeholder="e.g. Exercise 30 mins"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Period Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Period</label>
                <select
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Daily" className="bg-slate-900 text-slate-200">Daily</option>
                  <option value="Weekly" className="bg-slate-900 text-slate-200">Weekly</option>
                  <option value="Monthly" className="bg-slate-900 text-slate-200">Monthly</option>
                </select>
              </div>

              {/* Target Number & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Target Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={formTarget}
                    onChange={(e) => setFormTarget(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Unit Name</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. days, times"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary text-xs flex items-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="animate-spin" size={14} />}
                  <span>Save Goal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
