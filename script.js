const FU = window.FROZEN_UI;
if (!FU) {
  throw new Error("WWW-001: load website/frozen-ui.js before script.js");
}

const FADE_MS = 520;
const HERO_HOLD_MS = 3000;

/* Dark Side — set false before production push */
const DARK_SIDE_ENABLED = true;
/* Blog / BTS — true gdy są wpisy w data/blog.json i gotowe na menu */
const BLOG_ENABLED = true;
const DARK_FADE_IN_MS = 1000;
const DARK_FADE_OUT_MS = 1200;
const DARK_NAV_REVEAL_LEAD_MS = 420;
const DARK_CLOCK_SCENE_MS = 10000;
/** Re-enable after clock scene is finished — video detached for now */
const DARK_SIDE_VIDEO_ENABLED = false;
/** Native Fullscreen API on moon click (desktop/Android; iOS falls back to fixed overlay) */
const DARK_SIDE_FULLSCREEN_ENABLED = true;
const DARK_VIDEO_REVEAL_MS = 1000;
const DARK_VIDEO_FADE_MS = 2000;
const DARK_AUDIO_DELAY_MS = 2500;
const DARK_AUDIO_FADE_MS = 1500;
const DARK_VIDEO_SRC = "Dark_Side/NF_DARK.mp4?v=20260803-2137";

const DARK_MOON_ICON =
  '<svg class="darkSideIcon" viewBox="0 0 256 256" aria-hidden="true" focusable="false">' +
  '<path fill="currentColor" d="M128 40a88 88 0 1 0 88 88A72 72 0 1 1 128 40z"></path>' +
  "</svg>";

const DARK_ROTATE_ICON =
  '<svg class="darkSideIcon darkSideIcon--rotate" viewBox="0 0 256 256" aria-hidden="true" focusable="false">' +
  '<rect x="64" y="32" width="128" height="192" rx="16" fill="none" stroke="currentColor" stroke-width="12"></rect>' +
  '<path fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" d="M176 88h32l-24-24"></path>' +
  "</svg>";

/**
 * WWW-004D.1 — docelowe HERO (JPG). Puste = neutralny placeholder w UI.
 * Po wyborze PO ustaw np.:
 *   bright: "images/portfolio/hero-bright.jpg"
 *   dark: "images/portfolio/hero-dark.jpg"
 */
const PORTFOLIO_HERO_SRC = Object.freeze({
  bright: "images/weddings/foto01.jpg",
  dark: "images/portfolio/hero-dark.jpg",
  afterFrame: "images/portfolio/hero-after-frame.jpg",
});

const galleryManifestCache = {};
/** Bump when wedding/gallery JPGs or gallery.json change (cache-bust same filenames). */
const GALLERY_ASSET_VERSION = "20261017-foto06-hero";
let galleryLoadId = 0;
let angeboteCache = null;
let aktuellCache = null;
let blogCache = null;
let contactCache = null;
let motionCache = null;
let afterFrameCache = null;

const MOTION_FALLBACK = {
  items: [
    {
      file: "Video01.mp4",
      caption: "32 seconds of NOIЯFRAME",
    },
    {
      file: "Video02.mp4",
      caption: "Henna Abend by NOIЯFRAME",
    },
  ],
  footer: "Only light matters.",
};

const ANGEBOTE_FALLBACK = {
  title: FU.SECTION.ANGEBOTE,
  intro: "",
  items: [
    { title: "Hochzeit", price: "ab 999 €" },
    { title: "Standesamt", price: "ab 499 €" },
    { title: "Business", price: "ab 450 €" },
    { title: "Verlobung / Engagement", price: "ab 299 €" },
    { title: "Events & Feiern", price: "ab 179 €" },
    { title: "Familie & Portrait", price: "ab 129 €" },
  ],
  noteLead: "Orientierungspreise – individuell vereinbar.",
  note:
    "Die genannten Preise dienen als erste Orientierung. Jedes Projekt ist individuell und wird nach Umfang, Dauer und Anforderungen persönlich kalkuliert. Der endgültige Preis wird nach weiterer Kontaktaufnahme und gemeinsamer Abstimmung vereinbart.",
  ctaLabel: "Anfrage senden",
};

const BLOG_FALLBACK = {
  title: FU.SECTION.BLOG,
  intro: "Fotografie. Erinnerungen. Geschichten.\n\nVon alten Familienbildern über analoge Fotografie bis zu den aktuellen Projekten von Noir Frame.",
  items: [],
  footer: "",
};

const BLOG_SIGNATURE =
  (window.MARKETING_DEFAULTS && window.MARKETING_DEFAULTS.BLOG_SIGNATURE) ||
  "– Noir Frame | Only Light Matters";

const AKTUELL_FALLBACK = {
  title: FU.SECTION.AKTUELL,
  intro: "Aktuelle Aktionen, Mini-Sessions und saisonale Angebote von Noir Frame.",
  items: [
    {
      title: "MINI OUTDOOR SHOOTING",
      subtitle: "Kinder & Familie",
      price: "99 €",
      features: [
        "30 Minuten",
        "10 professionell bearbeitete Fotos",
        "Online-Galerie inklusive",
      ],
      hint: "Nur wenige Termine verfügbar.",
      image: "images/aktuell/NF_ANGEBOT.jpg",
      imageAlt: "Mini Outdoor Shooting — Kinder & Familie",
      qrCode: "images/aktuell/noirframe_mini_outdoor_qr.png",
      qrAlt: "Termin buchen — QR-Code scannen",
    },
  ],
};

function cancelPendingGalleryLoads() {
  galleryLoadId += 1;
}

const MENU_HERO_IMAGES = [
  { src: "images/karuzela/NF01.jpg", width: 900, height: 600 },
  { src: "images/karuzela/NF02.jpg", width: 799, height: 600 },
  { src: "images/karuzela/NF03.jpg", width: 800, height: 600 },
  { src: "images/karuzela/NF04.jpg", width: 900, height: 600 },
  { src: "images/karuzela/NF05.jpg", width: 800, height: 600 },
  { src: "images/karuzela/NF06.jpg", width: 900, height: 600 },
  { src: "images/karuzela/NF07.jpg", width: 900, height: 600 },
];
/** Full film loop duration in seconds — tune for speed tests (~8s per frame at 56). */
const MENU_HERO_LOOP_SECONDS = 56;

let heroTransitionStarted = false;
let darkSideOverlay = null;
let darkSideVideo = null;
let darkSideActive = false;
let darkSideAudioTimer = null;
let darkSideExitTimer = null;
let darkSideNavRevealTimer = null;
let darkSideVideoTimer = null;
let darkSideClockTimer = null;
let siteNav = null;
let portfolioHoverOpenTimer = null;
let portfolioHoverCloseTimer = null;
const PORTFOLIO_HOVER_OPEN_MS = 400;
const PORTFOLIO_HOVER_CLOSE_MS = 220;
let menuHeroTrack = null;
let menuHeroResizeHandler = null;
let menuHeroFallbackTimer = null;
let menuHeroFallbackOffset = 0;
let menuHeroFallbackLastTime = 0;

function openMenuFromHero() {
  if (heroTransitionStarted) {
    return;
  }
  heroTransitionStarted = true;

  const container = document.querySelector(".container");
  if (container) {
    container.classList.remove("show");
    setTimeout(function () {
      showMenu(true);
    }, FADE_MS);
    return;
  }
  showMenu();
}

function transitionBody(html, onReady, skipFadeOut) {
  stopMenuHero();
  const existing = document.body.firstElementChild;

  if (!skipFadeOut && existing && existing.classList.contains("fade")) {
    existing.classList.remove("show");
    setTimeout(function () {
      document.body.innerHTML = html;
      revealScreen(onReady);
    }, FADE_MS);
    return;
  }

  document.body.innerHTML = html;
  revealScreen(onReady);
}

function revealScreen(onReady) {
  const screen = document.body.firstElementChild;

  function finishReveal() {
    if (onReady) {
      onReady();
    }
    updateSiteNavVisibility();
  }

  if (screen) {
    screen.classList.add("fade");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        screen.classList.add("show");
        finishReveal();
      });
    });
    return;
  }

  finishReveal();
}

function ensureSiteNav() {
  const navHtml =
    '<div class="siteNav__bar">' +
    '<button type="button" class="siteNav__toggle ui-frozen notranslate" id="siteNavToggle" aria-expanded="false" aria-controls="siteNavPanel" translate="no">' +
    '<i class="ph-light ph-list"></i>' +
    "<span>" +
    FU.NAV.MENU_TOGGLE +
    "</span>" +
    "</button>" +
    '<div class="siteNav__panel siteNav__fadeSurface" id="siteNavPanel">' +
    '<div class="siteNav__panelInner">' +
    '<button type="button" class="siteNav__link ui-frozen notranslate" data-nav-action="portfolio" translate="no">' +
    FU.NAV.PORTFOLIO +
    "</button>" +
    '<hr class="siteNav__divider" aria-hidden="true">' +
    '<button type="button" class="siteNav__link ui-frozen notranslate" data-nav-action="angebote" translate="no">' +
    FU.NAV.ANGEBOTE +
    "</button>" +
    '<hr class="siteNav__divider" aria-hidden="true">' +
    '<button type="button" class="siteNav__link ui-frozen notranslate" data-nav-action="aktuell" translate="no">' +
    FU.NAV.AKTUELL +
    "</button>" +
    (BLOG_ENABLED
      ? '<hr class="siteNav__divider" aria-hidden="true">' +
        '<button type="button" class="siteNav__link ui-frozen notranslate" data-nav-action="blog" translate="no">' +
        FU.NAV.BLOG +
        "</button>"
      : "") +
    '<hr class="siteNav__divider" aria-hidden="true">' +
    '<button type="button" class="siteNav__link ui-frozen notranslate" data-nav-action="about" translate="no">' +
    FU.NAV.ABOUT_US +
    "</button>" +
    '<hr class="siteNav__divider" aria-hidden="true">' +
    '<button type="button" class="siteNav__link ui-frozen notranslate" data-nav-action="contact" translate="no">' +
    FU.NAV.KONTAKT +
    "</button>" +
    "</div>" +
    "</div>" +
    "</div>";

  if (siteNav) {
    siteNav.innerHTML = navHtml;
    bindSiteNav();
    return;
  }

  siteNav = document.createElement("nav");
  siteNav.id = "siteNav";
  siteNav.className = "siteNav siteNav--hidden";
  siteNav.setAttribute("aria-label", FU.NAV.ARIA);
  siteNav.innerHTML = navHtml;

  document.documentElement.appendChild(siteNav);
  bindSiteNav();
}

