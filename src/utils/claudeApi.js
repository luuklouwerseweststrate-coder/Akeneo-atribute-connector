import { LABELS } from "../constants";
import { findRelevantFeedback, formatFeedbackForPrompt } from "./feedbackStore";

const MODEL = "claude-sonnet-4-20250514";
const MAX_CONCURRENT = 5;
const MAX_RETRIES = 3;
const MAX_CHARS_PER_BATCH = 20000; // rough char budget per batch
const CHARS_PER_TOKEN = 3.5; // avg chars per token for Dutch text

// Sonnet 4 pricing (USD per 1M tokens)
const PRICE_INPUT = 3;
const PRICE_OUTPUT = 15;

export function calculateCost(usage) {
  const inputCost = (usage.inputTokens / 1_000_000) * PRICE_INPUT;
  const outputCost = (usage.outputTokens / 1_000_000) * PRICE_OUTPUT;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

export function estimateCost(products, selectedColumns, useDescription) {
  const batches = createDynamicBatches(products, useDescription, selectedColumns);

  // Realistischere prompt overhead (system prompt + regels + patronen + kolommen + feedback)
  const columnListChars = selectedColumns.length * 25;
  const feedbackChars = 500; // gemiddelde feedback-bijdrage per batch
  const promptOverhead = 1500 + columnListChars + feedbackChars;

  let totalInputChars = 0;
  for (const batch of batches) {
    let batchChars = promptOverhead;
    for (const p of batch) {
      batchChars += estimateProductChars(p, useDescription);
    }
    totalInputChars += batchChars;
  }

  // Output schatting: ~60 chars per product per kolom (JSON overhead)
  const totalOutputChars = products.length * selectedColumns.length * 60 + products.length * 80;

  // 1.2x veiligheidsmarge voor conservatieve schatting
  const inputTokens = Math.ceil((totalInputChars / CHARS_PER_TOKEN) * 1.2);
  const outputTokens = Math.ceil((totalOutputChars / CHARS_PER_TOKEN) * 1.2);
  const cost = calculateCost({ inputTokens, outputTokens });

  return {
    batches: batches.length,
    inputTokens,
    outputTokens,
    ...cost,
  };
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

function createDynamicBatches(products, useDescription, selectedColumns = []) {
  // Begrens batch-grootte ook op verwachte output (~60 chars per product per kolom)
  const colCount = Math.max(selectedColumns.length, 1);
  const maxByOutput = Math.max(5, Math.floor(14000 / (colCount * 60)));

  const batches = [];
  let currentBatch = [];
  let currentChars = 0;

  for (const product of products) {
    const chars = estimateProductChars(product, useDescription);

    if (currentBatch.length > 0 && (currentChars + chars > MAX_CHARS_PER_BATCH || currentBatch.length >= maxByOutput)) {
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
  // Zoek relevante feedback voor deze batch
  const feedback = findRelevantFeedback(products, selectedColumns);
  const feedbackText = formatFeedbackForPrompt(feedback);

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

  const skuList = products.map((p) => p.sku || "").join(", ");

  return `Je bent een specialist in B2B productdata voor een Nederlandse groothandel (verpakkingen, schoonmaak, kantoor, PBM, medisch, horeca, facilitair).

Extraheer attributen uit de productinformatie naar deze Akeneo-kolommen: ${columnList}

PRODUCTEN:
${productLines}

BELANGRIJK:
- Je MOET voor ELKE product een resultaat teruggeven. Verwachte SKUs: ${skuList}
- Analyseer ELKE titel grondig: kijk naar kleuren, maten, afmetingen, materialen, aantallen
- Voorbeelden van patronen die je MOET herkennen:
  - "18cm" → lengte_26: "18" (cm kolom)
  - "180mm" → lengte: "180" (mm kolom)
  - "blauw" of "blue" → kleur-nl_NL: "blauw", kleur-en_US: "blue"
  - "rood" of "red" → kleur-nl_NL: "rood", kleur-en_US: "red"
  - "40x48cm" → lengte_26: "40", breedte_27: "48"
  - "100st" of "(100)" → verpakt_per: "100"
  - "2-laags" → aantal_lagen: "2"
  - Modelnummers tussen haakjes: "(EC873523)" → mpn: "EC873523"

REGELS:
${descRule}
- ALLEEN extraheren wat letterlijk of sterk afleidbaar is
- confidence: "high" (letterlijk in tekst), "medium" (afleidbaar), "low" (twijfel)
- Niet te bepalen: value "" en confidence "empty"
- Kleuren altijd in het Nederlands voor kleur-nl_NL (White→wit, Black→zwart, Blue→blauw, Red→rood, Green→groen, Yellow→geel, Grey→grijs, Orange→oranje, Pink→roze, Brown→bruin, Purple→paars)
- Kleuren altijd in het Engels voor kleur-en_US
- Afmetingen: zet het GETAL in de juiste kolom op basis van de eenheid (mm→lengte, cm→lengte_26, m→lengte_25)
- Getallen ZONDER eenheid-suffix voor number-kolommen (dus "18" niet "18cm")
- Vermeld in "opmerkingen" als iets onduidelijk is

Antwoord ALLEEN met valid JSON, geen markdown, geen backticks.
Er moeten PRECIES ${products.length} items in de array staan, één per product:
[{"sku":"...","attributes":{"kolom_id":{"value":"...","confidence":"high|medium|low|empty"}},"opmerkingen":"optioneel"}]${feedbackText}`;
}

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    // 60 seconden timeout per poging
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), 60000);

    // Combineer timeout-signal met eventueel extern signal (annuleerknop)
    const mergedSignal = options.signal
      ? AbortSignal.any([options.signal, timeoutController.signal])
      : timeoutController.signal;

    try {
      const response = await fetch(url, { ...options, signal: mergedSignal });
      clearTimeout(timeout);

      if (response.status === 429 || response.status === 529 || (response.status >= 500 && response.status < 600)) {
        if (attempt < retries) {
          const delay = Math.pow(2, attempt + 1) * 1000;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      return response;
    } catch (err) {
      clearTimeout(timeout);
      // Als het een extern abort-signaal is (annuleerknop), meteen doorgooin
      if (options.signal?.aborted) throw err;
      // Als het een timeout is, behandel als retry-bare fout
      if (timeoutController.signal.aborted && attempt < retries) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
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

// Bereken dynamische max_tokens op basis van batch-grootte en kolommen
function calcMaxTokens(batchSize, columnCount) {
  // ~60 chars JSON output per product per kolom, 3.5 chars per token
  const estimatedOutputTokens = Math.ceil((batchSize * columnCount * 60) / CHARS_PER_TOKEN);
  return Math.min(8192, Math.max(4096, Math.ceil(estimatedOutputTokens * 1.5)));
}

// Robuuste JSON-parser: probeert meerdere strategieen
function safeParseJSON(text) {
  const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();

  // Poging 1: directe parse
  try {
    const result = JSON.parse(cleaned);
    // Claude wrapt soms in een object
    if (result && !Array.isArray(result) && Array.isArray(result.results)) return result.results;
    if (Array.isArray(result)) return result;
  } catch { /* probeer verdere opschoning */ }

  // Poging 2: strip alles voor eerste [ en na laatste ]
  try {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start >= 0 && end > start) {
      const sliced = cleaned.slice(start, end + 1);
      const result = JSON.parse(sliced);
      if (Array.isArray(result)) return result;
    }
  } catch { /* geef op */ }

  return null;
}

async function processBatch(batch, selectedColumns, apiKey, useDescription, signal) {
  const prompt = buildPrompt(batch, selectedColumns, useDescription);
  const maxTokens = calcMaxTokens(batch.length, selectedColumns.length);
  const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    signal,
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
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
  const parsed = safeParseJSON(text);

  // Als JSON helemaal niet geparsed kan worden: fallback per SKU
  if (!parsed) {
    const fallback = batch.map((p) => ({
      sku: String(p.sku || ""),
      attributes: {},
      opmerkingen: "JSON-parse fout — handmatig invullen",
    }));
    return { results: fallback, usage: batchUsage };
  }

  // Validate: ensure every SKU in the batch has a result
  const resultMap = new Map();
  for (const r of parsed) {
    if (r && r.sku) resultMap.set(String(r.sku), r);
  }

  const validated = batch.map((p) => {
    const sku = String(p.sku || "");
    if (resultMap.has(sku)) return resultMap.get(sku);
    return {
      sku,
      attributes: {},
      opmerkingen: "Niet geretourneerd door model — mogelijk opnieuw proberen",
    };
  });

  return { results: validated, usage: batchUsage };
}

export async function extractAttributes(
  products,
  selectedColumns,
  apiKey,
  onProgress,
  useDescription = false,
  signal = null
) {
  const batches = createDynamicBatches(products, useDescription, selectedColumns);

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
        const result = await processBatch(batch, selectedColumns, apiKey, useDescription, signal);
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

    // Checkpoint: sla tussenresultaten op in sessionStorage
    try {
      sessionStorage.setItem("akeneo_checkpoint", JSON.stringify({
        resultsByIndex,
        usage: { ...usage },
        completedBatches: completed,
        totalBatches: batches.length,
      }));
    } catch { /* sessionStorage vol of niet beschikbaar */ }

    if (queue.length > 0) {
      processNext();
    }
  }

  // Checkpoint opruimen na succesvolle afronding
  try { sessionStorage.removeItem("akeneo_checkpoint"); } catch {}

  // Assemble results in original order
  for (let i = 0; i < batches.length; i++) {
    if (resultsByIndex[i]) {
      allResults.push(...resultsByIndex[i]);
    }
  }

  return { results: allResults, errors, usage };
}
