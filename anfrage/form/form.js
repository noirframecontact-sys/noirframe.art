import { canSubmitPublicForm, questionnaireActivation } from "./activation.js";
import {
  ADDON_TIME_NOTE,
  BUSINESS_STANDARD_PACKAGE_ID,
  HOURLY_ADDON_MAX_HOURS,
  PRICE_SUMMARY_LABELS,
  PUBLIC_HOURLY_ADDON_IDS,
  applyDiscountNoteToText,
  bookingFlowHtml,
  businessDiscountPreviewRows,
  dodatkiForPackage,
  evaluateBusinessDiscount,
  inquiryPriceBreakdown,
  packagesForCategory,
  resolveAnfrageTyp,
  retainedAddonIds,
  selectedPackageView,
  demoUnavailableCardHtml,
  reviewSummaryHtml,
  REVIEW_LABEL,
  REVIEW_BACK_LABEL,
  SEND_LABEL,
  SEND_BUSY_LABEL,
  validatePublicForm,
} from "./envelope.js?v=20261030-etap-f";
import {
  CAMPAIGN_TIME_COPY,
  MONTH_NAMES_DE,
  STANDARD_TIME_COPY,
  applyNotizenPlaceholder,
  composeHHmm,
  composeIsoDate,
  dayChoices,
  durationChoices,
  formatDurationLabel,
  hourChoices,
  minuteChoices,
  monthChoices,
  preferredWindowEnd,
  splitHHmm,
  splitIsoDate,
  yearChoices,
} from "./schedule.js";
import { AVAILABILITY_COPY, evaluateCampaignHours } from "./slots.js";

const els = {
  form: document.getElementById("public-form"),
  category: document.getElementById("category"),
  packageWrap: document.getElementById("package-wrap"),
  packageSelect: document.getElementById("package"),
  packageChoices: document.getElementById("package-choices"),
  packageDetails: document.getElementById("package-details"),
  discountWrap: document.getElementById("discount-wrap"),
  rabattcode: document.getElementById("rabattcode"),
  discountPreview: document.getElementById("discount-preview"),
  addonsWrap: document.getElementById("addons-wrap"),
  addons: document.getElementById("addons"),
  addonTimeNote: document.getElementById("addon-time-note"),
  priceSummary: document.getElementById("price-summary"),
  campaignOffer: document.getElementById("campaign-offer"),
  beschreibungWrap: document.getElementById("beschreibung-wrap"),
  beschreibung: document.getElementById("beschreibung"),
  kundenadresse: document.getElementById("kundenadresse"),
  miejsce: document.getElementById("miejsce"),
  datum: document.getElementById("datum"),
  datumLabel: document.getElementById("datum-label"),
  datumTag: document.getElementById("datum-tag"),
  datumMonat: document.getElementById("datum-monat"),
  datumJahr: document.getElementById("datum-jahr"),
  uhrzeit: document.getElementById("uhrzeit"),
  uhrzeitLabel: document.getElementById("uhrzeit-label"),
  uhrzeitStunde: document.getElementById("uhrzeit-stunde"),
  uhrzeitMinute: document.getElementById("uhrzeit-minute"),
  uhrzeitHint: document.getElementById("uhrzeit-hint"),
  standardWindowWrap: document.getElementById("standard-window-wrap"),
  dauer: document.getElementById("dauer"),
  windowEnd: document.getElementById("window-end"),
  notizen: document.getElementById("notizen"),
  availabilityWrap: document.getElementById("availability-wrap"),
  availabilityStatus: document.getElementById("availability-status"),
  availabilityHours: document.getElementById("availability-hours"),
  errors: document.getElementById("errors"),
  bookingFlow: document.getElementById("booking-flow"),
  questionnaire: document.getElementById("questionnaire"),
  success: document.getElementById("success"),
  dump: document.getElementById("prototype-dump"),
  editor: document.getElementById("editor"),
  review: document.getElementById("review"),
  reviewBody: document.getElementById("review-body"),
  reviewBtn: document.getElementById("review-btn"),
  reviewBack: document.getElementById("review-back"),
  submit: document.getElementById("submit"),
  formView: document.getElementById("form-view"),
  legalView: document.getElementById("legal-view"),
  legalBack: document.getElementById("legal-back"),
  legalBody: document.getElementById("legal-body"),
};

const DRY_RUN = true;

const state = {
  taxonomy: null,
  catalog: null,
  campaigns: [],
  snapshot: null,
  snapshotMissing: false,
  submitting: false,
  sendLocked: false,
  step: "edit",
  lastKartkaId: null,
};

function categoryById(id) {
  return (state.taxonomy?.categories || []).find((item) => item.id === id) || null;
}

function campaignById(id) {
  return state.campaigns.find((item) => item.id === id) || null;
}

function selectedCampaign() {
  const category = categoryById(els.category.value);
  if (!category || category.mode !== "campaigns") return null;
  return state.campaigns[0] || null;
}

function show(el, visible) {
  if (!el) return;
  el.classList.toggle("is-hidden", !visible);
}

