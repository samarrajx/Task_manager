import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { TaskItem, GoalItem } from '../types';
import { CheckCircle2, XCircle, Clock, Sparkles, Loader2, Target } from 'lucide-react';

/**
 * TodayScreen – fetches today's tasks and allows toggling completion.
 * Displays target goal progress bar next to relevant tasks if configured.
 * Optimistic UI: updates local state immediately, rolls back on failure.
 */
export const TodayScreen: React.FC = () => {
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
    // Optimistic update
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
      // rollback on error
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="ml-2 text-sm text-slate-300">Loading today’s habits…</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">No habits scheduled for today.</div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const isComp = task.status === 'Completed';
        const isMissed = task.status === 'Missed';
        const isToggling = togglingIds.has(task.taskId);

        // Find matching goal for this task
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
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                    task.priority === 'High'
                      ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                      : task.priority === 'Low'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/40'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            </div>

            {/* Goal Progress Bar (if goal configured for task) */}
            {matchingGoal && (
              <div className="pt-2 border-t border-slate-800/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1 text-indigo-300">
                    <Target size={11} />
                    Goal: {matchingGoal.target} {matchingGoal.unit || 'times'} / {matchingGoal.period?.toLowerCase()}
                  </span>
                  <span className={isComp ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {goalCurrent} / {goalTarget} ({goalPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComp ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, goalPct))}%` }}
                  />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