function releaseSiteNavFocus() {
  if (
    siteNav &&
    document.activeElement &&
    siteNav.contains(document.activeElement)
  ) {
    document.activeElement.blur();
  }
}

function isDesktopSiteNav() {
  return window.matchMedia("(min-width: 901px) and (hover: hover) and (pointer: fine)").matches;
}

function clearPortfolioHoverTimers() {
  if (portfolioHoverOpenTimer) {
    clearTimeout(portfolioHoverOpenTimer);
    portfolioHoverOpenTimer = null;
  }
  if (portfolioHoverCloseTimer) {
    clearTimeout(portfolioHoverCloseTimer);
    portfolioHoverCloseTimer = null;
  }
}

function setPortfolioMenuOpen(open) {
  const group = document.getElementById("siteNavPortfolio");
  const trigger = document.getElementById("siteNavPortfolioTrigger");
  if (!group || !trigger) {
    return;
  }

  group.classList.toggle("is-open", open);
  trigger.setAttribute("aria-expanded", open ? "true" : "false");
}

function bindPortfolioDesktopHover() {
  const group = document.getElementById("siteNavPortfolio");
  if (!group) {
    return;
  }

  group.addEventListener("mouseenter", function () {
    if (!isDesktopSiteNav()) {
      return;
    }

    clearPortfolioHoverTimers();
    portfolioHoverOpenTimer = setTimeout(function () {
      portfolioHoverOpenTimer = null;
      setPortfolioMenuOpen(true);
    }, PORTFOLIO_HOVER_OPEN_MS);
  });

  group.addEventListener("mouseleave", function () {
    if (!isDesktopSiteNav()) {
      return;
    }

    if (portfolioHoverOpenTimer) {
      clearTimeout(portfolioHoverOpenTimer);
      portfolioHoverOpenTimer = null;
    }

    portfolioHoverCloseTimer = setTimeout(function () {
      portfolioHoverCloseTimer = null;
      setPortfolioMenuOpen(false);
    }, PORTFOLIO_HOVER_CLOSE_MS);
  });
}

function closeSiteNavPanels() {
  if (!siteNav) {
    return;
  }

  clearPortfolioHoverTimers();
  siteNav.classList.remove("siteNav--open");
  const toggle = document.getElementById("siteNavToggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
  }

  const portfolio = document.getElementById("siteNavPortfolio");
  if (portfolio) {
    portfolio.classList.remove("is-open");
  }

  const portfolioTrigger = document.getElementById("siteNavPortfolioTrigger");
  if (portfolioTrigger) {
    portfolioTrigger.setAttribute("aria-expanded", "false");
  }

  releaseSiteNavFocus();
}

function beginSubpageNavigation() {
  closeSiteNavPanels();

  if (siteNav) {
    siteNav.classList.add("siteNav--hidden");
  }
}

function updateSiteNavVisibility() {
  if (!siteNav) {
    return;
  }

  const onHero = Boolean(document.body.querySelector(".container"));
  const onSubpage = Boolean(document.body.querySelector(".gallery"));
  const hide = onHero || darkSideActive || onSubpage;
  siteNav.classList.toggle("siteNav--hidden", hide);

  if (hide) {
    closeSiteNavPanels();
  }
}

function bindSiteNav() {
  document.getElementById("siteNavToggle").addEventListener("click", function () {
    const isOpen = siteNav.classList.toggle("siteNav--open");
    this.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  siteNav.querySelectorAll("[data-nav-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      const action = button.getAttribute("data-nav-action");
      beginSubpageNavigation();

      if (action === "portfolio") {
        showPortfolioPicker();
        return;
      }
      if (action === "gallery") {
        openGallery(button.getAttribute("data-gallery-folder"));
        return;
      }
      if (action === "angebote") {
        showAngebote();
        return;
      }
      if (action === "aktuell") {
        showAktuell();
        return;
      }
      if (action === "blog") {
        showBlog();
        return;
      }
      if (action === "video") {
        showFilms();
        return;
      }
      if (action === "about") {
        showAbout();
        return;
      }
      if (action === "contact") {
        showContact();
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (!siteNav || siteNav.classList.contains("siteNav--hidden")) {
      return;
    }
    if (siteNav.contains(event.target)) {
      return;
    }
    closeSiteNavPanels();
  });
}

function galleryAssetPath(folder, filename) {
  return (
    "images/" + folder + "/" + filename + "?v=" + encodeURIComponent(GALLERY_ASSET_VERSION)
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fetchAngebote() {
  if (angeboteCache) {
    return Promise.resolve(angeboteCache);
  }

  return fetch("data/angebote.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Angebote manifest not found");
      }
      return response.json();
    })
    .then(function (data) {
      angeboteCache = normalizeAngeboteData(data);
      return angeboteCache;
    });
}

function normalizeAngeboteData(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    title: FU.SECTION.ANGEBOTE,
    intro: data.intro || "",
    items: items.length ? items : ANGEBOTE_FALLBACK.items,
    noteLead: data.noteLead || ANGEBOTE_FALLBACK.noteLead,
    note: data.note || ANGEBOTE_FALLBACK.note,
    ctaLabel: data.ctaLabel || ANGEBOTE_FALLBACK.ctaLabel,
  };
}

function angeboteCardHtml(item) {
  let html =
    '<article class="angebotCard">' +
    "<h3>" +
    escapeHtml(item.title) +
    "</h3>" +
    '<p class="angebotPrice">' +
    escapeHtml(item.price) +
    "</p>";

  if (item.description) {
    html += "<p>" + escapeHtml(item.description) + "</p>";
  }

  return html + "</article>";
}

function angeboteScreenHtml(data) {
  const cards = data.items.map(angeboteCardHtml).join("");
  const introHtml = data.intro
    ? "<p>" + escapeHtml(data.intro) + "</p>"
    : "";

  return (
    '<div class="gallery gallery--angebote fade">' +
    frozenOpenTag("h1") +
    escapeHtml(data.title) +
    "</h1>" +
    introHtml +
    '<div class="angeboteGrid">' +
    cards +
    "</div>" +
    '<div class="angeboteNotes">' +
    '<p class="angeboteNoteLead">' +
    escapeHtml(data.noteLead) +
    "</p>" +
    '<p class="angeboteNote">' +
    escapeHtml(data.note) +
    "</p>" +
    "</div>" +
    '<button type="button" class="angeboteCta" id="angeboteCtaButton">' +
    escapeHtml(data.ctaLabel) +
    "</button>" +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>"
  );
}

function bindAngeboteScreen() {
  const cta = document.getElementById("angeboteCtaButton");
  if (cta) {
    cta.addEventListener("click", function () {
      showContact();
    });
  }
}

function showAngebote() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();

  fetchAngebote()
    .then(function (data) {
      transitionBody(angeboteScreenHtml(data), bindAngeboteScreen);
    })
    .catch(function () {
      transitionBody(
        angeboteScreenHtml(ANGEBOTE_FALLBACK),
        bindAngeboteScreen
      );
    });
}

function fetchAktuell() {
  if (aktuellCache) {
    return Promise.resolve(aktuellCache);
  }

  return fetch("data/aktuell.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Aktuell manifest not found");
      }
      return response.json();
    })
    .then(function (data) {
      aktuellCache = normalizeAktuellData(data);
      return aktuellCache;
    });
}

function normalizeAktuellData(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  return {
    title: FU.SECTION.AKTUELL,
    intro: data.intro || AKTUELL_FALLBACK.intro,
    items: items.length ? items : AKTUELL_FALLBACK.items,
  };
}

function aktuellFeatureHtml(feature) {
  return "<li>" + escapeHtml(feature) + "</li>";
}

function aktuellItemHtml(item) {
  const features = Array.isArray(item.features) ? item.features : [];
  const featuresHtml = features.map(aktuellFeatureHtml).join("");
  const qrHtml = item.qrCode
    ? '<div class="aktuellItem__qr">' +
      '<img src="' +
      escapeHtml(item.qrCode) +
      '" alt="' +
      escapeHtml(item.qrAlt || FU.SYSTEM.QR_ALT) +
      '" width="128" height="128" loading="lazy" decoding="async">' +
      "</div>"
    : "";

  return (
    '<article class="aktuellItem">' +
    '<div class="aktuellItem__media">' +
    '<img src="' +
    escapeHtml(item.image) +
    '" alt="' +
    escapeHtml(item.imageAlt || item.title) +
    '" loading="lazy" decoding="async">' +
    "</div>" +
    '<div class="aktuellItem__body">' +
    "<h2>" +
    escapeHtml(item.title) +
    "</h2>" +
    '<p class="aktuellItem__subtitle">' +
    escapeHtml(item.subtitle) +
    "</p>" +
    '<p class="aktuellItem__price">' +
    escapeHtml(item.price) +
    "</p>" +
    '<ul class="aktuellItem__features">' +
    featuresHtml +
    "</ul>" +
    '<p class="aktuellItem__hint">' +
    escapeHtml(item.hint) +
    "</p>" +
    qrHtml +
    "</div>" +
    "</article>"
  );
}

