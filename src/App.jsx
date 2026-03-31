import { useState, useCallback } from "react";
import UploadStep from "./components/UploadStep";
import AnalyzeStep from "./components/AnalyzeStep";
import ApiKeyStep from "./components/ApiKeyStep";
import ExtractStep from "./components/ExtractStep";
import ReviewStep from "./components/ReviewStep";
import ExportStep from "./components/ExportStep";

const STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Analyse" },
  { num: 3, label: "API Key" },
  { num: 4, label: "Extractie" },
  { num: 5, label: "Review" },
  { num: 6, label: "Export" },
];

export default function App() {
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("akeneo_api_key") || ""
  );
  const [results, setResults] = useState([]);
  const [errors, setErrors] = useState([]);

  const handleFileLoaded = useCallback((data) => {
    setFileData(data);
    setStep(2);
  }, []);

  const handleColumnsSelected = useCallback((cols) => {
    setSelectedColumns(cols);
    setStep(3);
  }, []);

  const handleApiKeySet = useCallback((key) => {
    setApiKey(key);
    localStorage.setItem("akeneo_api_key", key);
    setStep(4);
  }, []);

  const handleExtractionDone = useCallback((res) => {
    setResults(res.results);
    setErrors(res.errors);
    setStep(5);
  }, []);

  const handleReviewDone = useCallback((updatedResults) => {
    setResults(updatedResults);
    setStep(6);
  }, []);

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-purple flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <h1 className="font-serif text-xl text-gray-900">
              Akeneo Extractor
            </h1>
          </div>

          {/* Step indicator */}
          <nav className="hidden md:flex items-center gap-1">
            {STEPS.map((s) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                    s.num === step
                      ? "bg-accent text-white font-semibold"
                      : s.num < step
                        ? "bg-accent-light text-accent font-medium"
                        : "text-gray-400"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      s.num < step
                        ? "bg-accent text-white"
                        : s.num === step
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {s.num < step ? "\u2713" : s.num}
                  </span>
                  <span className="hidden lg:inline">{s.label}</span>
                </div>
                {s.num < STEPS.length && (
                  <div
                    className={`w-4 h-px mx-0.5 ${s.num < step ? "bg-accent" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-fade-in" key={step}>
          {step === 1 && <UploadStep onFileLoaded={handleFileLoaded} />}
          {step === 2 && (
            <AnalyzeStep
              fileData={fileData}
              onColumnsSelected={handleColumnsSelected}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <ApiKeyStep
              apiKey={apiKey}
              onApiKeySet={handleApiKeySet}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <ExtractStep
              products={fileData.products}
              selectedColumns={selectedColumns}
              apiKey={apiKey}
              onDone={handleExtractionDone}
            />
          )}
          {step === 5 && (
            <ReviewStep
              results={results}
              products={fileData.products}
              selectedColumns={selectedColumns}
              errors={errors}
              onDone={handleReviewDone}
            />
          )}
          {step === 6 && (
            <ExportStep
              results={results}
              selectedColumns={selectedColumns}
              onRestart={() => {
                setStep(1);
                setFileData(null);
                setResults([]);
                setErrors([]);
                setSelectedColumns([]);
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
