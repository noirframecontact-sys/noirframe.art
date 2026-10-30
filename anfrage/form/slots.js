/**
 * Lokalna ocena godzin kampanii względem snapshotu v2.
 * Nie liczy snapshotId. Nie rezerwuje terminu.
 */

export const SNAPSHOT_MAX_AGE_MS = 12 * 60 * 60 * 1000;
export const REQUIRED_SCHEMA_VERSION = 2;
export const CAMPAIGN_TIME_ZONE = "Europe/Berlin";

export const EXPECTED_CANDIDATE_STARTS = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

export const AVAILABILITY_COPY = {
  loading: "Verfügbarkeit wird geprüft …",
  missing:
    "Termine können derzeit nicht angezeigt werden. Sie können eine Anfrage ohne geprüfte Uhrzeit senden.",
  invalid:
    "Termindaten sind unvollständig oder ungültig. Stunden werden nicht als frei angezeigt.",
  unsupported:
    "Diese Termindaten werden nicht unterstützt. Stunden werden nicht als frei angezeigt.",
  stale:
    "Die Termindaten sind nicht aktuell. Stunden können nicht angeboten werden.",
  blockedDay:
    "Dieser Tag ist im Kalender als belegt gemeldet. Eine Uhrzeit wird nicht angeboten.",
  noneOpen:
    "In diesem Zeitfenster gibt es laut aktuellem Kalenderstand keine anfragbare Wunschzeit.",
  ready:
    "Mögliche Wunschzeiten — unverbindlich, keine Reservierung. Das Formular bucht nicht.",
};

const INTERVAL_KEYS = ["date", "allDay", "start", "end", "kind"];

