import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import {
  Sun, Moon, Leaf,
  LayoutDashboard, CheckSquare, TrendingUp, BarChart3,
  PieChart, AlertCircle, BookOpen, Settings, MoreHorizontal, Target, FileText, Flame
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
  mobileTab?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'today',      label: 'Today',      Icon: CheckSquare,     mobileTab: true  },
  { id: 'dashboard',  label: 'Dashboard',  Icon: LayoutDashboard, mobileTab: true  },
  { id: 'streaks',    label: 'Streaks',    Icon: Flame,           mobileTab: true  },
  { id: 'stats',      label: 'Statistics', Icon: BarChart3,       mobileTab: false },
  { id: 'trends',     label: 'Trends',     Icon: TrendingUp,      mobileTab: false },
  { id: 'categories', label: 'Categories', Icon: PieChart,        mobileTab: false },
  { id: 'goals',      label: 'Goals',      Icon: Target,          mobileTab: false },
  { id: 'missed',     label: 'Missed',     Icon: AlertCircle,     mobileTab: false },
  { id: 'notes',      label: 'Notes',      Icon: BookOpen,        mobileTab: false },
  { id: 'reports',    label: 'Reports',    Icon: FileText,        mobileTab: false },
  { id: 'settings',   label: 'Settings',   Icon: Settings,        mobileTab: false },
];

const MORE_ITEMS    = NAV_ITEMS.filter(n => !n.mobileTab);
const PRIMARY_TABS  = NAV_ITEMS.filter(n => n.mobileTab);

interface NavProps {
  active: TabId;
  onNavigate: (tab: TabId) => void;
  moreOpen: boolean;
  onToggleMore: () => void;
  missedCount?: number;
}

/* ─── Sidebar (desktop ≥ 1024px) ────────────────── */
export const Sidebar: React.FC<NavProps> = ({ active, onNavigate, missedCount = 0 }) => {
  const { theme, toggle } = useTheme();

  return (
    <nav className="sidebar" role="navigation" aria-label="Main navigation">

      {/* Logo / Wordmark */}
      <div style={{ padding: '28px 20px 22px', display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: 14,
          background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 14px var(--accent-ring)',
        }}>
          <Leaf size={19} color="#fff" strokeWidth={2.2} />
        </div>
        <div>
          <div style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700, fontSize: 15,
            color: 'var(--text-1)', letterSpacing: '-0.02em'
          }}>
            Habit Tracker
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>
            Sheets · Apps Script
          </div>
        </div>
      </div>

      <hr className="divider" style={{ margin: '0 16px 14px' }} />

      {/* Nav section labels + items */}
      <div style={{ flex: 1, padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 6px 8px', fontFamily: "'Inter', sans-serif" }}>
          Main
        </div>

        {NAV_ITEMS.slice(0, 3).map(({ id, label, Icon }) => (
          <NavButton key={id} id={id} label={label} Icon={Icon} active={active} onNavigate={onNavigate} missedCount={missedCount} />
        ))}

        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '14px 6px 8px', fontFamily: "'Inter', sans-serif" }}>
          Analytics
        </div>

        {NAV_ITEMS.slice(3, 8).map(({ id, label, Icon }) => (
          <NavButton key={id} id={id} label={label} Icon={Icon} active={active} onNavigate={onNavigate} missedCount={missedCount} />
        ))}

        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '14px 6px 8px', fontFamily: "'Inter', sans-serif" }}>
          Journal
        </div>

        {NAV_ITEMS.slice(8).map(({ id, label, Icon }) => (
          <NavButton key={id} id={id} label={label} Icon={Icon} active={active} onNavigate={onNavigate} missedCount={missedCount} />
        ))}
      </div>

      {/* Footer: theme toggle */}
      <div style={{ padding: '14px 10px 28px', borderTop: '1px solid var(--border-subtle)' }}>
        <button
          className="nav-item"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun size={15} style={{ color: 'var(--status-amber)', flexShrink: 0 }} />
            : <Moon size={15} style={{ color: 'var(--sky)', flexShrink: 0 }} />
          }
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </nav>
  );
};

