import { useState, useMemo } from "react";
import { exportCSV } from "../utils/csvExporter";
import { calculateCost } from "../utils/claudeApi";
import SummaryReport from "./SummaryReport";

const MANUAL_SECONDS_PER_CELL = 45; // gemiddelde tijd om 1 cel handmatig in te vullen
const HOURLY_RATE = 35; // EUR/uur voor handmatig werk

export default function ExportStep({ results, selectedColumns, usage, extractionStartTime, onRestart }) {
  const [downloaded, setDownloaded] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Kwaliteits- en tijdsstatistieken
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

    // Tijdsbesparing
    const manualSeconds = results.length * selectedColumns.length * MANUAL_SECONDS_PER_CELL;
    const manualHours = manualSeconds / 3600;
    const aiSeconds = extractionStartTime ? Math.round((Date.now() - extractionStartTime) / 1000) : 0;
    const speedup = aiSeconds > 0 ? Math.round(manualSeconds / aiSeconds) : 0;
    const manualCost = manualHours * HOURLY_RATE;
    const aiCost = usage ? calculateCost(usage).totalCost : 0;

    return { high, medium, low, empty, total, filled, fillRate, qualityScore, manualHours, aiSeconds, speedup, manualCost, aiCost };
  }, [results, selectedColumns, usage, extractionStartTime]);

  const handleDownload = () => {
    const name = exportCSV(results, selectedColumns);
    setFileName(name);
    setDownloaded(true);
  };

  const qualityColor = stats.qualityScore >= 80 ? "text-conf-high" : stats.qualityScore >= 60 ? "text-conf-medium" : "text-conf-low";
  const qualityBg = stats.qualityScore >= 80 ? "bg-green-50 border-green-200" : stats.qualityScore >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Tijdsbesparing — het grote verhaal */}
      <div className="bg-gradient-to-br from-accent/5 to-purple/5 rounded-2xl border border-accent/10 p-8 text-center">
        <h2 className="font-serif text-2xl text-gray-900 mb-6">Resultaat</h2>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-3xl font-bold text-gray-900">{results.length}</div>
            <div className="text-xs text-gray-500 mt-1">Producten</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">{stats.filled.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Cellen ingevuld</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple">{stats.fillRate}%</div>
            <div className="text-xs text-gray-500 mt-1">Invulpercentage</div>
          </div>
        </div>

        {/* Tijdsvergelijking */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Handmatig</div>
              <div className="text-xl font-bold text-gray-900">
                {stats.manualHours >= 1 ? `${stats.manualHours.toFixed(1)} uur` : `${Math.round(stats.manualHours * 60)} min`}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {"\u20AC"}{stats.manualCost.toFixed(0)} aan personeelskosten
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Met AI</div>
              <div className="text-xl font-bold text-accent">
                {stats.aiSeconds < 60 ? `${stats.aiSeconds} sec` : `${Math.round(stats.aiSeconds / 60)} min`}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                ${stats.aiCost.toFixed(4)} aan API-kosten
              </div>
            </div>
          </div>

          {stats.speedup > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent font-bold text-lg rounded-full">
                {stats.speedup}x sneller
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Kwaliteitsscore */}
      <div className={`rounded-2xl border p-6 ${qualityBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Datakwaliteit</h3>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="text-conf-high">{stats.high} zeker</span>
              <span className="text-conf-medium">{stats.medium} waarschijnlijk</span>
              <span className="text-conf-low">{stats.low} twijfel</span>
              <span className="text-conf-empty">{stats.empty} leeg</span>
            </div>
          </div>
          <div className="text-center">
            <div className={`text-4xl font-bold ${qualityColor}`}>{stats.qualityScore}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.qualityScore >= 80 ? "Klaar voor import" : stats.qualityScore >= 60 ? "Controleer twijfelgevallen" : "Review nodig"}
            </div>
          </div>
        </div>
      </div>

      {/* Download */}
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
        {downloaded && (
          <p className="text-sm text-gray-500 mb-4">
            {fileName} is gedownload. Importeer dit bestand in Akeneo via "Productimport" met optie "vergelijken en samenvoegen".
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            {downloaded ? "Opnieuw downloaden" : "Download Excel voor Akeneo"}
          </button>

          <button
            onClick={() => setShowReport(!showReport)}
            className="w-full px-6 py-3 bg-purple/10 hover:bg-purple/20 text-purple font-medium rounded-xl transition-colors"
          >
            {showReport ? "Verberg rapport" : "Bekijk rapport"}
          </button>

          <button
            onClick={onRestart}
            className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Nieuw bestand verwerken
          </button>
        </div>

        {downloaded && (
          <div className="mt-4 p-4 bg-blue-50 rounded-xl text-left text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">Import-instellingen:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Bestandstype: xlsx</li>
              <li>Actie: Vergelijken en samenvoegen</li>
            </ul>
          </div>
        )}
      </div>

      {/* Printbaar rapport */}
      {showReport && (
        <SummaryReport
          results={results}
          selectedColumns={selectedColumns}
          usage={usage}
          extractionStartTime={extractionStartTime}
        />
      )}
    </div>
  );
}
