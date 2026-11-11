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
/** Native Fullscreen API when Dark Side starts (desktop/Android; iOS falls back to fixed overlay) */
const DARK_SIDE_FULLSCREEN_ENABLED = true;
const DARK_VIDEO_REVEAL_MS = 1000;
const DARK_VIDEO_FADE_MS = 2000;
const DARK_AUDIO_DELAY_MS = 2500;
const DARK_AUDIO_FADE_MS = 1500;
const DARK_VIDEO_SRC = "Dark_Side/NF_DARK.mp4?v=20260803-2137";

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
  sarina: "images/sarinas-art/Hero01.jpg",
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
let heroHoldTimer = null;
const NF_NAV = "nf-nav";

function isNfNavState(state) {
  return Boolean(state && state.nf === NF_NAV && state.screen);
}

function navStateUrl() {
  return window.location.pathname + window.location.search;
}

function flattenNavHash() {
  if (!window.location.hash) {
    return;
  }
  if (!window.history || typeof history.replaceState !== "function") {
    return;
  }
  history.replaceState(history.state, "", navStateUrl());
}

function markMenuSeen() {
  try {
    sessionStorage.setItem("nf-menu-seen", "1");
  } catch (error) {
    /* ignore quota / private-mode */
  }
}

function hasMenuSeen() {
  try {
    return sessionStorage.getItem("nf-menu-seen") === "1";
  } catch (error) {
    return false;
  }
}

function replaceNavState(screen) {
  if (!window.history || typeof history.replaceState !== "function") {
    return;
  }
  history.replaceState({ nf: NF_NAV, screen: screen }, "", navStateUrl());
}

function rememberViewHistory() {
  if (!window.history || typeof history.pushState !== "function") {
    return;
  }
  flattenNavHash();
  if (isNfNavState(history.state) && history.state.screen === "view") {
    replaceNavState("view");
    return;
  }
  history.pushState({ nf: NF_NAV, screen: "view" }, "", navStateUrl());
}

function cancelHeroHold() {
  if (heroHoldTimer !== null) {
    clearTimeout(heroHoldTimer);
    heroHoldTimer = null;
  }
}

function applyMenuFromHistory() {
  cancelHeroHold();
  heroTransitionStarted = true;
  markMenuSeen();
  if (document.querySelector(".container") || !document.querySelector(".menuWrapper")) {
    showMenu(true);
  }
  replaceNavState("menu");
}

function onNavPopState(event) {
  recoverCrossfadeScroll();
  if (window.location.hash === "#menu") {
    crossfadeRestoreScroll = true;
    applyMenuFromHistory();
    return;
  }

  const state = event.state;
  if (isNfNavState(state) && (state.screen === "menu" || state.screen === "hero")) {
    crossfadeRestoreScroll = true;
    applyMenuFromHistory();
    return;
  }

  if (isNfNavState(state) && state.screen === "view") {
    crossfadeRestoreScroll = true;
    if (lastViewReplay) {
      transitionBody(lastViewReplay.html, lastViewReplay.onReady);
      return;
    }
    applyMenuFromHistory();
    return;
  }

  if (document.querySelector(".container") || document.querySelector(".gallery")) {
    crossfadeRestoreScroll = true;
    applyMenuFromHistory();
  }
}

function onNavPageShow(event) {
  const state = history.state;
  const restoreMenu =
    window.location.hash === "#menu" ||
    hasMenuSeen() ||
    (isNfNavState(state) &&
      (state.screen === "menu" || state.screen === "view" || state.screen === "hero"));

  if ((event.persisted || restoreMenu) && document.querySelector(".container")) {
    applyMenuFromHistory();
  }
}
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
  heroHoldTimer = null;
  markMenuSeen();
  replaceNavState("menu");

  const container = document.querySelector(".container");
  if (container) {
    container.classList.remove("show");
    setTimeout(function () {
      showMenu(true);
      replaceNavState("menu");
    }, FADE_MS);
    return;
  }
  showMenu();
  replaceNavState("menu");
}

const CROSSFADE_MS = 400;
let crossfadeToken = 0;
let crossfadeTimer = null;
let crossfadeRestoreScroll = false;
let lastViewReplay = null;
const crossfadeScrollMemory = Object.create(null);

