import { useState } from 'react';
import { X, FileText, Download, CheckCircle, Calendar } from 'lucide-react';
import { useT } from '../../ThemeContext';

interface Props {
  title: string;
  context?: string;
  onClose: () => void;
}

const REPORT_TYPES = ['Compliance Summary', 'Alert History', 'NFC Tag Status', 'Staff Performance', 'Round Details'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function ReportModal({ title, context, onClose }: Props) {
  const t = useT();
  const today = todayStr();
  const [selected, setSelected] = useState<string[]>(['Compliance Summary', 'Alert History']);
  const [format, setFormat]     = useState<'pdf' | 'csv'>('pdf');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate]     = useState(today);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading]     = useState(false);

  const toggle = (type: string) =>
    setSelected(prev => prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]);

  // Clamp end date so it's never before start
  const handleStartChange = (v: string) => {
    setStartDate(v);
    if (endDate < v) setEndDate(v);
  };
  const handleEndChange = (v: string) => {
    if (v >= startDate) setEndDate(v);
  };

  const isSingleDay = startDate === endDate;
  const dateLabel = isSingleDay
    ? formatDate(startDate)
    : `${formatDate(startDate)} → ${formatDate(endDate)}`;

  const generate = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setGenerated(true); }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className={`w-full max-w-lg rounded-t-2xl p-5 pb-8 max-h-[90vh] overflow-y-auto ${t.cardFlat}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" />
            <h3 className={`font-semibold ${t.text}`}>Generate Report</h3>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-full ${t.hoverRow}`}>
            <X className={`w-4 h-4 ${t.textSm}`} />
          </button>
        </div>

        {/* Store / scope label */}
        <div className={`flex items-center gap-1.5 mb-4 px-3 py-2 rounded-lg ${t.isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
          <span className={`text-xs font-semibold ${t.isDark ? 'text-red-300' : 'text-red-700'}`}>{title}</span>
          {context && <span className={`text-xs ${t.isDark ? 'text-red-400' : 'text-red-500'}`}>· {context}</span>}
        </div>

        {!generated ? (
          <>
            {/* Date range */}
            <div className="mb-4">
              <p className={`text-sm font-medium mb-2 ${t.textSm}`}>Date range:</p>
              <div className={`rounded-xl border ${t.borderGray} overflow-hidden`}>
                <div className={`flex items-center gap-3 px-3 py-2.5 border-b ${t.borderGray}`}>
                  <Calendar className={`w-4 h-4 ${t.textMuted} shrink-0`} />
                  <div className="flex-1">
                    <div className={`text-xs ${t.textMuted} mb-0.5`}>Start date</div>
                    <input
                      type="date"
                      value={startDate}
                      max={today}
                      onChange={e => handleStartChange(e.target.value)}
                      className={`w-full text-sm bg-transparent outline-none ${t.text}`}
                    />
                  </div>
                </div>
                <div className={`flex items-center gap-3 px-3 py-2.5`}>
                  <Calendar className={`w-4 h-4 ${t.textMuted} shrink-0`} />
                  <div className="flex-1">
                    <div className={`text-xs ${t.textMuted} mb-0.5`}>End date</div>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      max={today}
                      onChange={e => handleEndChange(e.target.value)}
                      className={`w-full text-sm bg-transparent outline-none ${t.text}`}
                    />
                  </div>
                </div>
              </div>
              <p className={`text-xs mt-1.5 ${t.textMuted}`}>
                {isSingleDay
                  ? `Single-day report for ${formatDate(startDate)}`
                  : `Range report: ${formatDate(startDate)} to ${formatDate(endDate)}`}
              </p>
            </div>

            {/* Report sections */}
            <div className="mb-4">
              <p className={`text-sm font-medium mb-2 ${t.textSm}`}>Include in report:</p>
              <div className="space-y-2">
                {REPORT_TYPES.map(type => (
                  <button key={type} onClick={() => toggle(type)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      selected.includes(type)
                        ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                        : `${t.borderGray} ${t.textSm} ${t.hoverRow}`
                    }`}>
                    {type}
                    {selected.includes(type) && <CheckCircle className="w-4 h-4 text-red-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="mb-5">
              <p className={`text-sm font-medium mb-2 ${t.textSm}`}>Format:</p>
              <div className="flex gap-2">
                {(['pdf', 'csv'] as const).map(f => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium uppercase transition-all ${
                      format === f ? 'bg-red-600 text-white border-red-600' : `${t.borderGray} ${t.textSm}`
                    }`}>{f}</button>
                ))}
              </div>
            </div>

            <button onClick={generate} disabled={loading || selected.length === 0}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-red-700 transition-colors">
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className={`font-semibold mb-1 ${t.text}`}>Report Ready!</h4>
            <p className={`text-sm mb-1 ${t.textXs}`}>{title}</p>
            <p className={`text-xs mb-4 ${t.textMuted}`}>
              {dateLabel} · {format.toUpperCase()} · {selected.length} section{selected.length !== 1 ? 's' : ''}
            </p>
            <button className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-red-700">
              <Download className="w-4 h-4" /> Download Report
            </button>
            <button onClick={onClose} className={`w-full mt-2 py-3 border rounded-xl text-sm ${t.borderGray} ${t.textSm}`}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
