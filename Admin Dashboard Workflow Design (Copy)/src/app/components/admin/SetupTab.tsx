import { useState } from 'react';
import {
  ChevronLeft, MapPin, Cpu, Tag, CheckCircle, FileText,
  ToggleLeft, ToggleRight, ChevronDown, RefreshCw,
  ChevronRight, AlertTriangle, Trash2, PowerOff, RotateCcw,
  Users, UserPlus, Eye, EyeOff,
} from 'lucide-react';
import { stores, type NFCTag } from '../../mockData';
import { ReportModal } from '../shared/ReportModal';
import { useT } from '../../ThemeContext';

interface Props {
  navigate: (view: string, params?: Record<string, unknown>) => void;
  goBack?: () => void;
  subView?: string;
  subParams?: Record<string, unknown>;
}

// ─── Tag Registration ─────────────────────────────────────────────────────────

function TagRegistrationView({ goBack, navigate }: { goBack: () => void; navigate: (v: string, p?: Record<string, unknown>) => void }) {
  const t = useT();
  const [storeId, setStoreId]           = useState(stores[0].id);
  const [scanning, setScanning]         = useState(false);
  const [scanned, setScanned]           = useState(false);
  const [locationName, setLocationName] = useState('');

  const startScan = () => {
    setScanning(true);
    setTimeout(() => { setScanning(false); setScanned(true); }, 2000);
  };

  const canSubmit = scanned && locationName.trim() && storeId;

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-3 ${t.header}`}>
        <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}>
          <ChevronLeft className="w-5 h-5 text-orange-500" />
        </button>
        <div>
          <h2 className={`font-semibold text-sm ${t.text}`}>NFC Tag Registration</h2>
          <p className={`text-xs ${t.textXs}`}>Scan a tag and assign it to a store location</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Store */}
        <div className={`rounded-2xl p-4 border shadow-sm ${t.card}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${t.textXs}`}>Select Store</h3>
          <div className="relative">
            <select value={storeId} onChange={e => setStoreId(e.target.value)}
              className={`w-full appearance-none px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 pr-10 ${t.input}`}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name} {s.storeNumber}</option>)}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${t.textXs}`} />
          </div>
          {storeId && <p className={`text-xs mt-2 ${t.textMuted}`}>{stores.find(s => s.id === storeId)?.location}</p>}
        </div>

        {/* Step 1: Scan */}
        <div className={`rounded-2xl p-4 border shadow-sm ${t.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${scanned ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>1</div>
            <h3 className={`text-sm font-semibold ${t.text}`}>Scan NFC Tag</h3>
            {scanned && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full ml-auto">DETECTED</span>}
          </div>
          <div className={`border-2 border-dashed rounded-xl p-6 text-center mb-3 ${scanned ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-orange-200 bg-orange-50 dark:bg-orange-900/20'}`}>
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center mx-auto mb-3 ${scanned ? 'border-green-400 bg-green-100' : 'border-orange-300 bg-white dark:bg-gray-700'}`}>
              <Cpu className={`w-8 h-8 ${scanned ? 'text-green-500' : 'text-orange-400'}`} />
            </div>
            {scanned ? (
              <>
                <p className="text-sm font-medium text-green-700">Tag Detected!</p>
                <p className={`text-xs mt-1 font-mono ${t.textXs}`}>04:A3:7F:2B:C1:88</p>
                <p className={`text-xs mt-0.5 ${t.textMuted}`}>304 bytes · NFC Type 2</p>
              </>
            ) : scanning ? (
              <p className={`text-sm animate-pulse ${t.textSm}`}>Listening for NFC tag...</p>
            ) : (
              <>
                <p className={`text-sm ${t.textSm}`}>Ready to Scan</p>
                <p className={`text-xs mt-0.5 ${t.textMuted}`}>Hold phone near NFC tag</p>
              </>
            )}
          </div>
          {!scanned && (
            <button onClick={startScan} disabled={scanning}
              className="w-full py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-orange-600 transition-colors">
              {scanning ? 'Scanning...' : 'Start Scanning'}
            </button>
          )}
        </div>

        {/* Step 2: GPS */}
        <div className={`rounded-2xl p-4 border shadow-sm transition-opacity ${scanned ? 'opacity-100' : 'opacity-40'} ${t.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${scanned ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-500'}`}>2</div>
            <h3 className={`text-sm font-semibold ${t.text}`}>GPS Anchor</h3>
            {scanned && <span className="text-xs text-green-600 ml-auto">● Anchored</span>}
          </div>
          <div className={`rounded-xl p-3 text-center ${scanned ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800' : `${t.surface} border ${t.borderGray}`}`}>
            <MapPin className={`w-5 h-5 mx-auto mb-1 ${scanned ? 'text-orange-500' : 'text-gray-300'}`} />
            <p className={`text-xs ${scanned ? 'text-green-600 font-medium' : t.textMuted}`}>
              {scanned ? '51.5074°N, 0.1278°W · 15m tolerance' : 'Awaiting tag scan...'}
            </p>
          </div>
        </div>

        {/* Step 3: Location Name */}
        <div className={`rounded-2xl p-4 border shadow-sm transition-opacity ${scanned ? 'opacity-100' : 'opacity-40'} ${t.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${scanned ? 'bg-orange-500 text-white' : 'bg-gray-300 text-gray-500'}`}>3</div>
            <h3 className={`text-sm font-semibold ${t.text}`}>Location Name</h3>
          </div>
          <label className={`block text-xs mb-1 ${t.textXs}`}>Location Name *</label>
          <input value={locationName} onChange={e => setLocationName(e.target.value)}
            placeholder="e.g. Produce Section" disabled={!scanned}
            className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-50 ${t.input}`} />
        </div>

        <button onClick={() => navigate('registration-review', { uid: '04:A3:7F:2B:C1:88', locationName, storeId })}
          disabled={!canSubmit}
          className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
          <Tag className="w-4 h-4" /> Register & Assign Tag
        </button>
        {!scanned && <p className={`text-xs text-center ${t.textMuted}`}>Scan an NFC tag above to enable registration</p>}
        {scanned && !locationName && <p className="text-xs text-center text-amber-500">Enter a location name to continue</p>}
      </div>
    </div>
  );
}

// ─── Registration Review ──────────────────────────────────────────────────────

function RegistrationReviewView({ params, goBack }: { params: Record<string, unknown>; goBack: () => void }) {
  const t = useT();
  const [deployed, setDeployed] = useState(false);
  const store = stores.find(s => s.id === params.storeId);

  if (deployed) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center px-6 text-center ${t.page}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h2 className={`text-xl font-bold mb-1 ${t.text}`}>Tag Deployed!</h2>
        <p className={`text-sm mb-1 ${t.textXs}`}>NFC-013 is now active at</p>
        <p className="text-sm font-medium text-orange-500 mb-6">{params.locationName as string || 'Location'}</p>
        <button onClick={goBack} className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600">Back to Setup</button>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-3 ${t.header}`}>
        <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}><ChevronLeft className="w-5 h-5 text-orange-500" /></button>
        <div>
          <h2 className={`font-semibold text-sm ${t.text}`}>Registration Review</h2>
          <p className={`text-xs ${t.textXs}`}>Confirm all details before finalising</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">SETUP COMPLETE — Ready to Deploy</p>
          <div className="flex gap-2 flex-wrap">
            {['TAG REGISTERED', 'LOCATION ASSIGNED', 'GPS ANCHORED'].map(s => (
              <span key={s} className="flex items-center gap-1 text-xs bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-700">
                <CheckCircle className="w-3 h-3" /> {s}
              </span>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border shadow-sm p-4 space-y-3 ${t.card}`}>
          <h4 className={`text-sm font-semibold ${t.text}`}>NFC Tag Details</h4>
          {[['UID', '04:A3:7F:2B:C1:88'], ['Memory', '304 bytes'], ['Registered by', 'Admin User'], ['Registered', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className={t.textXs}>{k}</span>
              <span className={`font-mono text-xs ${t.text}`}>{v}</span>
            </div>
          ))}
        </div>

        <div className={`rounded-2xl border shadow-sm p-4 space-y-3 ${t.card}`}>
          <h4 className={`text-sm font-semibold ${t.text}`}>Assigned Location</h4>
          <div className="flex justify-between text-sm">
            <span className={t.textXs}>Checkpoint No.</span>
            <span className={`font-medium text-orange-500`}>#{(store ? store.tags.length + 1 : 1).toString().padStart(3, '0')}</span>
          </div>
          <div className="flex justify-between text-sm"><span className={t.textXs}>Name</span><span className={`font-medium ${t.text}`}>{params.locationName as string || '—'}</span></div>
          <div className="flex justify-between text-sm"><span className={t.textXs}>Store</span><span className={t.text}>{store ? `${store.name} ${store.storeNumber}` : '—'}</span></div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <span className="font-semibold">GPS Fraud Prevention Active</span> — Staff must physically be within 15 metres of this anchor point.
          </p>
        </div>

        <button onClick={() => setDeployed(true)}
          className="w-full py-3.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" /> Complete Setup & Deploy
        </button>
        <button onClick={goBack} className={`w-full py-3 border rounded-xl text-sm ${t.borderGray} ${t.textSm}`}>
          Cancel Registration
        </button>
      </div>
    </div>
  );
}

// ─── Round Setup ──────────────────────────────────────────────────────────────

function RoundSetupView({ goBack, storeId }: { goBack: () => void; storeId?: string }) {
  const t = useT();
  const [selectedStoreId, setSelectedStoreId] = useState(storeId || stores[0].id);
  const [numRounds, setNumRounds]             = useState(3);
  const [roundDuration, setRoundDuration]     = useState(90);
  const [dupWindow, setDupWindow]             = useState(30);
  const [saved, setSaved]                     = useState(false);
  const [customDuration, setCustomDuration]   = useState('');
  const [showCustom, setShowCustom]           = useState(false);

  const durationOptions = [60, 90, 120];
  const dupOptions      = [15, 30, 45, 60];

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const handleDurationSelect = (val: number | 'custom') => {
    if (val === 'custom') { setShowCustom(true); }
    else { setShowCustom(false); setRoundDuration(val); }
  };

  const applyCustom = () => {
    const v = parseInt(customDuration);
    if (!isNaN(v) && v >= 10 && v <= 360) { setRoundDuration(v); setShowCustom(false); }
  };

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-3 ${t.header}`}>
        <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}>
          <ChevronLeft className="w-5 h-5 text-orange-500" />
        </button>
        <div>
          <h2 className={`font-semibold text-sm ${t.text}`}>Round Setup</h2>
          <p className={`text-xs ${t.textXs}`}>Configure cleaning round parameters per store</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="relative">
          <select value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}
            className={`w-full appearance-none px-4 py-3 border-2 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-400 pr-10 ${t.input}`}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} {s.storeNumber}</option>)}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${t.textXs}`} />
        </div>

        {/* Number of rounds */}
        <div className={`rounded-2xl border shadow-sm p-4 ${t.card}`}>
          <h3 className={`text-sm font-semibold mb-0.5 ${t.text}`}>Number of Rounds</h3>
          <p className={`text-xs mb-4 ${t.textXs}`}>Total cleaning rounds per shift per day</p>
          <div className="flex items-center gap-3">
            <input type="number" min={1} max={99} value={numRounds}
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setNumRounds(Math.min(99, v)); }}
              className={`w-28 px-4 py-3 border-2 rounded-xl text-2xl font-bold text-center focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-orange-500 ${t.input}`} />
            <span className={`text-sm ${t.textSm}`}>{numRounds === 1 ? 'round per shift' : 'rounds per shift'}</span>
          </div>
          <p className={`mt-2 text-xs ${t.textMuted}`}>Enter any number between 1 and 99</p>
        </div>

        {/* Round duration */}
        <div className={`rounded-2xl border shadow-sm p-4 ${t.card}`}>
          <h3 className={`text-sm font-semibold mb-0.5 ${t.text}`}>Round Duration</h3>
          <p className={`text-xs mb-4 ${t.textXs}`}>Maximum time allowed to complete one round (minutes)</p>
          <div className="grid grid-cols-4 gap-2">
            {durationOptions.map(d => (
              <button key={d} onClick={() => handleDurationSelect(d)}
                className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${roundDuration === d && !showCustom ? 'bg-orange-500 text-white border-orange-500' : `${t.input} border-gray-200 dark:border-gray-600 hover:border-orange-300`}`}>{d}m</button>
            ))}
            <button onClick={() => handleDurationSelect('custom')}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${showCustom ? 'bg-orange-500 text-white border-orange-500' : `${t.input} border-gray-200 dark:border-gray-600 hover:border-orange-300`}`}>Custom</button>
          </div>
          {showCustom && (
            <div className="mt-3 flex gap-2">
              <input type="number" min={10} max={360} value={customDuration} onChange={e => setCustomDuration(e.target.value)} placeholder="e.g. 75"
                className={`flex-1 px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${t.input}`} />
              <button onClick={applyCustom} className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">Apply</button>
            </div>
          )}
          {!showCustom && (
            <div className={`mt-3 flex items-center gap-1.5 text-xs ${t.textMuted}`}>
              <RefreshCw className="w-3.5 h-3.5" />
              Current: <span className={`font-semibold ${t.textSm}`}>{roundDuration} min/round</span>
              <span>·</span>
              <span>{numRounds} rounds = {numRounds * roundDuration} min/day</span>
            </div>
          )}
        </div>

        {/* Duplicate window */}
        <div className={`rounded-2xl border shadow-sm p-4 ${t.card}`}>
          <h3 className={`text-sm font-semibold mb-0.5 ${t.text}`}>Duplicate Scan Window</h3>
          <p className={`text-xs mb-4 ${t.textXs}`}>Flag a scan as duplicate if same checkpoint scanned within this window</p>
          <div className="grid grid-cols-4 gap-2">
            {dupOptions.map(d => (
              <button key={d} onClick={() => setDupWindow(d)}
                className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${dupWindow === d ? 'bg-orange-500 text-white border-orange-500' : `${t.input} border-gray-200 dark:border-gray-600 hover:border-orange-300`}`}>{d}m</button>
            ))}
          </div>
          <div className={`mt-3 text-xs ${t.textMuted}`}>
            Scans within <span className={`font-semibold ${t.textSm}`}>{dupWindow} minutes</span> will trigger a duplicate alert.
          </div>
        </div>

        {/* Summary */}
        <div className={`rounded-2xl border shadow-sm p-4 ${t.card}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${t.textXs}`}>Configuration Summary</h3>
          {[
            { label: 'Store',              value: stores.find(s => s.id === selectedStoreId)?.name ?? '—' },
            { label: 'Rounds per shift',   value: `${numRounds} rounds` },
            { label: 'Round duration',     value: `${roundDuration} min` },
            { label: 'Duplicate window',   value: `${dupWindow} min` },
            { label: 'Maximum shift time', value: `${numRounds * roundDuration} min (${Math.round(numRounds * roundDuration / 60 * 10) / 10} hrs)` },
          ].map((row, i) => (
            <div key={row.label} className={`flex items-center justify-between py-2 ${i > 0 ? `border-t ${t.borderGray}` : ''}`}>
              <span className={`text-xs ${t.textMuted}`}>{row.label}</span>
              <span className={`text-xs font-semibold ${t.text}`}>{row.value}</span>
            </div>
          ))}
        </div>

        <button onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${saved ? 'bg-green-500 text-white' : 'bg-orange-500 text-white hover:bg-orange-600'}`}>
          {saved ? <><CheckCircle className="w-4 h-4" /> Settings Saved!</> : 'Save Round Settings'}
        </button>
      </div>
    </div>
  );
}

// ─── NFC Registry view ───────────────────────────────────────────────────────

function NfcRegistryView({ goBack, storeId }: { goBack: () => void; storeId?: string }) {
  const t = useT();
  const [selectedStoreId, setSelectedStoreId] = useState(storeId || stores[0].id);
  const store = stores.find(s => s.id === selectedStoreId)!;

  const [tagOverrides, setTagOverrides]   = useState<Record<string, NFCTag['status'] | 'deleted'>>({});
  const [expandedTagId, setExpandedTagId] = useState<string | null>(null);

  const effectiveStatus = (tag: NFCTag): NFCTag['status'] | 'deleted' => tagOverrides[tag.id] ?? tag.status;
  const visibleTags = store.tags.filter(t => effectiveStatus(t) !== 'deleted');
  const activeTags  = visibleTags.filter(t => effectiveStatus(t) === 'active').length;
  const errorTags   = visibleTags.filter(t => effectiveStatus(t) === 'error').length;

  const resetTag      = (id: string) => setTagOverrides(p => ({ ...p, [id]: 'active' }));
  const deactivateTag = (id: string) => { setTagOverrides(p => ({ ...p, [id]: 'deactivated' })); setExpandedTagId(null); };
  const deleteTag     = (id: string) => { setTagOverrides(p => ({ ...p, [id]: 'deleted' })); setExpandedTagId(null); };
  const resetAll      = () => { const o: Record<string, 'deactivated'> = {}; store.tags.forEach(tag => { o[tag.id] = 'deactivated'; }); setTagOverrides(o); setExpandedTagId(null); };

  const statusCls: Record<string, string> = {
    active:      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    error:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    warning:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    deactivated: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  };

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-3 ${t.header}`}>
        <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}>
          <ChevronLeft className="w-5 h-5 text-orange-500" />
        </button>
        <div>
          <h2 className={`font-semibold text-sm ${t.text}`}>NFC Tag Registry</h2>
          <p className={`text-xs ${t.textXs}`}>Manage tags for selected store</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Store picker */}
        <div className="relative">
          <select value={selectedStoreId} onChange={e => { setSelectedStoreId(e.target.value); setExpandedTagId(null); }}
            className={`w-full appearance-none px-4 py-3 border-2 rounded-xl text-sm font-medium focus:outline-none focus:border-orange-400 pr-10 ${t.input}`}>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name} {s.storeNumber}</option>)}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${t.textXs}`} />
        </div>

        <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
          <div className={`px-4 py-3 border-b ${t.border} flex items-center justify-between`}>
            <div>
              <h3 className={`font-semibold text-sm ${t.text}`}>Tags</h3>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">{activeTags} active</span>
                {errorTags > 0 && <span className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">{errorTags} error</span>}
              </div>
            </div>
            <button onClick={resetAll} className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 dark:border-gray-600 px-2.5 py-1.5 rounded-lg hover:border-orange-300 hover:text-orange-500 transition-colors">
              <PowerOff className="w-3.5 h-3.5" /> Reset All
            </button>
          </div>

          <div className={`divide-y ${t.divide}`}>
            {visibleTags.map(tag => {
              const status  = effectiveStatus(tag) as string;
              const isOpen  = expandedTagId === tag.id;
              const isError = status === 'error';
              const isDeact = status === 'deactivated';
              return (
                <div key={tag.id}>
                  <button onClick={() => setExpandedTagId(isOpen ? null : tag.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${t.hoverRow} ${isDeact ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isError ? 'bg-red-100 dark:bg-red-900/30' : t.redLight}`}>
                        <Cpu className={`w-4 h-4 ${isError ? 'text-red-500' : 'text-orange-500'}`} />
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${t.text}`}>{tag.location}</div>
                        <div className={`text-xs font-mono ${t.textMuted}`}>{tag.uid.substring(0, 11)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isError && (
                        <button onClick={e => { e.stopPropagation(); resetTag(tag.id); }}
                          className="text-xs text-orange-500 border border-orange-300 px-2 py-0.5 rounded-full hover:bg-orange-50 transition-colors">
                          Reset
                        </button>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls[status] ?? statusCls.active}`}>{status}</span>
                      <ChevronRight className={`w-4 h-4 ${t.textMuted} transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className={`border-t ${t.border} px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-800/40`}>
                      <div className={`rounded-xl border ${t.borderGray} overflow-hidden`}>
                        {[
                          ['Full UID', tag.uid], ['Zone', tag.zone], ['Area', tag.area], ['Floor', tag.floor],
                          ['Priority', tag.priority.charAt(0).toUpperCase() + tag.priority.slice(1)],
                          ['Last Scanned', tag.lastScanned ?? '—'], ['Registered', tag.registeredAt ?? '—'],
                          ...(tag.notes ? [['Notes', tag.notes]] : []),
                        ].map(([k, v], i, arr) => (
                          <div key={k} className={`flex items-start justify-between px-3 py-2 ${i < arr.length - 1 ? `border-b ${t.borderGray}` : ''}`}>
                            <span className={`text-xs ${t.textMuted} shrink-0 mr-4`}>{k}</span>
                            <span className={`text-xs font-medium text-right ${t.text} ${k === 'Full UID' ? 'font-mono' : ''}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                      {isError && (
                        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-700 dark:text-red-300">This tag has 5 consecutive scan errors. Reset to restore active status.</p>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => { resetTag(tag.id); setExpandedTagId(null); }}
                          disabled={status === 'active'}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${status === 'active' ? `${t.borderGray} ${t.textMuted} opacity-40 cursor-not-allowed` : 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                          <RotateCcw className="w-4 h-4" /><span className="text-xs font-medium">Reset</span>
                        </button>
                        <button onClick={() => deactivateTag(tag.id)}
                          disabled={isDeact}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${isDeact ? `${t.borderGray} ${t.textMuted} opacity-40 cursor-not-allowed` : 'border-amber-300 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'}`}>
                          <PowerOff className="w-4 h-4" /><span className="text-xs font-medium">Deactivate</span>
                        </button>
                        <button onClick={() => deleteTag(tag.id)}
                          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                          <Trash2 className="w-4 h-4" /><span className="text-xs font-medium">Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User Creation view ───────────────────────────────────────────────────────

interface AppUser { id: string; name: string; username: string; role: 'admin' | 'cleaner'; storeId?: string; joined: string; }

const INITIAL_USERS: AppUser[] = [
  { id: 'admin-1',   name: 'Admin User',   username: 'admin', role: 'admin',   joined: 'Jan 2024' },
  { id: 'cleaner-1', name: 'Maria Santos', username: 'maria', role: 'cleaner', storeId: 'store-042', joined: 'Mar 2022' },
  { id: 'cleaner-2', name: 'James Okafor', username: 'james', role: 'cleaner', storeId: 'store-042', joined: 'Jun 2023' },
  { id: 'cleaner-3', name: 'Tom Lee',      username: 'tom',   role: 'cleaner', storeId: 'store-018', joined: 'Sep 2023' },
  { id: 'cleaner-4', name: 'Sara Thompson',username: 'sara',  role: 'cleaner', storeId: 'store-018', joined: 'Feb 2022' },
  { id: 'cleaner-5', name: 'Ana Rivera',   username: 'ana',   role: 'cleaner', storeId: 'store-031', joined: 'Nov 2023' },
];

function UserCreationView({ goBack }: { goBack: () => void }) {
  const t = useT();
  const [users, setUsers]           = useState<AppUser[]>(INITIAL_USERS);
  const [showAdd, setShowAdd]       = useState(false);
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  // Add user form state
  const [newName, setNewName]       = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [newStore, setNewStore]     = useState(stores[0].id);

  const canAdd = newName.trim() && newUsername.trim() && newPassword.trim();

  const addUser = () => {
    if (!canAdd) return;
    setUsers(prev => [...prev, {
      id: `user-${Date.now()}`, name: newName.trim(), username: newUsername.trim(),
      role: 'cleaner' as const, storeId: newStore,
      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    }]);
    setNewName(''); setNewUsername(''); setNewPassword(''); setShowAdd(false);
  };

  const cleaners = users.filter(u => u.role === 'cleaner');

  const storeName = (sid?: string) => {
    if (!sid) return '—';
    const s = stores.find(s => s.id === sid);
    return s ? `${s.name} ${s.storeNumber}` : '—';
  };

  const cleanerCls = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center gap-3 ${t.header}`}>
        <button onClick={goBack} className={`p-1.5 rounded-full ${t.hoverRow}`}>
          <ChevronLeft className="w-5 h-5 text-orange-500" />
        </button>
        <div>
          <h2 className={`font-semibold text-sm ${t.text}`}>User Management</h2>
          <p className={`text-xs ${t.textXs}`}>{users.length} users · {cleaners.length} cleaners</p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Add User button */}
        <button
          onClick={() => setShowAdd(v => !v)}
          className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border-2 transition-all ${showAdd ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' : `border-transparent ${t.card} ${t.hoverRow}`}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className={`text-sm font-semibold ${t.text}`}>Add New User</div>
              <div className={`text-xs ${t.textXs}`}>Add a cleaner to a store</div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-orange-400 transition-transform ${showAdd ? 'rotate-180' : ''}`} />
        </button>

        {/* Add User form */}
        {showAdd && (
          <div className={`rounded-2xl border shadow-sm p-4 space-y-3 ${t.card}`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${t.textXs}`}>New User Details</h3>
            <div>
              <label className={`block text-xs mb-1 ${t.textXs}`}>Full Name *</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. John Smith"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${t.input}`} />
            </div>
            <div>
              <label className={`block text-xs mb-1 ${t.textXs}`}>Username *</label>
              <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. john"
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${t.input}`} />
            </div>
            <div>
              <label className={`block text-xs mb-1 ${t.textXs}`}>Password *</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Set a password"
                  className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 pr-10 ${t.input}`} />
                <button onClick={() => setShowPass(v => !v)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted}`}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className={`block text-xs mb-1 ${t.textXs}`}>Assigned Store</label>
              <div className="relative">
                <select value={newStore} onChange={e => setNewStore(e.target.value)}
                  className={`w-full appearance-none px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-orange-400 pr-8 ${t.input}`}>
                  {stores.map(s => <option key={s.id} value={s.id}>{s.name} {s.storeNumber}</option>)}
                </select>
                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none ${t.textXs}`} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowAdd(false)} className={`flex-1 py-2.5 border rounded-xl text-sm ${t.borderGray} ${t.textSm}`}>Cancel</button>
              <button onClick={addUser} disabled={!canAdd}
                className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-orange-600 transition-colors">
                Create User
              </button>
            </div>
          </div>
        )}

        {/* Cleaners list */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
          <div className={`px-4 py-3 border-b ${t.border} flex items-center gap-2`}>
            <Users className="w-4 h-4 text-orange-500" />
            <h3 className={`font-semibold text-sm ${t.text}`}>Cleaners</h3>
            <span className={`text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 ${t.textXs}`}>{cleaners.length}</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {cleaners.length === 0 ? (
              <div className={`px-4 py-8 text-center text-xs ${t.textMuted}`}>No cleaners yet</div>
            ) : (
              <div className={`divide-y ${t.divide}`}>
                {cleaners.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">{u.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${t.text}`}>{u.name}</div>
                      <div className={`text-xs ${t.textMuted}`}>@{u.username} · {storeName(u.storeId)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cleanerCls}`}>Cleaner</span>
                      <div className={`text-xs mt-0.5 ${t.textMuted}`}>Since {u.joined}</div>
                    </div>
                    <button onClick={() => setDeleteId(u.id)} className={`p-1.5 rounded-lg ${t.hoverRow} ${t.textMuted} hover:text-red-500 transition-colors`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="absolute inset-0 bg-black/40 z-40 flex items-center justify-center px-6">
          <div className={`rounded-2xl p-5 w-full ${t.cardFlat}`}>
            <h3 className={`font-semibold mb-1 ${t.text}`}>Remove User?</h3>
            <p className={`text-sm mb-4 ${t.textSm}`}>This will remove the user account. They will no longer be able to sign in.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className={`flex-1 py-2.5 border rounded-xl text-sm ${t.borderGray} ${t.textSm}`}>Cancel</button>
              <button onClick={() => { setUsers(p => p.filter(u => u.id !== deleteId)); setDeleteId(null); }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SetupTab main ────────────────────────────────────────────────────────────

export function SetupTab({ navigate, goBack, subView, subParams }: Props) {
  const t = useT();
  const [showReport, setShowReport]   = useState(false);
  const [selectedStore, setSelectedStore] = useState(stores[0].id);
  const [gpsEnabled, setGpsEnabled]   = useState(true);
  const [fraudEnabled, setFraudEnabled] = useState(true);
  const [duplicateBlock, setDuplicateBlock] = useState(true);
  const [rushAlerts, setRushAlerts]   = useState(true);

  if (subView === 'tag-registration')  return <TagRegistrationView goBack={goBack!} navigate={navigate} />;
  if (subView === 'registration-review') return <RegistrationReviewView params={subParams || {}} goBack={goBack!} />;
  if (subView === 'round-setup')       return <RoundSetupView goBack={goBack!} storeId={subParams?.storeId as string} />;
  if (subView === 'nfc-registry')      return <NfcRegistryView goBack={goBack!} storeId={subParams?.storeId as string} />;
  if (subView === 'user-creation')     return <UserCreationView goBack={goBack!} />;

  const store = stores.find(s => s.id === selectedStore)!;

  return (
    <div className={`flex-1 overflow-y-auto pb-6 ${t.page}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${t.header}`}>
        <h2 className={`font-semibold text-sm ${t.text}`}>Admin Setup</h2>
        <button onClick={() => setShowReport(true)} className="flex items-center gap-1.5 text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
          <FileText className="w-3.5 h-3.5" /> Report
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Store dropdown */}
        <div className={`rounded-2xl p-4 border shadow-sm ${t.card}`}>
          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${t.textXs}`}>Select Store</h3>
          <div className="relative">
            <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)}
              className={`w-full appearance-none px-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-orange-400 pr-10 ${t.input}`}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name} {s.storeNumber}</option>)}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${t.textXs}`} />
          </div>
        </div>

        {/* Actions */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
          {[
            { label: 'Register New NFC Tag', sub: 'Tap & assign to store location',           icon: <Tag className="w-4 h-4 text-white" />,      action: () => navigate('tag-registration') },
            { label: 'NFC Tag Registry',     sub: 'View, manage & reset tags',                 icon: <Cpu className="w-4 h-4 text-white" />,      action: () => navigate('nfc-registry', { storeId: selectedStore }) },
            { label: 'Round Setup',          sub: 'Configure rounds, duration & duplicate window', icon: <RefreshCw className="w-4 h-4 text-white" />, action: () => navigate('round-setup', { storeId: selectedStore }) },
            { label: 'User Creation',        sub: 'Add users & manage cleaner accounts',       icon: <Users className="w-4 h-4 text-white" />,    action: () => navigate('user-creation') },
          ].map((item, i, arr) => (
            <button key={item.label} onClick={item.action}
              className={`w-full flex items-center justify-between px-4 py-4 ${t.hoverRow} transition-colors ${i < arr.length - 1 ? `border-b ${t.border}` : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">{item.icon}</div>
                <div className="text-left">
                  <div className={`text-sm font-semibold ${t.text}`}>{item.label}</div>
                  <div className={`text-xs ${t.textXs}`}>{item.sub}</div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 -rotate-90 ${t.textMuted}`} />
            </button>
          ))}
        </div>

        {/* System Settings */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${t.card}`}>
          <div className={`px-4 py-3 border-b ${t.border}`}>
            <h3 className={`font-semibold text-sm ${t.text}`}>System Settings</h3>
          </div>
          {[
            { label: 'GPS Verification',     sub: 'Require GPS on all scans',        value: gpsEnabled,     set: setGpsEnabled },
            { label: 'Fraud Detection',      sub: 'Flag out-of-range scans',         value: fraudEnabled,   set: setFraudEnabled },
            { label: 'Duplicate Scan Block', sub: 'Block scans within interval',     value: duplicateBlock, set: setDuplicateBlock },
            { label: 'Rush Alerts',          sub: 'Immediate overdue notifications', value: rushAlerts,     set: setRushAlerts },
          ].map((s, i) => (
            <div key={s.label} className={`px-4 py-3.5 flex items-center justify-between ${i > 0 ? `border-t ${t.borderGray}` : ''}`}>
              <div>
                <div className={`text-sm font-medium ${t.text}`}>{s.label}</div>
                <div className={`text-xs ${t.textXs}`}>{s.sub}</div>
              </div>
              <button onClick={() => s.set(!s.value)}>
                {s.value
                  ? <ToggleRight className="w-7 h-7 text-orange-500" />
                  : <ToggleLeft className={`w-7 h-7 ${t.textMuted}`} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {showReport && <ReportModal title="Setup Report" context={`Store: ${store.name} ${store.storeNumber}`} onClose={() => setShowReport(false)} />}
    </div>
  );
}