if (window.history && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function prefersReducedCrossfade() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function crossfadeScreenKey(el) {
  if (!el) {
    return "";
  }
  if (el.classList.contains("npaper") || el.classList.contains("menuWrapper")) {
    return "home";
  }
  var names = [
    "portfolio",
    "blog",
    "about",
    "angebote",
    "aktuell",
    "contactImpressum",
    "contact",
    "photos",
  ];
  for (var i = 0; i < names.length; i++) {
    if (el.classList.contains("gallery--" + names[i])) {
      return names[i];
    }
  }
  if (el.classList.contains("gallery")) {
    return "gallery";
  }
  return "screen";
}

function activeCrossfadeScreen() {
  return document.querySelector("body > :not(.is-leaving)");
}

let crossfadeScrollTarget = 0;

function applyCrossfadeScrollTarget() {
  window.scrollTo(0, crossfadeScrollTarget);
}

function placeCrossfadeScroll(screen) {
  if (!screen) {
    crossfadeRestoreScroll = false;
    return;
  }
  var key = crossfadeScreenKey(screen);
  var y = 0;
  if (crossfadeRestoreScroll) {
    y = crossfadeScrollMemory[key] || 0;
  } else {
    crossfadeScrollMemory[key] = 0;
  }
  crossfadeRestoreScroll = false;
  crossfadeScrollTarget = y;
  applyCrossfadeScrollTarget();
}

let crossfadeScrollZeroAt = 0;
const crossfadeScrollPrevious = Object.create(null);

function rememberCrossfadeScroll() {
  var screen = activeCrossfadeScreen();
  if (
    !screen ||
    screen.classList.contains("is-leaving") ||
    screen.classList.contains("is-entering")
  ) {
    return;
  }
  var key = crossfadeScreenKey(screen);
  var y = window.scrollY || document.documentElement.scrollTop || 0;
  crossfadeScrollPrevious[key] = crossfadeScrollMemory[key] || 0;
  crossfadeScrollMemory[key] = y;
  crossfadeScrollZeroAt = y === 0 ? performance.now() : 0;
}

function recoverCrossfadeScroll() {
  var screen = activeCrossfadeScreen();
  if (!screen) {
    return;
  }
  var key = crossfadeScreenKey(screen);
  var previous = crossfadeScrollPrevious[key] || 0;
  if (
    (window.scrollY || 0) === 0 &&
    previous > 0 &&
    performance.now() - crossfadeScrollZeroAt < 80
  ) {
    crossfadeScrollMemory[key] = previous;
  }
}

window.addEventListener("scroll", rememberCrossfadeScroll, { passive: true });

function finishCrossfadeScreen(screen, onReady) {
  if (screen) {
    screen.classList.add("fade", "show");
    screen.classList.remove("is-entering");
  }
  document.body.classList.remove("is-crossfade");
  if (onReady) {
    onReady();
  }
  updateSiteNavVisibility();
  syncGalleryElevator();
  placeCrossfadeScroll(screen);
}

function transitionBody(html, onReady, skipFadeOut) {
  stopMenuHero();
  const token = ++crossfadeToken;
  if (crossfadeTimer) {
    clearTimeout(crossfadeTimer);
    crossfadeTimer = null;
  }
  document.querySelectorAll("body > .npaper-note").forEach(function (node) {
    node.remove();
  });
  document.querySelectorAll("body > .is-leaving").forEach(function (node) {
    node.remove();
  });

  const template = document.createElement("template");
  template.innerHTML = String(html || "").trim();
  const incoming = template.content.firstElementChild;
  const existing = activeCrossfadeScreen();
  const reduced = prefersReducedCrossfade();

  if (incoming && incoming.classList.contains("gallery")) {
    lastViewReplay = { html: html, onReady: onReady };
  }

  if (existing && !crossfadeRestoreScroll) {
    crossfadeScrollMemory[crossfadeScreenKey(existing)] =
      window.scrollY || document.documentElement.scrollTop || 0;
  }

  if (!existing || !incoming || reduced) {
    document.body.innerHTML = html;
    finishCrossfadeScreen(document.body.firstElementChild, onReady);
    return;
  }

  const savedY = crossfadeScrollMemory[crossfadeScreenKey(existing)] || 0;

  existing.classList.add("is-leaving");
  existing.style.top = -savedY + "px";
  existing.setAttribute("aria-hidden", "true");
  if ("inert" in existing) {
    existing.inert = true;
  }

  incoming.classList.add("fade", "is-entering");
  document.body.insertBefore(incoming, document.body.firstChild);
  document.body.classList.add("is-crossfade");
  placeCrossfadeScroll(incoming);
  if (onReady) {
    onReady();
  }
  updateSiteNavVisibility();
  syncGalleryElevator();

  function startCrossfadeMotion() {
    if (token !== crossfadeToken) {
      return;
    }
    existing.classList.add("is-gone");
    incoming.classList.add("show");
  }

  requestAnimationFrame(function () {
    requestAnimationFrame(startCrossfadeMotion);
  });
  setTimeout(startCrossfadeMotion, 32);

  crossfadeTimer = setTimeout(function () {
    if (token !== crossfadeToken) {
      return;
    }
    if (existing.parentNode) {
      existing.remove();
    }
    incoming.classList.remove("is-entering");
    document.body.classList.remove("is-crossfade");
    incoming.classList.add("fade", "show");
    crossfadeTimer = null;
    applyCrossfadeScrollTarget();
    requestAnimationFrame(applyCrossfadeScrollTarget);
    updateSiteNavVisibility();
    syncGalleryElevator();
  }, CROSSFADE_MS);
}

function revealScreen(onReady) {
  const screen = document.body.firstElementChild;

  function finishReveal() {
    if (onReady) {
      onReady();
    }
    updateSiteNavVisibility();
    syncGalleryElevator();
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

function prefersPhoneDrawer() {
  return window.matchMedia(
    "(max-width: 699px), ((max-height: 500px) and (hover: none) and (pointer: coarse))"
  ).matches;
}

function syncPhoneDrawerLock() {
  var lock = Boolean(
    siteNav &&
      siteNav.classList.contains("siteNav--open") &&
      prefersPhoneDrawer()
  );
  document.documentElement.classList.toggle("is-phone-drawer", lock);
}

function closeSiteNavPanels() {
  if (!siteNav) {
    return;
  }

  clearPortfolioHoverTimers();
  siteNav.classList.remove("siteNav--open");
  syncPhoneDrawerLock();
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
  cancelHeroHold();
  heroTransitionStarted = true;
  closeSiteNavPanels();

  if (siteNav) {
    siteNav.classList.add("siteNav--hidden");
  }

  rememberViewHistory();
}

function updateSiteNavVisibility() {
  if (!siteNav) {
    return;
  }

  const onHero = Boolean(document.body.querySelector(".container"));
  const onSubpage = Boolean(document.body.querySelector(".gallery"));
  const hide = darkSideActive || onHero || onSubpage;
  siteNav.classList.toggle("siteNav--hidden", hide);

  if (hide) {
    closeSiteNavPanels();
  }
}

function bindSiteNav() {
  document.getElementById("siteNavToggle").addEventListener("click", function () {
    const isOpen = siteNav.classList.toggle("siteNav--open");
    this.setAttribute("aria-expanded", isOpen ? "true" : "false");
    syncPhoneDrawerLock();
  });

  document.getElementById("siteNavPanel").addEventListener("click", function (event) {
    if (event.target.closest(".siteNav__link")) {
      return;
    }
    closeSiteNavPanels();
  });

  siteNav.querySelectorAll("[data-nav-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      const action = button.getAttribute("data-nav-action");

      if (action === "angebote") {
        window.location.assign("/anfrage/");
        return;
      }

      beginSubpageNavigation();

      if (action === "portfolio") {
        showPortfolioPicker();
        return;
      }
      if (action === "gallery") {
        openGallery(button.getAttribute("data-gallery-folder"));
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
    if (!siteNav || !siteNav.classList.contains("siteNav--open")) {
      return;
    }
    if (siteNav.contains(event.target)) {
      return;
    }
    closeSiteNavPanels();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !siteNav || !siteNav.classList.contains("siteNav--open")) {
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
    '<div class="angeboteCtaStack">' +
    '<a class="angeboteCta" id="angebotePaketButton" href="/anfrage/">Paket erstellen</a>' +
    '<button type="button" class="angeboteCta" id="angeboteCtaButton">' +
    escapeHtml(data.ctaLabel) +
    "</button>" +
    "</div>" +
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

function newspaperIcon(kind) {
  var inner = {
    hochzeiten:
      '<circle cx="12" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="1.6"></circle>' +
      '<circle cx="20" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="1.6"></circle>',
    portrait:
      '<circle cx="16" cy="11" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6"></circle>' +
      '<path d="M8 25c1.2-4 3.8-6 8-6s6.8 2 8 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>',
    business:
      '<rect x="7" y="8" width="18" height="16" fill="none" stroke="currentColor" stroke-width="1.6"></rect>' +
      '<path d="M7 14h18M12 8v16M20 8v16" fill="none" stroke="currentColor" stroke-width="1.3"></path>',
    events:
      '<rect x="6" y="8" width="20" height="16" fill="none" stroke="currentColor" stroke-width="1.6"></rect>' +
      '<path d="M6 13h20M11 6v4M21 6v4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>',
    drohne:
      '<circle cx="7" cy="13" r="3" fill="none" stroke="currentColor" stroke-width="1.5"></circle>' +
      '<circle cx="25" cy="13" r="3" fill="none" stroke="currentColor" stroke-width="1.5"></circle>' +
      '<path d="M10 13h4l2 4 2-4h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path>' +
      '<circle cx="16" cy="20" r="1.7" fill="currentColor"></circle>',
  };

  return (
    '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    (inner[kind] || "") +
    "</svg>"
  );
}

function newspaperServiceButton(kind, label) {
  return (
    '<button type="button" class="npaper-service" data-home-service="' +
    kind +
    '" aria-expanded="false" aria-controls="npaperNote">' +
    newspaperIcon(kind) +
    "<span>" +
    escapeHtml(label) +
    "</span></button>"
  );
}

function newspaperNavLink(action, label) {
  return (
    '<button type="button" class="npaper-nav__link ui-frozen notranslate" data-nav-action="' +
    action +
    '" translate="no">' +
    escapeHtml(label) +
    "</button>"
  );
}

function newspaperArchiveHtml() {
  var paragraphs = ["Am 17. Dezember 1984 herrschte ein frostiger Winter. Ich kam ohne einen Schrei zur Welt. Vielleicht war mir schon damals die Energie für unwichtige Dinge zu schade.","An meine Kindheit erinnere ich mich kaum. Sie verging wie ein einzelnes Bild in einer analogen Kamera – sie war da, wurde belichtet und verschwand irgendwo im Archiv der Zeit. Geblieben sind nur Bruchstücke von Bildern, einige Gerüche, ein paar Geräusche und das Gefühl, dass ich die Welt schon immer lieber beobachtet habe, als an ihr teilzunehmen.","Die Schulzeit war eine Zeit der Musik. Je härter, desto besser. Gitarren, Bass, Lärm und Rebellion. Allerdings rebellierte ich nicht gegen Lehrer, Eltern oder das System. Meistens rebellierte ich gegen mich selbst. Ich ging immer meinen eigenen Weg. Wenn alle nach rechts abbogen, wollte ich herausfinden, was sich auf der linken Seite befand. Nicht, weil ich es besser wusste. Meine Neugier war einfach stärker als mein Verstand.","Ich habe mich nie für besonders talentiert gehalten. Meine größte Stärke war mein Durchhaltevermögen. Ein hartnäckiges, manchmal törichtes und gelegentlich anstrengendes Durchhaltevermögen. Wenn mich etwas interessierte, gab ich nicht auf. Ich musste es überprüfen, in seine Einzelteile zerlegen und verstehen. Meine Neugier trieb mich weiter als jedes Talent.","Im Laufe der Jahre habe ich vieles ausprobiert. Es gab die Malerei. Zeichnungen und Bleistiftporträts. Es gab die Musik, die lange Zeit das Wichtigste in meinem Leben zu sein schien. Ich spielte Bass und viele andere Instrumente. All das bereitete mir Freude, aber nichts gab mir dieses besondere Gefühl, das entstand, wenn ich eine Kamera in die Hand nahm.","Die Fotografie kam nicht sofort zu mir. Vielmehr übernahm sie langsam die Kontrolle über mich. Zuerst war sie ein Interesse. Dann eine Leidenschaft. Schließlich wurde sie zu einer Sucht. Der gesündesten Sucht, die ich je hatte. Eine Dopaminquelle in den Momenten, in denen alles andere keinen Kick mehr gab.","Ich liebe Experimente. Ich baute mir eine eigene Lochkamera – eine primitive Kamera mit einem winzigen Loch. Damit machte ich ein Panoramafoto von einer traurigen Plattenbausiedlung. Für viele war es nur eine graue Landschaft. Für mich war es der Beweis, dass man mit allem fotografieren kann. Nicht die Kamera macht das Bild. Es entstehen durch den Menschen, das Licht und die Idee.","Und das Licht ist das Wichtigste.","Am besten ist es, wenn es möglichst wenig davon gibt.","Im Schatten verbirgt sich Charakter. Im Halbdunkel entstehen Emotionen. Helligkeit zeigt alles, aber die Dunkelheit lässt Raum für die Fantasie.","Vor zehn Jahren verließ ich meine Heimat. Damals stand die Fotografie noch nicht im Zentrum meiner Welt. Sie war irgendwo daneben. Und sie wartete geduldig.","Alles veränderte sich mit der Geburt meiner Tochter.","Für sie holte ich meine alte Spiegelreflexkamera aus dem Schrank. Ich wollte einige Momente festhalten, die viel zu schnell vergingen. Damals wusste ich noch nicht, dass ich eine Tür öffnete, die ich nie wieder schließen würde. Die Fotografie nahm mich vollständig ein. Sie begann, jeden freien Augenblick zu füllen – jeden Spaziergang, jede Reise und jede Nacht.","Heute stehe ich mit meiner Kamera auf Euren Hochzeiten, bei Events, Konzerten und Familienfeiern. Ich suche nach Emotionen, Gesten und Licht. Ich komme mit Speicherkarten voller Geschichten nach Hause und sitze anschließend stundenlang vor dem Monitor. Oft bis tief in die Nacht. Ich korrigiere, schneide zu und verfeinere jedes Detail.","Denn Fotografie ist für mich keine Arbeit.","Sie ist eine Art, die Welt zu betrachten.","Endlich tue ich etwas, das ich wirklich liebe. Und wenn man beginnt, das zu tun, was man liebt, hört man auf, die Arbeitsstunden zu zählen. Nicht, weil man weniger arbeitet. Im Gegenteil. Man hat einfach nicht mehr das Gefühl, zu arbeiten.","Ich bin Fotograf.","Nicht, weil ich eine Kamera besitze.","Sondern weil ich die Welt nicht mehr anders betrachten kann."];

  return (
    '<div class="npaper-archive">' +
    '<div class="npaper-archive__text">' +
    paragraphs
      .map(function (paragraph) {
        return "<p>" + escapeHtml(paragraph) + "</p>";
      })
      .join("") +
    "</div></div>"
  );
}

var ISSUE_TIME_ZONE = "Europe/Berlin";

function issueDateline(now) {
  var parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISSUE_TIME_ZONE,
    day: "2-digit",
    year: "numeric",
  }).formatToParts(now || new Date());
  var day = "";
  var year = "";
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].type === "day") day = parts[i].value;
    if (parts[i].type === "year") year = parts[i].value;
  }
  return "Nr. " + day + " / " + year;
}

function berlinDateKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ISSUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function msUntilBerlinDateChanges(now) {
  var key = berlinDateKey(now);
  var lo = now.getTime();
  var hi = lo + 26 * 60 * 60 * 1000;
  while (hi - lo > 1000) {
    var mid = Math.floor((lo + hi) / 2);
    if (berlinDateKey(new Date(mid)) === key) lo = mid;
    else hi = mid;
  }
  return Math.max(1000, hi - now.getTime() + 50);
}

function paintIssueDatelines(now) {
  var label = issueDateline(now);
  var nodes = document.querySelectorAll(
    ".npaper-kicker > span:first-child, .folioMast__kicker > span:first-child"
  );
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].textContent !== label) nodes[i].textContent = label;
  }
}

