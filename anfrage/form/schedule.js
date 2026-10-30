/**
 * Preferencje czasowe dla standardowych Anfragen.
 * Nie rezerwuje terminu. Nie zajmuje kalendarza.
 */

import { formatHHmm, isCalendarDate, parseHHmm } from "./slots.js";

export const DURATION_MIN_HOURS = 1;
export const DURATION_MAX_HOURS = 24;
export const DURATION_STEP_HOURS = 1;
export const NOTIZEN_HINT = "Erzähl uns von deinem Plan …";
export const MINUTES_PER_DAY = 24 * 60;

export const STANDARD_TIME_COPY = {
  datumLabel: "Wunschdatum",
  startLabel: "Gewünschter Beginn",
  durationLabel: "Geplante Dauer",
  durationHint:
    "Volle Stunden, 1–24. Orientierung für das Angebot, keine Reservierung.",
  inquiryHint: "Orientierung für das Angebot. Keine Reservierung, kein Kalendereintrag.",
};

export const CAMPAIGN_TIME_COPY = {
  datumLabel: "Datum",
  startLabel: "Uhrzeit",
};

export const DATE_YEAR_MIN = 2026;
export const DATE_YEAR_MAX = 2036;
export const TIME_MINUTE_STEP = 15;
export const MONTH_NAMES_DE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function pad2(value) {
  return String(value).padStart(2, "0");
}

export function composeIsoDate(day, month, year) {
  const dayNum = Number(day);
  const monthNum = Number(month);
  const yearNum = Number(year);
  if (!Number.isInteger(dayNum) || !Number.isInteger(monthNum) || !Number.isInteger(yearNum)) {
    return null;
  }
  const iso = `${String(yearNum).padStart(4, "0")}-${pad2(monthNum)}-${pad2(dayNum)}`;
  return isCalendarDate(iso) ? iso : null;
}

export function splitIsoDate(iso) {
  if (!isCalendarDate(iso)) return null;
  return {
    year: iso.slice(0, 4),
    month: String(Number(iso.slice(5, 7))),
    day: String(Number(iso.slice(8, 10))),
  };
}

export function dayChoices() {
  return Array.from({ length: 31 }, (_, i) => i + 1);
}

export function monthChoices() {
  return MONTH_NAMES_DE.map((name, index) => ({ value: String(index + 1), name }));
}

export function yearChoices() {
  const out = [];
  for (let year = DATE_YEAR_MIN; year <= DATE_YEAR_MAX; year += 1) out.push(year);
  return out;
}

export function hourChoices() {
  return Array.from({ length: 24 }, (_, i) => pad2(i));
}

export function minuteChoices(step = TIME_MINUTE_STEP) {
  const out = [];
  for (let minute = 0; minute < 60; minute += step) out.push(pad2(minute));
  return out;
}

export function composeHHmm(hour, minute) {
  const hourNum = Number(hour);
  const minuteNum = Number(minute);
  if (!Number.isInteger(hourNum) || !Number.isInteger(minuteNum)) return null;
  if (hourNum < 0 || hourNum > 23) return null;
  if (minuteNum < 0 || minuteNum > 59) return null;
  if (minuteNum % TIME_MINUTE_STEP !== 0) return null;
  return `${pad2(hourNum)}:${pad2(minuteNum)}`;
}

export function splitHHmm(value) {
  const total = parseHHmm(value);
  if (total === null || total >= MINUTES_PER_DAY) return null;
  return {
    hour: pad2(Math.floor(total / 60)),
    minute: pad2(total % 60),
  };
}

export function parseDurationHours(value) {
  if (value == null || value === "") return null;
  const hours = Number(value);
  if (!Number.isInteger(hours)) return null;
  if (hours < DURATION_MIN_HOURS || hours > DURATION_MAX_HOURS) return null;
  if ((hours - DURATION_MIN_HOURS) % DURATION_STEP_HOURS !== 0) return null;
  return hours;
}

export function durationChoices() {
  const out = [];
  for (let hours = DURATION_MIN_HOURS; hours <= DURATION_MAX_HOURS; hours += DURATION_STEP_HOURS) {
    out.push(hours);
  }
  return out;
}

export function formatDurationLabel(hours) {
  return hours === 1 ? "1 Stunde" : `${hours} Stunden`;
}

export function preferredWindowEnd(startHHmm, durationHours) {
  const start = parseHHmm(startHHmm);
  const hours = parseDurationHours(durationHours);
  if (start === null || hours === null) return null;
  const total = start + hours * 60;
  const nextDay = total >= MINUTES_PER_DAY;
  const wrapped = ((total % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return {
    start: formatHHmm(start),
    end: formatHHmm(wrapped),
    hours,
    nextDay,
  };
}

export function preferredWindowNotes(startHHmm, durationHours) {
  const hours = parseDurationHours(durationHours);
  if (hours === null) return [];
  const lines = [`Geplante Dauer: ${formatDurationLabel(hours)}`];
  const window = preferredWindowEnd(startHHmm, hours);
  if (window) {
    lines.push(
      window.nextDay
        ? `Voraussichtliches Ende: ${window.end} (nächster Tag)`
        : `Voraussichtliches Ende: ${window.end}`,
    );
  }
  return lines;
}

export function notizenPlaceholder(isActive, value) {
  if (isActive) return "";
  if (String(value || "").trim()) return "";
  return NOTIZEN_HINT;
}

export function applyNotizenPlaceholder(textarea) {
  if (!textarea) return;
  textarea.placeholder = notizenPlaceholder(
    document.activeElement === textarea,
    textarea.value,
  );
}