export function parseHHmm(value) {
  const text = String(value || "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (minute < 0 || minute > 59) return null;
  if (hour === 24) return minute === 0 ? 24 * 60 : null;
  if (hour < 0 || hour > 23) return null;
  return hour * 60 + minute;
}

export function formatHHmm(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function rangesOverlapHalfOpen(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

export function candidateStartsFromCampaign(campaign) {
  const event = campaign && campaign.event;
  if (!event) return [];
  const windowStart = parseHHmm(event.windowStart);
  const windowEnd = parseHHmm(event.windowEnd);
  const session = Number(event.sessionMinutes);
  const step = session;
  if (windowStart === null || windowEnd === null) return [];
  if (!Number.isInteger(session) || session <= 0) return [];
  const out = [];
  for (let start = windowStart; start + session <= windowEnd; start += step) {
    out.push(formatHHmm(start));
  }
  return out;
}

function publishedAtMs(publishedAt) {
  if (typeof publishedAt !== "string" || !publishedAt.endsWith("Z")) return NaN;
  if (publishedAt.includes(".")) return NaN;
  const ms = Date.parse(publishedAt);
  return Number.isFinite(ms) ? ms : NaN;
}

export function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

function isIntervalRecord(item) {
  if (!item || typeof item !== "object") return false;
  const keys = Object.keys(item).sort();
  if (keys.join(",") !== [...INTERVAL_KEYS].sort().join(",")) return false;
  if (!isCalendarDate(item.date)) return false;
  if (typeof item.allDay !== "boolean") return false;
  if (typeof item.start !== "string" || typeof item.end !== "string") return false;
  if (item.kind !== "auftrag" && item.kind !== "block") return false;
  const start = parseHHmm(item.start);
  const end = parseHHmm(item.end);
  return start !== null && end !== null && start < end;
}

export function inspectSnapshot(snapshot, options) {
  const nowMs = options && Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  if (snapshot == null) {
    return { ok: false, reason: "missing" };
  }
  if (typeof snapshot !== "object") {
    return { ok: false, reason: "invalid" };
  }
  const version = snapshot.schemaVersion;
  if (version !== REQUIRED_SCHEMA_VERSION) {
    return { ok: false, reason: version === 1 ? "v1" : "unsupported" };
  }
  if (snapshot.timeZone !== CAMPAIGN_TIME_ZONE) {
    return { ok: false, reason: "invalid" };
  }
  if (typeof snapshot.snapshotId !== "string" || !snapshot.snapshotId) {
    return { ok: false, reason: "invalid" };
  }
  if (!Array.isArray(snapshot.busyDates) || !Array.isArray(snapshot.busyIntervals)) {
    return { ok: false, reason: "invalid" };
  }
  if (!snapshot.busyDates.every(isCalendarDate)) {
    return { ok: false, reason: "invalid" };
  }
  if (!snapshot.busyIntervals.every(isIntervalRecord)) {
    return { ok: false, reason: "invalid" };
  }
  const publishedMs = publishedAtMs(snapshot.publishedAt);
  if (!Number.isFinite(publishedMs)) {
    return { ok: false, reason: "invalid_publishedAt" };
  }
  if (nowMs - publishedMs > SNAPSHOT_MAX_AGE_MS) {
    return { ok: false, reason: "stale" };
  }
  if (nowMs < publishedMs) {
    return { ok: false, reason: "invalid_publishedAt" };
  }
  return { ok: true, snapshot };
}

export function evaluateCampaignHours(snapshot, campaign, options) {
  const inspected = inspectSnapshot(snapshot, options);
  if (!inspected.ok) {
    return {
      status: inspected.reason,
      hours: [],
      message: messageFor(inspected.reason),
      snapshotId: snapshot && snapshot.snapshotId ? snapshot.snapshotId : "",
    };
  }

  const date = campaign && campaign.event && campaign.event.date;
  const candidates = candidateStartsFromCampaign(campaign);
  if (!isCalendarDate(date) || candidates.length === 0) {
    return {
      status: "invalid",
      hours: [],
      message: AVAILABILITY_COPY.invalid,
      snapshotId: inspected.snapshot.snapshotId,
    };
  }

  const session = Number(campaign.event.sessionMinutes);
  const dayIntervals = inspected.snapshot.busyIntervals.filter((item) => item.date === date);
  if (inspected.snapshot.busyDates.includes(date) && dayIntervals.length === 0) {
    return {
      status: "invalid",
      hours: [],
      message: AVAILABILITY_COPY.invalid,
      snapshotId: inspected.snapshot.snapshotId,
    };
  }
  if (dayIntervals.some((item) => item.allDay)) {
    return {
      status: "blocked_day",
      hours: [],
      message: AVAILABILITY_COPY.blockedDay,
      snapshotId: inspected.snapshot.snapshotId,
    };
  }

  const hours = [];
  for (const startText of candidates) {
    const start = parseHHmm(startText);
    if (start === null) {
      return {
        status: "invalid",
        hours: [],
        message: AVAILABILITY_COPY.invalid,
        snapshotId: inspected.snapshot.snapshotId,
      };
    }
    const end = start + session;
    let blocked = false;
    for (const item of dayIntervals) {
      const busyStart = parseHHmm(item.start);
      const busyEnd = parseHHmm(item.end);
      if (busyStart === null || busyEnd === null || busyStart >= busyEnd) {
        return {
          status: "invalid",
          hours: [],
          message: AVAILABILITY_COPY.invalid,
          snapshotId: inspected.snapshot.snapshotId,
        };
      }
      if (rangesOverlapHalfOpen(start, end, busyStart, busyEnd)) {
        blocked = true;
        break;
      }
    }
    if (!blocked) hours.push(startText);
  }

  if (!hours.length) {
    return {
      status: "none_open",
      hours: [],
      message: AVAILABILITY_COPY.noneOpen,
      snapshotId: inspected.snapshot.snapshotId,
    };
  }

  return {
    status: "ready",
    hours,
    message: AVAILABILITY_COPY.ready,
    snapshotId: inspected.snapshot.snapshotId,
  };
}

function messageFor(reason) {
  if (reason === "missing") return AVAILABILITY_COPY.missing;
  if (reason === "stale") return AVAILABILITY_COPY.stale;
  if (reason === "v1" || reason === "unsupported") return AVAILABILITY_COPY.unsupported;
  return AVAILABILITY_COPY.invalid;
}