function armIssueDateline() {
  paintIssueDatelines();
  window.setTimeout(armIssueDateline, msUntilBerlinDateChanges(new Date()));
}

function newspaperHomeHtml() {
  var nav =
    newspaperNavLink("portfolio", FU.NAV.PORTFOLIO) +
    '<span class="npaper-nav__rule" aria-hidden="true"></span>' +
    newspaperNavLink("angebote", FU.NAV.ANGEBOTE) +
    '<span class="npaper-nav__rule" aria-hidden="true"></span>' +
    newspaperNavLink("aktuell", FU.NAV.AKTUELL) +
    (BLOG_ENABLED
      ? '<span class="npaper-nav__rule" aria-hidden="true"></span>' +
        newspaperNavLink("blog", FU.NAV.BLOG)
      : "") +
    '<span class="npaper-nav__rule" aria-hidden="true"></span>' +
    newspaperNavLink("about", FU.NAV.ABOUT_US) +
    '<span class="npaper-nav__rule" aria-hidden="true"></span>' +
    newspaperNavLink("contact", FU.NAV.KONTAKT);

  return (
    '<div class="menuWrapper npaper">' +
    '<div class="npaper-stage">' +
    '<div class="npaper-sheet">' +
    '<p class="npaper-kicker">' +
    "<span>" + issueDateline() + "</span>" +
    "<span>Fotografie • Menschen • Geschichten</span>" +
    "<span>Düsseldorf / NRW</span>" +
    "</p>" +
    '<h1 class="npaper-mast" aria-label="NOIR FRAME">' +
    '<span class="npaper-mast__line">' +
    '<span class="npaper-mast__ghost npaper-mast__ghost--before" aria-hidden="true">Olszty</span>' +
    'NOI<span class="npaper-r">R</span> F' +
    (DARK_SIDE_ENABLED
      ? '<button type="button" class="npaper-l" id="darkSideTrigger" aria-label="Dark Side">R</button>'
      : '<span class="npaper-l">R</span>') +
    "AME" +
    '<span class="npaper-mast__ghost npaper-mast__ghost--after" aria-hidden="true">rkrath</span>' +
    "</span>" +
    "</h1>" +
    '<nav class="npaper-nav" aria-label="' +
    escapeHtml(FU.NAV.ARIA) +
    '">' +
    nav +
    "</nav>" +
    '<div class="npaper-story">' +
    '<h2 class="npaper-headline">Fotografie.<br>Menschen.<br>Geschichten.</h2>' +
    '<p class="npaper-deck">Wir erzählen Geschichten in Bildern.</p>' +
    newspaperArchiveHtml() +
    "</div>" +
    '<figure class="npaper-photo">' +
    '<img src="images/newspaper/marcin-analog.jpg" alt="Marcin Porębski mit einer Contaflex" width="1024" height="683" fetchpriority="high" decoding="async">' +
    "</figure>" +
    '<div class="npaper-services" role="group" aria-label="Leistungen">' +
    newspaperServiceButton("hochzeiten", "Hochzeiten") +
    newspaperServiceButton("portrait", "Portrait") +
    newspaperServiceButton("business", "Business") +
    newspaperServiceButton("events", "Events") +
    newspaperServiceButton("drohne", "Drohne") +
    "</div>" +
    '<div class="npaper-note" id="npaperNote" hidden role="note">' +
    '<p class="npaper-note__kicker"></p>' +
    '<p class="npaper-note__body"></p>' +
    "</div>" +
    '<a class="npaper-cnc" href="/anfrage/">' +
    '<span class="npaper-cnc__brand">Create &amp; Collect</span>' +
    '<span class="npaper-cnc__note">Stellen Sie Ihr Paket selbst zusammen.</span>' +
    '<span class="npaper-cnc__cta">Paket zusammenstellen</span>' +
    "</a>" +
    "</div></div></div>"
  );
}

