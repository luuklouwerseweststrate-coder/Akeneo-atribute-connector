import * as XLSX from "xlsx";
import Papa from "papaparse";

export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const isCSV = file.name.endsWith(".csv");

    reader.onload = (e) => {
      try {
        if (isCSV) {
          const result = Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
          });
          resolve({
            products: result.data,
            columns: result.meta.fields || [],
            fileName: file.name,
          });
        } else {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const products = XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
          const columns = products.length > 0 ? Object.keys(products[0]) : [];
          resolve({ products, columns, fileName: file.name });
        }
      } catch (err) {
        reject(new Error(`Fout bij het parsen van ${file.name}: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error("Fout bij het lezen van het bestand"));

    if (isCSV) {
      reader.readAsText(file, "UTF-8");
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
}
