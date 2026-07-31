import React, { useEffect, useState, useCallback } from 'react';
import { habitApi } from '../services/api';
import type { TrendsData } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Trophy,
  AlertTriangle,
  Calendar,
  BarChart2,
  Loader2,
  RotateCcw
} from 'lucide-react';

/**
 * Custom Tooltip for Recharts matching dark theme design system
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    return (
      <div className="surface p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1">
        <div className="font-bold text-slate-200">{label || data.name || data.weekLabel || data.monthLabel}</div>
        <div className="text-indigo-400 font-semibold flex items-center gap-1">
          <span>Completion:</span>
          <span>{Math.round(value)}%</span>
        </div>
        {data.total !== undefined && (
          <div className="text-slate-400 text-[11px]">
            {data.completed} of {data.total} tasks completed
          </div>
        )}
      </div>
    );
  }
  return null;
};

/**
 * TrendsScreen – visualizes completion performance over time using Recharts.
 * Mobile-first (<390px legible without horizontal scrolling).
 */
export const TrendsScreen: React.FC = () => {
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await habitApi.getTrends();
      setTrends(data);
    } catch (err) {
      console.error('Failed to load trends data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="animate-spin text-indigo-400" size={32} />
        <span className="text-sm text-slate-400">Loading trend analytics…</span>
      </div>
    );
  }

  if (error || !trends) {
    return (
      <div className="surface p-10 rounded-2xl text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-800/40 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-200">Unable to load trends</h3>
          <p className="text-xs text-slate-400 mt-1">
            Failed to retrieve historical trend series from the API.
          </p>
        </div>
        <button
          onClick={loadTrends}
          className="btn btn-ghost mx-auto flex items-center gap-2 text-xs"
        >
          <RotateCcw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const {
    weekdayBreakdown = {},
    bestDay = 'N/A',
    worstDay = 'N/A',
    weeklySeries = [],
    monthlySeries = []
  } = trends;

  // Format weekday data array
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShortMap: Record<string, string> = {
    Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat'
  };

  const weekdayData = dayOrder.map(fullDay => {
    const pct = weekdayBreakdown[fullDay] ?? 0;
    return {
      day: dayShortMap[fullDay] || fullDay,
      fullDay,
      completionPct: Math.round(pct)
    };
  });

  const bestDayPct = weekdayBreakdown[bestDay] !== undefined ? Math.round(weekdayBreakdown[bestDay]) : null;
  const worstDayPct = weekdayBreakdown[worstDay] !== undefined ? Math.round(weekdayBreakdown[worstDay]) : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto overflow-hidden">
      {/* Best & Worst Day Callout Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Best Day Callout */}
        <div className="surface p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Trophy size={14} className="text-emerald-400" />
              Best Performing Day
            </span>
            <div className="text-2xl font-extrabold text-slate-100">{bestDay}</div>
            {bestDayPct !== null && (
              <span className="text-xs font-semibold text-emerald-400 inline-block bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {bestDayPct}% avg completion
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 flex items-center justify-center flex-shrink-0">
            <Trophy size={24} />
          </div>
        </div>

        {/* Worst Day Callout */}
        <div className="surface p-5 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-400" />
              Lowest Performing Day
            </span>
            <div className="text-2xl font-extrabold text-slate-100">{worstDay}</div>
            {worstDayPct !== null && (
              <span className="text-xs font-semibold text-amber-400 inline-block bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                {worstDayPct}% avg completion
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-800/40 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* CHART 1: Weekday Completion Rate */}
      <div className="surface p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BarChart2 size={16} className="text-indigo-400" />
            <span>Completion Rate by Weekday</span>
          </h3>
          <span className="text-xs text-slate-400">All-time average</span>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekdayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="completionPct" radius={[6, 6, 0, 0]}>
                {weekdayData.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={entry.fullDay === bestDay ? '#22c55e' : entry.fullDay === worstDay ? '#f59e0b' : '#6366f1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: Weekly Line Chart (Last 8–12 Weeks) */}
      <div className="surface p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" />
            <span>Weekly Progress Trend</span>
          </h3>
          <span className="text-xs text-slate-400">Last 8–12 weeks</span>
        </div>

        {weeklySeries.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">No weekly series data available.</div>
        ) : (
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="completionPct"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0e1420' }}
                  activeDot={{ r: 6, fill: '#818cf8', stroke: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* CHART 3: Monthly Trend Chart (Last 6–12 Months) */}
      <div className="surface p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calendar size={16} className="text-indigo-400" />
            <span>Monthly Performance Trend</span>
          </h3>
          <span className="text-xs text-slate-400">Last 6–12 months</span>
        </div>

        {monthlySeries.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">No monthly series data available.</div>
        ) : (
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="completionPct" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
