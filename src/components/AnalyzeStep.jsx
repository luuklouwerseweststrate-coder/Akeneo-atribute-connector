import { useState, useMemo } from "react";
import { analyzeColumns } from "../utils/columnAnalyzer";
import { LABELS } from "../constants";

export default function AnalyzeStep({ fileData, onColumnsSelected, onBack }) {
  const { products, columns, fileName } = fileData;

  const { emptyColumns, preSelected } = useMemo(
    () => analyzeColumns(products, columns),
    [products, columns]
  );

  const [selected, setSelected] = useState(new Set(preSelected));
  const [useDescription, setUseDescription] = useState(true);

  const hasDescriptions = useMemo(
    () => products.some((p) => (p["description-nl_NL"] || "").trim().length > 0),
    [products]
  );

  const preview = products.slice(0, 5);

  const toggle = (col) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(emptyColumns));
  const selectNone = () => setSelected(new Set());

  const getLabel = (col) => LABELS[col] || col;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-2xl text-gray-900">Analyse</h2>
            <p className="text-gray-500 text-sm mt-1">
              {fileName} &mdash; {products.length} producten, {columns.length}{" "}
              kolommen
            </p>
          </div>
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            &larr; Terug
          </button>
        </div>

        {/* Preview table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  SKU
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  ERP Naam
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Commercieel
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-blue-50/30">
                  <td className="px-4 py-2 font-mono text-xs text-gray-700">
                    {p.sku || "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-700 max-w-xs truncate">
                    {p["erp_name-nl_NL"] || "-"}
                  </td>
                  <td className="px-4 py-2 text-gray-700 max-w-xs truncate">
                    {p["variation_name-nl_NL"] || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Description toggle */}
      {hasDescriptions && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`relative w-11 h-6 rounded-full transition-colors ${
                useDescription ? "bg-accent" : "bg-gray-200"
              }`}
              onClick={() => setUseDescription((v) => !v)}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  useDescription ? "translate-x-5" : ""
                }`}
              />
            </div>
            <div>
              <span className="font-medium text-gray-900">
                Omschrijvingen meesturen
              </span>
              <p className="text-sm text-gray-500">
                Gebruik ook de productomschrijving als bron voor extractie.
                Vindt meer attributen, maar kost meer tokens.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Column selection */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">
              Lege kolommen ({emptyColumns.length})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Selecteer welke attributen je wilt laten extraheren
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Alles
            </button>
            <button
              onClick={selectNone}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Niets
            </button>
          </div>
        </div>

        {emptyColumns.length === 0 ? (
          <p className="text-gray-400 text-sm italic">
            Geen lege attribuutkolommen gevonden.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {emptyColumns.map((col) => (
              <button
                key={col}
                onClick={() => toggle(col)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selected.has(col)
                    ? "bg-accent text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {getLabel(col)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Continue */}
      <div className="flex justify-end">
        <button
          onClick={() => onColumnsSelected([...selected], useDescription && hasDescriptions)}
          disabled={selected.size === 0}
          className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          Doorgaan met {selected.size} kolommen
        </button>
      </div>
    </div>
  );
}
