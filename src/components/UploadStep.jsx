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
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl text-gray-900 mb-2">
          Product bestand uploaden
        </h2>
        <p className="text-gray-500">
          Upload een Akeneo product-export om te beginnen
        </p>
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
