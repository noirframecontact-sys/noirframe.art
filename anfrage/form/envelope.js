/**
 * Budowa envelope schemaVersion 1 dla publicznego formularza.
 * Działa w przeglądarce (type=module) i w Node (testy).
 * Nie wysyła nic na sieć.
 */

import { preferredWindowNotes } from "./schedule.js";

export const DEFAULT_UHRZEIT = "12:00";

export const PUBLIC_FORM_TITLE = "NOIR FRAME – Buchungsanfrage";
export const PUBLIC_BRAND = "NOIR FRAME";

export const SUCCESS_HEADING =
  "Die Online-Anfragefunktion wird derzeit vorbereitet. Ihre Angaben werden noch nicht übermittelt.";
export const SUCCESS_BODY =
  "Es findet keine Übermittlung an NOIR FRAME und keine Speicherung Ihrer Angaben statt.";
export const UNCHECKED_TIME_NOTICE =
  "Eine konkrete Uhrzeit wurde nicht geprüft und nicht vorgemerkt.";
export const DRY_RUN_HEADING = "Testmodus – Ihre Anfrage wurde nicht versendet.";
export const DRY_RUN_BODY =
  "Diese lokale Testumgebung sendet nichts an NOIR FRAME und nichts an eNFOP. Ein erneuter Test erfordert ein Neu laden der Seite.";
export const DEMO_UNAVAILABLE_HEADING =
  "Die Online-Anfragefunktion wird derzeit vorbereitet. Ihre Angaben werden noch nicht übermittelt.";
export const REVIEW_HEADING = "Bitte Angaben prüfen";
export const REVIEW_NOTE =
  "Das ist eine Anfrage, keine bestätigte Buchung und kein Vertrag.";
export const REVIEW_LABEL = "Angaben prüfen";
export const REVIEW_BACK_LABEL = "Angaben ändern";
export const SEND_LABEL = "Anfrage senden";
export const SEND_BUSY_LABEL = "Wird gesendet …";
export const BOOKING_STEPS_TITLE = "So läuft die Buchung ab";
export const BOOKING_STEPS = [
  "Sie senden eine Anfrage. Damit ist noch nichts gebucht.",
  "NOIR FRAME prüft den Wunschtermin und die Angaben.",
  "Sie erhalten von uns eine persönliche Antwort — per E-Mail oder telefonisch. Dieses Formular verschickt keine automatische Bestätigung.",
  "Erst eine ausdrückliche Zusage von NOIR FRAME ist verbindlich.",
];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function bookingFlowHtml() {
  const items = BOOKING_STEPS.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
  return (
    `<h2 class="booking-flow__title">${escapeHtml(BOOKING_STEPS_TITLE)}</h2>` +
    `<ol class="booking-flow__steps">${items}</ol>`
  );
}

export function successCardHtml(options) {
  const timeEmpty = Boolean(options && options.timeEmpty);
  const notice = timeEmpty
    ? `<p class="success__notice">${escapeHtml(UNCHECKED_TIME_NOTICE)}</p>`
    : "";
  return (
    `<h2 class="success__heading">${escapeHtml(SUCCESS_HEADING)}</h2>` +
    `<p class="success__body">${escapeHtml(SUCCESS_BODY)}</p>` +
    notice +
    `<section class="booking-flow booking-flow--success">${bookingFlowHtml()}</section>`
  );
}

export function dryRunCardHtml() {
  return (
    `<h2 class="success__heading">${escapeHtml(DRY_RUN_HEADING)}</h2>` +
    `<p class="success__body">${escapeHtml(DRY_RUN_BODY)}</p>` +
    `<section class="booking-flow booking-flow--success">${bookingFlowHtml()}</section>`
  );
}

export function demoUnavailableCardHtml() {
  return `<h2 class="success__heading">${escapeHtml(DEMO_UNAVAILABLE_HEADING)}</h2>`;
}

export function isDryRunOutcome(result) {
  return Boolean(result && result.ok && (result.dryRun || result.blockedNetwork));
}

export function isConfirmedAcceptance(result) {
  return Boolean(
    result && result.ok && !result.dryRun && !result.blockedNetwork && !result.error,
  );
}