function showMenu(skipFadeOut) {
  cancelPendingGalleryLoads();
  transitionBody(newspaperHomeHtml(), setupMenuScreen, skipFadeOut === true);
}

function cncHomeBannerHtml() {
  return (
    '<a class="cncHomeBanner" href="/anfrage/" aria-label="Paket erstellen">' +
    '<span class="cncHomeBanner__note">' +
    escapeHtml(
      "Stellen Sie Ihr Paket selbst zusammen. Create & Collect ist Ihre direkte Anfrage an NOIR FRAME."
    ) +
    "</span>" +
    '<span class="cncHomeBanner__cta">PAKET ZUSAMMENSTELLEN</span>' +
    '<span class="cncHomeBanner__credit">' +
    escapeHtml("NOIR FRAME / CREATE & COLLECT") +
    "</span>" +
    "</a>"
  );
}

var newspaperNoteBinding = null;

var NEWSPAPER_NOTES = {
  hochzeiten: {
    title: "HOCHZEITEN",
    body: "Reportagen, die echte Emotionen festhalten. Vom Getting Ready bis zur Feier – ungestellt, aufmerksam und mit dem Blick für die kleinen Momente.",
  },
  portrait: {
    title: "PORTRAIT",
    body: "Charakter statt Pose. Individuelle Porträts mit natürlichem Licht, klarer Bildsprache und einer persönlichen Atmosphäre.",
  },
  business: {
    title: "BUSINESS",
    body: "Authentische Unternehmensfotografie für Websites, Marken und Social Media. Menschen, Arbeitsprozesse und echte Einblicke in den Betrieb.",
  },
  events: {
    title: "EVENTS",
    body: "Veranstaltungen, Konzerte und besondere Begegnungen. Dokumentarisch erzählt, mit Gespür für Atmosphäre, Dynamik und Details.",
  },
  drohne: {
    title: "DROHNE",
    body: "Neue Perspektiven und mehr Dynamik aus der Luft. Aufnahmen mit DJI-Drohne, durchgeführt von einem geschulten Operator unter Einhaltung der geltenden Vorschriften.",
  },
};

