import { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, History, FileText } from 'lucide-react';
import { stores, Alert } from '../../mockData';
import { ReportModal } from '../shared/ReportModal';
import { useT } from '../../ThemeContext';

interface Props {
  navigate: (view: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
  storeId?: string;
  alertId?: string;
  showHistory?: boolean;
}

const alertColors: Record<string, { bg: string; badge: string }> = {
  critical: { bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',     badge: 'bg-red-600 text-white' },
  warning:  { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', badge: 'bg-amber-500 text-white' },
  fraud:    { bg: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800', badge: 'bg-orange-600 text-white' },
};

function AlertCard({ alert, onClick }: { alert: Alert; onClick?: () => void }) {
  const t = useT();
  const c = alertColors[alert.type];
  return (
    <button onClick={onClick} className={`w-full text-left p-3.5 rounded-xl border ${c.bg} ${onClick ? 'hover:opacity-80 transition-opacity' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className={`text-sm font-semibold leading-tight ${t.text}`}>{alert.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 uppercase ${c.badge}`}>{alert.type}</span>
      </div>
      <p className={`text-xs mb-1.5 ${t.textSm}`}>{alert.description}</p>
      <div className={`flex items-center gap-1 text-xs ${t.textMuted}`}>
        <Clock className="w-3 h-3" /> {alert.time}
        {alert.location && <><span>·</span><span>{alert.location}</span></>}
      </div>
    </button>
  );
}

function HistoryView({ storeId, goBack }: { storeId?: string; goBack: () => void }) {
  const t = useT();
  const histAlerts = storeId ? stores.find(s => s.id === storeId)?.alerts || [] : stores.flatMap(s => s.alerts);
  const [showReport, setShowReport] = useState(false);
  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${t.header}`}>
        <div className="flex items-center gap-3">
          <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}><ChevronLeft className="w-5 h-5 text-orange-500" /></button>
          <div>
            <h2 className={`font-semibold text-sm ${t.text}`}>Alert History</h2>
            <p className={`text-xs ${t.textXs}`}>{storeId ? stores.find(s => s.id === storeId)?.name : 'All Stores'}</p>
          </div>
        </div>
        <button onClick={() => setShowReport(true)} className="flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
          <FileText className="w-3.5 h-3.5" /> Report
        </button>
      </div>
      <div className="px-4 pt-4 space-y-3">
        <div className={`text-xs font-medium ${t.textXs}`}>Today — {histAlerts.length} records</div>
        {histAlerts.map(a => <AlertCard key={a.id} alert={a} />)}
        <div className={`text-xs text-center pt-2 ${t.textMuted}`}>No earlier records</div>
      </div>
      {showReport && <ReportModal title="Alert History" context="Historical alert records" onClose={() => setShowReport(false)} />}
    </div>
  );
}

function AlertDetailView({ storeId, alertId, goBack, navigate }: { storeId: string; alertId: string; goBack: () => void; navigate: (v: string, p?: Record<string, unknown>) => void }) {
  const t = useT();
  const store = stores.find(s => s.id === storeId);
  const alert = store?.alerts.find(a => a.id === alertId);
  const [showReport, setShowReport] = useState(false);
  if (!alert || !store) return null;
  const c = alertColors[alert.type];
  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${t.header}`}>
        <div className="flex items-center gap-3">
          <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}><ChevronLeft className="w-5 h-5 text-orange-500" /></button>
          <h2 className={`font-semibold text-sm ${t.text}`}>Alert Detail</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('alert-history', { storeId })} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${t.badge}`}>
            <History className="w-3.5 h-3.5" /> History
          </button>
          <button onClick={() => setShowReport(true)} className="flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
            <FileText className="w-3.5 h-3.5" /> Report
          </button>
        </div>
      </div>
      <div className="px-4 pt-4 space-y-4">
        <div className={`p-4 rounded-2xl border ${c.bg}`}>
          <div className="flex items-start justify-between mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${c.badge}`}>{alert.type}</span>
          </div>
          <h3 className={`font-semibold mb-2 ${t.text}`}>{alert.title}</h3>
          <p className={`text-sm mb-3 ${t.textSm}`}>{alert.description}</p>
          <div className={`flex items-center gap-1 text-xs ${t.textMuted}`}><Clock className="w-3 h-3" />{alert.time}</div>
        </div>

