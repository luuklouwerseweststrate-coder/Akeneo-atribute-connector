import { useState, useMemo } from "react";
import { LABELS } from "../constants";
import { calculateCost } from "../utils/claudeApi";

const CONF_COLORS = {
  high: "text-conf-high",
  medium: "text-conf-medium",
  low: "text-conf-low",
  empty: "text-conf-empty",
};

function ConfidenceDot({ level }) {
  return (
    <span
      className={`confidence-dot ${CONF_COLORS[level] || CONF_COLORS.empty}`}
      title={level}
    />
  );
}

export default function ReviewStep({
  results,
  products,
  selectedColumns,
  errors,
  usage,
  onDone,
}) {
  const [data, setData] = useState(() => {
    const productMap = {};
    for (const p of products) {
      if (p.sku) productMap[p.sku] = p;
    }

    return results.map((r) => ({
      ...r,
      _product: productMap[r.sku] || {},
    }));
  });

  const [filter, setFilter] = useState("all");
  const [colSearch, setColSearch] = useState("");

  const filteredColumns = useMemo(() => {
    if (!colSearch.trim()) return selectedColumns;
    const q = colSearch.toLowerCase();
    return selectedColumns.filter(
      (col) =>
        col.toLowerCase().includes(q) ||
        (LABELS[col] || "").toLowerCase().includes(q)
    );
  }, [selectedColumns, colSearch]);

  const filteredData = useMemo(() => {
    if (filter === "all") return data;
    if (filter === "issues") {
      return data.filter((r) =>
        selectedColumns.some((col) => {
          const conf = r.attributes?.[col]?.confidence;
          return conf === "low" || conf === "empty";
        })
      );
    }
    // clean
    return data.filter((r) =>
      selectedColumns.every((col) => {
        const conf = r.attributes?.[col]?.confidence;
        return conf === "high" || conf === "medium";
      })
    );
  }, [data, filter, selectedColumns]);

  const updateValue = (rowIdx, col, newValue) => {
    setData((prev) => {
      const next = [...prev];
      const globalIdx = prev.indexOf(filteredData[rowIdx]);
      if (globalIdx < 0) return prev;
      const row = { ...next[globalIdx] };
      const attrs = { ...row.attributes };
      attrs[col] = { value: newValue, confidence: "high" };
      row.attributes = attrs;
      next[globalIdx] = row;
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-gray-900">Review</h2>
            <p className="text-sm text-gray-500">
              {data.length} producten &mdash; {selectedColumns.length} attributen
              {errors.length > 0 && (
                <span className="text-red-500 ml-2">
                  ({errors.length} batch fouten)
                </span>
              )}
            </p>
            {usage && usage.inputTokens > 0 && (() => {
              const cost = calculateCost(usage);
              return (
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="px-2 py-1 bg-blue-50 text-accent rounded-md font-medium">
                    {usage.inputTokens.toLocaleString()} input tokens
                  </span>
                  <span className="px-2 py-1 bg-blue-50 text-accent rounded-md font-medium">
                    {usage.outputTokens.toLocaleString()} output tokens
                  </span>
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md font-semibold">
                    ${cost.totalCost.toFixed(4)}
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            {[
              { key: "all", label: "Alles" },
              { key: "issues", label: "Twijfelgevallen" },
              { key: "clean", label: "Schoon" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                  filter === f.key
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <input
            type="text"
            value={colSearch}
            onChange={(e) => setColSearch(e.target.value)}
            placeholder="Zoek kolom..."
            className="w-full sm:w-64 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-0 bg-gray-50 z-10 min-w-[100px]">
                  SKU
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-[100px] bg-gray-50 z-10 min-w-[250px]">
                  Producttitel
                </th>
                {filteredColumns.map((col) => (
                  <th
                    key={col}
                    className="text-left px-4 py-3 font-medium text-gray-600 min-w-[160px]"
                  >
                    {LABELS[col] || col}
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-gray-600 min-w-[200px]">
                  Opmerkingen
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIdx) => (
                <tr
                  key={row.sku || rowIdx}
                  className="border-t border-gray-50 hover:bg-blue-50/20"
                >
                  <td className="px-4 py-2 font-mono text-xs text-gray-700 sticky left-0 bg-white z-10">
                    {row.sku}
                  </td>
                  <td className="px-4 py-2 text-gray-700 sticky left-[100px] bg-white z-10 max-w-[250px] truncate">
                    {row._product?.["erp_name-nl_NL"] ||
                      row._product?.["variation_name-nl_NL"] ||
                      "-"}
                  </td>
                  {filteredColumns.map((col) => {
                    const attr = row.attributes?.[col] || {
                      value: "",
                      confidence: "empty",
                    };
                    return (
                      <td key={col} className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <ConfidenceDot level={attr.confidence} />
                          <input
                            type="text"
                            value={attr.value || ""}
                            onChange={(e) =>
                              updateValue(rowIdx, col, e.target.value)
                            }
                            className="w-full px-2 py-1 border border-gray-100 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent bg-transparent"
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="px-4 py-2 text-xs text-gray-400 italic max-w-[200px] truncate">
                    {row.opmerkingen || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            Geen producten voor dit filter
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={() => onDone(data)}
          className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          Exporteren
        </button>
      </div>
    </div>
  );
}
