import { useState, useCallback } from "react";
import { parseFile } from "../utils/fileParser";

export default function UploadStep({ onFileLoaded }) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["xlsx", "xls", "csv"].includes(ext)) {
        setError("Ongeldig bestandstype. Upload een .xlsx, .xls of .csv bestand.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const data = await parseFile(file);
        if (data.products.length === 0) {
          setError("Het bestand bevat geen producten.");
          setLoading(false);
          return;
        }
        onFileLoaded(data);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    },
    [onFileLoaded]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Hero sectie */}
      <div className="text-center mb-10 max-w-2xl">
        <h2 className="font-serif text-4xl text-gray-900 mb-3">
          Productattributen automatisch invullen
        </h2>
        <p className="text-gray-500 text-lg mb-8">
          Upload een Akeneo export en laat AI de lege kolommen vullen.
          Kleur, maat, afmetingen, materiaal — in minuten in plaats van dagen.
        </p>

        {/* 3 stappen visueel */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[
            { icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            ), label: "Upload Excel" },
            { icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            ), label: "AI extraheert" },
            { icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            ), label: "Download CSV" },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  {step.icon}
                </div>
                <span className="text-xs font-medium text-gray-600">{step.label}</span>
              </div>
              {i < 2 && (
                <svg className="w-5 h-5 text-gray-300 mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
          ${
            dragging
              ? "border-accent bg-accent-light/50 scale-[1.02]"
              : "border-gray-300 bg-white hover:border-accent hover:bg-blue-50/30"
          }
          ${loading ? "opacity-60 pointer-events-none" : ""}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (loading) return;
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".xlsx,.xls,.csv";
          input.onchange = (e) => handleFile(e.target.files[0]);
          input.click();
        }}
      >
        {loading ? (
          <div className="animate-bob">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-light flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <p className="text-gray-600 font-medium">Bestand verwerken...</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/10 to-purple/10 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-1">
              Sleep een bestand hierheen
            </p>
            <p className="text-gray-400 text-sm">
              of klik om te bladeren (.xlsx, .xls, .csv)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-lg">
          {error}
        </div>
      )}
    </div>
  );
}