function aktuellScreenHtml(data) {
  const itemsHtml = data.items
    .map(function (item) {
      return aktuellItemHtml(item);
    })
    .join("");

  return (
    '<div class="gallery gallery--aktuell fade">' +
    frozenOpenTag("h1") +
    escapeHtml(data.title) +
    "</h1>" +
    "<p>" +
    escapeHtml(data.intro) +
    "</p>" +
    '<div class="aktuellList">' +
    itemsHtml +
    "</div>" +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>"
  );
}

function showAktuell() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();

  fetchAktuell()
    .then(function (data) {
      transitionBody(aktuellScreenHtml(data));
    })
    .catch(function () {
      transitionBody(aktuellScreenHtml(AKTUELL_FALLBACK));
    });
}

function fetchGalleryManifest(folder) {
  if (galleryManifestCache[folder]) {
    return Promise.resolve(galleryManifestCache[folder]);
  }

  return fetch(galleryAssetPath(folder, "gallery.json"), { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Gallery manifest not found");
      }
      return response.json();
    })
    .then(function (data) {
      const images = Array.isArray(data) ? data : data.images || [];
      galleryManifestCache[folder] = images;
      return images;
    });
}

function galleryImageTag(folder, filename, isFirst) {
  const src = galleryAssetPath(folder, filename);
  const lazy = isFirst ? "" : ' loading="lazy"';
  const priority = isFirst ? ' fetchpriority="high"' : "";

  return '<img src="' + src + '"' + lazy + ' decoding="async"' + priority + ">";
}

function teamImageTag(filename) {
  return (
    '<img src="images/team/' + filename + '.jpg" loading="lazy" decoding="async">'
  );
}

function backButtonHtml(id, label, extraClass) {
  const classes = ["backToMenuButton"];
  if (extraClass) {
    extraClass.split(/\s+/).forEach(function (className) {
      if (className) {
        classes.push(className);
      }
    });
  }

  return (
    '<button type="button" class="' +
    classes.join(" ") +
    ' ui-frozen notranslate" id="' +
    id +
    '" translate="no"><i class="ph-light ph-arrow-left"></i> ' +
    label +
    "</button>"
  );
}

function menuHeroHtml() {
  const loopImages = MENU_HERO_IMAGES.concat(MENU_HERO_IMAGES);
  const slides = loopImages
    .map(function (item, index) {
      const priority = index === 0 ? ' fetchpriority="high"' : "";
      return (
        '<div class="menuHeroSlide">' +
        '<img src="' +
        item.src +
        '" alt="" width="' +
        item.width +
        '" height="' +
        item.height +
        '" decoding="async" loading="eager"' +
        priority +
        ">" +
        "</div>"
      );
    })
    .join("");

  return (
    '<div class="menuHeroMachine">' +
    '<div class="menuHeroViewport" id="menuHeroViewport">' +
    '<div class="menuHeroTrack" id="menuHeroTrack">' +
    slides +
    "</div></div></div>"
  );
}

let menuHeroLoopDistance = 0;
let menuHeroMotionAttempts = 0;

function measureMenuHeroLoopDistance(track) {
  const count = MENU_HERO_IMAGES.length;
  if (!track || track.children.length < count * 2) {
    return 0;
  }

  const first = track.children[0];
  const loopStart = track.children[count];
  const layoutDistance = loopStart.offsetLeft - first.offsetLeft;

  if (layoutDistance > 1) {
    return layoutDistance;
  }

  const gap = parseFloat(getComputedStyle(track).gap) || 0;
  let sumDistance = 0;

  for (let i = 0; i < count; i++) {
    sumDistance += track.children[i].offsetWidth;
    sumDistance += gap;
  }

  return sumDistance > 1 ? sumDistance : 0;
}

function normalizeMenuHeroOffset(offset, loopDistance) {
  if (!loopDistance) {
    return offset;
  }

  while (offset <= -loopDistance) {
    offset += loopDistance;
  }

  while (offset > 0) {
    offset -= loopDistance;
  }

  return offset;
}

function syncMenuHeroLoopDistance(track, preserveMotion) {
  const nextDistance = measureMenuHeroLoopDistance(track);
  if (!nextDistance) {
    return false;
  }

  if (preserveMotion && menuHeroLoopDistance > 0) {
    const progress = menuHeroFallbackOffset / menuHeroLoopDistance;
    menuHeroFallbackOffset = normalizeMenuHeroOffset(
      progress * nextDistance,
      nextDistance
    );
  }

  menuHeroLoopDistance = nextDistance;
  return true;
}

function whenMenuHeroImagesReady(track, callback) {
  const images = track.querySelectorAll("img");
  let pending = 0;
  let done = false;

  function finish() {
    if (done) {
      return;
    }
    done = true;
    callback();
  }

  images.forEach(function (img) {
    if (!img.complete) {
      pending++;
    }
  });

  if (!pending) {
    finish();
    return;
  }

  function markDone() {
    pending--;
    if (pending <= 0) {
      finish();
    }
  }

  images.forEach(function (img) {
    if (img.complete) {
      return;
    }

    img.addEventListener("load", markDone, { once: true });
    img.addEventListener("error", markDone, { once: true });
  });

  setTimeout(finish, 1200);
}

function stopMenuHeroFallback() {
  if (menuHeroFallbackTimer) {
    cancelAnimationFrame(menuHeroFallbackTimer);
    menuHeroFallbackTimer = null;
  }

  menuHeroFallbackLastTime = 0;
}

function tickMenuHeroFallback(track) {
  if (!track || !document.body.contains(track)) {
    stopMenuHeroFallback();
    return;
  }

  const loopDistance = menuHeroLoopDistance;
  if (!loopDistance) {
    stopMenuHeroFallback();
    return;
  }

  const now = performance.now();
  if (!menuHeroFallbackLastTime) {
    menuHeroFallbackLastTime = now;
  }

  const delta = (now - menuHeroFallbackLastTime) / 1000;
  menuHeroFallbackLastTime = now;
  const speed = loopDistance / MENU_HERO_LOOP_SECONDS;

  menuHeroFallbackOffset -= speed * delta;
  menuHeroFallbackOffset = normalizeMenuHeroOffset(menuHeroFallbackOffset, loopDistance);

  track.style.transform =
    "translate3d(" + menuHeroFallbackOffset.toFixed(2) + "px, 0, 0)";
  menuHeroFallbackTimer = requestAnimationFrame(function () {
    tickMenuHeroFallback(track);
  });
}

function startMenuHeroFallback(track) {
  stopMenuHeroFallback();
  menuHeroFallbackLastTime = 0;
  tickMenuHeroFallback(track);
}

function beginMenuHeroMotion(track, preserveMotion) {
  menuHeroMotionAttempts += 1;

  if (!syncMenuHeroLoopDistance(track, preserveMotion)) {
    if (menuHeroMotionAttempts < 80) {
      setTimeout(function () {
        beginMenuHeroMotion(track, preserveMotion);
      }, 50);
    }
    return;
  }

  menuHeroMotionAttempts = 0;

  if (!preserveMotion) {
    menuHeroFallbackOffset = 0;
    track.style.transform = "translate3d(0, 0, 0)";
  }

  startMenuHeroFallback(track);
}

function startMenuHeroMotion(track, preserveMotion) {
  if (!track || !document.body.contains(track)) {
    return;
  }

  menuHeroMotionAttempts = 0;

  whenMenuHeroImagesReady(track, function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        beginMenuHeroMotion(track, preserveMotion);
      });
    });
  });
}

function stopMenuHero() {
  stopMenuHeroFallback();
  menuHeroFallbackOffset = 0;
  menuHeroLoopDistance = 0;
  menuHeroMotionAttempts = 0;

  if (menuHeroResizeHandler) {
    window.removeEventListener("resize", menuHeroResizeHandler);
    menuHeroResizeHandler = null;
  }

  menuHeroTrack = null;
}

function setupMenuHero() {
  stopMenuHero();

  menuHeroTrack = document.getElementById("menuHeroTrack");
  if (!menuHeroTrack) {
    return;
  }

  menuHeroResizeHandler = function () {
    if (menuHeroTrack) {
      startMenuHeroMotion(menuHeroTrack, true);
    }
  };
  window.addEventListener("resize", menuHeroResizeHandler);

  startMenuHeroMotion(menuHeroTrack, false);
}

function showMenu(skipFadeOut) {
  cancelPendingGalleryLoads();
  transitionBody(
    '<div class="menuWrapper fade">' +
      (DARK_SIDE_ENABLED
        ? '<div class="menuIntro">' +
          '<button type="button" class="darkSideMoon ui-frozen notranslate" id="darkSideMoon" aria-label="' +
          escapeHtml(FU.SYSTEM.DARK_SIDE_ARIA) +
          '" translate="no">' +
          DARK_MOON_ICON +
          "</button>" +
          '<div class="nfLogo ui-frozen notranslate" translate="no">' +
          FU.BRAND.LOGO_MARK +
          "<span>" +
          FU.BRAND.LOGO_WORDMARK +
          "</span></div>" +
          "</div>"
        : '<div class="nfLogo ui-frozen notranslate" translate="no">' +
          FU.BRAND.LOGO_MARK +
          "<span>" +
          FU.BRAND.LOGO_WORDMARK +
          "</span></div>") +
      menuHeroHtml() +
      "</div>",
    setupMenuScreen,
    skipFadeOut === true
  );
}

function setupMenuScreen() {
  if (DARK_SIDE_ENABLED) {
    const moonButton = document.getElementById("darkSideMoon");
    if (moonButton) {
      moonButton.addEventListener("click", enterDarkSide);
    }
  }

  setupMenuHero();
}

