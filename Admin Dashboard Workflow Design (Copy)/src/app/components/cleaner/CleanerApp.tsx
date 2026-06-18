import React, { useState, useRef, useEffect } from 'react';
import {
  Shield, Bell, Scan, LayoutDashboard, Home, MapPin,
  CheckCircle, XCircle, Clock, LogOut, User, TrendingUp,
  AlertTriangle, X, Star, Calendar, Award, Sun, Moon, AlertCircle, Wifi, ChevronRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useTheme, useT } from '../../ThemeContext';

/* ─── Types ─────────────────────────────────────────────── */
type AppUser = { role: 'admin' | 'cleaner'; name: string; id: string };
type TabType = 'scan' | 'dashboard' | 'home';
type ScanStatus = 'idle' | 'scanning' | 'verified' | 'error';
type CheckpointStatus = 'pending' | 'scanning' | 'verified' | 'error';

interface Checkpoint {
  id: string; uid: string; location: string; area: string;
  zone: string; priority: 'high' | 'medium' | 'low';
  status: CheckpointStatus; scannedAt?: string;
}

/* ─── Constants ─────────────────────────────────────────── */
const STORE = { name: 'FreshMart Superstore', number: '#042', location: 'Level 1, East Wing Mall' };
const EMPLOYEE = { name: 'Maria Santos', id: 'MS-0542', role: 'Cleaner', shift: '06:00 AM – 02:00 PM', joined: 'March 2022' };

const CHECKPOINT_DEFS = [
  { id: 'cp1',  uid: '04:A3:7F', location: 'Produce Section',      area: 'Aisle 1',   zone: 'Retail',     priority: 'high'   as const },
  { id: 'cp2',  uid: '04:B2:3C', location: 'Bakery Section',       area: 'Aisle 2',   zone: 'Retail',     priority: 'medium' as const },
  { id: 'cp3',  uid: '04:C4:5E', location: 'Dairy – Aisle 3',      area: 'Aisle 3',   zone: 'Retail',     priority: 'high'   as const },
  { id: 'cp4',  uid: '04:D5:6F', location: 'Meat & Seafood',       area: 'Aisle 4',   zone: 'Retail',     priority: 'high'   as const },
  { id: 'cp5',  uid: '04:E6:7G', location: 'Restrooms – Level 1',  area: 'Side',      zone: 'Facilities', priority: 'high'   as const },
  { id: 'cp6',  uid: '04:F7:8H', location: 'Checkout Lanes 1–6',   area: 'Front',     zone: 'Retail',     priority: 'medium' as const },
  { id: 'cp7',  uid: '04:G8:9I', location: 'Beverages – Aisle 7',  area: 'Aisle 7',   zone: 'Retail',     priority: 'low'    as const },
  { id: 'cp8',  uid: '04:H9:0J', location: 'Frozen Foods',         area: 'Aisle 8',   zone: 'Storage',    priority: 'medium' as const },
  { id: 'cp9',  uid: '04:I0:1K', location: 'Staff Break Room',     area: 'Back Area', zone: 'Facilities', priority: 'low'    as const },
  { id: 'cp10', uid: '04:J1:2L', location: 'Loading Dock',         area: 'Back Area', zone: 'Storage',    priority: 'medium' as const },
  { id: 'cp11', uid: '04:K2:3M', location: "Manager's Office",     area: 'Back Area', zone: 'Office',     priority: 'low'    as const },
  { id: 'cp12', uid: '04:L3:4N', location: 'Deli Counter',         area: 'Aisle 2',   zone: 'Retail',     priority: 'high'   as const },
];

const HOURLY_DATA = [
  { hour: '6AM', done: 12, missed: 0 }, { hour: '7AM', done: 11, missed: 1 },
  { hour: '8AM', done: 12, missed: 0 }, { hour: '9AM', done: 4,  missed: 0 },
  { hour: '10AM', done: 0, missed: 0 }, { hour: '11AM', done: 0, missed: 0 },
];

const WEEKLY_TREND = [
  { day: 'Mon', compliance: 88 }, { day: 'Tue', compliance: 95 },
  { day: 'Wed', compliance: 91 }, { day: 'Thu', compliance: 87 },
  { day: 'Fri', compliance: 94 }, { day: 'Sat', compliance: 82 },
  { day: 'Sun', compliance: 85 },
];

