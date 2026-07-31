import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { TaskItem, GoalItem } from '../types';
import { CheckCircle2, XCircle, Clock, Sparkles, Loader2, Target, Filter, X } from 'lucide-react';

interface TodayScreenProps {
  filterCategory?: string | null;
  onClearFilter?: () => void;
}

/**
 * TodayScreen – fetches today's tasks and allows toggling completion.
 * Supports category filtering with a clearable filter chip.
 * Displays target goal progress bar next to relevant tasks if configured.
 * Optimistic UI: updates local state immediately, rolls back on failure.
 */
export const TodayScreen: React.FC<TodayScreenProps> = ({ filterCategory, onClearFilter }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayData, goalsData] = await Promise.all([
        habitApi.getToday().catch(() => []),
        habitApi.getGoals().catch(() => [])
      ]);
      setTasks(todayData || []);
      setGoals(goalsData || []);
    } catch (e) {
      console.error('Failed to load today tasks', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTask = async (taskId: string, name: string, currentlyCompleted: boolean) => {
    setTasks(prev =>
      prev.map(t =>
        t.taskId === taskId
          ? { ...t, status: currentlyCompleted ? 'Pending' : 'Completed', completedAt: currentlyCompleted ? null : new Date().toISOString() }
          : t
      )
    );
    setTogglingIds(prev => new Set(prev).add(taskId));
    try {
      await habitApi.completeTask(taskId, name, !currentlyCompleted);
    } catch (err) {
      setTasks(prev =>
        prev.map(t => (t.taskId === taskId ? { ...t, status: currentlyCompleted ? 'Completed' : 'Pending', completedAt: currentlyCompleted ? new Date().toISOString() : null } : t))
      );
      console.error('Toggle failed', err);
    } finally {
      setTogglingIds(prev => {
        const copy = new Set(prev);
        copy.delete(taskId);
        return copy;
      });
    }
  };

  const displayedTasks = filterCategory
    ? tasks.filter(t => (t.category || 'General').toLowerCase() === filterCategory.toLowerCase())
    : tasks;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="ml-2 text-sm text-slate-300">Loading today’s habits…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Category Filter Active Chip */}
      {filterCategory && (
        <div className="surface p-3 sm:p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <Filter size={15} className="text-indigo-400 flex-shrink-0" />
            <span>
              Filtered by: <strong className="text-white px-1.5 py-0.5 rounded bg-indigo-900/60 border border-indigo-700/50">{filterCategory}</strong>
            </span>
            <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
              ({displayedTasks.length} of {tasks.length} tasks)
            </span>
          </div>

          {onClearFilter && (
            <button
              onClick={onClearFilter}
              className="btn btn-ghost text-xs flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer min-h-[36px] px-2.5"
              title="Clear category filter"
            >
              <span>Show all</span>
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {displayedTasks.length === 0 ? (
        <div className="surface p-10 text-center rounded-2xl border border-slate-800 space-y-4 max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40 flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100">
              {filterCategory ? `No habits in "${filterCategory}"` : "No Habits Scheduled For Today"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {filterCategory
                ? `There are no scheduled habits matching category "${filterCategory}".`
                : "Add tasks in your Google Tasks lists, or click refresh below to fetch the latest habits."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            {filterCategory && onClearFilter && (
              <button
                onClick={onClearFilter}
                className="btn btn-ghost text-xs px-4 py-2 cursor-pointer"
              >
                Clear Category Filter
              </button>
            )}
            <button
              onClick={loadData}
              className="btn btn-primary text-xs flex items-center gap-1.5 px-4 py-2 cursor-pointer"
            >
              <span>Refresh Today's Tasks</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedTasks.map(task => {
            const isComp = task.status === 'Completed';
            const isMissed = task.status === 'Missed';
            const isToggling = togglingIds.has(task.taskId);

            const matchingGoal = goals.find(g => g.task === task.taskName);
            const goalTarget = matchingGoal?.target || 1;
            const goalCurrent = isComp ? 1 : 0;
            const goalPct = Math.round((goalCurrent / goalTarget) * 100);

            return (
              <button
                key={task.taskId || task.taskName}
                className={`surface-elevated w-full text-left rounded-xl p-4 transition-colors cursor-pointer flex flex-col gap-2 ${
                  isComp
                    ? 'bg-emerald-950/20 border border-emerald-800/40 text-emerald-100'
                    : isMissed
                    ? 'bg-rose-950/20 border border-rose-800/40 text-rose-100'
                    : 'border border-slate-800 hover:border-indigo-500/50'
                } ${isToggling ? 'opacity-60 pointer-events-none' : ''}`}
                onClick={() => toggleTask(task.taskId, task.taskName, isComp)}
              >
                <div className="flex items-center justify-between gap-4 min-h-[44px]">
                  {/* Left – status icon & details */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                        isComp
                          ? 'bg-emerald-500 text-white'
                          : isMissed
                          ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                          : 'border-2 border-slate-600 hover:border-indigo-500'
                      }`}
                    >
                      {isComp && <CheckCircle2 className="w-4 h-4" />}
                      {isMissed && <XCircle className="w-4 h-4" />}
                    </div>

                    <div className="flex flex-col items-start">
                      <span className={`font-semibold text-sm ${isComp ? 'line-through opacity-70' : 'text-slate-100'}`}>
                        {task.taskName}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{task.category || 'General'}</span>
                        {task.completedAt && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <Clock className="w-3 h-3" />
                            Done at {task.completedAt.split(' ')[1] || task.completedAt}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right – priority and optional badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {task.isOptional && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 font-medium flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Optional
                      </span>
                    )}

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        task.priority === 'High'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                          : task.priority === 'Low'
                          ? 'bg-slate-900 text-slate-400 border border-slate-800'
                          : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                      }`}
                    >
                      {task.priority || 'Medium'}
                    </span>
                  </div>
                </div>

                {/* Target Goal Progress Bar */}
                {matchingGoal && (
                  <div className="pt-2 border-t border-slate-800/50 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Target size={13} className="text-indigo-400" />
                      <span className="font-semibold text-slate-200">Goal Target:</span>
                      <span>{goalCurrent}/{goalTarget} {matchingGoal.unit} ({matchingGoal.period})</span>
                    </div>

                    <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, goalPct)}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
