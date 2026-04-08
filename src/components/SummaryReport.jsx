import { useMemo } from "react";
import { calculateCost } from "../utils/claudeApi";

const MANUAL_SECONDS_PER_CELL = 45;
const HOURLY_RATE = 35;

export default function SummaryReport({ results, selectedColumns, usage, extractionStartTime }) {
  const stats = useMemo(() => {
    let high = 0, medium = 0, low = 0, empty = 0, filled = 0;
    for (const r of results) {
      for (const col of selectedColumns) {
        const attr = r.attributes?.[col];
        const conf = attr?.confidence || "empty";
        const hasValue = attr?.value && attr.value.trim().length > 0;
        if (conf === "high") high++;
        else if (conf === "medium") medium++;
        else if (conf === "low") low++;
        else empty++;
        if (hasValue) filled++;
      }
    }
    const total = high + medium + low + empty;
    const qualityScore = total > 0
      ? Math.round(((high * 1.0 + medium * 0.7 + low * 0.3) / total) * 100)
      : 0;
    const fillRate = total > 0 ? Math.round((filled / total) * 100) : 0;

    const manualSeconds = results.length * selectedColumns.length * MANUAL_SECONDS_PER_CELL;
    const manualHours = manualSeconds / 3600;
    const aiSeconds = extractionStartTime ? Math.round((Date.now() - extractionStartTime) / 1000) : 0;
    const speedup = aiSeconds > 0 ? Math.round(manualSeconds / aiSeconds) : 0;
    const manualCost = manualHours * HOURLY_RATE;
    const aiCost = usage ? calculateCost(usage).totalCost : 0;

    // ROI berekening op maandbasis (geschat 500 producten/maand)
    const monthlyProducts = 500;
    const monthlyManualHours = (monthlyProducts * selectedColumns.length * MANUAL_SECONDS_PER_CELL) / 3600;
    const monthlySavings = monthlyManualHours * HOURLY_RATE;

    // Percentages voor donut
    const highPct = total > 0 ? (high / total) * 100 : 0;
    const mediumPct = total > 0 ? (medium / total) * 100 : 0;
    const lowPct = total > 0 ? (low / total) * 100 : 0;
    const emptyPct = total > 0 ? (empty / total) * 100 : 0;

    return { high, medium, low, empty, total, filled, fillRate, qualityScore, manualHours, aiSeconds, speedup, manualCost, aiCost, monthlyManualHours, monthlySavings, highPct, mediumPct, lowPct, emptyPct };
  }, [results, selectedColumns, usage, extractionStartTime]);

  const date = new Date().toLocaleDateString("nl-NL", { year: "numeric", month: "long", day: "numeric" });

  // CSS conic-gradient voor donut chart
  const donutGradient = `conic-gradient(
    #22C55E 0% ${stats.highPct}%,
    #F59E0B ${stats.highPct}% ${stats.highPct + stats.mediumPct}%,
    #EF4444 ${stats.highPct + stats.mediumPct}% ${stats.highPct + stats.mediumPct + stats.lowPct}%,
    #9CA3AF ${stats.highPct + stats.mediumPct + stats.lowPct}% 100%
  )`;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl mx-auto print:shadow-none print:p-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <div>
          <h2 className="font-serif text-2xl text-gray-900">Extractie Rapport</h2>
          <p className="text-sm text-gray-500 mt-1">{date}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors print:hidden"
        >
          Print rapport
        </button>
      </div>

      {/* Kerncijfers */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <div className="text-2xl font-bold text-gray-900">{results.length}</div>
          <div className="text-xs text-gray-500">Producten</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-xl">
          <div className="text-2xl font-bold text-gray-900">{selectedColumns.length}</div>
          <div className="text-xs text-gray-500">Attributen</div>
        </div>
        <div className="text-center p-3 bg-accent/5 rounded-xl">
          <div className="text-2xl font-bold text-accent">{stats.filled.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Cellen ingevuld</div>
        </div>
        <div className="text-center p-3 bg-accent/5 rounded-xl">
          <div className="text-2xl font-bold text-accent">{stats.fillRate}%</div>
          <div className="text-xs text-gray-500">Invulpercentage</div>
        </div>
      </div>

      {/* Tijdsbesparing */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Tijdsbesparing</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 rounded-xl text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Handmatig</div>
            <div className="text-xl font-bold text-gray-900">
              {stats.manualHours >= 1 ? `${stats.manualHours.toFixed(1)} uur` : `${Math.round(stats.manualHours * 60)} min`}
            </div>
            <div className="text-xs text-gray-400">{"\u20AC"}{stats.manualCost.toFixed(0)}</div>
          </div>
          <div className="p-4 bg-green-50 rounded-xl text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Met AI</div>
            <div className="text-xl font-bold text-accent">
              {stats.aiSeconds < 60 ? `${stats.aiSeconds} sec` : `${Math.round(stats.aiSeconds / 60)} min`}
            </div>
            <div className="text-xs text-gray-400">${stats.aiCost.toFixed(4)}</div>
          </div>
          <div className="p-4 bg-accent/10 rounded-xl text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Resultaat</div>
            <div className="text-xl font-bold text-accent">{stats.speedup}x sneller</div>
            <div className="text-xs text-gray-400">dan handmatig</div>
          </div>
        </div>
      </div>

      {/* Kwaliteitsverdeling */}
      <div className="mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Datakwaliteit</h3>
        <div className="flex items-center gap-6">
          {/* Donut chart */}
          <div className="flex-shrink-0">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: donutGradient,
              }}
            >
              <div className="w-18 h-18 rounded-full bg-white flex items-center justify-center" style={{ width: "72px", height: "72px" }}>
                <span className="text-xl font-bold text-gray-900">{stats.qualityScore}%</span>
              </div>
            </div>
          </div>
          {/* Legenda */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-conf-high"></span>
              <span className="text-gray-600">Zeker: {stats.high}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-conf-medium"></span>
              <span className="text-gray-600">Waarschijnlijk: {stats.medium}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-conf-low"></span>
              <span className="text-gray-600">Twijfel: {stats.low}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-conf-empty"></span>
              <span className="text-gray-600">Leeg: {stats.empty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI projectie */}
      <div className="p-5 bg-gradient-to-r from-accent/5 to-purple/5 rounded-xl border border-accent/10">
        <h3 className="font-semibold text-gray-900 mb-2">Maandelijkse ROI-projectie</h3>
        <p className="text-sm text-gray-600">
          Bij {500} producten/maand met {selectedColumns.length} attributen:
        </p>
        <div className="mt-3 flex items-center gap-6">
          <div>
            <span className="text-2xl font-bold text-accent">{stats.monthlyManualHours.toFixed(0)} uur</span>
            <span className="text-sm text-gray-500 ml-1">bespaard per maand</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-accent">{"\u20AC"}{stats.monthlySavings.toFixed(0)}</span>
            <span className="text-sm text-gray-500 ml-1">per maand</span>
          </div>
        </div>
      </div>
    </div>
  );
}
