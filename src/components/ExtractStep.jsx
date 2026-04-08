import { useState, useEffect, useRef } from "react";
import { extractAttributes, calculateCost } from "../utils/claudeApi";

function formatTime(ms) {
  if (ms < 1000) return "< 1 sec";
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `~${totalSec} sec`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `~${min} min ${sec > 0 ? `${sec} sec` : ""}`;
}

export default function ExtractStep({ products, selectedColumns, apiKey, useDescription, onDone, onCancel }) {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState("running");
  const started = useRef(false);
  const startTime = useRef(Date.now());
  const abortController = useRef(new AbortController());

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    startTime.current = Date.now();

    const run = async () => {
      try {
        const result = await extractAttributes(
          products,
          selectedColumns,
          apiKey,
          setProgress,
          useDescription,
          abortController.current.signal
        );
        setStatus("done");
        onDone(result);
      } catch (err) {
        if (err.name === "AbortError" || abortController.current.signal.aborted) {
          setStatus("cancelled");
        } else {
          setStatus("error");
        }
      }
    };
    run();
  }, [products, selectedColumns, apiKey, useDescription, onDone]);

  const handleCancel = () => {
    abortController.current.abort();
    setStatus("cancelled");
  };

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  // Tijdsinschatting op basis van gemiddelde per batch
  const elapsed = Date.now() - startTime.current;
  const avgPerBatch = progress.current > 0 ? elapsed / progress.current : 0;
  const remaining = progress.current > 0 && progress.current < progress.total
    ? avgPerBatch * (progress.total - progress.current)
    : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md text-center">
        {status === "cancelled" ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl text-gray-900 mb-2">Geannuleerd</h2>
            <p className="text-gray-500 text-sm mb-6">
              Extractie is gestopt na {progress.current} van {progress.total} batches.
            </p>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              Terug naar instellingen
            </button>
          </>
        ) : (
          <>
            <div className="animate-bob mb-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent/10 to-purple/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="font-serif text-2xl text-gray-900 mb-2">
              Attributen extraheren
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Claude analyseert je product{useDescription ? "informatie" : "titels"}...
              {useDescription && (
                <span className="block text-xs text-accent mt-1">
                  Incl. omschrijvingen
                </span>
              )}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-purple rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="text-sm text-gray-600">
              Batch {progress.current} van {progress.total}{" "}
              <span className="text-gray-400">({pct}%)</span>
            </p>

            <p className="text-xs text-gray-400 mt-1">
              {products.length} producten &middot; {selectedColumns.length} attributen
              {progress.total > 0 && " \u00b7 5 parallel"}
            </p>

            {/* Tijdsinschatting */}
            {remaining > 0 && (
              <p className="text-xs text-accent font-medium mt-2">
                Nog {formatTime(remaining)}
              </p>
            )}

            {progress.usage && progress.usage.inputTokens > 0 && (
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                <span>{(progress.usage.inputTokens + progress.usage.outputTokens).toLocaleString()} tokens</span>
                <span>&middot;</span>
                <span>${calculateCost(progress.usage).totalCost.toFixed(4)}</span>
              </div>
            )}

            {status === "error" && (
              <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                Er is een fout opgetreden. Probeer het opnieuw.
              </div>
            )}

            {/* Annuleerknop */}
            {status === "running" && (
              <button
                onClick={handleCancel}
                className="mt-6 px-4 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
              >
                Annuleren
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