/* Shared nav button */
const NavButton: React.FC<{
  id: TabId; label: string; Icon: React.ElementType;
  active: TabId; onNavigate: (t: TabId) => void; missedCount: number;
}> = ({ id, label, Icon, active, onNavigate, missedCount }) => (
  <button
    className={`nav-item ${active === id ? 'active' : ''}`}
    onClick={() => onNavigate(id)}
    aria-current={active === id ? 'page' : undefined}
    style={{ justifyContent: 'space-between' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 30, height: 30,
        borderRadius: 9,
        background: active === id ? 'var(--accent-subtle)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.18s',
        flexShrink: 0,
      }}>
        <Icon size={15} style={{ color: active === id ? 'var(--accent)' : 'var(--text-3)' }} />
      </div>
      <span>{label}</span>
    </div>
    {id === 'missed' && missedCount > 0 && (
      <span style={{
        padding: '1px 7px',
        borderRadius: 9999,
        background: 'var(--status-red)',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        minWidth: 18,
        textAlign: 'center',
      }}>
        {missedCount}
      </span>
    )}
  </button>
);

/* ─── Bottom Tab Bar (mobile < 1024px) ─────────── */
export const BottomTabBar: React.FC<NavProps> = ({ active, onNavigate, moreOpen, onToggleMore, missedCount = 0 }) => {
  const moreIsActive = !PRIMARY_TABS.some(t => t.id === active);
  return (
    <nav className="tab-bar" role="navigation" aria-label="Mobile navigation">
      {PRIMARY_TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`tab-item ${active === id ? 'active' : ''}`}
          onClick={() => onNavigate(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <div style={{
            width: 34, height: 34,
            borderRadius: 11,
            background: active === id ? 'var(--accent-subtle)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.18s, transform 0.12s',
            transform: active === id ? 'scale(1.08)' : 'scale(1)',
          }}>
            <Icon size={18} />
          </div>
          <span>{label}</span>
        </button>
      ))}
      <button
        className={`tab-item ${moreIsActive || moreOpen ? 'active' : ''}`}
        onClick={onToggleMore}
        aria-label="More options"
      >
        <div style={{
          width: 34, height: 34,
          borderRadius: 11,
          background: moreIsActive || moreOpen ? 'var(--accent-subtle)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          transition: 'background 0.18s',
        }}>
          <MoreHorizontal size={18} />
          {missedCount > 0 && (
            <span style={{
              position: 'absolute', top: 3, right: 3,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--status-red)',
              border: '2px solid var(--bg-surface)',
            }} />
          )}
        </div>
        <span>More</span>
      </button>
    </nav>
  );
};

/* ─── More drawer (slides up on mobile) ─────── */
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
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.40)',
          backdropFilter: 'blur(6px)',
        }}
        aria-hidden
      />
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
          borderRadius: '24px 24px 0 0',
          padding: '16px 12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          animation: 'fadeUp 0.22s ease',
        }}
      >
        <div style={{
          width: 36, height: 4, background: 'var(--border-soft)',
          borderRadius: 9999, margin: '0 auto 14px',
        }} />

        {MORE_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`nav-item ${active === id ? 'active' : ''}`}
            onClick={() => { onNavigate(id); onClose(); }}
            style={{ justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: active === id ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={15} style={{ color: active === id ? 'var(--accent)' : 'var(--text-3)' }} />
              </div>
              <span>{label}</span>
            </div>
            {id === 'missed' && missedCount > 0 && (
              <span style={{
                padding: '1px 7px', borderRadius: 9999,
                background: 'var(--status-red)', color: '#fff',
                fontSize: 10, fontWeight: 700, minWidth: 18, textAlign: 'center',
              }}>
                {missedCount}
              </span>
            )}
          </button>
        ))}

        <hr className="divider" style={{ margin: '10px 0 6px' }} />

        <button className="nav-item" onClick={() => { toggle(); onClose(); }}>
          {theme === 'dark'
            ? <Sun size={15} style={{ color: 'var(--status-amber)' }} />
            : <Moon size={15} style={{ color: 'var(--sky)' }} />
          }
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </>
  );
};