function placeNewspaperNote(note, button) {
  var margin = 12;
  var gap = 8;

  note.style.left = "0px";
  note.style.top = "0px";

  var noteRect = note.getBoundingClientRect();
  var buttonRect = button.getBoundingClientRect();
  var left = buttonRect.left + buttonRect.width / 2 - noteRect.width / 2;

  left = Math.max(margin, Math.min(left, window.innerWidth - margin - noteRect.width));

  var top = buttonRect.top - gap - noteRect.height;

  if (top < margin) {
    top = buttonRect.bottom + gap;
  }

  if (top + noteRect.height > window.innerHeight - margin) {
    top = Math.max(margin, window.innerHeight - margin - noteRect.height);
  }

  note.style.left = Math.round(left) + "px";
  note.style.top = Math.round(top) + "px";
}

function bindNewspaperHome() {
  var root = document.querySelector(".npaper");
  if (!root) {
    return;
  }

  if (newspaperNoteBinding) {
    newspaperNoteBinding.destroy();
    newspaperNoteBinding = null;
  }

  root.querySelectorAll("[data-nav-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      var action = button.getAttribute("data-nav-action");

      if (action === "angebote") {
        window.location.assign("/anfrage/");
        return;
      }

      beginSubpageNavigation();

      if (action === "portfolio") {
        showPortfolioPicker();
      } else if (action === "aktuell") {
        showAktuell();
      } else if (action === "blog") {
        showBlog();
      } else if (action === "about") {
        showAbout();
      } else if (action === "contact") {
        showContact();
      }
    });
  });

  var note = root.querySelector(".npaper-note");
  document.body.appendChild(note);
  var noteKicker = note.querySelector(".npaper-note__kicker");
  var noteBody = note.querySelector(".npaper-note__body");
  var buttons = root.querySelectorAll("[data-home-service]");
  var openButton = null;

  function setExpanded(button, expanded) {
    if (button) {
      button.setAttribute("aria-expanded", expanded ? "true" : "false");
    }
  }

  function closeNote() {
    if (!note) {
      return;
    }

    note.hidden = true;
    setExpanded(openButton, false);
    openButton = null;
  }

  function openNote(button) {
    var kind = button.getAttribute("data-home-service");
    var copy = NEWSPAPER_NOTES[kind];

    if (!copy) {
      return;
    }

    if (openButton && openButton !== button) {
      setExpanded(openButton, false);
    }

    noteKicker.textContent = copy.title;
    noteBody.textContent = copy.body;
    note.hidden = false;
    openButton = button;
    setExpanded(button, true);
    placeNewspaperNote(note, button);
  }

  function repositionNote() {
    if (openButton && note && !note.hidden) {
      placeNewspaperNote(note, openButton);
    }
  }

  function onServiceClick(event) {
    var button = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();

    if (openButton === button) {
      closeNote();
      return;
    }

    openNote(button);
  }

  function onDocumentClick(event) {
    if (!openButton || !note || note.hidden) {
      return;
    }

    if (note.contains(event.target)) {
      return;
    }

    closeNote();
  }

  function onDocumentKey(event) {
    if (event.key === "Escape" && openButton) {
      closeNote();
    }
  }

  buttons.forEach(function (button) {
    button.addEventListener("click", onServiceClick);
  });
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onDocumentKey);
  window.addEventListener("resize", repositionNote);
  window.addEventListener("scroll", repositionNote, true);

  newspaperNoteBinding = {
    destroy: function () {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onDocumentKey);
      window.removeEventListener("resize", repositionNote);
      window.removeEventListener("scroll", repositionNote, true);
      buttons.forEach(function (button) {
        button.removeEventListener("click", onServiceClick);
      });
    },
  };
}

