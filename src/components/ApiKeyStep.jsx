import { useState } from "react";
import { validateApiKey } from "../utils/claudeApi";

export default function ApiKeyStep({ apiKey: initialKey, onApiKeySet, onBack }) {
  const [key, setKey] = useState(initialKey);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!key.trim()) return;

    setValidating(true);
    setError(null);

    const result = await validateApiKey(key.trim());
    setValidating(false);

    if (result.valid) {
      onApiKeySet(key.trim());
    } else {
      setError(result.error || "Ongeldige API key");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-gray-900">API Key</h2>
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            &larr; Terug
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-6">
          Voer je Anthropic API key in om attributen te extraheren met Claude.
          De key wordt lokaal opgeslagen in je browser.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="api-key"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Anthropic API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!key.trim() || validating}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {validating ? "Valideren..." : "Doorgaan"}
          </button>
        </form>
      </div>
    </div>
  );
}
