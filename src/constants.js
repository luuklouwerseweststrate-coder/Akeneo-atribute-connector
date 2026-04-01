// Systeem-kolommen: worden NOOIT geëxtraheerd uit producttitels
export const SYSTEM_COLS = new Set([
  // Basis & meta
  "sku", "categories", "family", "groups", "enabled",
  "erp_name", "erp_name-en_US", "erp_name-nl_NL",
  "variation_name", "variation_name-en_US", "variation_name-nl_NL",
  "meta_title", "meta_title-en_US", "meta_title-nl_NL",
  "meta_description", "meta_description-en_US", "meta_description-nl_NL",
  "keywords", "keywords-en_US", "keywords-nl_NL",
  "description", "description-en_US", "description-nl_NL",

  // Systeem & instellingen
  "vat", "product_shift", "min_order", "product_unit",
  "ws_keuze", "op_is_op", "custom_label", "action", "end_of_life",
  "supplier",

  // Media & downloads
  "thumbnail", "image_1", "image_2", "image_3", "image_4",
  "video_urls", "video_urls-en_US", "video_urls-nl_NL",
  "PDF", "PDF_2",
  "Download_vulinstructie", "Download_Brochure_2", "Download_certificaat",

  // Tekstvelden
  "kantoormeubilair_tekstveld",

  // Leverancierscodes & productnummers
  "Codering_Satino_by_Wepa", "Codering_Tork", "Kwaliteit_Tork",
  "Codering_BlackSatino", "Codering_nl",
  "Tork_productnummer", "Satino_productnummer",
  "Satino_productnummer_doos", "Satino_productnummer_pallet",
  "Q_nummer", "Duni_productnummer", "Dessinnummer",
  "Euro_products_productnummer", "SC_Johnson_productnummer",
  "Vileda_productnummer", "Vileda_productnummer_stuk",
  "BulkySoft_productnummer", "Oude_artikelnummer_satino",
  "Bestelnummer",

  // EAN-codes
  "ean", "EAN_colli", "EAN_consumenteneenheid", "EAN_pallet", "EAN_artikelcode",

  // Relaties
  "accessories-groups", "accessories-products", "accessories-product_models",
  "alternatives-groups", "alternatives-products", "alternatives-product_models",
  "related-groups", "related-products", "related-product_models",
  "variations-groups", "variations-products", "variations-product_models",

  // Intern
  "Showmodel_aanwezig",
]);

// Kolommen die standaard aangevinkt worden als ze leeg zijn
export const AUTO_SELECT = new Set([
  // Kleur & maat
  "kleur", "kleur-nl_NL", "kleur-en_US", "maat", "maat-nl_NL", "maat-en_US",

  // Materiaal & eigenschappen
  "soort_materiaal", "gerecycled", "materiaalsterkte",

  // Afmetingen
  "lengte", "breedte", "hoogte",
  "lengte_25", "lengte_26", "breedte_27", "hoogte_28",
  "breedte_m", "Hoogte_meter",
  "diametercm", "diametermm",
  "dikte", "dikte_mm",

  // Inhoud & gewicht
  "inhoud", "Inhoud_ml", "Inhoud_ml_number",
  "gewicht", "gewicht_gram",

  // Verpakking
  "verpakt_per", "aantal_op_pallet", "aantal_lagen",

  // Product-eigenschappen
  "Uitvoering", "Vorm", "Voedselgeschikt", "Bedrukt", "Duurzaam",
  "Milieukenmerk", "SUP_proof_simple_select",
  "Type_servies_en_bestek", "Geur",

  // Overig
  "mpn", "meters_rol", "brand",
]);

