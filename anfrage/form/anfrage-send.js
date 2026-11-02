/**
 * Public Anfrage transport. POST /anfragen to Przyczłapka.
 * Test version for the client: envelopes go to KV pending.
 * eNFOP Eingang pull stays a separate step (bridge still closed).
 */
(function (global) {
  function anfragenEndpoint() {
    const host = (global.location && global.location.hostname) || "";
    if (host === "przyczlapka.pages.dev" || host.endsWith(".przyczlapka.pages.dev")) {
      return "/anfragen";
    }
    return "https://przyczlapka.pages.dev/anfragen";
  }

  /**
   * @param {object} envelope
   * @param {{ dryRun?: boolean }} [options]
   * @returns {Promise<{ ok: boolean, dryRun?: boolean, blockedNetwork?: boolean, error?: string, result?: object, envelope?: object }>}
   */
  async function sendAnfrage(envelope, options) {
    const opts = options || {};
    if (opts.dryRun) {
      return {
        ok: true,
        dryRun: true,
        blockedNetwork: false,
        envelope: envelope,
      };
    }

    const response = await fetch(anfragenEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
    });

    let result = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (response.status === 409 || (result && result.status === "busy")) {
      return { ok: false, busy: true, error: "busy", result: result };
    }

    if (!response.ok || !result || !result.ok) {
      const detail = result && result.error ? String(result.error) : "";
      return { ok: false, error: detail, result: result };
    }

    return { ok: true, result: result };
  }

  /**
   * @param {string} iso
   * @returns {Promise<{ ok: boolean, status?: string, datum?: string, error?: string }>}
   */
  function publicationsEndpoint() {
    const host = (global.location && global.location.hostname) || "";
    if (host === "przyczlapka.pages.dev" || host.endsWith(".przyczlapka.pages.dev")) {
      return "/publications/dostepnosc-terminow";
    }
    return "https://przyczlapka.pages.dev/publications/dostepnosc-terminow";
  }

  async function checkSnapshotBusy(datum) {
    const response = await fetch(publicationsEndpoint(), { method: "GET", cache: "no-store" });
    const snapshot = await response.json();
    if (!response.ok || !snapshot || !Array.isArray(snapshot.busyDates)) {
      return { ok: false, status: "unknown" };
    }
    const busy = snapshot.busyDates.indexOf(datum) !== -1;
    return { ok: true, status: busy ? "busy" : "free", datum: datum };
  }

  async function checkDate(iso) {
    const datum = String(iso || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
      return { ok: false, status: "unknown", error: "datum required" };
    }
    const url = `${anfragenEndpoint()}?datum=${encodeURIComponent(datum)}`;
    try {
      const response = await fetch(url, { method: "GET", cache: "no-store" });
      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }
      if (response.ok && result && result.ok && (result.status === "busy" || result.status === "free")) {
        return { ok: true, status: result.status, datum: result.datum || datum };
      }
    } catch {
      /* fallback: published busyDates */
    }
    try {
      return await checkSnapshotBusy(datum);
    } catch {
      return { ok: false, status: "unknown" };
    }
  }

  global.przyczlapkaAnfrage = {
    anfragenEndpoint: anfragenEndpoint,
    sendAnfrage: sendAnfrage,
    checkDate: checkDate,
  };
})(typeof window !== "undefined" ? window : globalThis);