function bindBackToMenu() {
  /* Back navigation uses a single document listener (see bottom of script). */
}

function galleryEmptyScreenHtml(message) {
  return (
    '<div class="gallery fade">' +
    '<p class="galleryEmptyMessage ui-frozen notranslate" translate="no">' +
    escapeHtml(message) +
    "</p>" +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>"
  );
}

function galleryUnavailableMessage(folder) {
  if (folder === "dsotl") {
    return FU.PORTFOLIO.DSOTL_UNAVAILABLE;
  }
  if (folder === "sarinas-art") {
    return FU.PORTFOLIO.SARINAS_ART_UNAVAILABLE;
  }
  return FU.PORTFOLIO.GALLERY_UNAVAILABLE;
}

function portfolioHeroMediaHtml(imageKey) {
  var src = String(PORTFOLIO_HERO_SRC[imageKey] || "").trim();
  if (src) {
    src =
      src +
      (src.indexOf("?") >= 0 ? "&" : "?") +
      "v=" +
      encodeURIComponent(GALLERY_ASSET_VERSION);
    var priority = imageKey === "bright" ? "high" : "auto";
    return (
      '<img class="portfolioPicker__image" src="' +
      escapeHtml(src) +
      '" alt="" decoding="async" fetchpriority="' +
      priority +
      '">'
    );
  }

  return (
    '<span class="portfolioPicker__heroPlaceholder ui-frozen notranslate" translate="no">' +
    escapeHtml(FU.PORTFOLIO.HERO_PLACEHOLDER) +
    "</span>"
  );
}

function portfolioTileHtml(galleryFolder, imageKey, label) {
  var darkClass =
    imageKey === "dark" || imageKey === "sarina" ? " portfolioPicker__tile--dark" : "";
  var brightClass = imageKey === "bright" ? " portfolioPicker__tile--bright" : "";
  return (
    '<button type="button" class="portfolioPicker__tile ui-frozen notranslate' +
    darkClass +
    brightClass +
    '" data-portfolio-gallery="' +
    escapeHtml(galleryFolder) +
    '" translate="no">' +
    '<span class="portfolioPicker__media">' +
    portfolioHeroMediaHtml(imageKey) +
    "</span>" +
    '<span class="portfolioPicker__label">' +
    escapeHtml(label) +
    "</span>" +
    "</button>"
  );
}

function portfolioPickerHtml() {
  return (
    '<div class="gallery gallery--portfolio fade">' +
    '<div class="portfolioPicker" role="group" aria-label="' +
    escapeHtml(FU.NAV.PORTFOLIO) +
    '">' +
    portfolioTileHtml("weddings", "bright", FU.PORTFOLIO.BRIGHT_SIDE) +
    portfolioTileHtml("dsotl", "dark", FU.PORTFOLIO.DARK_SIDE) +
    portfolioTileHtml("after-frame", "afterFrame", FU.PORTFOLIO.AFTER_FRAME) +
    portfolioTileHtml("sarinas-art", "sarina", FU.PORTFOLIO.SARINAS_ART) +
    "</div>" +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>"
  );
}

function bindPortfolioPickerScreen() {
  document.querySelectorAll("[data-portfolio-gallery]").forEach(function (button) {
    button.addEventListener("click", function () {
      const folder = button.getAttribute("data-portfolio-gallery");
      if (folder === "after-frame") {
        showAfterFrame();
        return;
      }
      openGallery(folder);
    });
  });
}

function showPortfolioPicker() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();
  transitionBody(portfolioPickerHtml(), bindPortfolioPickerScreen);
}

function openGallery(folder) {
  beginSubpageNavigation();
  const loadId = ++galleryLoadId;

  fetchGalleryManifest(folder)
    .then(function (images) {
      if (loadId !== galleryLoadId) {
        return;
      }

      if (!Array.isArray(images) || images.length === 0) {
        transitionBody(galleryEmptyScreenHtml(galleryUnavailableMessage(folder)), bindBackToMenu);
        return;
      }

      let imagesHtml = "";
      images.forEach(function (filename, index) {
        imagesHtml += galleryImageTag(folder, filename, index === 0);
      });

      transitionBody(
        '<div class="gallery fade">' +
          imagesHtml +
          backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
          "</div>",
        bindBackToMenu
      );
    })
    .catch(function () {
      if (loadId !== galleryLoadId) {
        return;
      }

      transitionBody(galleryEmptyScreenHtml(galleryUnavailableMessage(folder)), bindBackToMenu);
    });
}

function showAbout() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();
  aboutCache = null;
  fetchAboutData()
    .then(function (about) {
      transitionBody(renderAboutHtml(about), bindAboutTeam);
    })
    .catch(function () {
      transitionBody(renderAboutHtml(defaultAboutData()), bindAboutTeam);
    });
}

var aboutCache = null;
var ABOUT_TEAM_MOTTO = "NOIR FRAME — Only Light Matters.";

function defaultAboutData() {
  return {
    headline: FU.SECTION.ABOUT_US,
    subline: "Two people. One workflow.",
    members: [
      {
        file: "foto01.jpg",
        name: "Marcin Porębski",
        role: "Founder & Photographer",
        description:
          "Ich bin Marcin – Fotograf, Musiker und visueller Geschichtenerzähler. Mich interessieren echte Menschen, ungestellte Momente und das Licht zwischen Hell und Dunkel. Ich suche nicht nach Perfektion, sondern nach Charakter, Atmosphäre und Bildern, die etwas fühlen lassen.",
      },
      {
        file: "foto02.jpg",
        name: "Sarina Skrobanek",
        role: "Second Shooter",
        description:
          "Ich bin Sarina und liebe es, mit meiner Kamera echte Momente und Emotionen einzufangen. Besonders faszinieren mich die kleinen, oft unscheinbaren Augenblicke, die eine Geschichte erzählen und Erinnerungen lebendig machen. Mir ist es wichtig, nicht nur festzuhalten, wie etwas aussieht, sondern vor allem, wie es sich anfühlt. Dabei achte ich besonders auf die Stimmung, die kleinen Details und die natürlichen Momente, die oft ganz nebenbei entstehen. Ich mag Bilder, die nicht perfekt inszeniert sein müssen, sondern authentisch sind und echte Gefühle widerspiegeln. Denn für mich sind es gerade die kleinen Dinge, die einen Moment besonders und einzigartig machen.",
      },
    ],
  };
}

function fetchAboutData() {
  if (aboutCache) {
    return Promise.resolve(aboutCache);
  }

  return fetch("data/about.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("About manifest not found");
      }
      return response.json();
    })
    .then(function (data) {
      aboutCache = data;
      return aboutCache;
    });
}

function aboutDescriptionHtml(text) {
  return escapeHtml(String(text || "")).replace(/\n/g, "<br>");
}

function aboutMemberBioHtml(description, memberIndex) {
  var body = String(description || "").trim();
  if (!body) {
    return "";
  }

  var bodyId = "about-bio-body-" + memberIndex;
  return (
    '<div class="member__bio">' +
    '<div class="member__bioBody member__bioBody--collapsed" id="' +
    bodyId +
    '">' +
    '<div class="member__bioContent">' +
    aboutDescriptionHtml(body) +
    "</div>" +
    "</div>" +
    '<button type="button" class="member__bioToggle" aria-expanded="false" aria-controls="' +
    bodyId +
    '">MEHR LESEN</button>' +
    "</div>"
  );
}

function resetAboutMemberBioUi(memberEl) {
  if (!memberEl) {
    return;
  }
  var toggle = memberEl.querySelector(".member__bioToggle");
  if (!toggle) {
    return;
  }
  var bodyId = toggle.getAttribute("aria-controls");
  var body = bodyId ? document.getElementById(bodyId) : null;
  if (!body) {
    return;
  }
  body.classList.add("member__bioBody--collapsed");
  body.classList.remove("member__bioBody--expanded");
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = "MEHR LESEN";
}

var ABOUT_TEAM_FOCUS_MS = 500;

function aboutTeamPrefersReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function clearAboutTeamFocusTimers(team) {
  if (!team) {
    return;
  }
  if (team._aboutFocusTimer) {
    window.clearTimeout(team._aboutFocusTimer);
    delete team._aboutFocusTimer;
  }
}

function applyAboutTeamFocusImmediate(focusedMemberEl) {
  var team = document.querySelector(".gallery--about .team");
  if (!team) {
    return;
  }
  clearAboutTeamFocusTimers(team);
  team.classList.remove("team--focus-reveal");
  if (focusedMemberEl) {
    team.classList.add("team--focus");
    team.querySelectorAll(".member").forEach(function (memberEl) {
      var isFocused = memberEl === focusedMemberEl;
      memberEl.classList.remove("member--leaving", "member--rejoin");
      memberEl.classList.toggle("member--focus", isFocused);
      if (isFocused) {
        memberEl.removeAttribute("hidden");
        memberEl.removeAttribute("inert");
      } else {
        memberEl.setAttribute("hidden", "");
        memberEl.setAttribute("inert", "");
      }
    });
  } else {
    team.classList.remove("team--focus");
    team.querySelectorAll(".member").forEach(function (memberEl) {
      memberEl.classList.remove("member--focus", "member--leaving", "member--rejoin");
      memberEl.removeAttribute("hidden");
      memberEl.removeAttribute("inert");
    });
  }
}