var portraitDesktopQuery = window.matchMedia(
  "(min-width: 1200px) and (hover: hover) and (pointer: fine)"
);

function syncInteractivePortrait() {
  var figure = document.querySelector(".menuWrapper.npaper .npaper-photo");
  if (!figure) {
    return;
  }
  var plate = figure.querySelector(".npaper-photo__plate");
  if (!portraitDesktopQuery.matches) {
    if (plate) {
      plate.remove();
    }
    return;
  }
  if (plate) {
    return;
  }
  var img = document.createElement("img");
  img.className = "npaper-photo__plate";
  img.src = "images/newspaper/NF01.jpg?v=20261110-portrait-2";
  img.alt = "";
  img.setAttribute("aria-hidden", "true");
  img.width = 1024;
  img.height = 683;
  img.decoding = "async";
  figure.appendChild(img);
}

function bindInteractivePortrait() {
  syncInteractivePortrait();
  if (bindInteractivePortrait.listening || !portraitDesktopQuery.addEventListener) {
    return;
  }
  bindInteractivePortrait.listening = true;
  portraitDesktopQuery.addEventListener("change", syncInteractivePortrait);
}

function setupMenuScreen() {
  if (DARK_SIDE_ENABLED) {
    const darkSideTrigger = document.getElementById("darkSideTrigger");
    if (darkSideTrigger) {
      darkSideTrigger.addEventListener("click", enterDarkSide);
    }
  }

  setupMenuHero();
  bindNewspaperHome();
  bindInteractivePortrait();
}

