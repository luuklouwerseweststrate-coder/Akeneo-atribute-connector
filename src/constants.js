export const SYSTEM_COLS = new Set([
  "sku", "categories", "family", "groups", "enabled", "end_of_life", "action",
  "vat", "product_shift", "min_order", "product_unit", "op_is_op", "ws_keuze",
  "thumbnail", "image_1", "image_2", "image_3", "image_4",
  "accessories-groups", "accessories-products", "accessories-product_models",
  "alternatives-groups", "alternatives-products", "alternatives-product_models",
  "related-groups", "related-products", "related-product_models",
  "variations-groups", "variations-products", "variations-product_models",
  "video_urls-en_US", "video_urls-nl_NL",
  "description-en_US", "description-nl_NL",
  "meta_description-en_US", "meta_description-nl_NL",
  "meta_title-en_US", "meta_title-nl_NL",
  "keywords-en_US", "keywords-nl_NL",
  "erp_name-en_US", "erp_name-nl_NL",
  "variation_name-en_US", "variation_name-nl_NL",
  "custom_label", "PDF", "PDF_2",
  "Download_vulinstructie", "Download_Brochure_2", "Download_certificaat",
]);

export const AUTO_SELECT = new Set([
  "kleur-nl_NL", "kleur-en_US", "maat-nl_NL", "maat-en_US", "soort_materiaal",
  "verpakt_per", "Uitvoering", "Vorm", "Voedselgeschikt", "Bedrukt", "Milieukenmerk",
  "lengte", "breedte", "hoogte", "lengte_26", "breedte_27", "hoogte_28",
  "inhoud", "Inhoud_ml", "gewicht", "gewicht_gram", "diametercm", "diametermm",
  "mpn", "SUP_proof_simple_select", "Duurzaam", "breedte_m", "Hoogte_meter",
  "lengte_25", "meters_rol", "dikte", "dikte_mm", "aantal_op_pallet",
]);

export const LABELS = {
  brand: "Merk", kleur: "Kleur", "kleur-nl_NL": "Kleur (NL)", "kleur-en_US": "Kleur (EN)",
  soort_materiaal: "Materiaal", maat: "Maat", "maat-nl_NL": "Maat (NL)", "maat-en_US": "Maat (EN)",
  verpakt_per: "Verpakt per", Uitvoering: "Uitvoering", Vorm: "Vorm",
  Voedselgeschikt: "Voedselgeschikt", Bedrukt: "Bedrukt", Duurzaam: "Duurzaam",
  Milieukenmerk: "Milieukenmerk", SUP_proof_simple_select: "SUP-proof",
  lengte: "Lengte (mm)", breedte: "Breedte (mm)", hoogte: "Hoogte (mm)",
  lengte_26: "Lengte (cm)", breedte_27: "Breedte (cm)", hoogte_28: "Hoogte (cm)",
  lengte_25: "Lengte (m)", breedte_m: "Breedte (m)", Hoogte_meter: "Hoogte (m)",
  inhoud: "Inhoud (liter)", Inhoud_ml: "Inhoud (ml)", Inhoud_ml_number: "Inhoud (ml)",
  gewicht: "Gewicht (kg)", gewicht_gram: "Gewicht (gram)",
  dikte: "Dikte (micron)", dikte_mm: "Dikte (mm)",
  diametermm: "Diameter (mm)", diametercm: "Diameter (cm)",
  aantal_op_pallet: "Aantal/pallet", meters_rol: "Meters/rol",
  mpn: "Modelnaam", ean: "EAN", EAN_artikelcode: "EAN (code)",
};