function reviewRow(label, value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return (
    `<div class="review__row"><dt>${escapeHtml(label)}</dt>` +
    `<dd>${escapeHtml(text)}</dd></div>`
  );
}

export function reviewSummaryHtml(model) {
  const data = model || {};
  const addonRows = Array.isArray(data.addons)
    ? data.addons
        .map((item) => reviewRow(item && item.name, item && item.preis))
        .join("")
    : "";
  return (
    `<h2 class="review__heading">${escapeHtml(REVIEW_HEADING)}</h2>` +
    `<p class="review__lede">${escapeHtml(REVIEW_NOTE)}</p>` +
    `<dl class="review__list">` +
    reviewRow("Leistung", data.leistung) +
    reviewRow("Paket", data.paket) +
    reviewRow("Paketpreis", data.paketPreis) +
    (addonRows || reviewRow("Zusatzleistungen", "keine")) +
    reviewRow("Gesamtpreis", data.gesamt) +
    reviewRow("Vorname", data.vorname) +
    reviewRow("Nachname", data.nachname) +
    reviewRow("Telefon", data.telefon) +
    reviewRow("E-Mail", data.email) +
    reviewRow("Kundenadresse", data.kundenadresse) +
    reviewRow("Event-Adresse", data.eventadresse) +
    reviewRow("Wunschdatum", data.datum) +
    reviewRow("Gewünschter Beginn", data.uhrzeit || "nicht angegeben") +
    reviewRow("Geplante Dauer", data.dauer) +
    `</dl>`
  );
}

export function newKartkaId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const PUBLIC_HIDDEN_PACKAGE_IDS = [];

export function packagesForCategory(catalog, categoryIds) {
  const ids = Array.isArray(categoryIds) ? categoryIds : [];
  const out = [];
  if (!catalog || !Array.isArray(catalog.kategorien)) return out;
  for (const katId of ids) {
    const kat = catalog.kategorien.find((item) => item.id === katId);
    if (!kat) continue;
    for (const paket of kat.pakete || []) {
      if (!paket || PUBLIC_HIDDEN_PACKAGE_IDS.includes(paket.id)) continue;
      out.push({
        id: paket.id,
        name: paket.name,
        preisAnzeige: paket.preisAnzeige,
        kurzbeschreibung: paket.kurzbeschreibung || "",
        kategorieId: kat.id,
        kategorieName: kat.name,
      });
    }
  }
  return out;
}

export const PACKAGES_WITHOUT_ADDONS = [
  "geburtstag-mini-plus",
  "business-standard",
];

export const PUBLIC_HOURLY_ADDON_IDS = [
  "zweiter-fotograf",
  "zusaetzliche-fotografenzeit",
];
export const PUBLIC_HIDDEN_ADDON_IDS = [
  "zusaetzliche-stunde",
  "zweiter-fotograf-pauschale",
  "zweiter-fotograf-4h",
  "zweiter-fotograf-8h",
];
export const HOURLY_ADDON_CENTS = {
  "zweiter-fotograf": 6000,
  "zusaetzliche-fotografenzeit": 4900,
};
export const HOURLY_ADDON_MAX_HOURS = 24;
export const ADDON_TIME_NOTE =
  "Die Einsatzdauer eines zweiten Fotografen wird nach tatsächlichem Zeitaufwand berechnet. Die Verfügbarkeit muss vorab bestätigt werden.";
export const PRICE_SUMMARY_LABELS = {
  paket: "Paketpreis",
  gesamt: "Gesamtpreis",
};

export function parseEuroAnzeigeToCents(text) {
  let raw = String(text || "").trim();
  if (!raw) return 0;
  raw = raw.replace(/€\s*\/\s*h/i, "").replace(/€/g, "").replace(/\s/g, "");
  raw = raw.replace(/[^\d,.\-−]/g, "");
  if (!raw) return 0;
  const negative = raw.startsWith("-") || raw.startsWith("−");
  raw = raw.replace(/^[-−]/, "");
  let euros = 0;
  let cents = 0;
  if (raw.includes(",")) {
    const [left, right = ""] = raw.split(",");
    euros = Number(String(left).replace(/\./g, ""));
    cents = Number(String(right).replace(/\D/g, "").padEnd(2, "0").slice(0, 2));
  } else {
    euros = Number(raw.replace(/\./g, ""));
  }
  if (!Number.isFinite(euros) || !Number.isFinite(cents)) return 0;
  const total = Math.round(euros * 100 + cents);
  return negative ? -total : total;
}