function setErrors(list) {
  if (!list.length) {
    els.errors.hidden = true;
    els.errors.textContent = "";
    return;
  }
  const labels = {
    vorname: "Vorname ist erforderlich.",
    nachname: "Nachname ist erforderlich.",
    vorname_length: "Vorname ist zu lang.",
    nachname_length: "Nachname ist zu lang.",
    telefon_or_email: "Telefon oder E-Mail ist erforderlich.",
    email: "Bitte eine gültige E-Mail-Adresse angeben.",
    telefon: "Bitte eine gültige Telefonnummer angeben.",
    datum: "Datum ist erforderlich.",
    datum_invalid: "Bitte ein gültiges Kalenderdatum angeben (JJJJ-MM-TT).",
    uhrzeit_invalid: "Bitte eine gültige Uhrzeit angeben (HH:MM).",
    category: "Bitte eine Leistung wählen.",
    package: "Bitte ein Paket wählen.",
    campaign: "Kampagne ist nicht verfügbar.",
    beschreibung: "Bitte beschreiben Sie Ihr Anliegen.",
    kundenadresse: "Kundenadresse braucht Straße, Hausnummer, Postleitzahl und Ort.",
    miejsce: "Event-Adresse braucht Straße, Hausnummer, Postleitzahl und Ort.",
    honeypot: "Senden nicht möglich.",
  };
  els.errors.hidden = false;
  els.errors.textContent = list.map((code) => labels[code] || code).join(" ");
}

function renderCategories() {
  els.category.innerHTML = '<option value="">Leistung wählen …</option>';
  for (const cat of state.taxonomy.categories) {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.label;
    els.category.appendChild(option);
  }
}

function renderPackages(category) {
  els.packageSelect.innerHTML = '<option value="">Paket wählen …</option>';
  if (els.packageChoices) els.packageChoices.replaceChildren();
  const packages = packagesForCategory(state.catalog, category.catalogKategorieIds || []);
  for (const paket of packages) {
    const option = document.createElement("option");
    option.value = paket.id;
    option.textContent = `${paket.name} · ${paket.preisAnzeige}`;
    option.dataset.kategorieId = paket.kategorieId;
    els.packageSelect.appendChild(option);
    if (!els.packageChoices) continue;
    const choice = document.createElement("label");
    choice.className = "package-choice";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "package-choice";
    radio.value = paket.id;
    radio.addEventListener("change", () => {
      els.packageSelect.value = paket.id;
      onPackageChange();
    });
    const name = document.createElement("span");
    name.className = "package-choice__name";
    name.textContent = paket.name;
    const price = document.createElement("span");
    price.className = "package-choice__price";
    price.textContent = paket.preisAnzeige;
    choice.append(radio, name, price);
    els.packageChoices.appendChild(choice);
  }
  show(els.packageWrap, packages.length > 0);
}

