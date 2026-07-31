import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Sun, Moon, Flame,
  LayoutDashboard, CheckSquare, TrendingUp, BarChart3,
  PieChart, AlertCircle, BookOpen, Settings, MoreHorizontal, Target, FileText
} from 'lucide-react';

export type TabId =
  | 'today'
  | 'dashboard'
  | 'streaks'
  | 'stats'
  | 'trends'
  | 'categories'
  | 'goals'
  | 'missed'
  | 'notes'
  | 'reports'
  | 'settings';

interface NavItem {
  id: TabId;
  label: string;
  Icon: React.ElementType;
  mobileTab?: boolean;  // show in bottom bar (max 3 primary + More)
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today',      label: 'Today',      Icon: CheckSquare,    mobileTab: true },
  { id: 'dashboard',  label: 'Dashboard',  Icon: LayoutDashboard, mobileTab: true },
  { id: 'streaks',    label: 'Streaks',    Icon: Flame,           mobileTab: true },
  { id: 'stats',      label: 'Statistics', Icon: BarChart3,      mobileTab: false },
  { id: 'trends',     label: 'Trends',     Icon: TrendingUp,     mobileTab: false },
  { id: 'categories', label: 'Categories', Icon: PieChart,       mobileTab: false },
  { id: 'goals',      label: 'Goals',      Icon: Target,         mobileTab: false },
  { id: 'missed',     label: 'Missed',     Icon: AlertCircle,    mobileTab: false },
  { id: 'notes',      label: 'Notes',      Icon: BookOpen,       mobileTab: false },
  { id: 'reports',    label: 'Reports',    Icon: FileText,       mobileTab: false },
  { id: 'settings',   label: 'Settings',   Icon: Settings,       mobileTab: false },
];

// Items shown in mobile "More" drawer (all non-primary)
const MORE_ITEMS = NAV_ITEMS.filter(n => !n.mobileTab);

interface NavProps {
  active: TabId;
  onNavigate: (tab: TabId) => void;
  moreOpen: boolean;
  onToggleMore: () => void;
  missedCount?: number;
}

/* ─── Sidebar (desktop ≥ 1024px) ─────────────────── */
export const Sidebar: React.FC<NavProps> = ({ active, onNavigate, missedCount = 0 }) => {
  const { theme, toggle } = useTheme();

  return (
    <nav className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Wordmark */}
      <div style={{ padding: '24px 20px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36,
          borderRadius: 10,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 18px var(--accent-ring)',
        }}>
          <Flame size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
            Habit Tracker
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            Sheets + Apps Script
          </div>
        </div>
      </div>

      <hr className="divider" style={{ margin: '0 0 12px' }} />

      {/* Nav items */}
      <div style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${active === id ? 'active' : ''} justify-between`}
            onClick={() => onNavigate(id)}
            aria-current={active === id ? 'page' : undefined}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </div>
            {id === 'missed' && missedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] min-w-[18px] text-center">
                {missedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Footer: theme toggle */}
      <div style={{ padding: '16px 10px 24px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          className="nav-item"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ gap: 10 }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </nav>
  );
};

/* ─── Bottom Tab Bar (mobile < 1024px) ───────────── */
const PRIMARY_TABS = NAV_ITEMS.filter(n => n.mobileTab);

export const BottomTabBar: React.FC<NavProps> = ({ active, onNavigate, moreOpen, onToggleMore, missedCount = 0 }) => {
  const moreIsActive = !PRIMARY_TABS.some(t => t.id === active);

  return (
    <nav className="tab-bar" role="navigation" aria-label="Mobile navigation">
      {PRIMARY_TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab-item ${active === id ? 'active' : ''}`}
          onClick={() => { onNavigate(id); }}
          aria-current={active === id ? 'page' : undefined}
        >
          <div className="relative">
            <Icon size={22} />
            {id === 'missed' && missedCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[9px] min-w-[14px] text-center">
                {missedCount}
              </span>
            )}
          </div>
          <span style={{ fontSize: 10, letterSpacing: '0.01em' }}>{label}</span>
        </button>
      ))}

      {/* "More" opens an overlay drawer */}
      <button
        className={`tab-item ${moreIsActive || moreOpen ? 'active' : ''}`}
        onClick={onToggleMore}
        aria-label="More navigation options"
        aria-expanded={moreOpen}
      >
        <div className="relative">
          <MoreHorizontal size={22} />
          {missedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900" />
          )}
        </div>
        <span style={{ fontSize: 10 }}>More</span>
      </button>
    </nav>
  );
};

/* ─── More drawer (slides up on mobile) ─────────── */
interface MoreDrawerProps {
  open: boolean;
  active: TabId;
  onNavigate: (tab: TabId) => void;
  onClose: () => void;
  missedCount?: number;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ open, active, onNavigate, onClose, missedCount = 0 }) => {
  const { theme, toggle } = useTheme();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
        }}
        aria-hidden
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="More options"
        style={{
          position: 'fixed',
          insetInline: 0,
          bottom: 'calc(var(--nav-bar-height) + env(safe-area-inset-bottom, 0px))',
          zIndex: 45,
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-soft)',
          borderRadius: '20px 20px 0 0',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{
          width: 36, height: 4, background: 'var(--border-soft)',
          borderRadius: 9999, margin: '0 auto 12px',
        }} />

        {MORE_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${active === id ? 'active' : ''} justify-between`}
            onClick={() => { onNavigate(id); onClose(); }}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={16} />
              <span>{label}</span>
            </div>
            {id === 'missed' && missedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] min-w-[18px] text-center">
                {missedCount}
              </span>
            )}
          </button>
        ))}

        <hr className="divider" style={{ margin: '8px 0' }} />

        <button
          className="nav-item"
          onClick={() => { toggle(); onClose(); }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </>
  );
};