export function formatEuroAnzeige(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "";
  const sign = n < 0 ? "\u2212" : "";
  const abs = Math.abs(Math.round(n));
  const euros = Math.floor(abs / 100);
  const rest = abs % 100;
  const grouped = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (rest === 0) return `${sign}${grouped} \u20AC`;
  return `${sign}${grouped},${String(rest).padStart(2, "0")} \u20AC`;
}

export function normalizeAddonHours(raw) {
  const out = {};
  for (const id of PUBLIC_HOURLY_ADDON_IDS) {
    const n = Number(raw && raw[id]);
    if (!Number.isFinite(n)) {
      out[id] = 0;
      continue;
    }
    out[id] = Math.max(0, Math.min(HOURLY_ADDON_MAX_HOURS, Math.round(n)));
  }
  return out;
}

export function hourlyAddonRateCents(item) {
  const fromLabel = parseEuroAnzeigeToCents(item && item.preisAnzeige);
  if (fromLabel > 0) return fromLabel;
  const id = item && item.id;
  return id && HOURLY_ADDON_CENTS[id] ? HOURLY_ADDON_CENTS[id] : 0;
}

export function inquiryPriceBreakdown(paket, addonHours, catalogAddons, selectedBooleanIds) {
  const preisAnzeige = paket && paket.preisAnzeige ? String(paket.preisAnzeige).trim() : "";
  const paketCents = parseEuroAnzeigeToCents(preisAnzeige);
  const hours = normalizeAddonHours(addonHours);
  const pool = Array.isArray(catalogAddons) ? catalogAddons : [];
  const selected = new Set(
    (Array.isArray(selectedBooleanIds) ? selectedBooleanIds : []).map((id) => String(id)),
  );
  const hourly = new Set(PUBLIC_HOURLY_ADDON_IDS);
  const lines = [];
  if (preisAnzeige) {
    lines.push({
      id: "paket",
      label: PRICE_SUMMARY_LABELS.paket,
      stunden: 0,
      betragCents: paketCents,
      betragAnzeige: formatEuroAnzeige(paketCents),
    });
  }
  let extraCents = 0;
  const zusatzStunden = [];
  for (const id of PUBLIC_HOURLY_ADDON_IDS) {
    const stunden = hours[id];
    const item = pool.find((entry) => entry && entry.id === id);
    if (!item) continue;
    const satzCents = hourlyAddonRateCents(item);
    const betragCents = stunden * satzCents;
    extraCents += betragCents;
    if (stunden <= 0) continue;
    const betragAnzeige = formatEuroAnzeige(betragCents);
    lines.push({
      id,
      label: `${item.name} (${stunden} Std.)`,
      stunden,
      satzCents,
      satzAnzeige: item.preisAnzeige || formatEuroAnzeige(satzCents) + "/h",
      betragCents,
      betragAnzeige,
    });
    zusatzStunden.push({
      id,
      name: item.name,
      stunden,
      satzCents,
      satzAnzeige: item.preisAnzeige || "",
      betragCents,
      betragAnzeige,
    });
  }
  for (const item of pool) {
    if (!item || !item.id || hourly.has(item.id) || !selected.has(item.id)) continue;
    const betragCents = parseEuroAnzeigeToCents(item.preisAnzeige);
    extraCents += betragCents;
    lines.push({
      id: item.id,
      label: item.name,
      stunden: 0,
      betragCents,
      betragAnzeige: formatEuroAnzeige(betragCents),
    });
  }
  const gesamtCents = paketCents + extraCents;
  return {
    paketCents,
    zusaetzeCents: extraCents,
    gesamtCents,
    paketAnzeige: formatEuroAnzeige(paketCents),
    gesamtAnzeige: formatEuroAnzeige(gesamtCents),
    hours,
    lines,
    zusatzStunden,
  };
}