function syncPackageChoices() {
  if (!els.packageChoices) return;
  const selected = els.packageSelect.value;
  for (const radio of els.packageChoices.querySelectorAll('input[name="package-choice"]')) {
    radio.checked = radio.value === selected;
    radio.closest(".package-choice")?.classList.toggle("is-selected", radio.checked);
  }
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

const ROLL_DURATION_MS = 1150;

function setRollOpen(root, open) {
  if (!root) return;
  root.classList.toggle("is-open", open);
  const toggle = root.querySelector(".roll__toggle");
  if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
}

function createRoll(title, body) {
  const root = document.createElement("div");
  root.className = "roll package-details__scope";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "roll__toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = title;
  const panel = document.createElement("div");
  panel.className = "roll__panel";
  const inner = document.createElement("div");
  inner.className = "roll__inner";
  inner.append(body);
  panel.append(inner);
  root.append(toggle, panel);
  toggle.addEventListener("click", () => {
    setRollOpen(root, !root.classList.contains("is-open"));
  });
  return root;
}

function buildPackageDetailsClip(view) {
  const clip = document.createElement("div");
  clip.className = "package-details__clip";
  const headline = document.createElement("p");
  headline.className = "package-details__headline";
  const name = document.createElement("span");
  name.className = "package-details__name";
  name.textContent = view.name;
  headline.append(name);
  if (view.preisAnzeige) {
    const price = document.createElement("span");
    price.className = "package-details__price";
    price.textContent = view.preisAnzeige;
    headline.append(price);
  }
  clip.append(headline);
  if (view.scopeItems.length || view.kurzbeschreibung) {
    let body;
    if (view.scopeItems.length) {
      body = document.createElement("ul");
      for (const item of view.scopeItems) {
        const li = document.createElement("li");
        li.textContent = item;
        body.append(li);
      }
    } else {
      body = document.createElement("p");
      body.textContent = view.kurzbeschreibung;
    }
    clip.append(createRoll("Leistungsumfang", body));
  }
  return clip;
}

function revealPackageDetailsClip(clip) {
  const roll = clip && clip.querySelector(".roll");
  if (!roll) return;
  if (prefersReducedMotion()) {
    setRollOpen(roll, true);
    return;
  }
  window.setTimeout(() => setRollOpen(roll, true), 90);
}

let packageDetailsTimer = 0;

function renderPackageDetails(paket) {
  if (!els.packageDetails) return;
  if (packageDetailsTimer) {
    window.clearTimeout(packageDetailsTimer);
    packageDetailsTimer = 0;
  }
  const view = selectedPackageView(paket);
  if (!view) {
    const currentRoll = els.packageDetails.querySelector(".roll");
    const currentClip = els.packageDetails.querySelector(".package-details__clip");
    if (currentClip && !prefersReducedMotion()) {
      setRollOpen(currentRoll, false);
      currentClip.classList.add("is-leaving");
      packageDetailsTimer = window.setTimeout(() => {
        els.packageDetails.replaceChildren();
        show(els.packageDetails, false);
      }, ROLL_DURATION_MS);
      return;
    }
    els.packageDetails.replaceChildren();
    show(els.packageDetails, false);
    return;
  }
  const next = buildPackageDetailsClip(view);
  const current = els.packageDetails.querySelector(".package-details__clip");
  show(els.packageDetails, true);
  if (!current || prefersReducedMotion()) {
    els.packageDetails.replaceChildren(next);
    revealPackageDetailsClip(next);
    return;
  }
  setRollOpen(current.querySelector(".roll"), false);
  current.classList.add("is-leaving");
  packageDetailsTimer = window.setTimeout(() => {
    els.packageDetails.replaceChildren(next);
    revealPackageDetailsClip(next);
  }, Math.round(ROLL_DURATION_MS * 0.72));
}

function readHourlyHoursFromDom() {
  const hours = {};
  if (!els.addons) return hours;
  for (const row of els.addons.querySelectorAll("[data-hourly-id]")) {
    const id = row.getAttribute("data-hourly-id");
    const n = Number(row.getAttribute("data-hours") || 0);
    hours[id] = Number.isFinite(n) ? n : 0;
  }
  return hours;
}

function formatHourlyValue(hours) {
  return `${hours} Std.`;
}

function setHourlyHours(row, next) {
  const hours = Math.max(0, Math.min(HOURLY_ADDON_MAX_HOURS, Math.round(Number(next) || 0)));
  row.setAttribute("data-hours", String(hours));
  const value = row.querySelector(".addon-hours__value");
  if (value) value.textContent = formatHourlyValue(hours);
  const minus = row.querySelector('[data-delta="-1"]');
  const plus = row.querySelector('[data-delta="1"]');
  if (minus) minus.disabled = hours <= 0;
  if (plus) plus.disabled = hours >= HOURLY_ADDON_MAX_HOURS;
  renderPriceSummary();
}

function onAddonHoursClick(event) {
  const btn = event.target.closest("[data-delta]");
  if (!btn || btn.disabled) return;
  event.preventDefault();
  const row = btn.closest("[data-hourly-id]");
  if (!row) return;
  const delta = Number(btn.getAttribute("data-delta"));
  const current = Number(row.getAttribute("data-hours") || 0);
  setHourlyHours(row, current + (Number.isFinite(delta) ? delta : 0));
}

function renderHourlyAddon(item, hours) {
  const row = document.createElement("div");
  row.className = "addon addon--hourly";
  row.setAttribute("data-hourly-id", item.id);
  row.setAttribute("data-hours", String(hours));
  const name = document.createElement("span");
  name.className = "addon__name";
  name.id = `addon-name-${item.id}`;
  name.textContent = item.name;
  const stepper = document.createElement("div");
  stepper.className = "addon-hours";
  stepper.setAttribute("role", "group");
  stepper.setAttribute("aria-labelledby", name.id);
  const minus = document.createElement("button");
  minus.type = "button";
  minus.className = "addon-hours__btn";
  minus.setAttribute("data-delta", "-1");
  minus.setAttribute("aria-label", "Eine Stunde weniger");
  minus.textContent = "\u2212";
  minus.disabled = hours <= 0;
  const value = document.createElement("span");
  value.className = "addon-hours__value";
  value.setAttribute("aria-live", "polite");
  value.textContent = formatHourlyValue(hours);
  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "addon-hours__btn";
  plus.setAttribute("data-delta", "1");
  plus.setAttribute("aria-label", "Eine Stunde mehr");
  plus.textContent = "+";
  plus.disabled = hours >= HOURLY_ADDON_MAX_HOURS;
  stepper.append(minus, value, plus);
  const price = document.createElement("span");
  price.className = "addon__price";
  price.textContent = item.preisAnzeige;
  row.append(name, stepper, price);
  return row;
}

function renderPriceSummary() {
  if (!els.priceSummary) return;
  const category = categoryById(els.category.value);
  const typ = resolveAnfrageTyp(category);
  if (!category || typ !== "pakiet" || !els.packageSelect.value) {
    els.priceSummary.replaceChildren();
    show(els.priceSummary, false);
    return;
  }
  const chosen = currentPackages(category).find((item) => item.id === els.packageSelect.value);
  if (!chosen) {
    els.priceSummary.replaceChildren();
    show(els.priceSummary, false);
    return;
  }
  const addons = dodatkiForPackage(
    state.catalog,
    category.catalogKategorieIds || [],
    chosen.id,
  );
  const selectedIds = [...els.addons.querySelectorAll('input[name="dodatki"]:checked')].map(
    (node) => node.value,
  );
  const breakdown = inquiryPriceBreakdown(
    chosen,
    readHourlyHoursFromDom(),
    addons,
    selectedIds,
  );
  const list = document.createElement("dl");
  list.className = "price-summary__rows";
  for (const line of breakdown.lines) {
    const row = document.createElement("div");
    row.className = "price-summary__row";
    const dt = document.createElement("dt");
    dt.textContent = line.label;
    const dd = document.createElement("dd");
    dd.className = "price-summary__amount";
    dd.textContent = line.betragAnzeige;
    row.append(dt, dd);
    list.append(row);
  }
  const total = document.createElement("div");
  total.className = "price-summary__row price-summary__row--total";
  const totalDt = document.createElement("dt");
  totalDt.textContent = PRICE_SUMMARY_LABELS.gesamt;
  const totalDd = document.createElement("dd");
  totalDd.className = "price-summary__amount";
  totalDd.textContent = breakdown.gesamtAnzeige;
  total.append(totalDt, totalDd);
  list.append(total);
  els.priceSummary.replaceChildren(list);
  show(els.priceSummary, true);
}

function renderAddons(category) {
  const previousChecks = [...els.addons.querySelectorAll('input[name="dodatki"]:checked')].map(
    (node) => node.value,
  );
  const previousHours = readHourlyHoursFromDom();
  els.addons.innerHTML = "";
  const list = dodatkiForPackage(
    state.catalog,
    category.catalogKategorieIds || [],
    els.packageSelect.value,
  );
  const keep = new Set(retainedAddonIds(previousChecks, list.filter((item) => !PUBLIC_HOURLY_ADDON_IDS.includes(item.id))));
  for (const item of list) {
    if (PUBLIC_HOURLY_ADDON_IDS.includes(item.id)) {
      const hours = Math.max(0, Number(previousHours[item.id]) || 0);
      els.addons.appendChild(renderHourlyAddon(item, hours));
      continue;
    }
    const label = document.createElement("label");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.name = "dodatki";
    box.value = item.id;
    box.checked = keep.has(item.id);
    const name = document.createElement("span");
    name.className = "addon__name";
    name.textContent = item.name;
    const price = document.createElement("span");
    price.className = "addon__price";
    price.textContent = item.preisAnzeige;
    label.className = "addon";
    label.append(box, name, price);
    els.addons.appendChild(label);
  }
  const showTimeNote = list.some((item) => item.id === "zweiter-fotograf");
  if (els.addonTimeNote) {
    els.addonTimeNote.textContent = ADDON_TIME_NOTE;
    show(els.addonTimeNote, showTimeNote);
  }
  show(els.addonsWrap, list.length > 0);
  renderPriceSummary();
}

function renderAvailability(campaign) {
  if (!els.availabilityWrap) return;
  if (!campaign) {
    show(els.availabilityWrap, false);
    if (els.availabilityHours) {
      els.availabilityHours.hidden = true;
      els.availabilityHours.innerHTML = "";
    }
    return;
  }

  show(els.availabilityWrap, true);
  const snapshot = state.snapshotMissing ? null : state.snapshot;
  const result = evaluateCampaignHours(snapshot, campaign);
  els.availabilityStatus.textContent = result.message || AVAILABILITY_COPY.invalid;
  els.availabilityHours.innerHTML = "";
  const canOffer = result.status === "ready" && result.hours.length > 0;
  els.availabilityHours.hidden = !canOffer;
  if (!canOffer) return;

  for (const hour of result.hours) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "availability__hour";
    button.textContent = hour;
    button.setAttribute("aria-pressed", hour === els.uhrzeit.value ? "true" : "false");
    if (hour === els.uhrzeit.value) button.classList.add("is-selected");
    button.addEventListener("click", () => {
      setUhrzeitHHmm(hour);
      renderAvailability(campaign);
    });
    els.availabilityHours.appendChild(button);
  }
}