const COMPLETED_ROUNDS = [
  { id: 'r1',  name: 'Morning Round #1', startTime: '06:00 AM', endTime: '07:30 AM', compliance: 100, scanned: 12, total: 12, staff: 'Maria Santos'  },
  { id: 'r2',  name: 'Morning Round #2', startTime: '07:30 AM', endTime: '09:00 AM', compliance:  92, scanned: 11, total: 12, staff: 'Maria Santos'  },
  { id: 'r3',  name: 'Morning Round #1', startTime: '06:15 AM', endTime: '07:45 AM', compliance:  88, scanned: 11, total: 12, staff: 'James Okafor'   },
  { id: 'r4',  name: 'Morning Round #2', startTime: '07:45 AM', endTime: '09:15 AM', compliance:  75, scanned:  9, total: 12, staff: 'James Okafor'   },
  { id: 'r5',  name: 'Morning Round #1', startTime: '06:30 AM', endTime: '07:00 AM', compliance:  58, scanned:  7, total: 12, staff: 'Priya Nair'     },
];

const ALERTS_DATA = [
  { id: 'a1', type: 'warning'  as const, title: 'Checkout Lanes 1–6 Overdue',  desc: 'Scheduled scan at 08:50 AM was missed. 45 min overdue.', time: '9 min ago' },
  { id: 'a2', type: 'info'     as const, title: 'Round #3 Started',            desc: 'Morning Round #3 started. 12 checkpoints assigned.',     time: '12 min ago' },
  { id: 'a3', type: 'critical' as const, title: 'GPS Mismatch Detected',       desc: 'Previous scan coordinates off by 20m. Logged for review.', time: '25 min ago' },
];

const ROUND_START = '09:00 AM';
const ROUND_DURATION = 90;

const now = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

function addMins(timeStr: string, mins: number): string {
  const m = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return '';
  let h = parseInt(m[1]); const min = parseInt(m[2]); const p = m[3].toUpperCase();
  if (p === 'PM' && h !== 12) h += 12; if (p === 'AM' && h === 12) h = 0;
  const total = h * 60 + min + mins;
  const nh = Math.floor(total / 60) % 24; const nm = total % 60;
  const np = nh >= 12 ? 'PM' : 'AM'; const dh = nh % 12 || 12;
  return `${dh}:${nm.toString().padStart(2, '0')} ${np}`;
}

const ROUND_END = addMins(ROUND_START, ROUND_DURATION);

