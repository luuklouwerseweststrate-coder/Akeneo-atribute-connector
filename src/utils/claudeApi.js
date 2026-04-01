import { LABELS } from "../constants";

const MODEL = "claude-sonnet-4-20250514";
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;
const MAX_CHARS_PER_BATCH = 12000; // rough char budget per batch

// Sonnet 4 pricing (USD per 1M tokens)
const PRICE_INPUT = 3;
const PRICE_OUTPUT = 15;

export function calculateCost(usage) {
  const inputCost = (usage.inputTokens / 1_000_000) * PRICE_INPUT;
  const outputCost = (usage.outputTokens / 1_000_000) * PRICE_OUTPUT;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

function estimateProductChars(product, useDescription) {
  let chars = (product.sku || "").length
    + (product["erp_name-nl_NL"] || "").length
    + (product["variation_name-nl_NL"] || "").length
    + (product.brand || "").length
    + (product.categories || "").length;
  if (useDescription) {
    chars += (product["description-nl_NL"] || "").length;
  }
  return chars + 80; // overhead for labels
}

function createDynamicBatches(products, useDescription) {
  const batches = [];
  let currentBatch = [];
  let currentChars = 0;

  for (const product of products) {
    const chars = estimateProductChars(product, useDescription);

    if (currentBatch.length > 0 && currentChars + chars > MAX_CHARS_PER_BATCH) {
      batches.push(currentBatch);
      currentBatch = [];
      currentChars = 0;
    }

    currentBatch.push(product);
    currentChars += chars;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

function truncate(text, maxLen) {
  if (!text || text.length <= maxLen) return text || "";
  return text.slice(0, maxLen) + "...";
}

function buildPrompt(products, selectedColumns, useDescription) {
  const columnList = selectedColumns
    .map((col) => `${col} (${LABELS[col] || col})`)
    .join(", ");

  const productLines = products
    .map((p) => {
      let line = `- SKU: ${p.sku || ""}\n  ERP-naam: ${p["erp_name-nl_NL"] || ""}\n  Commercieel: ${p["variation_name-nl_NL"] || ""}\n  Merk: ${p.brand || ""}\n  Categorie: ${p.categories || ""}`;
      if (useDescription) {
        const desc = truncate(p["description-nl_NL"], 500);
        if (desc) {
          line += `\n  Omschrijving: ${desc}`;
        }
      }
      return line;
    })
    .join("\n");

  const descRule = useDescription
    ? "- Gebruik ALLE bronnen: titels (ERP + commercieel) EN de omschrijving"
    : "- Gebruik BEIDE titels (ERP + commercieel) als bron";

  return `Je bent een specialist in B2B productdata voor een Nederlandse groothandel (verpakkingen, schoonmaak, kantoor, PBM, medisch, horeca, facilitair).

Extraheer attributen uit de productinformatie naar deze Akeneo-kolommen: ${columnList}

PRODUCTEN:
${productLines}

REGELS:
${descRule}
- ALLEEN extraheren wat letterlijk of sterk afleidbaar is
- confidence: "high" (letterlijk), "medium" (afleidbaar), "low" (twijfel)
- Niet te bepalen: value "" en confidence "empty"
- Kleuren Nederlands (White→wit, Black→zwart, Blue→blauw)
- Afmetingen in juiste eenheid per kolom (mm/cm/m/liter)
- Getallen zonder eenheid voor number-kolommen
- Patronen: "40x48cm", "100st", "2-laags", "T25"
- Bij kleur-nl_NL / kleur-en_US: Nederlandse resp. Engelse kleur
- Vermeld in "opmerkingen" als iets onduidelijk is of uit de omschrijving komt

Antwoord ALLEEN met valid JSON, geen markdown, geen backticks:
[{"sku":"...","attributes":{"kolom_id":{"value":"...","confidence":"high|medium|low|empty"}},"opmerkingen":"optioneel"}]`;
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429 || response.status === 529 || (response.status >= 500 && response.status < 600)) {
      if (attempt < retries) {
        const delay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }

    return response;
  }
}

export async function validateApiKey(apiKey) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 10,
        messages: [{ role: "user", content: "Zeg alleen: OK" }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

async function processBatch(batch, selectedColumns, apiKey, useDescription) {
  const prompt = buildPrompt(batch, selectedColumns, useDescription);
  const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  const batchUsage = {
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };

  const text = data.content?.[0]?.text || "[]";
  const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
  const parsed = JSON.parse(cleaned);

  return { results: parsed, usage: batchUsage };
}

export async function extractAttributes(
  products,
  selectedColumns,
  apiKey,
  onProgress,
  useDescription = false
) {
  const batches = createDynamicBatches(products, useDescription);

  const allResults = [];
  const errors = [];
  const usage = { inputTokens: 0, outputTokens: 0 };
  let completed = 0;

  // Process batches with concurrency limit
  const queue = batches.map((batch, i) => ({ batch, index: i }));
  const active = new Set();

  async function processNext() {
    if (queue.length === 0) return;

    const { batch, index } = queue.shift();
    const promise = (async () => {
      try {
        const result = await processBatch(batch, selectedColumns, apiKey, useDescription);
        usage.inputTokens += result.usage.inputTokens;
        usage.outputTokens += result.usage.outputTokens;
        return { index, results: result.results, error: null };
      } catch (err) {
        const batchSkus = batch.map((p) => p.sku || "onbekend");
        errors.push({ batch: index + 1, skus: batchSkus, error: err.message });
        const fallback = batch.map((p) => ({
          sku: p.sku || "",
          attributes: {},
          opmerkingen: `Fout in batch ${index + 1}: ${err.message}`,
        }));
        return { index, results: fallback, error: err.message };
      } finally {
        completed++;
        onProgress({ current: completed, total: batches.length, usage: { ...usage } });
        active.delete(promise);
      }
    })();

    active.add(promise);
    return promise;
  }

  // Collect results in order
  const resultsByIndex = {};

  // Fill initial pool
  const promises = [];
  for (let i = 0; i < Math.min(MAX_CONCURRENT, batches.length); i++) {
    promises.push(processNext());
  }

  // Process remaining batches as slots free up
  while (active.size > 0 || queue.length > 0) {
    const finished = await Promise.race([...active]);
    resultsByIndex[finished.index] = finished.results;

    if (queue.length > 0) {
      processNext();
    }
  }

  // Assemble results in original order
  for (let i = 0; i < batches.length; i++) {
    if (resultsByIndex[i]) {
      allResults.push(...resultsByIndex[i]);
    }
  }

  return { results: allResults, errors, usage };
}