function setTimeLabels(copy) {
  if (els.datumLabel) els.datumLabel.textContent = copy.datumLabel;
  if (els.uhrzeitLabel) els.uhrzeitLabel.textContent = copy.startLabel;
}

function fillDateOptions() {
  if (!els.datumTag || els.datumTag.dataset.filled === "1") return;
  for (const day of dayChoices()) {
    const option = document.createElement("option");
    option.value = String(day);
    option.textContent = String(day).padStart(2, "0");
    els.datumTag.appendChild(option);
  }
  for (const month of monthChoices()) {
    const option = document.createElement("option");
    option.value = month.value;
    option.textContent = month.name;
    els.datumMonat.appendChild(option);
  }
  for (const year of yearChoices()) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    els.datumJahr.appendChild(option);
  }
  els.datumTag.dataset.filled = "1";
}

function syncDatumIso() {
  if (!els.datum) return "";
  const iso = composeIsoDate(
    els.datumTag && els.datumTag.value,
    els.datumMonat && els.datumMonat.value,
    els.datumJahr && els.datumJahr.value,
  );
  els.datum.value = iso || "";
  return els.datum.value;
}

function setDatumIso(iso) {
  const parts = splitIsoDate(iso);
  if (!parts || !els.datumTag || !els.datumMonat || !els.datumJahr) {
    if (els.datum) els.datum.value = "";
    return;
  }
  els.datumTag.value = parts.day;
  els.datumMonat.value = parts.month;
  els.datumJahr.value = parts.year;
  els.datum.value = iso;
}

function setDatumEnabled(enabled) {
  for (const el of [els.datumTag, els.datumMonat, els.datumJahr]) {
    if (el) el.disabled = !enabled;
  }
}

function fillTimeOptions() {
  if (!els.uhrzeitStunde || els.uhrzeitStunde.dataset.filled === "1") return;
  for (const hour of hourChoices()) {
    const option = document.createElement("option");
    option.value = hour;
    option.textContent = hour;
    els.uhrzeitStunde.appendChild(option);
  }
  for (const minute of minuteChoices()) {
    const option = document.createElement("option");
    option.value = minute;
    option.textContent = minute;
    els.uhrzeitMinute.appendChild(option);
  }
  els.uhrzeitStunde.dataset.filled = "1";
}

