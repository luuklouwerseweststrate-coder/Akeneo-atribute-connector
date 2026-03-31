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

  const escape = (val) => {
    const str = String(val);
    if (str.includes(";") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv =
    [header.map(escape).join(";"), ...rows.map((r) => r.map(escape).join(";"))].join(
      "\r\n"
    );

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });

  const date = new Date().toISOString().slice(0, 10);
  const fileName = `akeneo_import_${date}.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return fileName;
}
