import { useState } from 'react';
import {
  ChevronDown, AlertTriangle, Cpu, TrendingUp, ArrowRight, FileText,
  AlertCircle, CheckCircle, Clock, XCircle, ChevronRight, SlidersHorizontal,
  ChevronLeft, MapPin, Copy, TrendingDown, User,
} from 'lucide-react';
import { stores, type AlertType, type Alert } from '../../mockData';
import { ReportModal } from '../shared/ReportModal';
import { useT } from '../../ThemeContext';

interface Props {
  navigate: (view: string, params?: Record<string, unknown>) => void;
}

const STALE_STORES: Record<string, string> = {
  'store-018': '1h 45m',
};

const alertBadge: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  warning:  'bg-amber-500 text-white',
  fraud:    'bg-orange-600 text-white',
};

type GridSelection = 'alerts' | 'nfc' | 'compliance' | null;

// ─── time helpers ─────────────────────────────────────────────────────────────

function parseTime(t: string): number {
  if (!t || t === '—') return 0;
  const parts = t.split(' ');
  if (parts.length < 2) return 0;
  const [timePart, meridiem] = parts;
  let [h, m] = timePart.split(':').map(Number);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function addMinutes(timeStr: string, mins: number): string {
  const total = (parseTime(timeStr) + mins) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const m   = total % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12    = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

function computeRoundTimes(round: typeof stores[0]['rounds'][0]) {
  const timedScans = round.scans.filter(s => s.time && s.time !== '—');
  if (!timedScans.length) {
    return { start: round.time, end: addMinutes(round.time, 90), isInProgress: false, isTooQuick: false };
  }

  const sorted   = [...timedScans].sort((a, b) => parseTime(a.time) - parseTime(b.time));
  const start    = sorted[0].time;
  const expected = addMinutes(start, 90);

  const hasOngoing  = round.scans.some(s => s.status === 'pending');
  const allVerified = round.scans.every(s => s.status === 'verified');

  if (hasOngoing) {
    return { start, end: expected, isInProgress: true, isTooQuick: false };
  }

  const lastScanTime  = sorted[sorted.length - 1].time;
  const durationMins  = parseTime(lastScanTime) - parseTime(start);

  // If every checkpoint was verified and duration < 90 min → use last scan as end
  const end = (allVerified && durationMins < 90) ? lastScanTime : expected;
  const isTooQuick = durationMins < 30;

  return { start, end, isInProgress: false, isTooQuick };
}

// ─── Alert category metadata ──────────────────────────────────────────────────

const alertCategoryLabel: Record<string, string> = {
  'missing-round':  'Missing Round',
  'duplicate-scan': 'Duplicate Scan',
  'gps-mismatch':   'GPS Mismatch',
  'low-compliance': 'Low Compliance',
  'too-quick':      'Round Too Quick',
};

const alertCategoryIcon = (category: string, size = 'w-4 h-4') => {
  if (category === 'missing-round')  return <AlertTriangle className={`${size} text-red-500`} />;
  if (category === 'duplicate-scan') return <Copy className={`${size} text-amber-500`} />;
  if (category === 'gps-mismatch')   return <MapPin className={`${size} text-orange-500`} />;
  if (category === 'too-quick')      return <Clock className={`${size} text-amber-500`} />;
  return <TrendingDown className={`${size} text-amber-500`} />;
};

// ─── Inline Alert Detail ──────────────────────────────────────────────────────

function AlertDetail({
  alert,
  isReviewed,
  onBack,
  onReview,
}: {
  alert: Alert;
  isReviewed: boolean;
  onBack: () => void;
  onReview: () => void;
}) {
  const t = useT();
  const showEmployee = (alert.category === 'duplicate-scan' || alert.category === 'too-quick') && alert.staff;

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
      {/* Back header */}
      <button
        onClick={onBack}
        className={`w-full flex items-center gap-2 px-4 py-3 border-b ${t.border} ${t.hoverRow} transition-colors`}
      >
        <ChevronLeft className="w-4 h-4 text-orange-500 shrink-0" />
        <span className="text-xs font-medium text-orange-500">Back to Alerts</span>
      </button>

      <div className="px-4 py-4 space-y-4">
        {/* Category + type + reviewed badge */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isReviewed          ? 'bg-green-100 dark:bg-green-900/30' :
            alert.type === 'critical' ? 'bg-red-100 dark:bg-red-900/30' :
            alert.type === 'fraud'    ? 'bg-orange-100 dark:bg-orange-900/30' :
            'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            {isReviewed
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : alertCategoryIcon(alert.category, 'w-5 h-5')
            }
          </div>
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${t.textMuted}`}>
              {alertCategoryLabel[alert.category]}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${alertBadge[alert.type]}`}>
                {alert.type}
              </span>
              {isReviewed && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  reviewed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className={`font-bold text-base leading-snug ${t.text}`}>{alert.title}</h3>

        {/* Description */}
        <div className={`text-sm leading-relaxed ${t.textSm}`}>{alert.description}</div>

        {/* Details grid */}
        <div className={`rounded-xl border ${t.borderGray} overflow-hidden`}>
          {alert.time && (
            <div className={`flex items-center justify-between px-3 py-2.5 border-b ${t.borderGray}`}>
              <span className={`text-xs ${t.textMuted}`}>Time</span>
              <span className={`text-xs font-semibold ${t.text}`}>{alert.time}</span>
            </div>
          )}
          {alert.location && (
            <div className={`flex items-center justify-between px-3 py-2.5 ${alert.staff ? `border-b ${t.borderGray}` : ''}`}>
              <span className={`text-xs ${t.textMuted}`}>Location</span>
              <span className={`text-xs font-semibold ${t.text}`}>{alert.location}</span>
            </div>
          )}
          {showEmployee && (
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <User className={`w-3.5 h-3.5 ${t.textMuted}`} />
                <span className={`text-xs ${t.textMuted}`}>Employee Responsible</span>
              </div>
              <span className="text-xs font-semibold text-red-600">{alert.staff}</span>
            </div>
          )}
        </div>

        {/* Guidance note */}
        <div className={`rounded-xl p-3 ${
          alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
          alert.type === 'fraud'    ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' :
          'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }`}>
          <p className={`text-xs ${
            alert.type === 'critical' ? 'text-red-700 dark:text-red-300' :
            alert.type === 'fraud'    ? 'text-orange-700 dark:text-orange-300' :
            'text-amber-700 dark:text-amber-300'
          }`}>
            {alert.category === 'missing-round'  && 'Ensure the next cleaning round starts promptly. If staff are unavailable, reassign immediately.'}
            {alert.category === 'duplicate-scan' && 'Review scan logs for this checkpoint. If the employee made the duplicate scan unintentionally, remind them of the 30-minute rescan policy.'}
            {alert.category === 'gps-mismatch'   && 'Verify that the employee was physically present at the location. This may indicate a fraudulent scan — review CCTV if available.'}
            {alert.category === 'low-compliance' && 'The round compliance is critically low. Follow up with the assigned staff member and schedule a catch-up round.'}
            {alert.category === 'too-quick'      && 'A round completed in under 30 minutes is suspicious. Each checkpoint requires physical presence. Review scan logs and speak with the responsible employee.'}
          </p>
        </div>

        {/* Mark as Reviewed button */}
        <button
          onClick={() => { onReview(); onBack(); }}
          disabled={isReviewed}
          className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
            isReviewed
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 cursor-default'
              : 'bg-green-500 text-white hover:bg-green-600 active:scale-[0.98]'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          {isReviewed ? 'Already Reviewed' : 'Mark as Reviewed'}
        </button>
      </div>
    </div>
  );
}

// ─── Store: Rounds view (compliance selected) ────────────────────────────────

function StoreRoundsView({ store }: { store: typeof stores[0] }) {
  const t = useT();
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  if (store.rounds.length === 0) {
    return (
      <div className={`rounded-2xl border shadow-sm p-6 text-center ${t.card}`}>
        <p className={`text-sm ${t.textXs}`}>No rounds recorded for this store.</p>
      </div>
    );
  }

  const sortedRounds = [...store.rounds].sort((a, b) => parseTime(b.time) - parseTime(a.time));

  const scanIcon = (status: string) => {
    if (status === 'verified') return <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />;
    if (status === 'missed')   return <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />;
    return <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  };

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
      <div className={`px-4 py-3 border-b ${t.border} flex items-center gap-2`}>
        <Clock className="w-4 h-4 text-red-500" />
        <h3 className={`font-semibold text-sm ${t.text}`}>Round Details</h3>
        <span className={`text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 ${t.textXs}`}>
          {store.rounds.length} rounds · newest first
        </span>
      </div>

      <div className={`divide-y ${t.divide}`}>
        {sortedRounds.map(round => {
          const isOpen = expandedRound === round.id;
          const { start, end, isInProgress, isTooQuick } = computeRoundTimes(round);
          const compColor = round.compliance >= 85 ? 'text-green-600' : round.compliance >= 70 ? 'text-amber-500' : 'text-red-600';
          const barColor  = round.compliance >= 85 ? 'bg-green-500'  : round.compliance >= 70 ? 'bg-amber-500'  : 'bg-red-500';

          return (
            <div key={round.id}>
              {/* Too-quick warning banner */}
              {isTooQuick && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    Round completed in under 30 minutes — check may be invalid
                  </span>
                </div>
              )}
              <button
                onClick={() => setExpandedRound(isOpen ? null : round.id)}
                className={`w-full px-4 py-3.5 text-left flex items-start justify-between gap-3 ${t.hoverRow} transition-colors`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-semibold ${t.text}`}>{round.name}</span>
                    {isInProgress && (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                        In Progress
                      </span>
                    )}
                    {isTooQuick && (
                      <span className="text-xs bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                        ⚠ Too Quick
                      </span>
                    )}
                  </div>
                  <div className={`text-xs ${t.textMuted} mb-1`}>
                    {round.staff} · {start} → {isInProgress ? `${end} (expected)` : end}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${round.compliance}%` }} />
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${compColor}`}>
                      {round.compliance}% · {round.completedScans}/{round.totalScans} scans
                    </span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 ${t.textMuted} transition-transform shrink-0 mt-0.5 ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {isOpen && (
                <div className={`border-t ${t.border} bg-gray-50 dark:bg-gray-800/50 max-h-64 overflow-y-auto`}>
                  {round.scans.map(scan => (
                    <div key={scan.id} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 ${t.borderGray}`}>
                      {scanIcon(scan.status)}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium ${t.text} truncate`}>{scan.location}</div>
                        <div className={`text-xs ${t.textMuted}`}>{scan.time !== '—' ? scan.time : 'Not scanned'}</div>
                      </div>
                      <span className={`text-xs capitalize shrink-0 px-2 py-0.5 rounded-full font-medium ${
                        scan.status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        scan.status === 'missed'   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>{scan.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Store: Alerts view ──────────────────────────────────────────────────────

function StoreAlertsView({ store }: { store: typeof stores[0] }) {
  const t = useT();
  const [showAll, setShowAll]             = useState(false);
  const [typeFilter, setTypeFilter]       = useState<AlertType | 'all' | 'reviewed'>('all');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [reviewedIds, setReviewedIds]     = useState<Set<string>>(new Set());

  const markReviewed = (id: string) => setReviewedIds(prev => new Set([...prev, id]));

  if (selectedAlert) {
    return (
      <AlertDetail
        alert={selectedAlert}
        isReviewed={reviewedIds.has(selectedAlert.id)}
        onBack={() => setSelectedAlert(null)}
        onReview={() => markReviewed(selectedAlert.id)}
      />
    );
  }

  const sortedAlerts = [...store.alerts].reverse();

  const displayed = showAll
    ? typeFilter === 'reviewed'
      ? sortedAlerts.filter(a => reviewedIds.has(a.id))
      : typeFilter === 'all'
      ? sortedAlerts
      : sortedAlerts.filter(a => a.type === typeFilter)
    : sortedAlerts;

  const typeCounts: Record<AlertType, number> = {
    critical: store.alerts.filter(a => a.type === 'critical').length,
    warning:  store.alerts.filter(a => a.type === 'warning').length,
    fraud:    store.alerts.filter(a => a.type === 'fraud').length,
  };

  const filterBtn = (label: string, value: AlertType | 'all' | 'reviewed', count?: number) => (
    <button
      key={value}
      onClick={() => setTypeFilter(value)}
      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors font-medium whitespace-nowrap ${
        typeFilter === value
          ? value === 'critical'  ? 'bg-red-600 text-white border-red-600'
          : value === 'warning'   ? 'bg-amber-500 text-white border-amber-500'
          : value === 'fraud'     ? 'bg-orange-600 text-white border-orange-600'
          : value === 'reviewed'  ? 'bg-green-600 text-white border-green-600'
          : 'bg-gray-700 text-white border-gray-700'
          : `${t.card} ${t.text} border-gray-200 dark:border-gray-600`
      }`}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span className={`ml-0.5 text-xs ${typeFilter === value ? 'opacity-80' : t.textMuted}`}>{count}</span>
      )}
    </button>
  );

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
      <div className={`px-4 py-3 border-b ${t.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className={`font-semibold text-sm ${t.text}`}>Today's Alerts</h3>
          <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{sortedAlerts.length}</span>
          {reviewedIds.size > 0 && (
            <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">{reviewedIds.size} reviewed</span>
          )}
        </div>
        <button
          onClick={() => { setShowAll(v => !v); setTypeFilter('all'); }}
          className="flex items-center gap-1 text-xs text-orange-500 font-medium"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {showAll ? 'Collapse' : 'View All'}
        </button>
      </div>

      {showAll && (
        <div className={`px-4 py-2.5 border-b ${t.border} flex items-center gap-1.5 overflow-x-auto`}>
          {filterBtn('All', 'all')}
          {filterBtn('Critical', 'critical', typeCounts.critical)}
          {filterBtn('Warning', 'warning', typeCounts.warning)}
          {filterBtn('Fraud', 'fraud', typeCounts.fraud)}
          {filterBtn('Reviewed', 'reviewed', reviewedIds.size)}
        </div>
      )}

      {displayed.length === 0 ? (
        <div className={`px-4 py-8 text-center text-xs ${t.textXs}`}>No alerts match this filter</div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          <div className={`divide-y ${t.divide}`}>
            {displayed.map(a => {
              const reviewed = reviewedIds.has(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => setSelectedAlert(a)}
                  className={`w-full text-left px-4 py-3 transition-colors ${reviewed ? 'bg-green-50 dark:bg-green-900/10' : t.hoverRow}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-start gap-2 min-w-0">
                      {reviewed
                        ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" />
                        : alertCategoryIcon(a.category, 'w-3.5 h-3.5 mt-0.5 shrink-0')
                      }
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          {alertCategoryLabel[a.category]}
                        </span>
                        <div className={`text-sm font-medium leading-tight ${reviewed ? 'line-through opacity-60' : ''} ${t.text}`}>{a.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {reviewed && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 font-medium">✓</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium uppercase ${alertBadge[a.type]}`}>{a.type}</span>
                    </div>
                  </div>
                  {a.location && <p className={`text-xs ${t.textMuted} mb-0.5 pl-5`}>{a.location}</p>}
                  <p className={`text-xs ${t.textXs} pl-5`}>{a.time}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Store: NFC view ─────────────────────────────────────────────────────────

function StoreNFCView({ store }: { store: typeof stores[0] }) {
  const t = useT();
  const totalRounds = store.rounds.length;

  const tagScanCounts = store.tags.map(tag => {
    let scanned = 0;
    for (const round of store.rounds) {
      const hit = round.scans.find(s =>
        s.location === tag.location || tag.uid.startsWith(s.nfcUid)
      );
      if (hit && hit.status === 'verified') scanned++;
    }
    return { tag, scanned, total: totalRounds };
  });

  const statusCls: Record<string, string> = {
    active:  'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    error:   'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
      <div className={`px-4 py-3 border-b ${t.border} flex items-center gap-2`}>
        <Cpu className="w-4 h-4 text-red-500" />
        <h3 className={`font-semibold text-sm ${t.text}`}>NFC Tags & Scan Counts</h3>
        <span className={`text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 ${t.textXs}`}>
          {store.tags.length} tags
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <div className={`divide-y ${t.divide}`}>
          {tagScanCounts.map(({ tag, scanned, total }) => {
            const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
            const barColor = pct >= 85 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
            return (
              <div key={tag.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <div className={`text-sm font-medium ${t.text} truncate`}>{tag.location}</div>
                    <div className={`text-xs font-mono ${t.textMuted}`}>{tag.uid.substring(0, 11)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls[tag.status]}`}>
                      {tag.status}
                    </span>
                    <div className={`text-xs mt-1 font-semibold ${t.text}`}>{scanned}/{total} scans</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-xs shrink-0 ${t.textMuted}`}>{pct}%</span>
                </div>
                {tag.lastScanned && (
                  <div className={`text-xs mt-1 ${t.textMuted}`}>Last scan: {tag.lastScanned}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── All-stores breakdown ────────────────────────────────────────────────────

function StoreAlertDetail({ store, onBack }: { store: typeof stores[0]; onBack: () => void }) {
  const t = useT();
  const alertBadgeMap: Record<string, string> = {
    critical: 'bg-red-600 text-white',
    warning:  'bg-amber-500 text-white',
    fraud:    'bg-orange-600 text-white',
  };
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
      <button
        onClick={onBack}
        className={`w-full flex items-center gap-2 px-4 py-3 border-b ${t.border} ${t.hoverRow} transition-colors`}
      >
        <ChevronLeft className="w-4 h-4 text-orange-500 shrink-0" />
        <span className="text-xs font-medium text-orange-500">Back to All Stores</span>
      </button>
      <div className={`px-4 py-3 border-b ${t.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className={`font-semibold text-sm ${t.text}`}>{store.name} {store.storeNumber}</h3>
        </div>
        <span className="text-xs bg-red-600 text-white px-1.5 py-0.5 rounded-full">{store.alerts.length}</span>
      </div>
      {store.alerts.length === 0 ? (
        <div className={`px-4 py-8 text-center text-xs ${t.textMuted}`}>No alerts for this store</div>
      ) : (
        <div className={`divide-y ${t.divide}`}>
          {[...store.alerts].reverse().map(a => (
            <div key={a.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className={`text-sm font-medium leading-tight ${t.text}`}>{a.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-medium uppercase ${alertBadgeMap[a.type]}`}>{a.type}</span>
              </div>
              <p className={`text-xs ${t.textSm} mb-1`}>{a.description}</p>
              {a.location && <p className={`text-xs ${t.textMuted}`}>{a.location}</p>}
              <p className={`text-xs ${t.textXs} mt-0.5`}>{a.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AllStoresBreakdown({ selection }: { selection: GridSelection }) {
  const t = useT();
  const [drillStore, setDrillStore] = useState<string | null>(null);

  if (!selection) return null;

  // Drill into a store's alerts
  if (drillStore && selection === 'alerts') {
    const store = stores.find(s => s.id === drillStore);
    if (store) return <StoreAlertDetail store={store} onBack={() => setDrillStore(null)} />;
  }

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
      <div className={`px-4 py-3 border-b ${t.border} flex items-center gap-2`}>
        {selection === 'alerts'     && <AlertTriangle className="w-4 h-4 text-red-500" />}
        {selection === 'nfc'        && <Cpu className="w-4 h-4 text-red-500" />}
        {selection === 'compliance' && <TrendingUp className="w-4 h-4 text-red-500" />}
        <h3 className={`font-semibold text-sm ${t.text}`}>
          {selection === 'alerts'     && 'Total Alerts — Per Store'}
          {selection === 'nfc'        && 'Total NFC Tags — Per Store'}
          {selection === 'compliance' && 'Compliance — Per Store'}
        </h3>
      </div>
      <div className={`divide-y ${t.divide}`}>
        {stores.map(s => {
          const value =
            selection === 'alerts'     ? s.alerts.length :
            selection === 'nfc'        ? s.nfcCount      : s.compliance;

          const maxValue =
            selection === 'alerts' ? Math.max(...stores.map(x => x.alerts.length), 1) :
            selection === 'nfc'    ? Math.max(...stores.map(x => x.nfcCount), 1)      : 100;

          const barColor =
            selection === 'compliance'
              ? s.compliance >= 85 ? 'bg-green-500' : s.compliance >= 70 ? 'bg-amber-500' : 'bg-red-500'
              : 'bg-red-500';

          const valueLabel = selection === 'compliance' ? `${value}%` : `${value}`;

          const subLabel =
            selection === 'alerts'     ? (value === 1 ? 'alert'  : 'alerts') :
            selection === 'nfc'        ? (value === 1 ? 'tag'    : 'tags')   :
            value >= 85 ? 'On Track' : value >= 70 ? 'At Risk' : 'Critical';

          const subColor =
            selection === 'compliance'
              ? s.compliance >= 85 ? 'text-green-600' : s.compliance >= 70 ? 'text-amber-500' : 'text-red-600'
              : selection === 'alerts' && value > 3
              ? 'text-red-600'
              : t.textMuted;

          const isClickable = selection === 'alerts';

          const inner = (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <span className={`text-sm font-medium ${t.text}`}>{s.name} {s.storeNumber}</span>
                  <span className={`text-xs ml-2 ${t.textMuted}`}>{s.location}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-sm font-bold ${t.text}`}>{valueLabel}</span>
                  <span className={`text-xs ${subColor}`}>{subLabel}</span>
                  {isClickable && <ChevronRight className={`w-3.5 h-3.5 ${t.textMuted}`} />}
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${(value / maxValue) * 100}%` }} />
              </div>
            </>
          );

          return isClickable ? (
            <button
              key={s.id}
              onClick={() => setDrillStore(s.id)}
              className={`w-full px-4 py-3.5 text-left ${t.hoverRow} transition-colors`}
            >
              {inner}
            </button>
          ) : (
            <div key={s.id} className="px-4 py-3.5">{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main DashboardTab ───────────────────────────────────────────────────────

export function DashboardTab({ navigate }: Props) {
  const t = useT();
  const [selectedStore, setSelectedStore] = useState('');
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [showReport, setShowReport]       = useState(false);
  const [selectedGrid, setSelectedGrid]   = useState<GridSelection>('compliance');

  const store = stores.find(s => s.id === selectedStore);

  const totalAlerts   = stores.reduce((sum, s) => sum + s.alerts.length, 0);
  const totalNFCs     = stores.reduce((sum, s) => sum + s.nfcCount, 0);
  const avgCompliance = Math.round(stores.reduce((sum, s) => sum + s.compliance, 0) / stores.length);

  const displayAlerts     = store ? store.alerts.length : totalAlerts;
  const displayNFCs       = store ? store.nfcCount      : totalNFCs;
  const displayCompliance = store ? store.compliance    : avgCompliance;

  const toggleGrid = (grid: GridSelection) =>
    setSelectedGrid(prev => (prev === grid ? null : grid));

  const staleTime   = store ? STALE_STORES[store.id] : null;
  const staleStores = !store
    ? stores.filter(s => STALE_STORES[s.id]).map(s => ({ store: s, time: STALE_STORES[s.id] }))
    : [];

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      {/* Sub-header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${t.header}`}>
        <span className={`text-xs ${t.textXs}`}>
          {store ? `${store.name} ${store.storeNumber}` : `${stores.length} stores · Last sync: 2 min ago`}
        </span>
        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-1.5 text-xs text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full"
        >
          <FileText className="w-3.5 h-3.5" /> Generate Report
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Store Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-sm font-medium transition-colors ${
              selectedStore ? 'border-orange-400' : 'border-orange-200'
            } ${t.cardFlat} ${t.text}`}
          >
            <span>{store ? `${store.name} ${store.storeNumber}` : 'All Stores — Overview'}</span>
            <ChevronDown className={`w-4 h-4 text-red-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1 border rounded-xl shadow-xl z-20 overflow-hidden ${t.card}`}>
              <button
                onClick={() => { setSelectedStore(''); setSelectedGrid('compliance'); setDropdownOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${t.hoverRow} ${!selectedStore ? 'text-orange-500 font-medium' : t.text}`}
              >
                All Stores — Overview
              </button>
              {stores.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStore(s.id); setSelectedGrid('compliance'); setDropdownOpen(false); }}
                  className={`w-full text-left px-4 py-3 text-sm border-t ${t.borderGray} ${t.hoverRow} transition-colors ${selectedStore === s.id ? 'text-orange-500 font-medium' : t.text}`}
                >
                  <div className="font-medium">{s.name} {s.storeNumber}</div>
                  <div className={`text-xs ${t.textMuted}`}>{s.location}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stale banner — specific store */}
        {staleTime && (
          <div className="flex items-start gap-3 bg-red-600 rounded-2xl p-4 text-white">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">No Scan Activity — {staleTime}</p>
              <p className="text-xs text-red-100 mt-0.5">
                No scan has been recorded at this store for over 60 consecutive minutes. Immediate action required.
              </p>
            </div>
          </div>
        )}

        {/* Stale banners — all-stores */}
        {staleStores.map(({ store: s, time }) => (
          <div key={s.id} className="flex items-start gap-3 bg-red-600 rounded-2xl p-4 text-white">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">{s.name} {s.storeNumber} — No Scan Activity</p>
              <p className="text-xs text-red-100 mt-0.5">
                No scan recorded for <span className="font-semibold">{time}</span>. Exceeds 60-min threshold — immediate action required.
              </p>
            </div>
          </div>
        ))}

        {/* Stats Tiles */}
        <div className="grid grid-cols-3 gap-3">
          {/* Alerts */}
          <button
            onClick={() => toggleGrid('alerts')}
            className={`rounded-2xl p-3 border-2 shadow-sm text-left transition-colors ${t.hoverRow} ${
              selectedGrid === 'alerts'
                ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                : `border-transparent ${t.card}`
            }`}
          >
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-orange-500">{displayAlerts}</div>
            <div className={`text-xs leading-tight ${t.textXs}`}>Total Alerts</div>
          </button>

          {/* Compliance — centre */}
          <button
            onClick={() => toggleGrid('compliance')}
            className={`rounded-2xl p-3 border-2 shadow-sm text-left transition-colors ${t.hoverRow} ${
              selectedGrid === 'compliance'
                ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                : `border-transparent ${t.card}`
            }`}
          >
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
            <div className={`text-2xl font-bold ${t.text}`}>{displayCompliance}%</div>
            <div className={`text-xs leading-tight ${t.textXs}`}>Compliance</div>
            <div className="text-xs text-green-600 mt-1">+3.2% today</div>
          </button>

          {/* NFCs */}
          <button
            onClick={() => toggleGrid('nfc')}
            className={`rounded-2xl p-3 border-2 shadow-sm text-left transition-colors ${t.hoverRow} ${
              selectedGrid === 'nfc'
                ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                : `border-transparent ${t.card}`
            }`}
          >
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-2">
              <Cpu className="w-4 h-4 text-orange-500" />
            </div>
            <div className={`text-2xl font-bold ${t.text}`}>{displayNFCs}</div>
            <div className={`text-xs leading-tight ${t.textXs}`}>Total NFCs</div>
            <div className="text-xs text-green-600 mt-1">● Active</div>
          </button>
        </div>

        {/* Content area */}
        {store ? (
          <>
            {selectedGrid === 'compliance' && <StoreRoundsView store={store} />}
            {selectedGrid === 'alerts'     && <StoreAlertsView store={store} />}
            {selectedGrid === 'nfc'        && <StoreNFCView store={store} />}
          </>
        ) : (
          <AllStoresBreakdown selection={selectedGrid} />
        )}
      </div>

      {showReport && (
        <ReportModal
          title={store ? `${store.name} ${store.storeNumber}` : 'Overall Dashboard'}
          context={store ? `Compliance: ${store.compliance}%` : `${stores.length} stores`}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