function syncUhrzeitHHmm() {
  if (!els.uhrzeit) return "";
  const hhmm = composeHHmm(
    els.uhrzeitStunde && els.uhrzeitStunde.value,
    els.uhrzeitMinute && els.uhrzeitMinute.value,
  );
  els.uhrzeit.value = hhmm || "";
  return els.uhrzeit.value;
}

function setUhrzeitHHmm(hhmm) {
  const parts = splitHHmm(hhmm);
  if (!parts || !els.uhrzeitStunde || !els.uhrzeitMinute) {
    if (els.uhrzeit) els.uhrzeit.value = "";
    return;
  }
  els.uhrzeitStunde.value = parts.hour;
  els.uhrzeitMinute.value = parts.minute;
  els.uhrzeit.value = `${parts.hour}:${parts.minute}`;
}

function fillDurationOptions() {
  if (!els.dauer || els.dauer.dataset.filled === "1") return;
  for (const hours of durationChoices()) {
    const option = document.createElement("option");
    option.value = String(hours);
    option.textContent = formatDurationLabel(hours);
    els.dauer.appendChild(option);
  }
  els.dauer.dataset.filled = "1";
}

function renderWindowEnd() {
  if (!els.windowEnd) return;
  const window = preferredWindowEnd(els.uhrzeit.value, els.dauer && els.dauer.value);
  if (!window) {
    els.windowEnd.hidden = true;
    els.windowEnd.textContent = "";
    return;
  }
  const endText = window.nextDay
    ? `Voraussichtliches Ende: ${window.end} (nächster Tag)`
    : `Voraussichtliches Ende: ${window.end}`;
  els.windowEnd.textContent = `${endText}. ${STANDARD_TIME_COPY.inquiryHint}`;
  els.windowEnd.hidden = false;
}

function renderStandardWindow(visible) {
  show(els.standardWindowWrap, visible);
  if (!visible) {
    if (els.windowEnd) {
      els.windowEnd.hidden = true;
      els.windowEnd.textContent = "";
    }
    return;
  }
  fillDurationOptions();
  renderWindowEnd();
}

function renderCampaign(campaign) {
  if (!campaign) {
    show(els.campaignOffer, false);
    setDatumEnabled(true);
    setTimeLabels(STANDARD_TIME_COPY);
    els.uhrzeitHint.textContent = STANDARD_TIME_COPY.inquiryHint;
    renderAvailability(null);
    return;
  }
  els.campaignOffer.innerHTML =
    `<strong>${campaign.copy.title}</strong><br>` +
    `${campaign.copy.intro}<br>` +
    `${campaign.copy.windowHint} · <span class="price-tag">${campaign.copy.priceNote}</span>`;
  show(els.campaignOffer, true);
  setTimeLabels(CAMPAIGN_TIME_COPY);
  renderStandardWindow(false);
  if (campaign.event.dateLocked) {
    setDatumIso(campaign.event.date);
    setDatumEnabled(false);
  }
  els.uhrzeitHint.textContent =
    `Wunschzeit (optional), nicht verbindlich. Fenster ${campaign.event.windowStart}–${campaign.event.windowEnd}. Keine Reservierung.`;
  renderAvailability(campaign);
}

function currentPackages(category) {
  if (!category) return [];
  return packagesForCategory(state.catalog, category.catalogKategorieIds || []);
}

function currentGate() {
  const category = categoryById(els.category.value);
  return questionnaireActivation(category, {
    packageId: els.packageSelect.value,
    packages: currentPackages(category),
    campaign: selectedCampaign(),
  });
}

function resetFlowChrome() {
  if (state.sendLocked) return;
  els.success.hidden = true;
  if (els.dump) {
    els.dump.classList.remove("is-visible");
    els.dump.textContent = "";
  }
  setErrors([]);
  state.lastKartkaId = null;
  if (state.step !== "done") state.step = "edit";
}

function syncStepChrome() {
  const gate = currentGate();
  const editing = state.step === "edit";
  const reviewing = state.step === "review" || state.step === "done";
  const canReview = Boolean(gate.active) && !state.sendLocked && !state.submitting;
  show(els.editor, editing);
  if (els.review) {
    els.review.hidden = !reviewing;
    show(els.review, reviewing);
  }
  if (els.reviewBtn) {
    els.reviewBtn.textContent = REVIEW_LABEL;
    show(els.reviewBtn, editing && Boolean(gate.active) && !state.sendLocked);
    els.reviewBtn.disabled = !canReview;
  }
  if (els.reviewBack) {
    els.reviewBack.textContent = REVIEW_BACK_LABEL;
    els.reviewBack.disabled = state.submitting || state.sendLocked;
  }
  if (els.submit) {
    show(els.submit, reviewing && !state.sendLocked);
    els.submit.disabled = state.submitting || state.sendLocked || state.step !== "review";
    els.submit.textContent = state.submitting ? SEND_BUSY_LABEL : SEND_LABEL;
    els.submit.setAttribute("aria-busy", state.submitting ? "true" : "false");
  }
}