// Human-readable labels voor alle extracteerbare attributen
export const LABELS = {
  // Basis
  brand: "Merk",
  mpn: "Modelnaam",
  Model: "Model",
  supported_devices: "Ondersteunde apparaten",

  // Kleur & maat
  kleur: "Kleur",
  "kleur-nl_NL": "Kleur (NL)",
  "kleur-en_US": "Kleur (EN)",
  Kleur_facilitair: "Kleur (facilitair)",
  maat: "Maat",
  "maat-nl_NL": "Maat (NL)",
  "maat-en_US": "Maat (EN)",

  // Materiaal
  soort_materiaal: "Materiaal",
  gerecycled: "Gerecycled",
  materiaalsterkte: "Materiaalsterkte",
  Materiaal_drager: "Materiaal drager",
  Materiaal_coating: "Materiaal coating",
  Materiaal_montuur: "Materiaal montuur",
  Materiaal_lens: "Materiaal lens",
  Materiaal_kassarol: "Materiaal kassarol",
  Materiaal_frame: "Materiaal frame",
  Materiaal_blad: "Materiaal blad",

  // Afmetingen (mm)
  lengte: "Lengte (mm)",
  breedte: "Breedte (mm)",
  hoogte: "Hoogte (mm)",
  Binnenlengte_MM: "Binnenlengte (mm)",
  Buitenlengte_MM: "Buitenlengte (mm)",
  Buitenhoogte_mm: "Buitenhoogte (mm)",

  // Afmetingen (cm)
  lengte_26: "Lengte (cm)",
  breedte_27: "Breedte (cm)",
  hoogte_28: "Hoogte (cm)",
  Hoogte_cm: "Hoogte (cm)",
  binnenlengte: "Binnenlengte (cm)",
  binnenbredte: "Binnenbredte (cm)",
  binnenhoogte: "Binnenhoogte (cm)",
  buitenlengte: "Buitenlengte (cm)",
  buitenbreedte: "Buitenbredte (cm)",
  Zijvouw_cm: "Zijvouw (cm)",
  Zijvouw_zak_cm: "Zijvouw zak (cm)",

  // Afmetingen (m)
  lengte_25: "Lengte (m)",
  breedte_m: "Breedte (m)",
  Hoogte_meter: "Hoogte (m)",

  // Diameter
  diametermm: "Diameter (mm)",
  diametercm: "Diameter (cm)",
  diameter_rol: "Diameter rol",

  // Dikte
  dikte: "Dikte (micron)",
  dikte_mm: "Dikte (mm)",
  Dikte_T_waardes: "Dikte (T-waardes)",
  Bladdikte: "Bladdikte",

  // Inhoud
  inhoud: "Inhoud (liter)",
  Inhoud_ml: "Inhoud (ml)",
  Inhoud_ml_number: "Inhoud (ml)",
  Inhoud_per_flacon: "Inhoud per flacon",
  Vulcapaciteit: "Vulcapaciteit",
  Capaciteit: "Capaciteit",
  Zakinhoud: "Zakinhoud",

  // Gewicht
  gewicht: "Gewicht (kg)",
  gewicht_gram: "Gewicht (gram)",
  draagvermogen: "Draagvermogen",
  Totaal_draagvermogen: "Totaal draagvermogen",
  Draagvermogen_etage_kg: "Draagvermogen etage (kg)",

  // Verpakking & aantallen
  verpakt_per: "Verpakt per",
  aantal_op_pallet: "Aantal/pallet",
  aantal_lagen: "Aantal lagen",
  aantal_vellen_per_pak: "Vellen/pak",
  Aantal_vellen_per_rol: "Vellen/rol",
  Aantal_colli_per_pallet: "Colli/pallet",
  Doseringen_per_cartridge: "Doseringen/cartridge",
  Stuks_per_doos_ca: "Stuks/doos (ca.)",
  Aantal_tabs: "Aantal tabs",
  Aantal_gaten: "Aantal gaten",
  Aantal_zakken: "Aantal zakken",
  Aantal_blokkadestanden: "Blokkadestanden",

  // Rollen & vellen
  meters_rol: "Meters/rol",
  Rolbreedte: "Rolbreedte",
  Rollengte: "Rollengte",
  Rolbreedte_cadeaupapier: "Rolbreedte cadeaupapier",
  Vellengte: "Vellengte",
  Velbreedte: "Velbreedte",
  Veldiepte: "Veldiepte",
  kerndiameter_kassarol: "Kerndiameter kassarol",
  Kerndiameter: "Kerndiameter",

  // Producttype & uitvoering
  Uitvoering: "Uitvoering",
  Uitvoering_facilitair: "Uitvoering (facilitair)",
  Vorm: "Vorm",
  Type: "Type",
  Type_Merk: "Type/Merk",
  Type_servies_en_bestek: "Type servies & bestek",
  type_versverpakking: "Type versverpakking",
  Type_sluiting: "Type sluiting",
  Type_embossing: "Type embossing",
  Type_cartridge: "Type cartridge",
  Type_cadeaudoos: "Type cadeaudoos",
  Type_krullint: "Type krullint",
  Type_markering: "Type markering",
  type_afvalbak: "Type afvalbak",
  Type_stoel: "Type stoel",
  Type_Tafel: "Type tafel",
  Type_rugleuning: "Type rugleuning",
  Type_bediening: "Type bediening",

  // Eigenschappen
  Voedselgeschikt: "Voedselgeschikt",
  Bedrukt: "Bedrukt",
  Duurzaam: "Duurzaam",
  Milieukenmerk: "Milieukenmerk",
  SUP_proof_simple_select: "SUP-proof",
  Geperforeerd: "Geperforeerd",
  Storingsvrij: "Storingsvrij",
  pe_gecoat: "PE gecoat",
  automatische_bodem: "Automatische bodem",
  zelfklevende_sluiting: "Zelfklevende sluiting",
  vuurbestendig: "Vuurbestendig",
  vlamdovend: "Vlamdovend",
  vingerafdruk_vrij: "Vingerafdrukvrij",
  gedempt_deksel: "Gedempt deksel",
  Handgrepen: "Handgrepen",
  handgreep: "Handgreep",
  binnenemmer: "Binnenemmer",
  Buitengebruik: "Buitengebruik",
  Sensor: "Sensor",

  // Papier & karton
  karton_kwaliteit: "Karton kwaliteit",
  Papier_Kwaliteit: "Papier kwaliteit",
  Papierdikte_grams: "Papierdikte (g/m²)",
  papierformaat: "Papierformaat",
  vouwwijze: "Vouwwijze",
  cie_witwaarde: "CIE witwaarde",
  Kwaliteit: "Kwaliteit",
  Koelgaten_dozen: "Koelgaten dozen",

  // Folie & tape
  rekpercentage_folie_150: "Rekpercentage folie 150%",
  wikkeling: "Wikkeling",
  zijvouw: "Zijvouw",
  Tape_materiaal: "Tape materiaal",
  Tape_lijmkeuze: "Tape lijmkeuze",
  Tape_hand_afscheurbaar: "Tape handafscheurbaar",

  // Etiketten
  soort_etiket: "Soort etiket",
  Vorm_etiket: "Vorm etiket",
  lijmkeuze: "Lijmkeuze",

  // Printer & technologie
  technologie: "Technologie",
  printkop: "Printkop",
  Printkop_: "Printkop",
  gebruikersinterface: "Gebruikersinterface",
  printsnelheid: "Printsnelheid",
  resolutie: "Resolutie",
  printlengte: "Printlengte",
  lintlengte: "Lintlengte",
  geschikt_voor_printertype_s: "Geschikt voor printertype(s)",
  Compatible_with: "Compatibel met",
  geschikt_voor: "Geschikt voor",

  // Afval & schoonmaak
  Afvalstroom: "Afvalstroom",
  Afvalscheiding: "Afvalscheiding",
  verpakking_afvalverwerking: "Verpakking afvalverwerking",
  Werking: "Werking",
  handling_dispenser: "Handling dispenser",
  Dispensermaat: "Dispensermaat",

  // Zakken
  Zaklengte: "Zaklengte",
  Zakbreedte: "Zakbreedte",
  Zakdikte: "Zakdikte",

  // Geur & thema
  Geur: "Geur",
  Zeepgeur: "Zeepgeur",
  Geurduur: "Geurduur",
  Thema: "Thema",
  Dessin: "Dessin",

  // Flessen & dispensers
  soort_fles: "Soort fles",
  Dispenser_lengte: "Dispenser lengte",
  Dispenser_breedte: "Dispenser breedte",
  Dispenser_diepte: "Dispenser diepte",

  // PBM & veiligheid
  Normering: "Normering",
  Waarde_normering: "Waarde normering",
  Certificering: "Certificering",
  Manchet_stijl: "Manchet stijl",
  Lens_kleur: "Lens kleur",
  Lens_coating: "Lens coating",
  type_band: "Type band",
  lengte_lepels: "Lengte lepels",
  dB: "Geluid (dB)",

  // Meubilair — stoelen
  Verstelbare_zithoogte: "Verstelbare zithoogte",
  Verstelbare_zitdiepte: "Verstelbare zitdiepte",
  Voetenkruis: "Voetenkruis",
  Armleggers: "Armleggers",
  Hoogte_verstelbare_lendensteun: "Hoogte verstelbare lendensteun",
  Zittingverlening: "Zittingverlening",
  Hoogte_verstelbare_armleuningen: "Hoogte verstelbare armleuningen",
  Breedte_verstelbare_armleuningen: "Breedte verstelbare armleuningen",
  Diepte_verstelbare_armleuningen: "Diepte verstelbare armleuningen",
  Speciale_eigenschappen: "Speciale eigenschappen",
  Wielen: "Wielen",
  Rugleuning_hoogte_verstelbaar: "Rugleuning hoogte verstelbaar",
  Regelbare_tegendruk_rugleuning: "Regelbare tegendruk rugleuning",
  Zwenkbare_armleggers: "Zwenkbare armleggers",

  // Meubilair — bureaus & tafels
  Zit_stabureau: "Zit-stabureau",
  Hoogte_verstelbaar_bureau: "Hoogte verstelbaar bureau",
  Bedieningswijze_bureau: "Bedieningswijze bureau",
  Pootkleur_bureau: "Pootkleur bureau",
  Bladkleur_bureau: "Bladkleur bureau",
  formaat_werkblad: "Formaat werkblad",
  Framekleur: "Framekleur",

  // Transport & logistiek
  Wielmaat: "Wielmaat",
  Wielmateriaal: "Wielmateriaal",
  Laadvlak: "Laadvlak",
  Laadvlak_lengte: "Laadvlak lengte",
  Laadvlak_breedte: "Laadvlak breedte",
  Laadvlak_hoogte: "Laadvlak hoogte",
  Totaalafmetingen: "Totaalafmetingen",
  Verstelbaarheid_hoogte: "Verstelbaarheid hoogte",
  Montage: "Montage",
  Etagehoogte_1: "Etagehoogte 1",
  Etagehoogte_2: "Etagehoogte 2",
  Etagehoogte_3: "Etagehoogte 3",
  Etagehoogte_4: "Etagehoogte 4",
  Etagehoogte_5: "Etagehoogte 5",

  // Kaarsen
  Brandtijd_uren: "Brandtijd (uren)",

  // Verpakking & overig
  Branche: "Branche",
  Pallethoogte: "Pallethoogte",
  Verpakking: "Verpakking",
  Verpakking_facilitair: "Verpakking (facilitair)",
  Verpakking_toilethygiene: "Verpakking (toilethygiëne)",
};