export const PACKAGE_EXCLUDED_ADDON_IDS = {
  "hochzeit-standard": ["highlight-video-4k", "drohne-4k"],
  "hochzeit-premium": ["highlight-video-4k", "drohne-4k"],
  "standesamt-classic-video": ["highlight-video-4k"],
  "henna-premium": ["highlight-video-4k", "drohne-4k"],
  "engagement-premium": ["highlight-video-4k"],
  "geburtstag-premium": ["highlight-video-4k"],
  "familie-standard": ["drohne-4k", "social-media-reel", "highlight-video-4k"],
  "kirchenzeremonie-audio": ["highlight-video-4k"],
};

export const SHARED_BOOLEAN_ADDON_IDS = [
  "drohne-4k",
  "highlight-video-4k",
  "social-media-reel",
  "express-delivery",
  "spezialeffekte",
];

export const ADDON_EQUIVALENT_IDS = {
  "highlightfilm-3-5-min": "highlight-video-4k",
  "neugeborene-video-upgrade": "highlight-video-4k",
  "drohnenaufnahmen-optional": "drohne-4k",
};

function canonicalAddonId(addonId) {
  const id = String(addonId || "");
  return ADDON_EQUIVALENT_IDS[id] || id;
}

export function packageScopeItems(kurzbeschreibung) {
  const text = String(kurzbeschreibung || "").trim();
  if (!text) return [];
  if (text.includes("·")) {
    return text.split("·").map((part) => part.trim()).filter(Boolean);
  }
  const protectedText = text.replace(/(\d),(\d)/g, "$1\u0000$2");
  return protectedText
    .split(",")
    .map((part) => part.replace(/\u0000/g, ",").trim())
    .filter(Boolean);
}

export function selectedPackageView(paket) {
  if (!paket) return null;
  const kurzbeschreibung = String(paket.kurzbeschreibung || "").trim();
  return {
    id: paket.id || "",
    name: String(paket.name || "").trim(),
    preisAnzeige: String(paket.preisAnzeige || "").trim(),
    kurzbeschreibung,
    scopeItems: packageScopeItems(kurzbeschreibung),
  };
}

export const BUSINESS_STANDARD_PACKAGE_ID = "business-standard";
export const BUSINESS_NEW_CUSTOMER_CODE = "NF-BUSINESS-15";
export const BUSINESS_DISCOUNT_PERCENT = 15;
export const BUSINESS_STANDARD_REGULAR_CENTS = 45000;
export const BUSINESS_STANDARD_DISCOUNT_CENTS = 6750;
export const BUSINESS_STANDARD_AFTER_CENTS = 38250;
export const DISCOUNT_MANUAL_REVIEW_NOTE =
  "Rabatt vorbehaltlich manueller Prüfung durch NOIR FRAME.";
/**
 * Spätere Neukundenprüfung könnte E-Mail, Vorname/Nachname und Telefon
 * mit früheren Anfragen vergleichen. Dafür fehlt hier ein autorisierter,
 * zuverlässiger Bestand. Dieses Formular fragt nicht eNFOP, SQLite, KV
 * oder andere Produktivsysteme ab und behauptet keine automatische Prüfung.
 */
export const BUSINESS_DISCOUNT_COMPARISON_FIELDS = ["email", "vorname", "nachname", "telefon"];
export const BUSINESS_DISCOUNT_AUTOCHECK_MISSING = [
  "Kein autorisierter Bestand früherer Anfragen im öffentlichen Formular.",
  "Kein Zugriff auf eNFOP, SQLite, KV oder andere Produktivsysteme.",
  "Keine Netzwerkanfrage und keine Übermittlung persönlicher Daten zur Prüfung.",
];