function applyQuestionnaireGate(gate, category) {
  if (state.step === "review" || state.step === "done") {
    syncStepChrome();
    return;
  }
  const active = Boolean(gate.active);
  if (els.questionnaire) {
    els.questionnaire.disabled = !active;
    show(els.questionnaire, active);
  }

  if (!active) {
    els.addons.innerHTML = "";
    show(els.addonsWrap, false);
    if (els.addonTimeNote) show(els.addonTimeNote, false);
    show(els.beschreibungWrap, false);
    renderStandardWindow(false);
    if (gate.typ !== "kampania") renderAvailability(null);
    renderPriceSummary();
    if (state.step !== "done") state.step = "edit";
    syncStepChrome();
    return;
  }

  const typ = gate.typ;
  if (typ === "pakiet") {
    renderAddons(category);
    show(els.beschreibungWrap, false);
    renderCampaign(null);
    renderStandardWindow(true);
  } else if (typ === "kampania") {
    els.addons.innerHTML = "";
    show(els.addonsWrap, false);
    if (els.addonTimeNote) show(els.addonTimeNote, false);
    show(els.beschreibungWrap, false);
    renderStandardWindow(false);
    renderPriceSummary();
  } else {
    els.addons.innerHTML = "";
    show(els.addonsWrap, false);
    if (els.addonTimeNote) show(els.addonTimeNote, false);
    show(els.beschreibungWrap, true);
    renderCampaign(null);
    renderStandardWindow(true);
    setDatumEnabled(true);
    renderPriceSummary();
  }
  syncStepChrome();
}

function syncQuestionnaire() {
  const category = categoryById(els.category.value);
  applyQuestionnaireGate(currentGate(), category);
}

function syncNotizenDiscount(erkannt) {
  if (!els.notizen) return;
  const next = applyDiscountNoteToText(els.notizen.value, erkannt);
  if (next === els.notizen.value) return;
  els.notizen.value = next;
  applyNotizenPlaceholder(els.notizen);
}

function renderDiscount(packageId) {
  if (!els.discountWrap) return;
  const eligible = packageId === BUSINESS_STANDARD_PACKAGE_ID;
  show(els.discountWrap, eligible);
  if (!eligible) {
    syncNotizenDiscount(false);
    if (els.discountPreview) {
      els.discountPreview.replaceChildren();
      show(els.discountPreview, false);
    }
    return;
  }
  const preview = evaluateBusinessDiscount(packageId, els.rabattcode ? els.rabattcode.value : "");
  syncNotizenDiscount(Boolean(preview.erkannt));
  const rows = businessDiscountPreviewRows(preview);
  if (!els.discountPreview) return;
  els.discountPreview.replaceChildren();
  if (!rows.length) {
    show(els.discountPreview, false);
    return;
  }
  const list = document.createElement("dl");
  list.className = "discount__rows";
  for (const row of rows) {
    const dt = document.createElement("dt");
    dt.textContent = row.label;
    const dd = document.createElement("dd");
    dd.className = row.total ? "discount__total" : "";
    dd.textContent = row.value;
    list.append(dt, dd);
  }
  const note = document.createElement("p");
  note.className = "discount__note";
  note.textContent = preview.hinweis;
  els.discountPreview.append(list, note);
  show(els.discountPreview, true);
}

function onCategoryChange() {
  resetFlowChrome();
  const category = categoryById(els.category.value);

  if (!category) {
    els.packageSelect.innerHTML = '<option value="">Paket wählen …</option>';
    if (els.packageChoices) els.packageChoices.replaceChildren();
    show(els.packageWrap, false);
    renderPackageDetails(null);
    renderDiscount("");
    renderCampaign(null);
    syncQuestionnaire();
    return;
  }

  const typ = resolveAnfrageTyp(category);
  if (typ === "pakiet") {
    renderPackages(category);
    renderPackageDetails(null);
    renderDiscount("");
    renderCampaign(null);
  } else if (typ === "kampania") {
    els.packageSelect.innerHTML = '<option value="">Paket wählen …</option>';
    if (els.packageChoices) els.packageChoices.replaceChildren();
    show(els.packageWrap, false);
    renderPackageDetails(null);
    renderDiscount("");
    renderCampaign(selectedCampaign());
  } else {
    els.packageSelect.innerHTML = '<option value="">Paket wählen …</option>';
    if (els.packageChoices) els.packageChoices.replaceChildren();
    show(els.packageWrap, false);
    renderPackageDetails(null);
    renderDiscount("");
    renderCampaign(null);
  }
  syncQuestionnaire();
}

function onPackageChange() {
  resetFlowChrome();
  const category = categoryById(els.category.value);
  const chosen = currentPackages(category).find((item) => item.id === els.packageSelect.value);
  syncPackageChoices();
  renderPackageDetails(chosen || null);
  renderDiscount(chosen ? chosen.id : "");
  syncQuestionnaire();
}

function readValues() {
  const dodatkiIds = [...els.addons.querySelectorAll('input[name="dodatki"]:checked')].map(
    (node) => node.value,
  );
  return {
    vorname: document.getElementById("vorname").value,
    nachname: document.getElementById("nachname").value,
    telefon: document.getElementById("telefon").value,
    email: document.getElementById("email").value,
    honeypot: document.getElementById("website").value,
    packageId: els.packageSelect.value,
    rabattcode: els.rabattcode ? els.rabattcode.value : "",
    dodatkiIds,
    addonHours: readHourlyHoursFromDom(),
    beschreibung: els.beschreibung.value,
    datum: syncDatumIso(),
    uhrzeit: syncUhrzeitHHmm(),
    dauerStunden: els.dauer ? els.dauer.value : "",
    notizen: els.notizen ? els.notizen.value : "",
    kundenadresse: els.kundenadresse ? els.kundenadresse.value : "",
    miejsce: els.miejsce ? els.miejsce.value : "",
  };
}