        <div className={`rounded-2xl border shadow-sm p-4 space-y-3 ${t.card}`}>
          <h4 className={`font-medium text-sm ${t.text}`}>Store Details</h4>
          <div className="flex justify-between text-sm"><span className={t.textMuted}>Store</span><span className={`font-medium ${t.text}`}>{store.name} {store.storeNumber}</span></div>
          <div className="flex justify-between text-sm"><span className={t.textMuted}>Manager</span><span className={`font-medium ${t.text}`}>{store.manager}</span></div>
          {alert.location && <div className="flex justify-between text-sm"><span className={t.textMuted}>Location</span><span className={`font-medium ${t.text}`}>{alert.location}</span></div>}
          {alert.staff && <div className="flex justify-between text-sm"><span className={t.textMuted}>Staff</span><span className={`font-medium ${t.text}`}>{alert.staff}</span></div>}
          <div className="flex justify-between text-sm"><span className={t.textMuted}>Compliance</span><span className={`font-medium ${store.compliance >= 85 ? 'text-green-600' : store.compliance >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{store.compliance}%</span></div>
        </div>

        <button onClick={goBack} className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors">
          Mark as Reviewed
        </button>
      </div>
      {showReport && <ReportModal title={`Alert: ${alert.title}`} context={`Store: ${store.name}`} onClose={() => setShowReport(false)} />}
    </div>
  );
}

function StorewiseAlertsView({ storeId, goBack, navigate }: { storeId: string; goBack: () => void; navigate: (v: string, p?: Record<string, unknown>) => void }) {
  const t = useT();
  const store = stores.find(s => s.id === storeId);
  const [showReport, setShowReport] = useState(false);
  if (!store) return null;
  const critical = store.alerts.filter(a => a.type === 'critical').length;
  const warnings  = store.alerts.filter(a => a.type === 'warning').length;
  const fraud     = store.alerts.filter(a => a.type === 'fraud').length;

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${t.header}`}>
        <div className="flex items-center gap-3">
          <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}><ChevronLeft className="w-5 h-5 text-orange-500" /></button>
          <div>
            <h2 className={`font-semibold text-sm ${t.text}`}>{store.name} {store.storeNumber}</h2>
            <p className={`text-xs ${t.textXs}`}>Store Alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('alert-history', { storeId })} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${t.badge}`}>
            <History className="w-3.5 h-3.5" /> History
          </button>
          <button onClick={() => setShowReport(true)} className="flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
            <FileText className="w-3.5 h-3.5" /> Report
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-red-600">{critical}</div>
            <div className={`text-xs ${t.textXs}`}>Critical</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-amber-600">{warnings}</div>
            <div className={`text-xs ${t.textXs}`}>Warnings</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-orange-600">{fraud}</div>
            <div className={`text-xs ${t.textXs}`}>Fraud Risk</div>
          </div>
        </div>
        <div className="space-y-3">
          {store.alerts.map(a => (
            <AlertCard key={a.id} alert={a} onClick={() => navigate('store-alert-detail', { storeId, alertId: a.id })} />
          ))}
        </div>
      </div>
      {showReport && <ReportModal title={`${store.name} Alerts`} context={`${store.alerts.length} alerts`} onClose={() => setShowReport(false)} />}
    </div>
  );
}

function GlobalAlertsView({ goBack, navigate }: { goBack: () => void; navigate: (v: string, p?: Record<string, unknown>) => void }) {
  const t = useT();
  const [activeTab, setActiveTab]   = useState<'alerts' | 'history'>('alerts');
  const [showReport, setShowReport] = useState(false);
  const allAlerts = stores.flatMap(s => s.alerts);
  const critical  = allAlerts.filter(a => a.type === 'critical').length;
  const warnings  = allAlerts.filter(a => a.type === 'warning').length;
  const fraud     = allAlerts.filter(a => a.type === 'fraud').length;

  if (activeTab === 'history') return <HistoryView goBack={() => setActiveTab('alerts')} />;

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${t.header}`}>
        <div className="flex items-center gap-3">
          <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}><ChevronLeft className="w-5 h-5 text-orange-500" /></button>
          <h2 className={`font-semibold text-sm ${t.text}`}>Alerts &amp; History</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${t.badge}`}>
            <History className="w-3.5 h-3.5" /> History
          </button>
          <button onClick={() => setShowReport(true)} className="flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
            <FileText className="w-3.5 h-3.5" /> Report
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-red-600 rounded-xl p-3 text-center text-white">
            <div className="text-xl font-bold">{critical}</div>
            <div className="text-xs text-red-200">Critical</div>
          </div>
          <div className="bg-amber-500 rounded-xl p-3 text-center text-white">
            <div className="text-xl font-bold">{warnings}</div>
            <div className="text-xs text-amber-100">Warnings</div>
          </div>
          <div className="bg-orange-600 rounded-xl p-3 text-center text-white">
            <div className="text-xl font-bold">{fraud}</div>
            <div className="text-xs text-orange-100">Fraud Risk</div>
          </div>
        </div>

        {stores.map(store => (
          <div key={store.id} className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
            <button onClick={() => navigate('storewise-alerts', { storeId: store.id })}
              className={`w-full flex items-center justify-between px-4 py-3 border-b ${t.border} ${t.hoverRow} transition-colors`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <div className="text-left">
                  <span className={`text-sm font-semibold ${t.text}`}>{store.name} {store.storeNumber}</span>
                  <span className="ml-2 text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full">{store.activeAlerts}</span>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${t.textMuted}`} />
            </button>
            <div className={`divide-y ${t.divide}`}>
              {store.alerts.slice(0, 2).map(a => (
                <AlertCard key={a.id} alert={a} onClick={() => navigate('store-alert-detail', { storeId: store.id, alertId: a.id })} />
              ))}
              {store.alerts.length > 2 && (
                <button onClick={() => navigate('storewise-alerts', { storeId: store.id })} className={`w-full text-xs text-orange-500 py-2.5 ${t.hoverRow} text-center`}>
                  +{store.alerts.length - 2} more alerts →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {showReport && <ReportModal title="All Alerts" context={`${allAlerts.length} total alerts across ${stores.length} stores`} onClose={() => setShowReport(false)} />}
    </div>
  );
}

export function AlertsPage({ navigate, goBack, storeId, alertId, showHistory }: Props) {
  if (showHistory) return <HistoryView storeId={storeId} goBack={goBack} />;
  if (storeId && alertId) return <AlertDetailView storeId={storeId} alertId={alertId} goBack={goBack} navigate={navigate} />;
  if (storeId) return <StorewiseAlertsView storeId={storeId} goBack={goBack} navigate={navigate} />;
  return <GlobalAlertsView goBack={goBack} navigate={navigate} />;
}