function applyAboutTeamFocus(focusedMemberEl) {
  var team = document.querySelector(".gallery--about .team");
  if (!team) {
    return;
  }
  if (aboutTeamPrefersReducedMotion()) {
    applyAboutTeamFocusImmediate(focusedMemberEl);
    return;
  }

  clearAboutTeamFocusTimers(team);

  if (focusedMemberEl) {
    team.classList.add("team--focus", "team--focus-reveal");
    team.querySelectorAll(".member").forEach(function (memberEl) {
      var isFocused = memberEl === focusedMemberEl;
      memberEl.classList.remove("member--rejoin");
      memberEl.classList.toggle("member--focus", isFocused);
      if (isFocused) {
        memberEl.classList.remove("member--leaving");
        memberEl.removeAttribute("hidden");
        memberEl.removeAttribute("inert");
      } else {
        memberEl.removeAttribute("hidden");
        memberEl.setAttribute("inert", "");
        memberEl.classList.add("member--leaving");
      }
    });
    team._aboutFocusTimer = window.setTimeout(function () {
      team.querySelectorAll(".member").forEach(function (memberEl) {
        if (memberEl !== focusedMemberEl) {
          memberEl.classList.remove("member--leaving");
          memberEl.setAttribute("hidden", "");
        }
      });
      team.classList.remove("team--focus-reveal");
      delete team._aboutFocusTimer;
    }, ABOUT_TEAM_FOCUS_MS);
  } else {
    team.classList.remove("team--focus-reveal");
    team.querySelectorAll(".member").forEach(function (memberEl) {
      memberEl.classList.remove("member--focus", "member--leaving");
      memberEl.removeAttribute("hidden");
      memberEl.removeAttribute("inert");
      if (!memberEl.querySelector(".member__bioToggle[aria-expanded='true']")) {
        memberEl.classList.add("member--rejoin");
      }
    });
    team.classList.remove("team--focus");
    window.requestAnimationFrame(function () {
      team.querySelectorAll(".member").forEach(function (memberEl) {
        memberEl.classList.remove("member--rejoin");
      });
    });
  }
}

function toggleAboutBio(button) {
  var bodyId = button.getAttribute("aria-controls");
  var body = bodyId ? document.getElementById(bodyId) : null;
  if (!body) {
    return;
  }

  var memberEl = button.closest(".member");
  var team = memberEl ? memberEl.closest(".team") : null;
  var expanded = button.getAttribute("aria-expanded") === "true";
  if (expanded) {
    body.classList.add("member__bioBody--collapsed");
    body.classList.remove("member__bioBody--expanded");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "MEHR LESEN";
    if (memberEl) {
      memberEl.classList.remove("member--bio-expanded");
    }
    applyAboutTeamFocus(null);
  } else {
    if (team) {
      team.querySelectorAll(".member").forEach(function (other) {
        if (other !== memberEl) {
          resetAboutMemberBioUi(other);
        }
      });
    }
    body.classList.remove("member__bioBody--collapsed");
    body.classList.add("member__bioBody--expanded");
    button.setAttribute("aria-expanded", "true");
    button.textContent = "WENIGER ANZEIGEN";
    if (memberEl) {
      memberEl.classList.add("member--bio-expanded");
    }
    applyAboutTeamFocus(memberEl);
  }
}

function bindAboutBioToggles() {
  var root = document.querySelector(".gallery--about");
  if (!root) {
    return;
  }

  root.querySelectorAll(".member__bioToggle").forEach(function (button) {
    if (button.dataset.bound === "1") {
      return;
    }
    button.dataset.bound = "1";
    button.addEventListener("click", function () {
      toggleAboutBio(button);
    });
  });
}

function bindAboutTeam() {
  bindBackToMenu();
  bindAboutBioToggles();
}

function aboutMemberIdentityHtml(member) {
  var displayName = String(member.name || "").trim();
  var role = String(member.role || "").trim();
  if (displayName) {
    var html = "<h3>" + escapeHtml(displayName) + "</h3>";
    if (role) {
      html += '<p class="member__role">' + escapeHtml(role) + "</p>";
    }
    return html;
  }
  if (role) {
    return "<h3>" + escapeHtml(role) + "</h3>";
  }
  return "";
}

function aboutPhotoTag(file, displayName) {
  var name = String(file || "").trim();
  var alt = String(displayName || "").trim();
  var inner;
  if (!name) {
    inner =
      '<div class="member__photo member__photo--plain" aria-hidden="true"></div>';
  } else {
    inner =
      '<img src="images/team/' +
      encodeURI(name) +
      "?v=20261010-team-sarina" +
      '" loading="lazy" decoding="async" alt="' +
      escapeHtml(alt) +
      '">';
  }
  return '<div class="member__photoFrame">' + inner + "</div>";
}

function renderAboutHtml(about) {
  var members = Array.isArray(about.members) ? about.members : [];
  var membersHtml = members
    .map(function (member, memberIndex) {
      return (
        '<div class="member" data-about-member="' +
        memberIndex +
        '">' +
        aboutPhotoTag(member.file, member.name) +
        aboutMemberIdentityHtml(member) +
        aboutMemberBioHtml(member.description, memberIndex) +
        "</div>"
      );
    })
    .join("");

  return (
    '<div class="gallery gallery--about fade">' +
    frozenOpenTag("h1") +
    escapeHtml(FU.SECTION.ABOUT_US) +
    "</h1>" +
    "<p>" +
    escapeHtml(about.subline || "") +
    "</p>" +
    '<div class="team">' +
    membersHtml +
    "</div>" +
    '<p class="team__motto">' +
    escapeHtml(ABOUT_TEAM_MOTTO) +
    "</p>" +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>"
  );
}

function contactTelHref(displayPhone) {
  var digits = String(displayPhone || "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.charAt(0) === "0") {
    digits = "49" + digits.slice(1);
  }
  return "+" + digits;
}

function fetchContactData() {
  if (contactCache) {
    return Promise.resolve(contactCache);
  }

  return fetch("data/contact.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Contact manifest not found");
      }
      return response.json();
    })
    .then(function (data) {
      contactCache = data;
      return contactCache;
    });
}

function contactImpressumLegalContentHtml() {
  var impressumTel = contactTelHref("01774429815");
  return (
    "<h2>Impressum</h2>" +
    "<h3>Angaben gemäß § 5 DDG</h3>" +
    "<p><strong>NOIR FRAME</strong></p>" +
    "<p>Inhaber: Marcin Porębski</p>" +
    "<p>Fotografie · Videografie · Drohnenaufnahmen</p>" +
    "<p><strong>Anschrift</strong></p>" +
    "<p>Peter-Rosegger-Straße 29<br>40699 Erkrath<br>Deutschland</p>" +
    "<p><strong>Kontakt</strong></p>" +
    '<p>Telefon: <a href="tel:' +
    escapeHtml(impressumTel) +
    '">0177 4429815</a><br>E-Mail: <a href="mailto:noirframe.contact@gmail.com">noirframe.contact@gmail.com</a></p>' +
    "<p><strong>Umsatzsteuer</strong></p>" +
    "<p>Es gilt die Kleinunternehmerregelung gemäß § 19 UStG.</p>"
  );
}

function contactImpressumHtml() {
  return (
    '<div class="contactImpressum">' +
    '<button type="button" class="contactImpressum__toggle" aria-expanded="false" aria-controls="contact-impressum-drawer">Impressum</button>' +
    '<div id="contact-impressum-drawer" class="contactImpressum__drawer" aria-hidden="true">' +
    '<div class="contactImpressum__drawerInner">' +
    '<div class="contactImpressum__content">' +
    contactImpressumLegalContentHtml() +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>"
  );
}

function contactCardInnerWidth(card) {
  var style = getComputedStyle(card);
  return Math.max(
    card.clientWidth -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight) -
      6,
    100
  );
}

function fitContactBrandText() {
  var brand = document.querySelector(".gallery--contact .contactLayout__brand");
  var box = document.querySelector(".gallery--contact .contactCard");
  if (!brand || !box) {
    return;
  }

  brand.style.textAlign = "left";
  brand.style.fontSize = "48px";
  brand.style.letterSpacing = "0.12em";
  var maxWidth = contactCardInnerWidth(box);
  var low = 14;
  var high = 80;
  for (var step = 0; step < 16; step++) {
    var mid = (low + high) / 2;
    brand.style.fontSize = mid + "px";
    if (brand.scrollWidth > maxWidth) {
      high = mid;
    } else {
      low = mid;
    }
  }
  brand.style.fontSize = Math.floor(low * 10) / 10 + "px";
  if (brand.scrollWidth > maxWidth) {
    brand.style.fontSize = Math.max(14, low - 1) + "px";
  }
}

function setContactCardImpressumOpen(open) {
  var visual = document.querySelector(".gallery--contact .contactCard__visual");
  var note = document.getElementById("contact-impressum-note");
  var openBtn = document.querySelector(
    ".gallery--contact .contactImpressum--cardMode .contactImpressum__toggle"
  );
  if (!visual || !note) {
    return;
  }
  if (open) {
    visual.classList.add("contactCard__visual--impressum");
    note.hidden = false;
    note.setAttribute("aria-hidden", "false");
    if (openBtn) {
      openBtn.setAttribute("aria-expanded", "true");
      openBtn.hidden = true;
    }
    var back = note.querySelector(".contactCard__impressumBack");
    if (back) {
      back.focus();
    }
  } else {
    visual.classList.remove("contactCard__visual--impressum");
    note.hidden = true;
    note.setAttribute("aria-hidden", "true");
    if (openBtn) {
      openBtn.setAttribute("aria-expanded", "false");
      openBtn.hidden = false;
      openBtn.focus();
    }
  }
}