function formatReviewDate(iso) {
  const parts = splitIsoDate(iso);
  if (!parts) return "";
  const monthName = MONTH_NAMES_DE[Number(parts.month) - 1];
  if (!monthName) return String(iso || "");
  return `${parts.day}. ${monthName} ${parts.year}`;
}

function collectReviewModel(category, values) {
  const chosen = currentPackages(category).find((item) => item.id === values.packageId);
  const addons = chosen
    ? dodatkiForPackage(state.catalog, category.catalogKategorieIds || [], chosen.id)
    : [];
  const breakdown = inquiryPriceBreakdown(chosen, values.addonHours, addons, values.dodatkiIds);
  const addonLines = breakdown.lines.filter((line) => line.id !== "paket").map((line) => ({
    name: line.label,
    preis: line.betragAnzeige,
  }));
  const dauerHours = Number(values.dauerStunden);
  return {
    leistung: category.label || category.name || "",
    paket: chosen ? chosen.name : "",
    paketPreis: chosen ? chosen.preisAnzeige : "",
    addons: addonLines,
    gesamt: breakdown.gesamtAnzeige,
    vorname: values.vorname,
    nachname: values.nachname,
    telefon: values.telefon,
    email: values.email,
    kundenadresse: values.kundenadresse,
    eventadresse: values.miejsce,
    datum: formatReviewDate(values.datum),
    uhrzeit: values.uhrzeit,
    dauer: Number.isInteger(dauerHours) && dauerHours > 0
      ? formatDurationLabel(dauerHours)
      : "noch offen",
  };
}

function validateReadyToReview() {
  const category = categoryById(els.category.value);
  if (!category) {
    setErrors(["category"]);
    return null;
  }
  const campaign = selectedCampaign();
  const gateContext = {
    packageId: els.packageSelect.value,
    packages: currentPackages(category),
    campaign,
  };
  if (!canSubmitPublicForm(category, gateContext)) {
    const gate = questionnaireActivation(category, gateContext);
    setErrors([gate.needs || "category"]);
    return null;
  }
  const values = readValues();
  const errors = validatePublicForm(values, category, { campaign });
  if (errors.length) {
    setErrors(errors);
    return null;
  }
  setErrors([]);
  return { category, campaign, values };
}

function goToReview() {
  if (state.submitting || state.sendLocked) return;
  const ready = validateReadyToReview();
  if (!ready) return;
  if (els.reviewBody) {
    els.reviewBody.innerHTML = reviewSummaryHtml(collectReviewModel(ready.category, ready.values));
  }
  state.step = "review";
  syncStepChrome();
  if (els.review) els.review.scrollIntoView({ block: "start" });
}

function goToEdit() {
  if (state.submitting || state.sendLocked) return;
  state.lastKartkaId = null;
  state.step = "edit";
  if (els.success) {
    els.success.hidden = true;
    els.success.innerHTML = "";
  }
  syncStepChrome();
  if (els.editor) els.editor.scrollIntoView({ block: "start" });
}

function lockAfterTerminal() {
  state.sendLocked = true;
  state.submitting = false;
  state.step = "done";
  syncStepChrome();
}

function showTransportError(message) {
  setErrors([]);
  els.errors.hidden = false;
  els.errors.textContent = message || "Senden fehlgeschlagen. Ihre Angaben bleiben erhalten.";
  if (els.success) {
    els.success.hidden = true;
    els.success.innerHTML = "";
  }
}

async function sendInquiry() {
  if (state.submitting || state.sendLocked) return;
  if (state.step !== "review") return;

  const ready = validateReadyToReview();
  if (!ready) {
    goToEdit();
    return;
  }

  state.submitting = true;
  syncStepChrome();

  /* Public visual demo: dryRun: true. No POST, fetch, or envelope transport. */
  if (!DRY_RUN) {
    showTransportError("Senden ist nicht aktiv.");
    state.submitting = false;
    syncStepChrome();
    return;
  }

  els.success.hidden = false;
  els.success.innerHTML = demoUnavailableCardHtml();
  setErrors([]);
  lockAfterTerminal();
  if (els.success) els.success.scrollIntoView({ block: "center" });
}

async function onSubmit(event) {
  event.preventDefault();
  if (state.submitting || state.sendLocked) return;
  if (state.step !== "review") {
    goToReview();
    return;
  }
  await sendInquiry();
}