function bindBackToMenu() {
  /* Back navigation uses a single document listener (see bottom of script). */
}

function galleryEmptyScreenHtml(message) {
  return (
    '<div class="gallery gallery--photos fade">' +
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

function portfolioDeptHtml(galleryFolder, imageKey, label, number, variant) {
  return (
    '<button type="button" class="folioDept ui-frozen notranslate folioDept--' +
    variant +
    " folioDept--img-" +
    imageKey +
    '" data-portfolio-gallery="' +
    escapeHtml(galleryFolder) +
    '" translate="no">' +
    '<span class="folioDept__index">0' +
    number +
    "</span>" +
    '<span class="folioDept__media">' +
    portfolioHeroMediaHtml(imageKey) +
    "</span>" +
    '<span class="folioDept__text">' +
    '<span class="folioDept__name">' +
    escapeHtml(label) +
    "</span>" +
    '<span class="folioDept__fig">Abb. 0' +
    number +
    "</span>" +
    "</span>" +
    "</button>"
  );
}

function portfolioPickerHtml() {
  return (
    '<div class="gallery gallery--portfolio fade">' +
    '<div class="folio">' +
    '<header class="folioMast">' +
    '<p class="folioMast__kicker">' +
    "<span>" + issueDateline() + "</span>" +
    "<span>Fotografie · Menschen · Geschichten</span>" +
    "<span>Düsseldorf / NRW</span>" +
    "</p>" +
    '<div class="folioMast__row">' +
    '<p class="folioMast__brand" aria-label="NOIR FRAME">NOI<span class="folioMast__r">R</span> FRAME</p>' +
    "<h1 class=\"folioMast__title\">Portfolio</h1>" +
    "</div>" +
    '<p class="folioMast__line">Inhalt · Vier Abteilungen</p>' +
    "</header>" +
    '<div class="folioSpread" role="group" aria-label="' +
    escapeHtml(FU.NAV.PORTFOLIO) +
    '">' +
    portfolioDeptHtml("weddings", "bright", FU.PORTFOLIO.BRIGHT_SIDE, "1", "lead") +
    '<div class="folioRail">' +
    portfolioDeptHtml("dsotl", "dark", FU.PORTFOLIO.DARK_SIDE, "2", "side") +
    portfolioDeptHtml("after-frame", "afterFrame", FU.PORTFOLIO.AFTER_FRAME, "3", "side folioDept--flip") +
    portfolioDeptHtml("sarinas-art", "sarina", FU.PORTFOLIO.SARINAS_ART, "4", "side folioDept--quiet") +
    "</div>" +
    "</div>" +
    backButtonHtml("backToMenuButton", FU.BUTTON.BACK_TO_MENU) +
    "</div>" +
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
        '<div class="gallery gallery--photos fade">' +
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
          "Fotograf, Musiker und visueller Geschichtenerzähler. Er arbeitet auch mit Spezialeffekten und ist Drohnenoperator. Marcin interessieren echte Menschen, ungestellte Momente und das Licht zwischen Hell und Dunkel.\n\nNicht Perfektion ist sein Maß. Er sucht Charakter, Atmosphäre und Bilder, die etwas fühlen lassen.",
      },
      {
        file: "foto02.jpg",
        name: "Sarina Skrobanek",
        role: "Second Shooter",
        description:
          "Sarina fotografiert als Second Shooter. Mit der Kamera hält sie echte Momente und Emotionen fest, besonders die kleinen, oft unscheinbaren Augenblicke, die eine Geschichte erzählen und Erinnerungen lebendig machen.\n\nIhr ist wichtig, nicht nur festzuhalten, wie etwas aussieht, sondern wie es sich anfühlt. Stimmung, kleine Details und natürliche Momente, die nebenbei entstehen, wiegen mehr als eine perfekte Inszenierung. Gerade die kleinen Dinge machen einen Moment besonders und einzigartig.",
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

function aboutMemberBioHtml(description) {
  var body = String(description || "").trim();
  if (!body) {
    return "";
  }

  var paragraphs = body.split(/\n\n+/).map(function (part) {
    var text = String(part || "").trim();
    if (!text) {
      return "";
    }
    return "<p>" + aboutDescriptionHtml(text) + "</p>";
  }).join("");

  return (
    '<div class="member__bio">' +
    '<div class="member__bioBody">' +
    '<div class="member__bioContent">' +
    paragraphs +
    "</div>" +
    "</div>" +
    '<p class="member__sign">' +
    escapeHtml(ABOUT_TEAM_MOTTO) +
    "</p>" +
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
        aboutMemberBioHtml(member.description) +
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
    "<p>Es gilt die Kleinunternehmerregelung gemäß § 19 UStG.</p>" +
    '<p><a href="/datenschutz.html">Datenschutzerklärung</a></p>'
  );
}

function contactImpressumHtml() {
  return (
    '<div class="contactImpressum">' +
    '<button type="button" class="contactImpressum__toggle" aria-expanded="false" aria-controls="contact-impressum-drawer">Impressum</button>' +
    '<p class="contactCard__impressumNav">' +
    '<a class="contactCard__impressumLink" href="/datenschutz.html">Datenschutzerklärung</a>' +
    "</p>" +
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
    '<span class="contactCard__impressumSep" aria-hidden="true"> · </span>' +
    '<a class="contactCard__impressumLink" href="/datenschutz.html">Datenschutzerklärung</a>' +
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
  darkSideOverlay.style.opacity = "0";
  darkSideOverlay.style.visibility = "hidden";
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
  darkSideOverlay.style.opacity = "";
  darkSideOverlay.style.visibility = "";
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

var galleryElevatorObserver = null;
var galleryElevatorObserved = null;
var galleryElevatorFrame = 0;

function galleryElevatorArrow(direction) {
  var up = direction === "up";
  return (
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
    '<path d="' +
    (up ? "M8 12.5V3.5M8 3.5L4.2 7.3M8 3.5l3.8 3.8" : "M8 3.5v9M8 12.5l-3.8-3.8M8 12.5l3.8-3.8") +
    '" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path>' +
    "</svg>"
  );
}

function ensureGalleryElevator() {
  if (document.getElementById("galleryElevator")) {
    return;
  }

  var elevator = document.createElement("div");
  elevator.id = "galleryElevator";
  elevator.className = "galleryElevator";
  elevator.hidden = true;
  elevator.setAttribute("role", "group");
  elevator.setAttribute("aria-label", "Aufzug");
  elevator.innerHTML =
    '<button type="button" class="galleryElevator__btn" data-gallery-elevator="top" aria-label="AUFZUG NACH OBEN">' +
    galleryElevatorArrow("up") +
    "<span>Oben</span></button>" +
    '<button type="button" class="galleryElevator__btn" data-gallery-elevator="bottom" aria-label="AUFZUG NACH UNTEN">' +
    galleryElevatorArrow("down") +
    "<span>Unten</span></button>";

  elevator.addEventListener("click", function (event) {
    var button = event.target.closest("[data-gallery-elevator]");
    if (!button) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    var scroller = document.scrollingElement || document.documentElement;
    var toEnd = button.getAttribute("data-gallery-elevator") === "bottom";
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({
      top: toEnd ? scroller.scrollHeight : 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  });

  document.documentElement.appendChild(elevator);
}

function longGalleryElement() {
  var gallery = document.querySelector("body > .gallery");
  if (!gallery || document.querySelector(".menuWrapper")) {
    return null;
  }

  if (
    gallery.classList.contains("gallery--portfolio") ||
    gallery.classList.contains("gallery--contact") ||
    gallery.classList.contains("legalPage")
  ) {
    return null;
  }

  if (gallery.classList.contains("gallery--photos") && !gallery.querySelector("img")) {
    return null;
  }

  var scroller = document.scrollingElement || document.documentElement;
  var extra = scroller.scrollHeight - scroller.clientHeight;
  var threshold = Math.min(window.innerHeight * 0.45, 320);

  if (extra <= threshold) {
    return null;
  }

  return gallery;
}

function syncGalleryElevator() {
  ensureGalleryElevator();
  var elevator = document.getElementById("galleryElevator");
  var gallery = document.querySelector("body > .gallery");
  var longGallery = longGalleryElement();

  elevator.hidden = !longGallery;

  if (gallery === galleryElevatorObserved) {
    return;
  }

  if (galleryElevatorObserver) {
    galleryElevatorObserver.disconnect();
  }

  galleryElevatorObserved = gallery;

  if (!gallery || typeof ResizeObserver !== "function") {
    return;
  }

  if (!galleryElevatorObserver) {
    galleryElevatorObserver = new ResizeObserver(scheduleGalleryElevatorSync);
  }

  galleryElevatorObserver.observe(gallery);
}

function scheduleGalleryElevatorSync() {
  if (galleryElevatorFrame) {
    return;
  }

  galleryElevatorFrame = window.requestAnimationFrame(function () {
    galleryElevatorFrame = 0;
    syncGalleryElevator();
  });
}

ensureSiteNav();
updateSiteNavVisibility();
syncGalleryElevator();
window.addEventListener("resize", scheduleGalleryElevatorSync);

document.addEventListener("click", function (event) {
  if (!event.target.closest(".backToMenuButton")) {
    return;
  }

  event.preventDefault();
  cancelHeroHold();
  if (isNfNavState(history.state) && history.state.screen === "view") {
    history.back();
    return;
  }
  heroTransitionStarted = true;
  showMenu();
  replaceNavState("menu");
});

window.addEventListener("popstate", onNavPopState);
window.addEventListener("pageshow", onNavPageShow);
window.addEventListener("hashchange", function () {
  if (window.location.hash === "#menu") {
    applyMenuFromHistory();
  }
});

if (
  window.location.hash === "#menu" ||
  hasMenuSeen() ||
  (isNfNavState(history.state) &&
    (history.state.screen === "menu" ||
      history.state.screen === "view" ||
      history.state.screen === "hero"))
) {
  applyMenuFromHistory();
} else {
  markMenuSeen();
  heroTransitionStarted = true;
  showMenu(true);
  replaceNavState("menu");
}

armIssueDateline();