function toggleContactImpressum(button) {
  var drawerId = button.getAttribute("aria-controls");
  if (drawerId === "contact-impressum-note") {
    var noteOpen =
      document
        .querySelector(".gallery--contact .contactCard__visual")
        ?.classList.contains("contactCard__visual--impressum") || false;
    setContactCardImpressumOpen(!noteOpen);
    return;
  }

  var drawer = drawerId ? document.getElementById(drawerId) : null;
  if (!drawer) {
    return;
  }

  var expanded = button.getAttribute("aria-expanded") === "true";
  if (expanded) {
    drawer.classList.remove("contactImpressum__drawer--open");
    drawer.setAttribute("aria-hidden", "true");
    button.setAttribute("aria-expanded", "false");
  } else {
    drawer.classList.add("contactImpressum__drawer--open");
    drawer.setAttribute("aria-hidden", "false");
    button.setAttribute("aria-expanded", "true");
  }
}

function bindContactImpressumToggle() {
  var root = document.querySelector(".gallery--contact");
  if (!root || root.dataset.impressumBound === "1") {
    return;
  }
  root.dataset.impressumBound = "1";

  root.querySelectorAll(".contactImpressum__toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      toggleContactImpressum(button);
    });
  });

  var backBtn = root.querySelector(".contactCard__impressumBack");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      setContactCardImpressumOpen(false);
    });
  }
}

var contactBrandFitResizeBound = false;

function contactCardImageFile(contact) {
  return String(contact.cardImage || "").trim();
}

function contactCardImageSrc(fileRef) {
  var ref = String(fileRef || "").trim();
  if (!ref) {
    return "";
  }
  if (ref.indexOf("images/") === 0) {
    return ref;
  }
  return "images/contact/" + ref;
}

function contactCardImageHtml(fileRef) {
  var src = contactCardImageSrc(fileRef);
  return (
    '<div class="contactCard__visual">' +
    '<img class="contactCard__image" src="' +
    encodeURI(src) +
    "?v=20261010-contact-dir" +
    '" alt="NOIЯFRAME Kontakt" decoding="async">' +
    "</div>"
  );
}

function contactCardImpressumNavLinkHtml() {
  return (
    '<p class="contactCard__impressumNav">' +
    '<button type="button" class="contactCard__impressumLink" id="contactImpressumNavLink">Impressum</button>' +
    "</p>"
  );
}

function contactImpressumCloseIconSvgHtml() {
  return (
    '<svg class="contactImpressumPage__closeIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
    '<path d="M6 6l12 12M18 6 6 18"></path>' +
    "</svg>"
  );
}

function contactImpressumCloseButtonHtml(id) {
  return (
    '<button type="button" class="contactImpressumPage__close" id="' +
    id +
    '" aria-label="Schließen">' +
    contactImpressumCloseIconSvgHtml() +
    "</button>"
  );
}

function renderContactImpressumHtml() {
  return (
    '<div class="gallery gallery--contact gallery--contactImpressum fade">' +
      '<div class="contactLayout">' +
      '<div class="contactLayout__frame">' +
      '<article class="contactImpressumPage">' +
      contactImpressumCloseButtonHtml("contactImpressumBackToContact") +
      '<div class="contactImpressum__content contactImpressum__content--page">' +
      contactImpressumLegalContentHtml() +
      "</div>" +
      backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
      "</article>" +
      "</div>" +
      "</div>" +
    "</div>"
  );
}

function bindContactImpressumScreen() {
  bindBackToMenu();
  var backContact = document.getElementById("contactImpressumBackToContact");
  if (backContact) {
    backContact.addEventListener("click", function () {
      showContact();
    });
  }
}

function showContactImpressum() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();
  transitionBody(renderContactImpressumHtml(), bindContactImpressumScreen);
}

function contactQuickActionsHtml() {
  return (
    '<div class="contactQuickActions" role="group" aria-label="Kontakt">' +
    '<a class="contactQuickActions__link" href="tel:01774429815">' +
    '<span class="contactQuickActions__label">Telefon: 0177 4429815</span>' +
    '<svg class="contactQuickActions__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>' +
    "</svg></a>" +
    '<a class="contactQuickActions__link" href="mailto:noirframe.contact@gmail.com">' +
    '<span class="contactQuickActions__label">E-Mail: noirframe.contact@gmail.com</span>' +
    '<span class="contactQuickActions__at" aria-hidden="true">@</span></a>' +
    "</div>"
  );
}

function contactTextBlockHtml(contact) {
  var ownerTel = contactTelHref(contact.ownerPhone);
  return (
    '<div class="contactLayout__panel">' +
    '<p class="contactLayout__brand ui-frozen notranslate" translate="no">' +
    escapeHtml(FU.CONTACT.BRAND) +
    "</p>" +
    '<div class="contact-box">' +
    '<div class="contact-group">' +
    '<p class="contact-row">' +
    '<span class="contact-row__icon" aria-hidden="true"><i class="ph-light ph-user"></i></span>' +
    '<span class="contact-row__body">' + escapeHtml(contact.ownerName || "") + "</span>" +
    "</p>" +
    '<p class="contact-row">' +
    '<span class="contact-row__icon" aria-hidden="true"><i class="ph-light ph-camera"></i></span>' +
    '<span class="contact-row__body contact-box__role">' + escapeHtml(contact.ownerRole || "") + "</span>" +
    "</p>" +
    '<p class="contact-row">' +
    '<span class="contact-row__icon" aria-hidden="true"><i class="ph-light ph-phone"></i></span>' +
    '<a class="contact-row__body" href="tel:' + escapeHtml(ownerTel) + '">' + escapeHtml(contact.ownerPhone || "") + "</a>" +
    "</p>" +
    '<p class="contact-row">' +
    '<span class="contact-row__icon" aria-hidden="true"><i class="ph-light ph-envelope"></i></span>' +
    '<a class="contact-row__body" href="mailto:' + escapeHtml(contact.ownerEmail || "") + '">' + escapeHtml(contact.ownerEmail || "") + "</a>" +
    "</p>" +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="contactLayout__languages">' +
    '<p class="contactLayout__languagesLead ui-frozen notranslate" translate="no">' +
    escapeHtml(FU.CONTACT.LANGUAGES_LEAD) +
    "</p>" +
    '<p class="contactLayout__languagesList">' + escapeHtml(contact.languages || "") + "</p>" +
    "</div>" +
    contactImpressumHtml()
  );
}

function bindContactScreen() {
  bindBackToMenu();
  var impressumNav = document.getElementById("contactImpressumNavLink");
  if (impressumNav) {
    impressumNav.addEventListener("click", function () {
      showContactImpressum();
    });
  }
  if (document.querySelector(".contactImpressum__toggle")) {
    bindContactImpressumToggle();
  }
  if (document.querySelector(".gallery--contact .contactLayout__brand")) {
    fitContactBrandText();
    if (!contactBrandFitResizeBound) {
      contactBrandFitResizeBound = true;
      window.addEventListener("resize", function () {
        if (document.querySelector(".gallery--contact .contactLayout__brand")) {
          fitContactBrandText();
        }
      });
    }
  }
}

function renderContactHtml(contact) {
  var cardImage = contactCardImageFile(contact);
  if (cardImage) {
    return (
      '<div class="gallery gallery--contact gallery--contactImage fade">' +
        '<div class="contactLayout">' +
        '<div class="contactLayout__frame">' +
        '<div class="contactLayout__main">' +
        '<div class="contactCard contactCard--image contactCard--stack">' +
        contactCardImageHtml(cardImage) +
        contactQuickActionsHtml() +
        contactCardImpressumNavLinkHtml() +
        backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
      "</div>"
    );
  }

  return (
    '<div class="gallery gallery--contact fade">' +
      '<div class="contactLayout">' +
      '<div class="contactLayout__frame">' +
      '<div class="contactLayout__main">' +
      '<div class="contactCard">' +
      contactTextBlockHtml(contact) +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
      "</div>"
  );
}


function showContact() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();
  fetchContactData()
    .then(function (contact) {
      transitionBody(renderContactHtml(contact), bindContactScreen);
    })
    .catch(function () {
      transitionBody(
        renderContactHtml({
          brand: FU.CONTACT.BRAND,
          ownerName: "Marcin Porębski",
          ownerRole: "Fotograf & Inhaber",
          ownerPhone: "01774429815",
          ownerEmail: "noirframe.contact@gmail.com",
          languagesLead: FU.CONTACT.LANGUAGES_LEAD,
          languages: "Russisch · Polnisch · Deutsch",
          cardImage: "kontakt02.jpg",
          backgroundDesktop: "images/layouts/layout_PC.jpg",
        }),
        bindContactScreen
      );
    });
}

function fetchMotionManifest() {
  if (motionCache) {
    return Promise.resolve(motionCache);
  }

  return fetch("images/motion/motion.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Motion manifest not found");
      }
      return response.json();
    })
    .then(function (data) {
      motionCache = normalizeMotionData(data);
      return motionCache;
    });
}

function normalizeMotionData(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  const normalizedItems = items
    .map(function (item) {
      if (!item || !item.file) {
        return null;
      }
      return {
        file: item.file,
        caption: item.caption || "",
      };
    })
    .filter(Boolean);

  return {
    items: normalizedItems.length ? normalizedItems : MOTION_FALLBACK.items,
    footer: data.footer || MOTION_FALLBACK.footer,
  };
}

function motionItemHtml(item) {
  return (
    '<video class="motionVideo" controls preload="metadata" playsinline>' +
    '<source src="images/motion/' +
    escapeHtml(item.file) +
    '" type="video/mp4">' +
    "</video>" +
    "<p>" +
    escapeHtml(item.caption) +
    "</p>"
  );
}

function motionScreenHtml(data) {
  const itemsHtml = data.items.map(motionItemHtml).join("");
  const footerHtml = data.footer
    ? "<p>" + escapeHtml(data.footer) + "</p>"
    : "";

  return (
    '<div class="gallery gallery--video fade">' +
    frozenOpenTag("h1") +
    FU.SECTION.VIDEO +
    "</h1>" +
    itemsHtml +
    footerHtml +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>"
  );
}

