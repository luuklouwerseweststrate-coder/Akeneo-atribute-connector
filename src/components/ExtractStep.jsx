import { useState, useEffect, useRef } from "react";
import { extractAttributes } from "../utils/claudeApi";

export default function ExtractStep({ products, selectedColumns, apiKey, onDone }) {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState("running");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      try {
        const result = await extractAttributes(
          products,
          selectedColumns,
          apiKey,
          setProgress
        );
        setStatus("done");
        onDone(result);
      } catch (err) {
        setStatus("error");
      }
    };
    run();
  }, [products, selectedColumns, apiKey, onDone]);

  const pct =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md text-center">
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
          Claude analyseert je producttitels...
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

        {status === "error" && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            Er is een fout opgetreden. Probeer het opnieuw.
          </div>
        )}
      </div>
    </div>
  );
}
