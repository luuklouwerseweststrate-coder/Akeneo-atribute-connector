import * as XLSX from "xlsx";

export function exportCSV(results, selectedColumns) {
  const header = ["sku", ...selectedColumns];
  const rows = results.map((r) => {
    const row = [r.sku];
    for (const col of selectedColumns) {
      const attr = r.attributes?.[col];
      row.push(attr?.value ?? "");
    }
    return row;
  });

  // Bouw worksheet
  const wsData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Kolombreedte automatisch aanpassen
  ws["!cols"] = header.map((h, i) => {
    let maxLen = h.length;
    for (const row of rows) {
      const val = String(row[i] || "");
      if (val.length > maxLen) maxLen = val.length;
    }
    return { wch: Math.min(maxLen + 2, 40) };
  });

  // Maak workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Akeneo Import");

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `akeneo_import_${date}.xlsx`;

  // Download
  XLSX.writeFile(wb, fileName);

  return fileName;
}