async function loadJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`);
  return response.json();
}

const LEGAL_HASH = "#datenschutz";
let formScrollY = 0;
let legalLoaded = false;

function isModifiedClick(event) {
  return !event || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isLegalHash() {
  return window.location.hash === LEGAL_HASH;
}

function showFormView() {
  if (els.legalView) {
    els.legalView.hidden = true;
    els.legalView.classList.add("is-hidden");
  }
  if (els.formView) {
    els.formView.hidden = false;
    els.formView.classList.remove("is-hidden");
  }
  requestAnimationFrame(() => window.scrollTo(0, formScrollY));
}

function showLegalView() {
  if (els.formView) {
    els.formView.hidden = true;
    els.formView.classList.add("is-hidden");
  }
  if (els.legalView) {
    els.legalView.hidden = false;
    els.legalView.classList.remove("is-hidden");
  }
  window.scrollTo(0, 0);
  if (els.legalBack) els.legalBack.focus();
}

async function loadLegalBody() {
  if (!els.legalBody || legalLoaded) return;
    const response = await fetch("/datenschutz.html", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status} datenschutz.html`);
  const html = await response.text();
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const main = parsed.querySelector("main");
  if (!main) throw new Error("datenschutz-main");
  els.legalBody.replaceChildren(...main.childNodes);
  for (const link of els.legalBody.querySelectorAll("a.js-back-to-form")) {
    const wrap = link.closest("p") || link;
    wrap.remove();
  }
  legalLoaded = true;
  bindLegalBackLinks();
}

function bindLegalBackLinks() {
  if (!els.legalView) return;
  for (const link of els.legalView.querySelectorAll("a.privacy-link")) {
    const href = String(link.getAttribute("href") || "");
    if (/^https?:/i.test(href)) continue;
    link.addEventListener("click", closeLegalToForm);
  }
}

async function openLegalInPlace(event) {
  if (isModifiedClick(event)) return;
  event.preventDefault();
  formScrollY = window.scrollY;
  try {
    await loadLegalBody();
  } catch (error) {
    console.warn("[public-form]", error);
    window.location.href = "/datenschutz.html";
    return;
  }
  showLegalView();
  if (!isLegalHash()) {
    history.pushState({ view: "legal" }, "", LEGAL_HASH);
  }
}

function closeLegalToForm(event) {
  if (event) event.preventDefault();
  if (isLegalHash() || (history.state && history.state.view === "legal")) {
    history.replaceState({ view: "form" }, "", window.location.pathname + window.location.search);
  }
  showFormView();
}

function syncViewFromLocation() {
  if (!isLegalHash()) {
    showFormView();
    return;
  }
  formScrollY = window.scrollY;
  loadLegalBody()
    .then(showLegalView)
    .catch((error) => {
      console.warn("[public-form]", error);
      window.location.href = "/datenschutz.html";
    });
}

async function boot() {
  try {
    const [taxonomy, catalog, weihnachten] = await Promise.all([
      loadJson("./config/public-taxonomy.json"),
      loadJson("./config/katalog-handlowy.json?v=20261030-etap-f"),
      loadJson("./config/campaigns/weihnachten-2026.json"),
    ]);
    state.taxonomy = taxonomy;
    state.catalog = catalog;
    state.campaigns = [weihnachten];
    state.snapshot = null;
    state.snapshotMissing = true;
    if (els.bookingFlow) els.bookingFlow.innerHTML = bookingFlowHtml();
    fillDateOptions();
    fillTimeOptions();
    fillDurationOptions();
    if (els.datumTag) els.datumTag.addEventListener("change", syncDatumIso);
    if (els.datumMonat) els.datumMonat.addEventListener("change", syncDatumIso);
    if (els.datumJahr) els.datumJahr.addEventListener("change", syncDatumIso);
    if (els.uhrzeitStunde) {
      els.uhrzeitStunde.addEventListener("change", () => {
        syncUhrzeitHHmm();
        renderWindowEnd();
      });
    }
    if (els.uhrzeitMinute) {
      els.uhrzeitMinute.addEventListener("change", () => {
        syncUhrzeitHHmm();
        renderWindowEnd();
      });
    }
    if (els.notizen) {
      applyNotizenPlaceholder(els.notizen);
      els.notizen.addEventListener("focus", () => applyNotizenPlaceholder(els.notizen));
      els.notizen.addEventListener("blur", () => applyNotizenPlaceholder(els.notizen));
      els.notizen.addEventListener("input", () => applyNotizenPlaceholder(els.notizen));
    }
    if (els.dauer) els.dauer.addEventListener("change", renderWindowEnd);
    renderCategories();
    els.category.addEventListener("change", onCategoryChange);
    els.packageSelect.addEventListener("change", onPackageChange);
    if (els.addons) {
      els.addons.addEventListener("click", onAddonHoursClick);
      els.addons.addEventListener("change", renderPriceSummary);
    }
    if (els.rabattcode) {
      els.rabattcode.addEventListener("input", () => renderDiscount(els.packageSelect.value));
    }
    els.form.addEventListener("submit", onSubmit);
    if (els.reviewBtn) els.reviewBtn.addEventListener("click", goToReview);
    if (els.reviewBack) els.reviewBack.addEventListener("click", goToEdit);
    const legalRoot = els.formView || els.form;
    legalRoot.addEventListener("click", (event) => {
      const link = event.target.closest("a.privacy-link[href='datenschutz.html'], a.privacy-link[href='/datenschutz.html']");
      if (!link) return;
      openLegalInPlace(event);
    });
    if (els.legalBack) els.legalBack.addEventListener("click", closeLegalToForm);
    window.addEventListener("popstate", syncViewFromLocation);
    syncQuestionnaire();
    if (isLegalHash()) syncViewFromLocation();
  } catch (error) {
    els.errors.hidden = false;
    els.errors.textContent = "Katalog oder Konfiguration konnte nicht geladen werden.";
    console.warn("[public-form]", error);
  }
}

boot();