/* ─── Styles ─────────────────────────────────────────────── */
const priorityDot: Record<string, string> = {
  high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-gray-300',
};
const zoneTag: Record<string, string> = {
  Retail:     'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  Facilities: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  Storage:    'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  Office:     'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

/* ─── Status Row ─────────────────────────────────────────── */
function StatusRow({ status }: { status: ScanStatus }) {
  const t = useT();
  const states: { key: ScanStatus; label: string }[] = [
    { key: 'idle',     label: 'IDLE' },
    { key: 'scanning', label: 'SCANNING' },
    { key: 'verified', label: 'VERIFIED' },
    { key: 'error',    label: 'ERROR' },
  ];
  return (
    <div className="flex items-center justify-center gap-5">
      {states.map(s => {
        const active = s.key === status;
        const dotCls =
          active && s.key === 'verified' ? 'bg-green-500' :
          active && s.key === 'error'    ? 'bg-red-500' :
          active && s.key === 'scanning' ? 'bg-orange-500 animate-pulse' :
          active                         ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600';
        const txtCls =
          active && s.key === 'verified' ? 'text-green-600 dark:text-green-400' :
          active && s.key === 'error'    ? 'text-red-500' :
          active                         ? 'text-orange-500' : `${t.textMuted}`;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
            <span className={`text-xs font-semibold tracking-wide ${txtCls}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Checkpoint Row ─────────────────────────────────────── */
function CheckpointRow({ cp, index }: { cp: Checkpoint; index: number }) {
  const t = useT();
  const isScanning = cp.status === 'scanning';
  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b ${t.borderGray} transition-all ${isScanning ? 'bg-orange-50 dark:bg-orange-900/20' : t.cardFlat}`}>
      <span className={`text-xs w-5 shrink-0 text-center ${t.textMuted}`}>{index}</span>
      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[cp.priority]}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${t.text}`}>{cp.location}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs px-1.5 py-0.5 rounded ${zoneTag[cp.zone]}`}>{cp.zone}</span>
          <span className={`text-xs font-mono ${t.textMuted}`}>{cp.uid}</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        {cp.status === 'pending'  && <span className="w-5 h-5 rounded-full border-2 border-gray-200 dark:border-gray-600 inline-flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600" /></span>}
        {cp.status === 'scanning' && <span className="w-5 h-5 rounded-full border-2 border-orange-400 border-t-transparent animate-spin inline-flex" />}
        {cp.status === 'verified' && <div className="flex flex-col items-end gap-0.5"><CheckCircle className="w-5 h-5 text-green-500" /><span className={`text-xs ${t.textMuted}`}>{cp.scannedAt}</span></div>}
        {cp.status === 'error'    && <div className="flex flex-col items-end gap-0.5"><XCircle className="w-5 h-5 text-red-500" /><span className="text-xs text-red-400">Error</span></div>}
      </div>
    </div>
  );
}

/* ─── Alerts Panel ───────────────────────────────────────── */
function AlertsPanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div className="absolute inset-0 z-30 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className={`w-[85%] max-w-sm h-full shadow-2xl flex flex-col ${t.cardFlat}`}>
        <div className={`flex items-center justify-between px-4 py-4 border-b ${t.border}`}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />
            <h3 className={`font-semibold ${t.text}`}>Notifications</h3>
            <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">{ALERTS_DATA.length}</span>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-full ${t.hoverRow}`}><X className={`w-4 h-4 ${t.textSm}`} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {ALERTS_DATA.map(a => (
            <div key={a.id} className={`p-3.5 rounded-xl border ${
              a.type === 'critical' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
              a.type === 'warning'  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' :
                                      `${t.surface} ${t.borderGray}`
            }`}>
              <div className="flex items-start justify-between mb-1.5">
                <span className={`text-sm font-semibold leading-tight pr-2 ${t.text}`}>{a.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 uppercase ${
                  a.type === 'critical' ? 'bg-red-600 text-white' : a.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                }`}>{a.type}</span>
              </div>
              <p className={`text-xs mb-1 ${t.textSm}`}>{a.desc}</p>
              <div className={`flex items-center gap-1 text-xs ${t.textMuted}`}><Clock className="w-3 h-3" />{a.time}</div>
            </div>
          ))}
        </div>
        <div className={`px-4 py-3 border-t ${t.border}`}>
          <button onClick={onClose} className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">Mark All as Read</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Store Sub-Header ───────────────────────────────────── */
function StoreHeader({ alertCount, onAlerts, extraRight }: { alertCount: number; onAlerts: () => void; extraRight?: React.ReactNode }) {
  const t = useT();
  return (
    <div className={`px-4 py-3 border-b flex items-center justify-between shrink-0 ${t.header}`}>
      <div>
        <div className={`font-semibold text-sm ${t.text}`}>{STORE.name} {STORE.number}</div>
        <div className={`text-xs ${t.textXs}`}>{STORE.location}</div>
      </div>
      <div className="flex items-center gap-2">
        {extraRight}
        <button onClick={onAlerts} className={`relative w-8 h-8 rounded-full flex items-center justify-center ${t.badge}`}>
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center font-bold">{alertCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Scan Tab ───────────────────────────────────────────── */
function ScanTab({ checkpoints, scanStatus, onScan, onAlerts, alertCount }: {
  checkpoints: Checkpoint[]; scanStatus: ScanStatus; onScan: () => void; onAlerts: () => void; alertCount: number;
}) {
  const t = useT();
  const listRef = useRef<HTMLDivElement>(null);
  const scannedCount = checkpoints.filter(c => c.status === 'verified').length;
  const errorCount   = checkpoints.filter(c => c.status === 'error').length;
  const pendingCount = checkpoints.filter(c => c.status === 'pending' || c.status === 'scanning').length;
  const compliance   = Math.round((scannedCount / checkpoints.length) * 100);
  const allDone      = pendingCount === 0 && scannedCount + errorCount === checkpoints.length;

  const minutesSinceScan = scannedCount === 0 ? 83 : 0;
  const showInactivityBanner = minutesSinceScan >= 60;

  // Scanned log: only completed checkpoints, newest first
  const scannedLog = checkpoints
    .filter(c => c.status === 'verified' || c.status === 'error')
    .slice()
    .reverse();

  // Auto-scroll to top of list when a new scan arrives
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [scannedLog.length]);

  const btnBg = () => {
    if (scanStatus === 'scanning') return 'bg-orange-400';
    if (scanStatus === 'verified') return 'bg-green-500';
    if (scanStatus === 'error')    return 'bg-red-600';
    if (allDone)                   return 'bg-gray-400 cursor-not-allowed';
    return 'bg-orange-500 hover:bg-orange-400 active:scale-95';
  };

  // Each row is ~60 px; show 5 at a time
  const ROW_H = 60;
  const VISIBLE = 5;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <StoreHeader alertCount={alertCount} onAlerts={onAlerts} />

      {/* Status strip */}
      <div className={`shrink-0 px-4 pt-3 pb-3 border-b ${t.header} space-y-2`}>
        {showInactivityBanner && (
          <div className="flex items-start gap-2 bg-red-600 text-white rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold">No Scan Activity — {minutesSinceScan} min</p>
              <p className="text-[10px] text-red-100">No scan recorded in 60+ consecutive minutes.</p>
            </div>
          </div>
        )}
        <StatusRow status={scanStatus} />
      </div>

      {/* Scan button hero */}
      <div className={`shrink-0 flex flex-col items-center gap-4 pt-5 pb-4 px-4 ${t.page}`}>
        <button
          onClick={onScan}
          disabled={scanStatus === 'scanning' || allDone}
          className={`w-52 h-52 rounded-full flex items-center justify-center relative transition-all duration-200 select-none shadow-2xl ${btnBg()}`}
          style={{ boxShadow: (scanStatus === 'idle') ? '0 16px 50px rgba(249,115,22,0.3)' : undefined }}
        >
          <div className="absolute inset-5 rounded-full border-[2px] border-dashed border-white/50 pointer-events-none" />

          {scanStatus === 'scanning' ? (
            <span className="w-14 h-14 border-[5px] border-white border-t-transparent rounded-full animate-spin" />
          ) : scanStatus === 'verified' ? (
            <div className="flex flex-col items-center gap-1">
              <CheckCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
              <span className="text-white font-bold text-sm tracking-widest">VERIFIED</span>
            </div>
          ) : scanStatus === 'error' ? (
            <div className="flex flex-col items-center gap-1">
              <XCircle className="w-16 h-16 text-white" strokeWidth={1.5} />
              <span className="text-white font-bold text-sm tracking-widest">ERROR</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg viewBox="0 0 60 60" width="68" height="68" fill="none" className="mb-1">
                <circle cx="30" cy="38" r="6" fill="white" />
                <path d="M18 30 a 14 14 0 0 1 24 0" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M8 22 a 24 24 0 0 1 44 0" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
              </svg>
              <span className="text-white font-bold text-sm tracking-widest uppercase">
                {allDone ? 'ALL DONE' : 'TAP TO SCAN'}
              </span>
              {!allDone && <span className="text-white/70 text-xs mt-1">Hold near NFC tag</span>}
            </div>
          )}
        </button>

        {/* Stats row */}
        <div className="w-full grid grid-cols-3 gap-2">
          <div className={`rounded-xl p-2.5 text-center border ${t.redLight}`}>
            <div className="text-xl font-bold text-orange-500">{scannedCount}</div>
            <div className={`text-[10px] leading-tight ${t.textXs}`}>Scans Done</div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5 text-center border border-amber-100 dark:border-amber-800">
            <div className="text-xl font-bold text-amber-600">{pendingCount}</div>
            <div className={`text-[10px] leading-tight ${t.textXs}`}>Pending</div>
          </div>
          <div className={`rounded-xl p-2.5 text-center border ${compliance >= 80 ? 'bg-green-50 border-green-100 dark:bg-green-900/20' : compliance >= 60 ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20' : t.redLight}`}>
            <div className={`text-xl font-bold ${compliance >= 80 ? 'text-green-600' : compliance >= 60 ? 'text-amber-600' : 'text-orange-500'}`}>{compliance}%</div>
            <div className={`text-[10px] leading-tight ${t.textXs}`}>Compliance</div>
          </div>
        </div>

        <p className={`text-xs text-center ${t.textMuted} px-6 leading-relaxed`}>
          Hold your iPhone near the NFC tag to verify your cleaning visit. GPS is captured automatically.
        </p>
      </div>

      {/* Scanned log — 5 rows visible, grows as scans happen */}
      <div className={`mx-4 mb-4 rounded-2xl border shadow-sm overflow-hidden shrink-0 ${t.card}`}>
        <div className={`px-4 py-2.5 border-b ${t.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold ${t.text}`}>Morning Round #3</span>
            <span className={`text-xs ${t.textMuted}`}>· {ROUND_START}</span>
          </div>
          <span className={`text-xs ${t.textXs}`}>{scannedCount}/{checkpoints.length}</span>
        </div>

        {scannedLog.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-6 gap-2`} style={{ height: ROW_H * VISIBLE }}>
            <svg viewBox="0 0 40 40" width="36" height="36" fill="none" className="opacity-20">
              <circle cx="20" cy="26" r="4" fill="currentColor" className={t.textMuted} />
              <path d="M12 20 a 10 10 0 0 1 16 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={t.textMuted} />
              <path d="M6 14 a 16 16 0 0 1 28 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" className={t.textMuted} />
            </svg>
            <p className={`text-xs ${t.textMuted}`}>No scans yet — tap the button to begin</p>
          </div>
        ) : (
          <div
            ref={listRef}
            className="overflow-y-auto"
            style={{ maxHeight: ROW_H * VISIBLE }}
          >
            {scannedLog.map((cp, i) => (
              <div
                key={cp.id}
                className={`flex items-center gap-3 px-4 border-b last:border-b-0 ${t.borderGray} ${i === 0 ? (cp.status === 'verified' ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10') : ''}`}
                style={{ height: ROW_H }}
              >
                {cp.status === 'verified'
                  ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  : <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${t.text}`}>{cp.location}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${zoneTag[cp.zone]}`}>{cp.zone}</span>
                    <span className={`text-xs font-mono ${t.textMuted}`}>{cp.uid}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cp.status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {cp.status}
                  </span>
                  <div className={`text-xs mt-0.5 ${t.textMuted}`}>{cp.scannedAt}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Dashboard Tab ──────────────────────────────────────── */
function DashboardTab({ checkpoints, onAlerts, alertCount }: { checkpoints: Checkpoint[]; onAlerts: () => void; alertCount: number }) {
  const t = useT();
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  const myCompletedForStats = COMPLETED_ROUNDS.filter(r => r.staff === EMPLOYEE.name);
  const activeScanned  = checkpoints.filter(c => c.status === 'verified').length;
  const activeMissed   = checkpoints.filter(c => c.status === 'error').length;
  const activeTotal    = checkpoints.length;
  const activeComp     = Math.round((activeScanned / activeTotal) * 100);
  const activeBarColor = activeComp >= 85 ? 'bg-green-500' : activeComp >= 70 ? 'bg-amber-500' : 'bg-orange-500';

  // All-employee round counts
  const allDoneRounds   = COMPLETED_ROUNDS.length;  // 5 completed by all staff
  const PLANNED_ROUNDS  = 9;                         // 3 employees × 3 rounds/day
  const allActiveRounds = 1;

  // My rounds
  const myRoundsDone    = myCompletedForStats.length;  // completed by this employee
  const myRoundsTotal   = myRoundsDone + 1;            // + the active round

  // Store overall compliance (weighted avg of all completed + active scans)
  const allScanned  = COMPLETED_ROUNDS.reduce((s, r) => s + r.scanned, 0) + activeScanned;
  const allTotal    = COMPLETED_ROUNDS.reduce((s, r) => s + r.total,   0) + activeTotal;
  const storeComp   = allTotal > 0 ? Math.round((allScanned / allTotal) * 100) : 0;

  // My compliance (weighted avg of my completed + active)
  const myScanned   = myCompletedForStats.reduce((s, r) => s + r.scanned, 0) + activeScanned;
  const myTotal     = myCompletedForStats.reduce((s, r) => s + r.total,   0) + activeTotal;
  const myComp      = myTotal > 0 ? Math.round((myScanned / myTotal) * 100) : 0;

  const pieData = [
    { name: 'Done',   value: myScanned || 1, color: '#f97316' },
    { name: 'Missed', value: Math.max(0, myTotal - myScanned), color: '#fed7aa' },
  ];

  // This employee's rounds only — active first, then completed newest-first
  const myCompletedForDash = COMPLETED_ROUNDS.filter(r => r.staff === EMPLOYEE.name);
  const allRounds = [
    {
      id: 'active',
      name: 'Morning Round #3',
      startTime: ROUND_START,
      endTime: ROUND_END,
      compliance: activeComp,
      scanned: activeScanned,
      total: activeTotal,
      staff: EMPLOYEE.name,
      isActive: true,
      checkpointItems: checkpoints.map(cp => ({
        id: cp.id, location: cp.location, zone: cp.zone, uid: cp.uid,
        status: cp.status === 'pending' || cp.status === 'scanning' ? 'pending' : cp.status,
        scannedAt: cp.scannedAt,
      })),
    },
    ...myCompletedForDash.slice().reverse().map(r => ({
      id: r.id,
      name: r.name,
      startTime: r.startTime,
      endTime: r.endTime,
      compliance: r.compliance,
      scanned: r.scanned,
      total: r.total,
      staff: r.staff,
      isActive: false,
      checkpointItems: CHECKPOINT_DEFS.slice(0, r.total).map((cp, i) => ({
        id: cp.id, location: cp.location, zone: cp.zone, uid: cp.uid,
        status: i < r.scanned ? 'verified' : 'missed',
        scannedAt: undefined as string | undefined,
      })),
    })),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <StoreHeader
        alertCount={alertCount}
        onAlerts={onAlerts}
        extraRight={
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${t.redLight}`}>
            <User className="w-3 h-3 text-orange-500" />
            <span className="text-xs text-orange-500 font-medium">{EMPLOYEE.name}</span>
          </div>
        }
      />
      <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
        <div className="px-4 pt-4 space-y-4">

          {/* Overall compliance summary */}
          <div className={`rounded-2xl p-4 border shadow-sm ${t.card}`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${t.textXs}`}>Today's Compliance</h3>
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <PieChart width={90} height={90}>
                  <Pie data={pieData} cx={40} cy={40} innerRadius={30} outerRadius={42} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold text-orange-500">{myComp}%</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  {
                    label: 'All rounds today',
                    val: `${allDoneRounds + allActiveRounds} / ${PLANNED_ROUNDS}`,
                    cls: t.text,
                    sub: 'done / planned',
                  },
                  {
                    label: 'My rounds',
                    val: `${myRoundsTotal}`,
                    cls: 'text-orange-500',
                    sub: `${myRoundsDone} done · 1 active`,
                  },
                  {
                    label: 'Store compliance',
                    val: `${storeComp}%`,
                    cls: storeComp >= 85 ? 'text-green-600' : storeComp >= 70 ? 'text-amber-500' : 'text-red-500',
                    sub: 'all staff today',
                  },
                  {
                    label: 'My compliance',
                    val: `${myComp}%`,
                    cls: myComp >= 85 ? 'text-green-600' : myComp >= 70 ? 'text-amber-500' : 'text-orange-500',
                    sub: 'my rounds today',
                  },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className={`text-xs ${t.textXs}`}>{s.label}</span>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${s.cls}`}>{s.val}</span>
                      <div className={`text-[10px] ${t.textMuted}`}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Round details — expandable, admin-style */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
            <div className={`px-4 py-3 border-b ${t.border} flex items-center gap-2`}>
              <Clock className="w-4 h-4 text-orange-500" />
              <h3 className={`font-semibold text-sm ${t.text}`}>Round Details</h3>
              <span className={`text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 ${t.textXs}`}>
                {allRounds.length} rounds · newest first
              </span>
            </div>

            <div className={`divide-y ${t.divide}`}>
              {allRounds.map(round => {
                const isOpen   = expandedRound === round.id;
                const compColor = round.compliance >= 85 ? 'text-green-600' : round.compliance >= 70 ? 'text-amber-500' : 'text-orange-500';
                const barColor  = round.compliance >= 85 ? 'bg-green-500'  : round.compliance >= 70 ? 'bg-amber-500'  : 'bg-orange-500';

                return (
                  <div key={round.id}>
                    <button
                      onClick={() => setExpandedRound(isOpen ? null : round.id)}
                      className={`w-full px-4 py-3.5 text-left flex items-start justify-between gap-3 ${t.hoverRow} transition-colors`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-sm font-semibold ${t.text}`}>{round.name}</span>
                          {round.isActive && (
                            <span className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${t.textMuted} mb-0.5`}>
                          {round.staff}
                        </div>
                        <div className={`text-xs ${t.textMuted} mb-1.5`}>
                          {round.startTime} → {round.isActive ? `${round.endTime} (expected)` : round.endTime}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${round.compliance}%` }} />
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${compColor}`}>
                            {round.compliance}% · {round.scanned}/{round.total}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${t.textMuted} transition-transform shrink-0 mt-1 ${isOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className={`border-t ${t.border} bg-gray-50 dark:bg-gray-800/50 max-h-64 overflow-y-auto`}>
                        {round.checkpointItems.map((cp, i) => (
                          <div key={cp.id} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 ${t.borderGray}`}>
                            {cp.status === 'verified'
                              ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              : cp.status === 'missed'
                              ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                              : <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                            }
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-medium ${t.text} truncate`}>{cp.location}</div>
                              <div className={`text-xs ${t.textMuted}`}>{cp.zone}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${
                                cp.status === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                cp.status === 'missed'   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>{cp.status}</span>
                              {cp.scannedAt && <div className={`text-xs mt-0.5 ${t.textMuted}`}>{cp.scannedAt}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Home Tab ───────────────────────────────────────────── */
function HomeTab({ checkpoints, onAlerts, alertCount }: { checkpoints: Checkpoint[]; onAlerts: () => void; alertCount: number }) {
  const t = useT();
  const [editingShift, setEditingShift] = useState(false);
  const [shiftStart, setShiftStart]     = useState('06:00');
  const [shiftEnd, setShiftEnd]         = useState('14:00');

  const currentScanned = checkpoints.filter(c => c.status === 'verified').length;
  const myRounds       = COMPLETED_ROUNDS.filter(r => r.staff === EMPLOYEE.name);
  const totalToday     = myRounds.reduce((s, r) => s + r.scanned, 0) + currentScanned;
  const avgCompliance  = Math.round(WEEKLY_TREND.reduce((s, d) => s + d.compliance, 0) / WEEKLY_TREND.length);

  // Format 24h "HH:MM" → "HH:MM AM/PM"
  const fmt24 = (v: string) => {
    const [h, m] = v.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const shiftLabel = `${fmt24(shiftStart)} – ${fmt24(shiftEnd)}`;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <StoreHeader alertCount={alertCount} onAlerts={onAlerts} />
      <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
        <div className="px-4 pt-4 space-y-4">

          {/* Employee Profile */}
          <div className={`rounded-2xl p-4 border shadow-sm ${t.card}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-white">
                  {EMPLOYEE.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-bold ${t.text}`}>{EMPLOYEE.name}</div>
                {/* "Senior" removed */}
                <div className="text-xs text-orange-500 font-medium">Cleaner</div>
                <div className={`text-xs mt-0.5 ${t.textMuted}`}>ID: {EMPLOYEE.id}</div>
              </div>
              {/* Shift — editable */}
              <div className="text-right shrink-0">
                <div className={`text-xs ${t.textMuted} mb-0.5`}>Shift</div>
                {editingShift ? (
                  <div className="flex flex-col gap-1 items-end">
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={shiftStart}
                        onChange={e => setShiftStart(e.target.value)}
                        className={`w-24 text-xs px-2 py-1 border rounded-lg focus:outline-none focus:border-orange-400 ${t.input}`}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={shiftEnd}
                        onChange={e => setShiftEnd(e.target.value)}
                        className={`w-24 text-xs px-2 py-1 border rounded-lg focus:outline-none focus:border-orange-400 ${t.input}`}
                      />
                    </div>
                    <button
                      onClick={() => setEditingShift(false)}
                      className="text-xs bg-orange-500 text-white px-2.5 py-1 rounded-lg mt-0.5 hover:bg-orange-600 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className={`text-xs font-medium ${t.textSm}`}>{fmt24(shiftStart)}</div>
                    <div className={`text-xs ${t.textXs}`}>– {fmt24(shiftEnd)}</div>
                    <button
                      onClick={() => setEditingShift(true)}
                      className="text-xs text-orange-500 mt-1 hover:underline"
                    >
                      Edit shift
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className={`grid grid-cols-3 gap-2 mt-4 pt-4 border-t ${t.borderGray}`}>
              {[['Store', STORE.number], ['Since', EMPLOYEE.joined], ['Avg Score', `${avgCompliance}%`]].map(([k, v], i) => (
                <div key={k} className={`text-center ${i === 1 ? `border-x ${t.borderGray}` : ''}`}>
                  <div className={`text-xs ${t.textMuted}`}>{k}</div>
                  <div className={`text-xs font-semibold ${k === 'Avg Score' ? 'text-green-600' : t.textSm}`}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Analysis */}
          <div className={`rounded-2xl p-4 border shadow-sm ${t.card}`}>
            <h3 className={`text-sm font-semibold mb-3 ${t.text}`}>Performance Analysis</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {(() => {
                const myR  = COMPLETED_ROUNDS.filter(r => r.staff === EMPLOYEE.name);
                const mySc = myR.reduce((s, r) => s + r.scanned, 0);
                const myTt = myR.reduce((s, r) => s + r.total, 0);
                const todayComp = myTt > 0 ? Math.round((mySc / myTt) * 100) : 0;
                return [
                  { icon: <Award className="w-4 h-4 text-yellow-500" />,     label: 'Weekly Avg',       val: `${avgCompliance}%`,    sub: 'compliance', bg: 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20' },
                  { icon: <TrendingUp className="w-4 h-4 text-green-500" />, label: 'Total Scans',      val: totalToday.toString(),  sub: 'today',      bg: 'bg-green-50 border-green-100 dark:bg-green-900/20' },
                  { icon: <TrendingUp className="w-4 h-4 text-orange-500" />,label: "Today's Compliance", val: `${todayComp}%`,      sub: 'completed rounds', bg: t.redLight },
                  { icon: <Calendar className="w-4 h-4 text-blue-500" />,    label: 'Days Active',      val: '156',                  sub: 'this year',  bg: 'bg-blue-50 border-blue-100 dark:bg-blue-900/20' },
                ];
              })().map(m => (
                <div key={m.label} className={`rounded-xl p-3 border ${m.bg}`}>
                  <div className="flex items-center gap-1.5 mb-1">{m.icon}<span className={`text-xs ${t.textXs}`}>{m.label}</span></div>
                  <div className={`font-bold ${t.text}`}>{m.val}</div>
                  <div className={`text-xs ${t.textMuted}`}>{m.sub}</div>
                </div>
              ))}
            </div>
            <div className={`text-xs font-medium mb-2 ${t.textSm}`}>This Week's Compliance</div>
            <ResponsiveContainer width="100%" height={75}>
              <LineChart data={WEEKLY_TREND} margin={{ top: 0, right: 5, left: -35, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ background: t.isDark ? '#1f2937' : '#fff', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 10 }} />
                <Line type="monotone" dataKey="compliance" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Main CleanerApp ────────────────────────────────────── */
export function CleanerApp({ user, onLogout }: { user: AppUser; onLogout: () => void }) {
  const { isDark, toggle } = useTheme();
  const t = useT();
  const [activeTab, setActiveTab]   = useState<TabType>('scan');
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(
    CHECKPOINT_DEFS.map(c => ({ ...c, status: 'pending' as CheckpointStatus }))
  );
  const [scanStatus, setScanStatus]     = useState<ScanStatus>('idle');
  const [alertsOpen, setAlertsOpen]     = useState(false);
  // Track consecutive errors per checkpoint uid — 5 in a row → tag marked faulty
  const [consecErrors, setConsecErrors] = useState<Record<string, number>>({});
  const [faultyTags, setFaultyTags]     = useState<Set<string>>(new Set());

  const handleScan = () => {
    const nextCp = checkpoints.find(c => c.status === 'pending');
    if (!nextCp || scanStatus === 'scanning') return;
    setScanStatus('scanning');
    setCheckpoints(prev => prev.map(c => c.id === nextCp.id ? { ...c, status: 'scanning' } : c));
    setTimeout(() => {
      const isError = Math.random() < 0.07;
      const newStatus: CheckpointStatus = isError ? 'error' : 'verified';
      setScanStatus(isError ? 'error' : 'verified');
      setCheckpoints(prev => prev.map(c => c.id === nextCp.id ? { ...c, status: newStatus, scannedAt: now() } : c));

      // Consecutive error tracking per tag uid
      if (isError) {
        setConsecErrors(prev => {
          const next = { ...prev, [nextCp.uid]: (prev[nextCp.uid] ?? 0) + 1 };
          if (next[nextCp.uid] >= 5) {
            setFaultyTags(ft => new Set([...ft, nextCp.uid]));
          }
          return next;
        });
      } else {
        setConsecErrors(prev => ({ ...prev, [nextCp.uid]: 0 }));
      }

      setTimeout(() => setScanStatus('idle'), 1500);
    }, 1600);
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden ${t.surface}`}>
      {/* App Header — white with green shield, matching screenshot */}
      <div className={`px-4 pt-10 pb-3 flex items-center justify-between shrink-0 border-b ${t.header}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className={`font-semibold text-sm ${t.text}`}>CleanCheck</div>
            <div className={`text-xs ${t.textXs}`}>NFC Compliance</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">ONLINE</span>
          </div>
          <button
            onClick={toggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${t.badge} hover:opacity-80 transition-opacity`}
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-500" />}
          </button>
          <button
            onClick={onLogout}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${t.badge} hover:opacity-80 transition-opacity`}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'scan'      && <ScanTab checkpoints={checkpoints} scanStatus={scanStatus} onScan={handleScan} onAlerts={() => setAlertsOpen(true)} alertCount={ALERTS_DATA.length} />}
        {activeTab === 'dashboard' && <DashboardTab checkpoints={checkpoints} onAlerts={() => setAlertsOpen(true)} alertCount={ALERTS_DATA.length} />}
        {activeTab === 'home'      && <HomeTab checkpoints={checkpoints} onAlerts={() => setAlertsOpen(true)} alertCount={ALERTS_DATA.length} />}
      </div>

      {/* Bottom Tab Bar */}
      <div className={`flex shrink-0 border-t ${t.tabBar}`}>
        {[
          { id: 'scan'      as const, label: 'Scan',      Icon: Scan },
          { id: 'dashboard' as const, label: 'Dashboard', Icon: LayoutDashboard },
          { id: 'home'      as const, label: 'Home',      Icon: Home },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
              activeTab === id ? 'text-orange-500' : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {alertsOpen && <AlertsPanel onClose={() => setAlertsOpen(false)} />}
    </div>
  );
}
