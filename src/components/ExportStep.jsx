import { useState } from "react";
import { exportCSV } from "../utils/csvExporter";

export default function ExportStep({ results, selectedColumns, onRestart }) {
  const [downloaded, setDownloaded] = useState(false);
  const [fileName, setFileName] = useState(null);

  const handleDownload = () => {
    const name = exportCSV(results, selectedColumns);
    setFileName(name);
    setDownloaded(true);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-conf-high/10 to-accent/10 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-conf-high"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="font-serif text-2xl text-gray-900 mb-2">
          {downloaded ? "Gedownload!" : "Klaar voor export"}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {downloaded
            ? `${fileName} is opgeslagen. Importeer dit bestand in Akeneo via "Productimport" met optie "vergelijken en samenvoegen".`
            : `${results.length} producten met ${selectedColumns.length} attributen zijn klaar voor export.`}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            {downloaded ? "Opnieuw downloaden" : "Download CSV"}
          </button>

          <button
            onClick={onRestart}
            className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
          >
            Nieuw bestand verwerken
          </button>
        </div>

        {downloaded && (
          <div className="mt-6 p-4 bg-blue-50 rounded-xl text-left text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">Import-instellingen:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Scheidingsteken: puntkomma (;)</li>
              <li>Encoding: UTF-8</li>
              <li>Actie: Vergelijken en samenvoegen</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
