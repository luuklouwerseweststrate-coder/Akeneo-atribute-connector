import { LABELS } from "../constants";

const BATCH_SIZE = 6;
const MODEL = "claude-sonnet-4-20250514";

// Sonnet 4 pricing (USD per 1M tokens)
const PRICE_INPUT = 3;
const PRICE_OUTPUT = 15;

export function calculateCost(usage) {
  const inputCost = (usage.inputTokens / 1_000_000) * PRICE_INPUT;
  const outputCost = (usage.outputTokens / 1_000_000) * PRICE_OUTPUT;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

function buildPrompt(products, selectedColumns) {
  const columnList = selectedColumns
    .map((col) => `${col} (${LABELS[col] || col})`)
    .join(", ");

  const productLines = products
    .map(
      (p) =>
        `- SKU: ${p.sku || ""}\n  ERP-naam: ${p["erp_name-nl_NL"] || ""}\n  Commercieel: ${p["variation_name-nl_NL"] || ""}\n  Merk: ${p.brand || ""}\n  Categorie: ${p.categories || ""}`
    )
    .join("\n");

  return `Je bent een specialist in B2B productdata voor een Nederlandse groothandel (verpakkingen, schoonmaak, kantoor, PBM, medisch, horeca, facilitair).

Extraheer attributen uit de producttitels naar deze Akeneo-kolommen: ${columnList}

PRODUCTEN:
${productLines}

REGELS:
- Gebruik BEIDE titels (ERP + commercieel) als bron
- ALLEEN extraheren wat letterlijk of sterk afleidbaar is
- confidence: "high" (letterlijk), "medium" (afleidbaar), "low" (twijfel)
- Niet te bepalen: value "" en confidence "empty"
- Kleuren Nederlands (White→wit, Black→zwart, Blue→blauw)
- Afmetingen in juiste eenheid per kolom (mm/cm/m/liter)
- Getallen zonder eenheid voor number-kolommen
- Patronen: "40x48cm", "100st", "2-laags", "T25"
- Bij kleur-nl_NL / kleur-en_US: Nederlandse resp. Engelse kleur
- Vermeld in "opmerkingen" als titel onduidelijk is

Antwoord ALLEEN met valid JSON, geen markdown, geen backticks:
[{"sku":"...","attributes":{"kolom_id":{"value":"...","confidence":"high|medium|low|empty"}},"opmerkingen":"optioneel"}]`;
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

export async function extractAttributes(
  products,
  selectedColumns,
  apiKey,
  onProgress
) {
  const batches = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    batches.push(products.slice(i, i + BATCH_SIZE));
  }

  const allResults = [];
  const errors = [];
  const usage = { inputTokens: 0, outputTokens: 0 };

  for (let i = 0; i < batches.length; i++) {
    onProgress({ current: i + 1, total: batches.length, usage: { ...usage } });

    try {
      const prompt = buildPrompt(batches[i], selectedColumns);
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
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Track token usage
      if (data.usage) {
        usage.inputTokens += data.usage.input_tokens || 0;
        usage.outputTokens += data.usage.output_tokens || 0;
      }

      const text = data.content?.[0]?.text || "[]";

      const cleaned = text.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      allResults.push(...parsed);
    } catch (err) {
      const batchSkus = batches[i].map((p) => p.sku || "onbekend");
      errors.push({ batch: i + 1, skus: batchSkus, error: err.message });
      for (const product of batches[i]) {
        allResults.push({
          sku: product.sku || "",
          attributes: {},
          opmerkingen: `Fout in batch ${i + 1}: ${err.message}`,
        });
      }
    }
  }

  return { results: allResults, errors, usage };
}