function fetchAfterFrameManifest() {
  if (afterFrameCache) {
    return Promise.resolve(afterFrameCache);
  }

  return fetch("images/after-frame/after-frame.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("After Frame manifest not found");
      }
      return response.json();
    })
    .then(function (data) {
      afterFrameCache = normalizeAfterFrameData(data);
      return afterFrameCache;
    });
}

function normalizeAfterFrameData(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  const normalizedItems = items
    .map(function (item) {
      if (!item || !item.playback || item.playback.kind !== "file") {
        return null;
      }
      const file = item.playback.file ? String(item.playback.file).trim() : "";
      if (!file) {
        return null;
      }
      return {
        file: file,
        title: item.title ? String(item.title) : "",
        description: item.description ? String(item.description) : "",
        poster: item.poster ? String(item.poster).trim() : "",
      };
    })
    .filter(Boolean);

  return {
    items: normalizedItems,
    footer: data.footer ? String(data.footer) : "",
  };
}

function afterFrameItemHtml(item) {
  const src = "images/after-frame/" + escapeHtml(item.file);
  const posterAttr = item.poster
    ? ' poster="images/after-frame/' + escapeHtml(item.poster) + '"'
    : "";
  const titleHtml = item.title ? "<p>" + escapeHtml(item.title) + "</p>" : "";
  const descriptionHtml = item.description
    ? "<p>" + escapeHtml(item.description) + "</p>"
    : "";

  return (
    '<article class="afterFrameItem">' +
    titleHtml +
    '<video class="motionVideo" controls preload="metadata" playsinline' +
    posterAttr +
    ">" +
    '<source src="' +
    src +
    '" type="video/mp4">' +
    "</video>" +
    descriptionHtml +
    "</article>"
  );
}

function afterFrameScreenHtml(data) {
  const itemsHtml = data.items.length
    ? data.items.map(afterFrameItemHtml).join("")
    : "<p>" + escapeHtml(FU.PORTFOLIO.GALLERY_UNAVAILABLE) + "</p>";
  const footerHtml = data.footer ? "<p>" + escapeHtml(data.footer) + "</p>" : "";

  return (
    '<div class="gallery gallery--video gallery--after-frame fade">' +
    frozenOpenTag("h1") +
    FU.SECTION.AFTER_FRAME +
    "</h1>" +
    itemsHtml +
    footerHtml +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>"
  );
}

function showAfterFrame() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();

  fetchAfterFrameManifest()
    .then(function (data) {
      transitionBody(afterFrameScreenHtml(data), bindBackToMenu);
    })
    .catch(function () {
      transitionBody(
        afterFrameScreenHtml({ items: [], footer: "" }),
        bindBackToMenu
      );
    });
}

function showFilms() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();

  fetchMotionManifest()
    .then(function (data) {
      transitionBody(motionScreenHtml(data), bindBackToMenu);
    })
    .catch(function () {
      transitionBody(motionScreenHtml(MOTION_FALLBACK), bindBackToMenu);
    });
}

function fetchBlogManifest() {
  if (blogCache) {
    return Promise.resolve(blogCache);
  }

  return fetch("data/blog.json", { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Blog manifest not found");
      }
      return response.json();
    })
    .then(function (data) {
      blogCache = normalizeBlogData(data);
      return blogCache;
    });
}

function normalizeBlogData(data) {
  const items = Array.isArray(data.items) ? data.items : [];
  const normalizedItems = items
    .map(function (item) {
      if (!item || !item.file) {
        return null;
      }
      return {
        file: item.file,
        caption: item.caption || "",
      };
    })
    .filter(Boolean);

  return {
    title: FU.SECTION.BLOG,
    intro: data.intro || BLOG_FALLBACK.intro,
    items: normalizedItems,
    footer: data.footer || "",
  };
}

/* Blog caption Markdown renderer — synchronizuj z nf-studio-tools/src/nfst/blog-caption-site.ts (NF-BLOG-RENDERER-001) */

function blogCaptionBody(caption) {
  if (!caption || !caption.trim()) {
    return "";
  }

  return caption
    .trim()
    .replace(/\n*–\s*Noir Frame\s*\|\s*Only Light Matters\s*$/i, "")
    .trim();
}

function blogCaptionStripUnsafeHtml(raw) {
  var out = raw.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<style[\s\S]*?<\/style>/gi, "");
  out = out.replace(/<\/?([a-z0-9]+)\b[^>]*>/gi, function (match, tag) {
    var t = String(tag).toLowerCase();
    if (t === "u") {
      return match.toLowerCase().indexOf("</") === 0 ? "</u>" : "<u>";
    }
    return "";
  });
  return out;
}

function blogCaptionInlineMarkdown(text) {
  var raw = blogCaptionStripUnsafeHtml(String(text).trim());
  var underlines = [];
  raw = raw.replace(/<u>([\s\S]*?)<\/u>/gi, function (_m, inner) {
    underlines.push(String(inner));
    return "%%U" + (underlines.length - 1) + "%%";
  });
  var safe = escapeHtml(raw);
  underlines.forEach(function (inner, index) {
    safe = safe.replace("%%U" + index + "%%", "<u>" + escapeHtml(inner) + "</u>");
  });
  safe = safe.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  safe = safe.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    function (_match, label, url) {
      var href = String(url).trim();
      if (!/^https?:\/\//i.test(href)) {
        return escapeHtml(label);
      }
      return (
        '<a href="' +
        escapeHtml(href) +
        '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(label) +
        "</a>"
      );
    }
  );
  return safe;
}

