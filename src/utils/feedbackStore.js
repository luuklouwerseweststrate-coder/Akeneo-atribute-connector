/**
 * Feedback Store — slaat correcties op in localStorage
 *
 * Wanneer een gebruiker een waarde aanpast in de review-tabel,
 * wordt dat opgeslagen als feedback. Bij volgende extracties
 * worden relevante correcties meegestuurd in de prompt,
 * zodat Claude leert van eerdere fouten.
 */

const STORAGE_KEY = "akeneo_feedback";
const MAX_FEEDBACK = 5000; // max aantal opgeslagen correcties

/**
 * Haal alle feedback op uit localStorage
 */
export function getAllFeedback() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Sla feedback op
 * @param {Array} corrections - [{ productTitle, column, wrongValue, correctValue }]
 */
export function saveFeedback(corrections) {
  if (!corrections || corrections.length === 0) return;

  const existing = getAllFeedback();
  const timestamp = new Date().toISOString();

  const newEntries = corrections.map((c) => ({
    productTitle: c.productTitle,
    column: c.column,
    wrongValue: c.wrongValue,
    correctValue: c.correctValue,
    timestamp,
  }));

  // Dedupliceer: als dezelfde producttitel + kolom al bestaat, overschrijf
  const merged = [...existing];
  for (const entry of newEntries) {
    const idx = merged.findIndex(
      (f) => f.productTitle === entry.productTitle && f.column === entry.column
    );
    if (idx >= 0) {
      merged[idx] = entry;
    } else {
      merged.push(entry);
    }
  }

  // Beperk totaal aantal (oudste eraf)
  const trimmed = merged.length > MAX_FEEDBACK
    ? merged.slice(merged.length - MAX_FEEDBACK)
    : merged;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/**
 * Zoek relevante feedback voor een lijst producten en kolommen.
 * Gebruikt woordovereenkomst op producttitel.
 *
 * @param {Array} products - producten met erp_name-nl_NL en/of variation_name-nl_NL
 * @param {Array} columns - geselecteerde kolommen
 * @param {number} maxResults - max aantal feedback-items om terug te geven
 * @returns {Array} relevante feedback-items
 */
export function findRelevantFeedback(products, columns, maxResults = 30) {
  const all = getAllFeedback();
  if (all.length === 0) return [];

  // Filter op kolommen die we nu extraheren
  const columnSet = new Set(columns);
  const relevant = all.filter((f) => columnSet.has(f.column));
  if (relevant.length === 0) return [];

  // Bouw een set van woorden uit alle producttitels
  const productWords = new Set();
  for (const p of products) {
    const title = (p["erp_name-nl_NL"] || "") + " " + (p["variation_name-nl_NL"] || "");
    for (const word of tokenize(title)) {
      productWords.add(word);
    }
  }

  // Score elke feedback op woordovereenkomst
  const scored = relevant.map((f) => {
    const words = tokenize(f.productTitle);
    if (words.length === 0) return { feedback: f, score: 0 };
    const matches = words.filter((w) => productWords.has(w)).length;
    return { feedback: f, score: matches / words.length };
  });

  // Sorteer op score, pak de beste
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0.3)
    .slice(0, maxResults)
    .map((s) => s.feedback);
}

/**
 * Formatteer feedback als tekst voor de Claude prompt
 */
export function formatFeedbackForPrompt(feedbackItems) {
  if (!feedbackItems || feedbackItems.length === 0) return "";

  // Groepeer per kolom
  const byColumn = {};
  for (const f of feedbackItems) {
    if (!byColumn[f.column]) byColumn[f.column] = [];
    byColumn[f.column].push(f);
  }

  let text = "\nEERDERE CORRECTIES (leer hiervan, maak deze fouten niet opnieuw):\n";
  for (const [col, items] of Object.entries(byColumn)) {
    for (const item of items) {
      if (item.wrongValue) {
        text += `- "${item.productTitle}" → ${col}: FOUT was "${item.wrongValue}", CORRECT is "${item.correctValue}"\n`;
      } else {
        text += `- "${item.productTitle}" → ${col}: "${item.correctValue}"\n`;
      }
    }
  }
  return text;
}

/**
 * Geeft stats over opgeslagen feedback
 */
export function getFeedbackStats() {
  const all = getAllFeedback();
  const columns = {};
  for (const f of all) {
    columns[f.column] = (columns[f.column] || 0) + 1;
  }
  return { total: all.length, byColumn: columns };
}

/**
 * Verwijder alle feedback (reset)
 */
export function clearFeedback() {
  localStorage.removeItem(STORAGE_KEY);
}

// Hulpfunctie: splits tekst in woorden, filter stopwoorden
const STOP_WORDS = new Set([
  "de", "het", "een", "en", "van", "voor", "met", "in", "op", "per",
  "stuks", "st", "mm", "cm", "ml", "gr", "kg", "x",
]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\u00e0-\u00ff]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}
