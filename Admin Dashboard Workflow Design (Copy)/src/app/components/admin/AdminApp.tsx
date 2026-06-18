import { useState } from 'react';
import { Shield, Bell, LayoutDashboard, Settings, Home, LogOut, Sun, Moon, X, AlertTriangle, MapPin, Copy, TrendingDown, ChevronLeft } from 'lucide-react';
import { DashboardTab } from './DashboardTab';
import { StoreDashboard } from './StoreDashboard';
import { AlertsPage } from './AlertsPage';
import { SetupTab } from './SetupTab';
import { HomeTab } from './HomeTab';
import { stores, totalAlertCount, type Alert } from '../../mockData';
import { useTheme, useT } from '../../ThemeContext';

type AppUser = { role: 'admin' | 'cleaner'; name: string; id: string };

interface NavView {
  id: string;
  params?: Record<string, unknown>;
}

interface Props {
  user: AppUser;
  onLogout: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseTime(t: string): number {
  const [timePart, meridiem] = t.split(' ');
  if (!meridiem) return 0;
  let [h, m] = timePart.split(':').map(Number);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

const alertBadge: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  warning:  'bg-amber-500 text-white',
  fraud:    'bg-orange-600 text-white',
};

const categoryIcon: Record<string, React.ReactNode> = {
  'missing-round':  <AlertTriangle className="w-4 h-4 text-red-500" />,
  'duplicate-scan': <Copy className="w-4 h-4 text-amber-500" />,
  'gps-mismatch':   <MapPin className="w-4 h-4 text-orange-500" />,
  'low-compliance': <TrendingDown className="w-4 h-4 text-amber-500" />,
};

const categoryLabel: Record<string, string> = {
  'missing-round':  'Missing Round',
  'duplicate-scan': 'Duplicate Scan',
  'gps-mismatch':   'GPS Mismatch',
  'low-compliance': 'Low Compliance',
};

type RichAlert = Alert & { storeName: string; storeNumber: string };

// Collect all alerts across stores, newest first
const allAlerts: RichAlert[] = stores
  .flatMap(s => s.alerts.map(a => ({ ...a, storeName: s.name, storeNumber: s.storeNumber })))
  .sort((a, b) => parseTime(b.time) - parseTime(a.time));

// ─── Notification Sidebar ─────────────────────────────────────────────────────

function NotificationSidebar({
  alerts,
  newCount,
  onClose,
}: {
  alerts: RichAlert[];
  newCount: number;
  onClose: () => void;
}) {
  const t = useT();

  return (
    /* Full-screen overlay for mobile */
    <div className={`absolute inset-0 z-40 flex flex-col ${t.page}`}>
      {/* Header */}
      <div className="bg-orange-600 px-4 pt-10 pb-4 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Bell className="w-4 h-4 text-white" />
          <span className="text-white font-semibold text-sm">Notifications</span>
          {newCount > 0 && (
            <span className="text-xs bg-amber-400 text-white px-1.5 py-0.5 rounded-full font-bold">
              {newCount} new
            </span>
          )}
        </div>
      </div>

        {/* Alert list */}
        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className={`px-4 py-12 text-center text-sm ${t.textXs}`}>No notifications</div>
          ) : (
            <div className={`divide-y ${t.divide}`}>
              {alerts.map((a, idx) => {
                const isNew = idx < newCount;
                return (
                  <div
                    key={a.id}
                    className={`px-4 py-3.5 ${isNew ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}
                  >
                    {isNew && idx === 0 && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">New</span>
                      </div>
                    )}
                    {!isNew && idx === newCount && newCount > 0 && (
                      <div className={`-mx-4 px-4 py-1.5 mb-2 ${t.header} border-b ${t.border}`}>
                        <span className={`text-xs font-medium ${t.textMuted} uppercase tracking-wide`}>Earlier</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {categoryIcon[a.category]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5 mb-0.5">
                          <span className={`text-xs font-semibold ${t.text} leading-snug`}>{a.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 font-medium uppercase ${alertBadge[a.type]}`}>
                            {a.type}
                          </span>
                        </div>
                        <p className={`text-xs ${t.textMuted} mb-1 line-clamp-2`}>{a.description}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${t.textXs}`}>{a.storeName} {a.storeNumber}</span>
                          <span className={`text-xs ${t.textMuted}`}>·</span>
                          <span className={`text-xs ${t.textXs}`}>{a.time}</span>
                        </div>
                        <div className={`text-xs mt-0.5 text-amber-600 dark:text-amber-400 font-medium`}>
                          {categoryLabel[a.category]}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}

// ─── AdminApp ─────────────────────────────────────────────────────────────────

export function AdminApp({ user, onLogout }: Props) {
  const { isDark, toggle } = useTheme();
  const t = useT();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup' | 'home'>('dashboard');
  const [navStack, setNavStack] = useState<NavView[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  // Simulate 3 new alerts since last check
  const [lastCheckedCount, setLastCheckedCount] = useState(totalAlertCount - 3);
  const newAlertCount = Math.max(0, totalAlertCount - lastCheckedCount);

  const openNotifications = () => {
    setNotifOpen(true);
    setLastCheckedCount(totalAlertCount); // mark as read when opened
  };

  const navigate = (id: string, params?: Record<string, unknown>) =>
    setNavStack(prev => [...prev, { id, params }]);

  const goBack = () => setNavStack(prev => prev.slice(0, -1));

  const changeTab = (tab: 'dashboard' | 'setup' | 'home') => {
    setActiveTab(tab);
    setNavStack([]);
  };

  const currentView = navStack[navStack.length - 1];

  const renderContent = () => {
    if (currentView) {
      const { id, params } = currentView;
      if (id === 'store-dashboard')
        return <StoreDashboard storeId={params?.storeId as string} goBack={goBack} navigate={navigate} />;
      if (id === 'alerts-global')
        return <AlertsPage navigate={navigate} goBack={goBack} />;
      if (id === 'storewise-alerts')
        return <AlertsPage navigate={navigate} goBack={goBack} storeId={params?.storeId as string} />;
      if (id === 'store-alert-detail')
        return <AlertsPage navigate={navigate} goBack={goBack} storeId={params?.storeId as string} alertId={params?.alertId as string} />;
      if (id === 'alert-history')
        return <AlertsPage navigate={navigate} goBack={goBack} storeId={params?.storeId as string} showHistory />;
      if (id === 'tag-registration')
        return <SetupTab navigate={navigate} goBack={goBack} subView="tag-registration" subParams={params} />;
      if (id === 'registration-review')
        return <SetupTab navigate={navigate} goBack={goBack} subView="registration-review" subParams={params} />;
      if (id === 'round-setup')
        return <SetupTab navigate={navigate} goBack={goBack} subView="round-setup" subParams={params} />;
      if (id === 'nfc-registry')
        return <SetupTab navigate={navigate} goBack={goBack} subView="nfc-registry" subParams={params} />;
      if (id === 'user-creation')
        return <SetupTab navigate={navigate} goBack={goBack} subView="user-creation" subParams={params} />;
    }
    if (activeTab === 'dashboard') return <DashboardTab navigate={navigate} />;
    if (activeTab === 'setup') return <SetupTab navigate={navigate} />;
    return <HomeTab />;
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden ${t.surface}`}>
      {/* Header */}
      <div className="bg-orange-600 px-4 pt-10 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">CleanCheck</div>
            <div className="text-orange-200 text-xs">NFC Compliance</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium">ADMIN</span>

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-yellow-300" /> : <Moon className="w-4 h-4 text-white" />}
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={openNotifications}
              className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-white" />
            </button>
            {newAlertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-amber-400 rounded-full text-xs text-white flex items-center justify-center font-bold leading-none px-1 pointer-events-none">
                {newAlertCount}
              </span>
            )}
          </div>

          <button onClick={onLogout} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
            <LogOut className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderContent()}
      </div>

      {/* Bottom Tab Bar */}
      <div className={`flex shrink-0 border-t ${t.tabBar}`}>
        {[
          { id: 'dashboard' as const, label: 'Dashboard', Icon: LayoutDashboard },
          { id: 'setup'     as const, label: 'Setup',     Icon: Settings },
          { id: 'home'      as const, label: 'Home',      Icon: Home },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => changeTab(id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              activeTab === id && !currentView
                ? 'text-orange-500'
                : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Notification sidebar */}
      {notifOpen && (
        <NotificationSidebar
          alerts={allAlerts}
          newCount={newAlertCount}
          onClose={() => setNotifOpen(false)}
        />
      )}
    </div>
  );
}
