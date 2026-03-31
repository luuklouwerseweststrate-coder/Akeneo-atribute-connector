import { SYSTEM_COLS, AUTO_SELECT } from "../constants";

export function analyzeColumns(products, columns) {
  const total = products.length;
  if (total === 0) return { emptyColumns: [], preSelected: [] };

  const emptyColumns = columns.filter((col) => {
    if (SYSTEM_COLS.has(col)) return false;

    const filled = products.filter((p) => {
      const val = p[col];
      return val !== "" && val !== null && val !== undefined;
    }).length;

    return filled / total < 0.5;
  });

  const preSelected = emptyColumns.filter((col) => AUTO_SELECT.has(col));

  return { emptyColumns, preSelected };
}
