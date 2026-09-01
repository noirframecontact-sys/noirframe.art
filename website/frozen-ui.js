/**
 * WWW-001 — Frozen UI registry (v1.1)
 *
 * P0 Brand Locked + P1 UI Locked only.
 * P2 Content and P3 Marketing strings are NOT listed here — they live in JSON/NFST.
 */
(function (global) {
  const FROZEN_UI = Object.freeze({
    NAV: Object.freeze({
      MENU_TOGGLE: "Menü",
      PORTFOLIO: "Portfolio / Galerie",
      WEDDING: "Wedding",
      PORTRAIT: "Portrait",
      REPORTAGE: "Reportage",
      VIDEO: "Video",
      ANGEBOTE: "Angebote",
      AKTUELL: "Aktuell bei uns",
      BLOG: "Blog",
      ABOUT_US: "About Us",
      KONTAKT: "Kontakt",
      ARIA: "Hauptnavigation",
    }),
    SECTION: Object.freeze({
      ABOUT_US: "ABOUT US",
      AKTUELL: "AKTUELL BEI UNS",
      ANGEBOTE: "ANGEBOTE",
      BLOG: "BLOG",
      VIDEO: "VIDEO",
    }),
    BUTTON: Object.freeze({
      BACK_TO_MENU: "BACK TO MENU",
    }),
    BRAND: Object.freeze({
      LOGO_MARK: "NF",
      LOGO_WORDMARK: "NOIЯFRAME",
    }),
    CONTACT: Object.freeze({
      BRAND: "NOIЯFRAME",
      LANGUAGES_LEAD: "Wir sprechen",
      OFFICE_LABEL: "Büro & Organisation",
    }),
    SYSTEM: Object.freeze({
      DARK_SIDE_ARIA: "The Dark Side",
      QR_ALT: "QR-Code scannen",
    }),
  });

  /** P3 defaults — editable via JSON/NFST; not enforced at render. */
  const MARKETING_DEFAULTS = Object.freeze({
    TAGLINE: "Only light matters.",
    BLOG_SIGNATURE: "– Noir Frame | Only Light Matters",
    CTA_ANGEBOTE: "Anfrage senden",
  });

  function frozenOpenTag(tagName, extraClass) {
    const classes = ["ui-frozen", "notranslate"];
    if (extraClass) {
      classes.push(extraClass);
    }
    return (
      "<" +
      tagName +
      ' class="' +
      classes.join(" ") +
      '" translate="no">'
    );
  }

  global.FROZEN_UI = FROZEN_UI;
  global.MARKETING_DEFAULTS = MARKETING_DEFAULTS;
  global.frozenOpenTag = frozenOpenTag;
})(window);