export function formatEuroCents(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return "";
  const sign = n < 0 ? "\u2212" : "";
  const abs = Math.abs(Math.round(n));
  const euros = Math.floor(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  return `${sign}${euros},${rest} \u20AC`;
}

export function normalizeDiscountCode(raw) {
  return String(raw || "").trim();
}

export function recognizeBusinessDiscountCode(raw) {
  return normalizeDiscountCode(raw) === BUSINESS_NEW_CUSTOMER_CODE;
}

export function evaluateBusinessDiscount(packageId, rawCode) {
  const codeEntered = normalizeDiscountCode(rawCode);
  const eligiblePackage = String(packageId || "") === BUSINESS_STANDARD_PACKAGE_ID;
  const erkannt = eligiblePackage && recognizeBusinessDiscountCode(codeEntered);
  return {
    packageId: String(packageId || ""),
    codeEntered,
    erkannt,
    katalogpreis: "450 \u20AC",
    regulaererPreis: formatEuroCents(BUSINESS_STANDARD_REGULAR_CENTS),
    vorgesehenerRabatt: formatEuroCents(-BUSINESS_STANDARD_DISCOUNT_CENTS),
    preisNachRabatt: formatEuroCents(BUSINESS_STANDARD_AFTER_CENTS),
    hinweis: erkannt ? DISCOUNT_MANUAL_REVIEW_NOTE : "",
  };
}

export function businessDiscountPayload(packageId, rawCode, katalogpreisAnzeige) {
  const preview = evaluateBusinessDiscount(packageId, rawCode);
  if (preview.packageId !== BUSINESS_STANDARD_PACKAGE_ID) return null;
  const katalogpreis = String(katalogpreisAnzeige || "").trim() || preview.katalogpreis;
  const payload = {
    code: preview.codeEntered,
    erkannt: preview.erkannt,
    katalogpreis,
    status: preview.erkannt ? "vorgesehen-manuelle-pruefung" : "kein",
    berechtigungGeprueft: false,
    vergleichsfelder: BUSINESS_DISCOUNT_COMPARISON_FIELDS.slice(),
  };
  if (preview.erkannt) {
    payload.regulaererPreis = preview.regulaererPreis;
    payload.vorgesehenerRabatt = preview.vorgesehenerRabatt;
    payload.preisNachRabatt = preview.preisNachRabatt;
    payload.hinweis = preview.hinweis;
  }
  return payload;
}

export function businessDiscountPreviewRows(preview) {
  if (!preview || !preview.erkannt) return [];
  return [
    { label: "Regulärer Preis", value: preview.regulaererPreis },
    { label: "Vorgesehener Rabatt", value: preview.vorgesehenerRabatt },
    { label: "Preis nach Rabatt", value: preview.preisNachRabatt, total: true },
  ];
}

export const DISCOUNT_NOTE_LINE = `Rabatt 15%: ${BUSINESS_NEW_CUSTOMER_CODE}`;

export function isDiscountNoteLine(line) {
  const text = String(line || "").trim();
  return /^Rabattcode\s*:/i.test(text) || /^Rabatt\s*15\s*%/i.test(text);
}

export function stripDiscountNoteLines(text) {
  const kept = String(text || "")
    .split(/\r?\n/)
    .filter((line) => !isDiscountNoteLine(line));
  while (kept.length && !String(kept[0]).trim()) kept.shift();
  while (kept.length && !String(kept[kept.length - 1]).trim()) kept.pop();
  return kept.join("\n");
}

export function withActiveDiscountNote(extraLines, erkannt) {
  const out = [];
  for (const line of extraLines || []) {
    if (isDiscountNoteLine(line)) continue;
    out.push(line);
  }
  if (erkannt) out.push(DISCOUNT_NOTE_LINE);
  return out;
}

export function applyDiscountNoteToText(text, erkannt) {
  const cleaned = stripDiscountNoteLines(text);
  if (!erkannt) return cleaned;
  if (cleaned) return `${cleaned}\n${DISCOUNT_NOTE_LINE}`;
  return DISCOUNT_NOTE_LINE;
}

export function dodatkiForCategory(catalog, categoryIds) {
  const ids = Array.isArray(categoryIds) ? categoryIds : [];
  const seen = new Set();
  const out = [];
  if (!catalog || !Array.isArray(catalog.kategorien)) return out;

  for (const katId of ids) {
    if (katId === "zusatzleistungen") continue;
    const kat = catalog.kategorien.find((item) => item.id === katId);
    const list = kat && Array.isArray(kat.dodatki) ? kat.dodatki : [];
    for (const item of list) {
      if (!item || !item.id || seen.has(item.id)) continue;
      if (PUBLIC_HIDDEN_ADDON_IDS.includes(item.id)) continue;
      seen.add(item.id);
      out.push({
        id: item.id,
        name: item.name,
        preisAnzeige: item.preisAnzeige || "",
      });
    }
  }
  return out;
}

function sharedBooleanAddons(catalog) {
  if (!catalog || !Array.isArray(catalog.kategorien)) return [];
  const kat = catalog.kategorien.find((item) => item && item.id === "zusatzleistungen");
  const list = kat && Array.isArray(kat.dodatki) ? kat.dodatki : [];
  const allow = new Set(SHARED_BOOLEAN_ADDON_IDS);
  const out = [];
  for (const item of list) {
    if (!item || !allow.has(item.id)) continue;
    if (PUBLIC_HIDDEN_ADDON_IDS.includes(item.id)) continue;
    out.push({
      id: item.id,
      name: item.name,
      preisAnzeige: item.preisAnzeige || "",
    });
  }
  return out;
}

export function dodatkiForPackage(catalog, categoryIds, packageId) {
  const id = String(packageId || "").trim();
  if (!id) return [];
  if (PACKAGES_WITHOUT_ADDONS.includes(id)) return [];
  const excludedExact = new Set(PACKAGE_EXCLUDED_ADDON_IDS[id] || []);
  const excludedCanonical = new Set(
    [...excludedExact].map((addonId) => canonicalAddonId(addonId)),
  );
  const local = dodatkiForCategory(catalog, categoryIds).filter(
    (item) => !excludedExact.has(item.id),
  );
  const occupied = new Set(local.map((item) => canonicalAddonId(item.id)));
  for (const extra of sharedBooleanAddons(catalog)) {
    const canonical = canonicalAddonId(extra.id);
    if (excludedCanonical.has(canonical) || occupied.has(canonical)) continue;
    occupied.add(canonical);
    local.push(extra);
  }
  return local;
}

export function retainedAddonIds(previousIds, allowed) {
  const allow = new Set((allowed || []).map((item) => item && item.id).filter(Boolean));
  return (Array.isArray(previousIds) ? previousIds : []).filter((id) => allow.has(id));
}

export function formatPaketDisplayName(kategorieName, paketName) {
  const kat = String(kategorieName || "").trim();
  const name = String(paketName || "").trim();
  if (kat && name) return `${kat} · ${name}`;
  return name || kat;
}

export function resolveAnfrageTyp(category) {
  if (!category) return "indywidualne";
  if (category.packageForbidden || category.mode === "individual") return "indywidualne";
  if (category.mode === "campaigns") return "kampania";
  if (category.mode === "catalog") return "pakiet";
  return "indywidualne";
}

/**
 * Tekstowa kompletność adresu DE: ulica, numer, PLZ (5 cyfr), miasto.
 * To nie jest weryfikacja istnienia adresu.
 */
export function looksLikeConcreteDeAddress(text) {
  const raw = String(text || "").trim().replace(/\s+/g, " ");
  if (!raw) return false;
  const plzMatch = raw.match(/\b(\d{5})\b/);
  if (!plzMatch) return false;
  const plz = plzMatch[1];
  const plzIndex = raw.indexOf(plz);
  const before = raw.slice(0, plzIndex).replace(/[,\s]+$/g, "").trim();
  const after = raw.slice(plzIndex + 5).replace(/^[,\s]+/g, "").trim();
  if (!after || !/[A-Za-zÄÖÜäöüß]/.test(after)) return false;
  const houseMatch = before.match(/(\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*$/);
  if (!houseMatch) return false;
  const street = before.slice(0, before.length - houseMatch[1].length).replace(/[.,\s]+$/g, "").trim();
  if (street.length < 2 || !/[A-Za-zÄÖÜäöüß]/.test(street)) return false;
  return true;
}

/** Format only — does not prove the mailbox exists. Allows reserved names such as example.invalid. */
export function looksLikeEmail(text) {
  const raw = String(text || "").trim();
  if (!raw || raw.length > 254) return false;
  if (/\s/.test(raw)) return false;
  return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,24}$/.test(raw);
}

export function looksLikeIsoDate(text) {
  const raw = String(text || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

export function looksLikeClockTime(text) {
  const raw = String(text || "").trim();
  if (!raw) return true;
  const match = raw.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function countDigits(text) {
  return String(text || "").replace(/\D/g, "").length;
}

export function validatePublicForm(values, category, context) {
  const errors = [];
  const v = values || {};
  const cat = category || {};
  const ctx = context || {};

  if (String(v.honeypot || "").trim()) {
    errors.push("honeypot");
    return errors;
  }
  const vorname = String(v.vorname || "").trim();
  const nachname = String(v.nachname || "").trim();
  const telefon = String(v.telefon || "").trim();
  const email = String(v.email || "").trim();
  if (!vorname) errors.push("vorname");
  else if (vorname.length > 80) errors.push("vorname_length");
  if (!nachname) errors.push("nachname");
  else if (nachname.length > 80) errors.push("nachname_length");
  if (!telefon && !email) {
    errors.push("telefon_or_email");
  }
  if (email && !looksLikeEmail(email)) errors.push("email");
  if (telefon && countDigits(telefon) < 6) errors.push("telefon");

  const typ = resolveAnfrageTyp(cat);

  if (typ === "pakiet") {
    if (!String(v.packageId || "").trim()) errors.push("package");
    if (!String(v.datum || "").trim()) errors.push("datum");
    else if (!looksLikeIsoDate(v.datum)) errors.push("datum_invalid");
  }

  if (typ === "kampania") {
    const campaign = ctx.campaign;
    if (!campaign || !campaign.package || !campaign.package.packageId) {
      errors.push("campaign");
    }
    const datum = campaign && campaign.event && campaign.event.dateLocked
      ? campaign.event.date
      : v.datum;
    if (!String(datum || "").trim()) errors.push("datum");
    else if (!looksLikeIsoDate(datum)) errors.push("datum_invalid");
  }

  if (typ === "indywidualne") {
    if (!String(v.datum || "").trim()) errors.push("datum");
    else if (!looksLikeIsoDate(v.datum)) errors.push("datum_invalid");
    const opis = String(v.beschreibung || "").trim() || String(v.notizen || "").trim();
    if (!opis) errors.push("beschreibung");
  }

  if (String(v.uhrzeit || "").trim() && !looksLikeClockTime(v.uhrzeit)) {
    errors.push("uhrzeit_invalid");
  }

  if (!looksLikeConcreteDeAddress(v.kundenadresse)) errors.push("kundenadresse");
  if (!looksLikeConcreteDeAddress(v.miejsce)) errors.push("miejsce");

  return errors;
}

function joinNotizen(prefix, extraLines, userNotes) {
  const lines = [];
  if (prefix) lines.push(String(prefix).trim());
  for (const line of extraLines || []) {
    const text = String(line || "").trim();
    if (text) lines.push(text);
  }
  const notes = String(userNotes || "").trim();
  if (notes) lines.push(notes);
  return lines.join("\n");
}

function selectedDodatki(allDodatki, selectedIds) {
  const ids = Array.isArray(selectedIds) ? selectedIds : [];
  const list = Array.isArray(allDodatki) ? allDodatki : [];
  return list.filter((item) => ids.includes(item.id));
}

function selectedBooleanDodatki(allDodatki, selectedIds) {
  const hourly = new Set(PUBLIC_HOURLY_ADDON_IDS);
  return selectedDodatki(allDodatki, selectedIds).filter((item) => !hourly.has(item.id));
}

/**
 * @returns {{ schemaVersion: 1, kartkaId: string, createdAt: string, source: "przyczlapka", payload: object }}
 */
export function buildPublicEnvelope(input) {
  const category = input.category;
  const catalog = input.catalog;
  const campaign = input.campaign || null;
  const values = input.values || {};
  const kartkaId = input.kartkaId || newKartkaId();
  const createdAt = input.createdAt || new Date().toISOString();
  const typ = resolveAnfrageTyp(category);

  const kontakt = {
    vorname: String(values.vorname || "").trim(),
    nachname: String(values.nachname || "").trim(),
    telefon: String(values.telefon || "").trim(),
    email: String(values.email || "").trim(),
    kundenadresse: String(values.kundenadresse || "").trim(),
  };

  let packageId = "";
  let displayName = "";
  let dodatki = [];
  let dodatkiIds = [];
  let zusatzStunden = [];
  let preis = null;
  let rabatt = null;
  let datum = String(values.datum || "").trim();
  let uhrzeit = String(values.uhrzeit || "").trim() || DEFAULT_UHRZEIT;
  let miejsce = String(values.miejsce || "").trim();
  let notizenPrefix = "";
  const extraNotizen = [];

  if (typ === "pakiet") {
    const packages = packagesForCategory(catalog, category.catalogKategorieIds);
    const chosen = packages.find((item) => item.id === values.packageId);
    if (chosen) {
      packageId = chosen.id;
      displayName = formatPaketDisplayName(chosen.kategorieName, chosen.name);
      miejsce = miejsce || "";
      const pool = dodatkiForPackage(catalog, category.catalogKategorieIds, packageId);
      const booleanAddons = selectedBooleanDodatki(pool, values.dodatkiIds);
      const breakdown = inquiryPriceBreakdown(
        chosen,
        values.addonHours,
        pool,
        values.dodatkiIds,
      );
      dodatki = booleanAddons.map((item) => item.name);
      dodatkiIds = booleanAddons.map((item) => item.id);
      for (const extra of breakdown.zusatzStunden) {
        dodatkiIds.push(extra.id);
        dodatki.push(`${extra.name} (${extra.stunden} Std., ${extra.betragAnzeige})`);
      }
      rabatt = businessDiscountPayload(packageId, values.rabattcode, chosen.preisAnzeige);
      zusatzStunden = breakdown.zusatzStunden;
      preis = {
        paketAnzeige: chosen.preisAnzeige,
        paketCents: breakdown.paketCents,
        zusaetzeCents: breakdown.zusaetzeCents,
        gesamtpreisAnzeige: breakdown.gesamtAnzeige,
        gesamtpreisCents: breakdown.gesamtCents,
      };
    }
  } else if (typ === "kampania" && campaign) {
    packageId = campaign.package.packageId;
    displayName = campaign.package.displayName;
    dodatki = [];
    dodatkiIds = [];
    if (campaign.event && campaign.event.dateLocked) {
      datum = campaign.event.date;
    }
    miejsce = miejsce || "";
    notizenPrefix = campaign.notizenPrefix || "";
    if (values.uhrzeit) extraNotizen.push(`Wunschzeit: ${values.uhrzeit}`);
  } else {
    packageId = "";
    displayName = "Sonstige";
    if (category && category.id && category.id !== "sonstige") {
      displayName = String(category.label || "Sonstige");
    }
    dodatki = [];
    dodatkiIds = [];
    const temat = String(values.beschreibung || "").trim();
    extraNotizen.push(`[${category && category.label ? category.label : "Sonstige"}]`);
    if (temat) extraNotizen.push(temat);
  }

  const kampania = {
    kategoriaId: category && category.id ? category.id : "",
    anfrageTyp: typ,
  };
  if (typ === "kampania" && campaign) {
    kampania.id = campaign.id;
    kampania.titel = campaign.copy && campaign.copy.title ? campaign.copy.title : campaign.id;
    kampania.kanal = "public-form";
  }
  if (typ === "indywidualne" && values.beschreibung) {
    kampania.temat = String(values.beschreibung).trim();
  }

  if (typ !== "kampania") {
    extraNotizen.push(...preferredWindowNotes(values.uhrzeit, values.dauerStunden));
  }

  const discountActive = Boolean(rabatt && rabatt.erkannt);
  const noteLines = withActiveDiscountNote(extraNotizen, discountActive);
  const userNotes = stripDiscountNoteLines(values.notizen);

  return {
    schemaVersion: 1,
    kartkaId,
    createdAt,
    source: "przyczlapka",
    payload: {
      kontakt,
      termin: {
        datum,
        uhrzeit,
        miejsce,
        locationId: "",
        googleMapsUrl: "",
        notizen: joinNotizen(notizenPrefix, noteLines, userNotes),
      },
      pakiet: {
        packageId,
        displayName,
        dodatki,
        dodatkiIds,
        zusatzStunden,
        ...(preis ? { preis } : {}),
        ...(rabatt ? { rabatt } : {}),
      },
      kampania,
    },
  };
}
