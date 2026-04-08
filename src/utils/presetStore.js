const STORAGE_KEY = "akeneo_presets";

// Ingebouwde presets
const BUILT_IN = [
  {
    name: "Basis attributen",
    columns: ["kleur-nl_NL", "kleur-en_US", "maat-nl_NL", "maat-en_US", "soort_materiaal", "verpakt_per", "lengte_26", "breedte_27", "hoogte_28"],
    builtIn: true,
  },
];

export function getPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const custom = raw ? JSON.parse(raw) : [];
    return [...BUILT_IN, ...custom];
  } catch {
    return [...BUILT_IN];
  }
}

export function savePreset(name, columns) {
  const existing = getPresets().filter((p) => !p.builtIn);
  // Overschrijf als naam al bestaat
  const idx = existing.findIndex((p) => p.name === name);
  const entry = { name, columns, createdAt: new Date().toISOString() };
  if (idx >= 0) {
    existing[idx] = entry;
  } else {
    existing.push(entry);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function deletePreset(name) {
  const existing = getPresets().filter((p) => !p.builtIn && p.name !== name);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}