function blogCaptionBlockMarkdown(block) {
  var trimmed = block.trim();
  if (!trimmed) {
    return "";
  }
  if (/^###\s+/.test(trimmed)) {
    return "<h3>" + blogCaptionInlineMarkdown(trimmed.replace(/^###\s+/, "")) + "</h3>";
  }
  if (/^##\s+/.test(trimmed)) {
    return "<h2>" + blogCaptionInlineMarkdown(trimmed.replace(/^##\s+/, "")) + "</h2>";
  }
  var lines = trimmed.split(/\n/);
  if (lines.length > 1 && lines.every(function (line) { return /^\s*-\s+/.test(line); })) {
    return (
      "<ul>" +
      lines
        .map(function (line) {
          return "<li>" + blogCaptionInlineMarkdown(line.replace(/^\s*-\s+/, "")) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }
  if (lines.length > 1 && lines.every(function (line) { return /^\s*\d+\.\s+/.test(line); })) {
    return (
      "<ol>" +
      lines
        .map(function (line) {
          return "<li>" + blogCaptionInlineMarkdown(line.replace(/^\s*\d+\.\s+/, "")) + "</li>";
        })
        .join("") +
      "</ol>"
    );
  }
  if (/^:::large\s+/.test(trimmed)) {
    return (
      '<p><span class="blog-text-large">' +
      blogCaptionInlineMarkdown(trimmed.replace(/^:::large\s+/, "").replace(/\s+:::$/, "")) +
      "</span></p>"
    );
  }
  if (/^:::small\s+/.test(trimmed)) {
    return (
      '<p><span class="blog-text-small">' +
      blogCaptionInlineMarkdown(trimmed.replace(/^:::small\s+/, "").replace(/\s+:::$/, "")) +
      "</span></p>"
    );
  }
  return "<p>" + blogCaptionInlineMarkdown(trimmed) + "</p>";
}

function blogCaptionHtml(caption) {
  const body = blogCaptionBody(caption);
  const blocks = body ? body.split(/\n\s*\n/) : [];
  blocks.push(BLOG_SIGNATURE);

  return blocks
    .map(function (block, index) {
      const isSignature = index === blocks.length - 1 && block.trim() === BLOG_SIGNATURE;
      if (isSignature) {
        return '<p class="blogItem__signature">' + escapeHtml(BLOG_SIGNATURE) + "</p>";
      }
      return blogCaptionBlockMarkdown(block);
    })
    .join("");
}

function blogFileExtension(file) {
  const dot = file.lastIndexOf(".");
  if (dot === -1) {
    return "";
  }
  return file.slice(dot + 1).toLowerCase();
}

function isBlogImageFile(file) {
  const ext = blogFileExtension(file);
  return ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp";
}

function isBlogVideoFile(file) {
  const ext = blogFileExtension(file);
  return ext === "mp4" || ext === "webm";
}

function blogItemHtml(item) {
  const src = "images/blog/" + escapeHtml(item.file);
  let mediaHtml = "";

  if (isBlogImageFile(item.file)) {
    mediaHtml =
      '<div class="blogItem__media">' +
      '<img class="blogMedia" src="' +
      src +
      '" alt="" loading="lazy" decoding="async">' +
      "</div>";
  } else if (isBlogVideoFile(item.file)) {
    mediaHtml =
      '<div class="blogItem__media">' +
      '<video class="motionVideo blogVideo" controls preload="metadata" playsinline>' +
      '<source src="' +
      src +
      '" type="video/' +
      (blogFileExtension(item.file) === "webm" ? "webm" : "mp4") +
      '">' +
      "</video>" +
      "</div>";
  } else {
    return "";
  }

  return (
    '<article class="blogItem">' +
    mediaHtml +
    '<div class="blogItem__caption">' +
    blogCaptionHtml(item.caption) +
    "</div>" +
    "</article>"
  );
}

function blogIntroHtml(intro) {
  if (!intro || !intro.trim()) {
    return "";
  }

  const parts = intro.trim().split(/\n\s*\n/);
  if (parts.length === 1) {
    return '<p class="blogIntro">' + escapeHtml(parts[0]) + "</p>";
  }

  return (
    '<p class="blogIntro blogIntro__headline">' +
    escapeHtml(parts[0]) +
    "</p>" +
    '<p class="blogIntro blogIntro__lead">' +
    escapeHtml(parts.slice(1).join("\n\n")) +
    "</p>"
  );
}

function blogScreenHtml(data) {
  const itemsHtml = data.items.length ? data.items.map(blogItemHtml).join("") : "";
  const footerHtml = data.footer ? "<p>" + escapeHtml(data.footer) + "</p>" : "";

  return (
    '<div class="gallery gallery--blog fade">' +
    '<header class="blogHeader">' +
    '<div class="blogHeader__nav">' +
    backButtonHtml("backToMenuButtonTop", FU.BUTTON.BACK_TO_MENU) +
    "</div>" +
    '<div class="blogHeader__title">' +
    frozenOpenTag("h1") +
    escapeHtml(FU.SECTION.BLOG) +
    "</h1>" +
    "</div>" +
    blogIntroHtml(data.intro) +
    "</header>" +
    '<div class="blogColumn">' +
    '<div class="blogList">' +
    itemsHtml +
    "</div>" +
    footerHtml +
    "</div>" +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>"
  );
}

function showBlog() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();

  fetchBlogManifest()
    .then(function (data) {
      transitionBody(blogScreenHtml(data), bindBackToMenu);
    })
    .catch(function () {
      transitionBody(blogScreenHtml(BLOG_FALLBACK), bindBackToMenu);
    });
}

function isCoarseMobile() {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function isPortraitMobile() {
  return isCoarseMobile() && window.matchMedia("(orientation: portrait)").matches;
}

function ensureDarkSideOverlay() {
  if (darkSideOverlay && document.getElementById("darkSideClockStage")) {
    return;
  }

  if (darkSideOverlay) {
    stopDarkSideClockScene();
    darkSideOverlay.remove();
    darkSideOverlay = null;
    darkSideVideo = null;
  }

  darkSideOverlay = document.createElement("div");
  darkSideOverlay.id = "darkSideOverlay";
  darkSideOverlay.className = "darkSideOverlay";
  darkSideOverlay.innerHTML =
    '<div class="darkSideRotateGate" aria-live="polite">' +
    DARK_ROTATE_ICON +
    "<p>Obróć telefon</p>" +
    "</div>" +
    darkSideClockStageHtml() +
    '<div class="darkSideStage">' +
    '<video class="darkSideVideo" id="darkSideVideo" playsinline preload="auto"></video>' +
    "</div>";

  document.documentElement.appendChild(darkSideOverlay);
  darkSideVideo = document.getElementById("darkSideVideo");

  if (DARK_SIDE_VIDEO_ENABLED && darkSideVideo) {
    darkSideVideo.src = DARK_VIDEO_SRC;
    darkSideVideo.loop = false;
    darkSideVideo.controls = false;
    darkSideVideo.setAttribute("controlsList", "nodownload noplaybackrate noremoteplayback");
    darkSideVideo.disablePictureInPicture = true;
    darkSideVideo.addEventListener("ended", exitDarkSide);
    darkSideVideo.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
  }

  window.addEventListener("orientationchange", updateDarkSideOrientation);
  window.addEventListener("resize", updateDarkSideOrientation);
}

function updateDarkSideOrientation() {
  if (!darkSideOverlay || !darkSideActive) {
    return;
  }

  if (isPortraitMobile()) {
    darkSideOverlay.classList.add("darkSideOverlay--portrait");
    if (darkSideVideo) {
      darkSideVideo.pause();
    }
    return;
  }

  darkSideOverlay.classList.remove("darkSideOverlay--portrait");
  if (
    DARK_SIDE_VIDEO_ENABLED &&
    darkSideOverlay.classList.contains("is-video") &&
    darkSideVideo &&
    darkSideVideo.paused
  ) {
    darkSideVideo.play().catch(function () {});
  }
}

function clearDarkSideTimers() {
  if (darkSideAudioTimer) {
    clearTimeout(darkSideAudioTimer);
    darkSideAudioTimer = null;
  }
  if (darkSideExitTimer) {
    clearTimeout(darkSideExitTimer);
    darkSideExitTimer = null;
  }
  if (darkSideNavRevealTimer) {
    clearTimeout(darkSideNavRevealTimer);
    darkSideNavRevealTimer = null;
  }
  if (darkSideVideoTimer) {
    clearTimeout(darkSideVideoTimer);
    darkSideVideoTimer = null;
  }
  if (darkSideClockTimer) {
    clearTimeout(darkSideClockTimer);
    darkSideClockTimer = null;
  }
}

function fadeDarkSideAudioIn() {
  if (!darkSideVideo) {
    return;
  }

  darkSideVideo.muted = false;
  darkSideVideo.volume = 0;

  const steps = 20;
  const stepMs = DARK_AUDIO_FADE_MS / steps;
  let step = 0;

  const tick = function () {
    step += 1;
    darkSideVideo.volume = Math.min(1, step / steps);
    if (step < steps) {
      setTimeout(tick, stepMs);
    }
  };

  tick();
}

function resetDarkSideVideo() {
  if (!darkSideVideo) {
    return;
  }

  darkSideVideo.pause();
  darkSideVideo.currentTime = 0;
  darkSideVideo.muted = true;
  darkSideVideo.volume = 0;
  darkSideVideo.loop = false;
}

function getDarkSideFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.webkitCurrentFullScreenElement ||
    null
  );
}

function requestDarkSideFullscreen() {
  if (!DARK_SIDE_FULLSCREEN_ENABLED || getDarkSideFullscreenElement()) {
    return;
  }

  const root = document.documentElement;
  const request =
    root.requestFullscreen ||
    root.webkitRequestFullscreen ||
    root.webkitRequestFullScreen;

  if (!request) {
    return;
  }

  Promise.resolve(request.call(root)).catch(function () {
    /* iOS Safari / blocked — fixed overlay still fills the viewport */
  });
}

function exitDarkSideFullscreen() {
  if (!getDarkSideFullscreenElement()) {
    return;
  }

  const exit =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.webkitCancelFullScreen;

  if (!exit) {
    return;
  }

  Promise.resolve(exit.call(document)).catch(function () {});
}

function beginDarkSideClock() {
  if (!darkSideOverlay) {
    return;
  }

  darkSideOverlay.classList.add("is-clock");
  initDarkSideClockScene();
  darkSideClockTimer = setTimeout(exitDarkSide, DARK_CLOCK_SCENE_MS);
}

function beginDarkSideVideo() {
  if (!DARK_SIDE_VIDEO_ENABLED || !darkSideOverlay || !darkSideVideo) {
    return;
  }

  darkSideOverlay.classList.remove("is-clock");
  stopDarkSideClockScene();
  darkSideOverlay.classList.add("is-video");

  if (!isPortraitMobile()) {
    darkSideVideo.play().catch(function () {});
  }
}

function enterDarkSide() {
  if (!DARK_SIDE_ENABLED || darkSideActive) {
    return;
  }

  ensureDarkSideOverlay();
  requestDarkSideFullscreen();
  darkSideActive = true;
  clearDarkSideTimers();
  resetDarkSideVideo();

  darkSideOverlay.classList.remove("is-exiting", "is-visible", "is-video", "is-clock");
  darkSideOverlay.classList.add("is-active");
  updateSiteNavVisibility();
  updateDarkSideOrientation();

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      darkSideOverlay.classList.add("is-visible");

      if (DARK_SIDE_VIDEO_ENABLED) {
        darkSideVideoTimer = setTimeout(beginDarkSideVideo, DARK_VIDEO_REVEAL_MS);
        return;
      }

      darkSideVideoTimer = setTimeout(beginDarkSideClock, DARK_FADE_IN_MS);
    });
  });

  if (DARK_SIDE_VIDEO_ENABLED && !isPortraitMobile()) {
    darkSideAudioTimer = setTimeout(fadeDarkSideAudioIn, DARK_AUDIO_DELAY_MS);
  }
}

function restoreMenuAfterDarkSide() {
  const menu = document.querySelector(".menuWrapper");
  if (!menu) {
    showMenu(true);
    return;
  }

  menu.classList.add("fade");
  menu.classList.remove("show");
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      menu.classList.add("show");
      setupMenuHero();
    });
  });
}

function revealSiteNavAfterDarkSide() {
  darkSideActive = false;
  updateSiteNavVisibility();
}

function exitDarkSide() {
  if (!darkSideActive || !darkSideOverlay) {
    return;
  }

  clearDarkSideTimers();
  stopDarkSideClockScene();
  exitDarkSideFullscreen();
  darkSideOverlay.classList.add("is-exiting");
  darkSideOverlay.classList.remove("is-visible", "is-video", "is-clock");

  if (darkSideVideo) {
    darkSideVideo.pause();
  }

  restoreMenuAfterDarkSide();

  darkSideNavRevealTimer = setTimeout(
    revealSiteNavAfterDarkSide,
    Math.max(0, DARK_FADE_OUT_MS - DARK_NAV_REVEAL_LEAD_MS)
  );

  darkSideExitTimer = setTimeout(function () {
    darkSideOverlay.classList.remove(
      "is-active",
      "is-exiting",
      "is-visible",
      "is-video",
      "is-clock",
      "darkSideOverlay--portrait"
    );
    resetDarkSideVideo();
    revealSiteNavAfterDarkSide();
  }, DARK_FADE_OUT_MS);
}

ensureSiteNav();
updateSiteNavVisibility();

document.addEventListener("click", function (event) {
  if (!event.target.closest(".backToMenuButton")) {
    return;
  }

  event.preventDefault();
  showMenu();
});

if (DARK_SIDE_ENABLED) {
  ensureDarkSideOverlay();
}

if (window.location.hash === "#menu") {
  heroTransitionStarted = true;
  showMenu(true);
  if (window.history && window.history.replaceState) {
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  }
} else {
  setTimeout(openMenuFromHero, HERO_HOLD_MS);
}
