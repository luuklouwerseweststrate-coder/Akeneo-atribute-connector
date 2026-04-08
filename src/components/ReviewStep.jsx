import { useState, useMemo, useCallback, useRef } from "react";
import { LABELS } from "../constants";
import { calculateCost } from "../utils/claudeApi";
import { saveFeedback, getFeedbackStats } from "../utils/feedbackStore";

const CONF_COLORS = {
  high: "text-conf-high",
  medium: "text-conf-medium",
  low: "text-conf-low",
  empty: "text-conf-empty",
};

const PAGE_SIZE = 25;

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
  // Index data by SKU for O(1) lookups
  const [dataMap, setDataMap] = useState(() => {
    const productMap = {};
    for (const p of products) {
      if (p.sku) productMap[p.sku] = p;
    }

    const map = new Map();
    for (const r of results) {
      map.set(r.sku, {
        ...r,
        _product: productMap[r.sku] || {},
      });
    }
    return map;
  });

  // Keep ordered SKU list for stable rendering
  const skuOrder = useMemo(() => results.map((r) => r.sku), [results]);

  // Bijhouden welke waarden de gebruiker heeft aangepast (origineel → nieuw)
  const originalValues = useRef(new Map());
  // Bij eerste render: sla originele waarden op
  useMemo(() => {
    const map = new Map();
    for (const r of results) {
      for (const col of selectedColumns) {
        const val = r.attributes?.[col]?.value || "";
        map.set(`${r.sku}::${col}`, val);
      }
    }
    originalValues.current = map;
  }, [results, selectedColumns]);

  // Kwaliteitsstatistieken berekenen
  const stats = useMemo(() => {
    let high = 0, medium = 0, low = 0, empty = 0;
    for (const [, row] of dataMap) {
      for (const col of selectedColumns) {
        const conf = row.attributes?.[col]?.confidence || "empty";
        if (conf === "high") high++;
        else if (conf === "medium") medium++;
        else if (conf === "low") low++;
        else empty++;
      }
    }
    const total = high + medium + low + empty;
    const filled = high + medium + low;
    const fillRate = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { high, medium, low, empty, total, filled, fillRate };
  }, [dataMap, selectedColumns]);

  const [filter, setFilter] = useState("all");
  const [colSearch, setColSearch] = useState("");
  const [skuSearch, setSkuSearch] = useState("");
  const [page, setPage] = useState(0);

  const filteredColumns = useMemo(() => {
    if (!colSearch.trim()) return selectedColumns;
    const q = colSearch.toLowerCase();
    return selectedColumns.filter(
      (col) =>
        col.toLowerCase().includes(q) ||
        (LABELS[col] || "").toLowerCase().includes(q)
    );
  }, [selectedColumns, colSearch]);

  const filteredSkus = useMemo(() => {
    let list = skuOrder;

    // Eerst filteren op zoekterm (SKU of productnaam)
    if (skuSearch.trim()) {
      const q = skuSearch.toLowerCase();
      list = list.filter((sku) => {
        const r = dataMap.get(sku);
        if (!r) return false;
        const title = (r._product?.["erp_name-nl_NL"] || "") + " " + (r._product?.["variation_name-nl_NL"] || "");
        return sku.toLowerCase().includes(q) || title.toLowerCase().includes(q);
      });
    }

    // Dan filteren op confidence
    if (filter === "all") return list;
    return list.filter((sku) => {
      const r = dataMap.get(sku);
      if (!r) return false;
      if (filter === "issues") {
        return selectedColumns.some((col) => {
          const conf = r.attributes?.[col]?.confidence;
          return conf === "low" || conf === "empty";
        });
      }
      if (filter === "high" || filter === "medium" || filter === "low" || filter === "empty") {
        return selectedColumns.some((col) => {
          return (r.attributes?.[col]?.confidence || "empty") === filter;
        });
      }
      // clean
      return selectedColumns.every((col) => {
        const conf = r.attributes?.[col]?.confidence;
        return conf === "high" || conf === "medium";
      });
    });
  }, [dataMap, skuOrder, filter, selectedColumns, skuSearch]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredSkus.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageSkus = filteredSkus.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE
  );

  // Reset page when filter changes
  const setFilterAndReset = (f) => {
    setFilter(f);
    setPage(0);
  };

  // O(1) update via Map
  const updateValue = useCallback((sku, col, newValue) => {
    setDataMap((prev) => {
      const next = new Map(prev);
      const row = next.get(sku);
      if (!row) return prev;
      next.set(sku, {
        ...row,
        attributes: {
          ...row.attributes,
          [col]: { value: newValue, confidence: "high" },
        },
      });
      return next;
    });
  }, []);

  const handleDone = () => {
    const ordered = skuOrder.map((sku) => dataMap.get(sku)).filter(Boolean);

    // Verzamel alle correcties (waarden die de gebruiker heeft aangepast)
    const corrections = [];
    for (const row of ordered) {
      const sku = row.sku;
      const title = row._product?.["erp_name-nl_NL"] || row._product?.["variation_name-nl_NL"] || sku;
      for (const col of selectedColumns) {
        const originalVal = originalValues.current.get(`${sku}::${col}`) || "";
        const currentVal = row.attributes?.[col]?.value || "";
        if (currentVal !== originalVal) {
          corrections.push({
            productTitle: title,
            column: col,
            wrongValue: originalVal,
            correctValue: currentVal,
          });
        }
      }
    }

    // Sla correcties op als feedback
    if (corrections.length > 0) {
      saveFeedback(corrections);
    }

    onDone(ordered);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-gray-900">Review</h2>
            <p className="text-sm text-gray-500">
              {filteredSkus.length} van {skuOrder.length} producten &mdash;{" "}
              {selectedColumns.length} attributen
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
            {(() => {
              const stats = getFeedbackStats();
              if (stats.total === 0) return null;
              return (
                <p className="mt-1 text-xs text-gray-400">
                  {stats.total} eerdere correcties opgeslagen &mdash; Claude leert hiervan
                </p>
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
                onClick={() => setFilterAndReset(f.key)}
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

        <div className="mt-3 flex gap-3">
          <input
            type="text"
            value={skuSearch}
            onChange={(e) => { setSkuSearch(e.target.value); setPage(0); }}
            placeholder="Zoek product (SKU of naam)..."
            className="w-full sm:w-72 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
          <input
            type="text"
            value={colSearch}
            onChange={(e) => setColSearch(e.target.value)}
            placeholder="Zoek kolom..."
            className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </div>
      </div>

      {/* Kwaliteitsdashboard */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { key: "high", label: "Zeker", count: stats.high, color: "bg-green-50 text-conf-high border-green-200" },
          { key: "medium", label: "Waarschijnlijk", count: stats.medium, color: "bg-amber-50 text-conf-medium border-amber-200" },
          { key: "low", label: "Twijfel", count: stats.low, color: "bg-red-50 text-conf-low border-red-200" },
          { key: "empty", label: "Leeg", count: stats.empty, color: "bg-gray-50 text-conf-empty border-gray-200" },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setFilterAndReset(s.key === filter ? "all" : s.key)}
            className={`rounded-xl border p-3 text-center transition-all hover:scale-[1.02] ${s.color} ${
              filter === s.key ? "ring-2 ring-offset-1 ring-current" : ""
            }`}
          >
            <div className="text-2xl font-bold">{s.count.toLocaleString()}</div>
            <div className="text-xs font-medium opacity-80">{s.label}</div>
          </button>
        ))}
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-center">
          <div className="text-2xl font-bold text-accent">{stats.fillRate}%</div>
          <div className="text-xs font-medium text-accent/70">Ingevuld</div>
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
                <th className="text-left px-4 py-3 font-medium text-gray-600 sticky left-[100px] bg-gray-50 z-10 min-w-[350px] max-w-[500px]">
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
              {pageSkus.map((sku) => {
                const row = dataMap.get(sku);
                if (!row) return null;
                return (
                  <tr
                    key={sku}
                    className="border-t border-gray-50 hover:bg-blue-50/20"
                  >
                    <td className="px-4 py-2 font-mono text-xs text-gray-700 sticky left-0 bg-white z-10">
                      {row.sku}
                    </td>
                    <td className="px-4 py-2 text-gray-700 sticky left-[100px] bg-white z-10 min-w-[350px] max-w-[500px] whitespace-normal break-words text-xs leading-snug">
                      {row._product?.["erp_name-nl_NL"] ||
                        row._product?.["variation_name-nl_NL"] ||
                        "-"}
                    </td>
                    {filteredColumns.map((col) => {
                      const attr = row.attributes?.[col] || {
                        value: "",
                        confidence: "empty",
                      };
                      const originalVal = originalValues.current.get(`${sku}::${col}`) || "";
                      const isEdited = (attr.value || "") !== originalVal;
                      return (
                        <td key={col} className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <ConfidenceDot level={attr.confidence} />
                            <input
                              type="text"
                              value={attr.value || ""}
                              onChange={(e) =>
                                updateValue(sku, col, e.target.value)
                              }
                              className={`w-full px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent bg-transparent ${
                                isEdited
                                  ? "border-amber-400 bg-amber-50/40 ring-1 ring-amber-200"
                                  : "border-gray-100"
                              }`}
                            />
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-xs text-gray-400 italic max-w-[200px]">
                      {row.opmerkingen || ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSkus.length === 0 && (
          <div className="py-12 text-center text-gray-400">
            Geen producten voor dit filter
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm px-6 py-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            &larr; Vorige
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => {
              // Show first, last, current, and neighbors
              if (
                i === 0 ||
                i === totalPages - 1 ||
                Math.abs(i - safePage) <= 1
              ) {
                return (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 text-sm rounded-lg font-medium transition-all ${
                      i === safePage
                        ? "bg-accent text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              }
              // Show dots for gaps
              if (i === 1 && safePage > 2) {
                return (
                  <span key={i} className="px-1 text-gray-400">
                    ...
                  </span>
                );
              }
              if (i === totalPages - 2 && safePage < totalPages - 3) {
                return (
                  <span key={i} className="px-1 text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="px-3 py-1.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Volgende &rarr;
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleDone}
          className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          Exporteren
        </button>
      </div>
    </div>
  );
}
