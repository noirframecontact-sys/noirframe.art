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

    if (!response.ok || !result || !result.ok) {
      const detail = result && result.error ? String(result.error) : "";
      return { ok: false, error: detail, result: result };
    }

    return { ok: true, result: result };
  }

  global.przyczlapkaAnfrage = {
    anfragenEndpoint: anfragenEndpoint,
    sendAnfrage: sendAnfrage,
  };
})(typeof window !== "undefined" ? window : globalThis);
