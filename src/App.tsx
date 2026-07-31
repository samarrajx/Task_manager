import React, { useEffect, useState, useCallback } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Sidebar, BottomTabBar, MoreDrawer, type TabId } from './components/Nav';
import { TodayScreen } from './components/TodayScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { StreaksScreen } from './components/StreaksScreen';
import { TrendsScreen } from './components/TrendsScreen';
import { CategoriesScreen } from './components/CategoriesScreen';
import { GoalsScreen } from './components/GoalsScreen';
import { MissedScreen } from './components/MissedScreen';
import { NotesScreen } from './components/NotesScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { habitApi } from './services/api';
import type { SettingsData } from './types';
import { RefreshCw, WifiOff } from 'lucide-react';

/* ─────────────────────────────────────────────────────
   Placeholder screen component for unbuilt tabs
───────────────────────────────────────────────────── */
const PlaceholderScreen: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: 12,
    color: 'var(--text-3)',
    textAlign: 'center',
  }}>
    <div style={{
      width: 64, height: 64,
      borderRadius: 16,
      background: 'var(--accent-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 28 }}>🏗️</span>
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-2)', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
        This screen will be built in an upcoming prompt.
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────
   API Connection status indicator
───────────────────────────────────────────────────── */
type ConnStatus = 'checking' | 'ok' | 'error';

const ConnPill: React.FC<{ status: ConnStatus; timezone?: string; isOffline?: boolean }> = ({ status, timezone, isOffline }) => {
  if (isOffline) {
    return (
      <span className="conn-pill err flex items-center gap-1.5" title="Offline - Viewing cached snapshot">
        <WifiOff size={13} className="text-amber-400" />
        <span>Offline — View Only (Cached Data)</span>
      </span>
    );
  }

  const label =
    status === 'checking' ? 'Checking API…' :
    status === 'ok'       ? `API connected · ${timezone ?? ''}` :
    'API error — check token';

  return (
    <span className={`conn-pill ${status === 'ok' ? 'ok' : status === 'error' ? 'err' : 'checking'}`}>
      {status === 'checking' && (
        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: 'var(--status-amber)', animation: 'pulse 1.2s infinite' }} />
      )}
      {status === 'ok' && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-green)', display: 'inline-block' }} />
      )}
      {status === 'error' && (
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-red)', display: 'inline-block' }} />
      )}
      {label}
    </span>
  );
};

/* ─────────────────────────────────────────────────────
   Page header (inside main content)
───────────────────────────────────────────────────── */
const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  connStatus: ConnStatus;
  timezone?: string;
  isOffline?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}> = ({ title, subtitle, connStatus, timezone, isOffline, onRefresh, refreshing }) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 28,
    flexWrap: 'wrap',
  }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.03em' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>{subtitle}</p>
      )}
      <div style={{ marginTop: 10 }}>
        <ConnPill status={connStatus} timezone={timezone} isOffline={isOffline} />
      </div>
    </div>

    {onRefresh && (
      <button
        className="btn btn-ghost btn-icon"
        onClick={onRefresh}
        disabled={refreshing}
        aria-label="Refresh"
        title="Refresh data"
      >
        <RefreshCw size={16} style={refreshing ? { animation: 'spin 0.6s linear infinite' } : {}} />
      </button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────
   App Shell
───────────────────────────────────────────────────── */
const TAB_LABELS: Record<TabId, string> = {
  today: 'Today',
  dashboard: 'Dashboard',
  streaks: 'Streaks',
  stats: 'Trends',
  categories: 'Categories',
  goals: 'Goals',
  missed: 'Missed',
  notes: 'Notes',
  reports: 'Reports',
  settings: 'Settings',
};

const TAB_SUBTITLES: Record<TabId, string> = {
  today: "Check off today's habits",
  dashboard: 'Your progress at a glance',
  streaks: 'Current & best streaks',
  stats: 'Completion trends over time',
  categories: 'Breakdown by category',
  goals: 'Target goals & progress tracking',
  missed: 'Habits that slipped',
  notes: 'Daily mood & journal reflections',
  reports: 'Weekly & monthly summaries + CSV export',
  settings: 'Preferences & Config tab management',
};

const AppShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    try { return (sessionStorage.getItem('ht-tab') as TabId) ?? 'dashboard'; }
    catch { return 'dashboard'; }
  });
  const [moreOpen, setMoreOpen] = useState(false);

  const [connStatus, setConnStatus] = useState<ConnStatus>('checking');
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [missedCount, setMissedCount] = useState<number>(0);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  const checkConnection = useCallback(async () => {
    setConnStatus('checking');
    setRefreshing(true);
    try {
      const [s, m] = await Promise.all([
        habitApi.getSettings().catch(() => null),
        habitApi.getMissed().catch(() => null)
      ]);
      if (s) setSettings(s);
      if (m?.missedToday) setMissedCount(m.missedToday.length);
      setConnStatus('ok');
    } catch {
      setConnStatus('error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const handleOnline = () => {
      setIsOffline(false);
      checkConnection();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  const navigate = (tab: TabId) => {
    setActiveTab(tab);
    setMoreOpen(false);
    try { sessionStorage.setItem('ht-tab', tab); } catch {}
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'today':
        return <TodayScreen />;
      case 'dashboard':
        return <DashboardScreen onNavigate={(t) => navigate(t as TabId)} />;
      case 'streaks':
        return <StreaksScreen />;
      case 'stats':
        return <TrendsScreen />;
      case 'categories':
        return <CategoriesScreen onSelectCategory={() => navigate('today')} />;
      case 'goals':
        return <GoalsScreen />;
      case 'missed':
        return <MissedScreen onMissedLoaded={(count) => setMissedCount(count)} />;
      case 'notes':
        return <NotesScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen onSettingsSaved={checkConnection} />;
      default:
        return <PlaceholderScreen title={TAB_LABELS[activeTab]} />;
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <Sidebar
        active={activeTab}
        onNavigate={navigate}
        moreOpen={moreOpen}
        onToggleMore={() => setMoreOpen(o => !o)}
        missedCount={missedCount}
      />

      {/* Mobile bottom bar */}
      <BottomTabBar
        active={activeTab}
        onNavigate={navigate}
        moreOpen={moreOpen}
        onToggleMore={() => setMoreOpen(o => !o)}
        missedCount={missedCount}
      />

      {/* Mobile more drawer */}
      <MoreDrawer
        open={moreOpen}
        active={activeTab}
        onNavigate={navigate}
        onClose={() => setMoreOpen(false)}
        missedCount={missedCount}
      />

      {/* Main content */}
      <main className="main-content" id="main-content">
        <PageHeader
          title={TAB_LABELS[activeTab]}
          subtitle={TAB_SUBTITLES[activeTab]}
          connStatus={connStatus}
          timezone={settings?.timezone}
          isOffline={isOffline}
          onRefresh={checkConnection}
          refreshing={refreshing}
        />

        {renderActiveScreen()}
      </main>
    </>
  );
};

/* ─────────────────────────────────────────────────────
   Root — wrap with ThemeProvider
───────────────────────────────────────────────────── */
const App: React.FC = () => (
  <ThemeProvider>
    <AppShell />
  </ThemeProvider>
);

export default App;
