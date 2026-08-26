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

const galleryManifestCache = {};
let galleryLoadId = 0;
let angeboteCache = null;
let aktuellCache = null;
let blogCache = null;
let contactCache = null;
let motionCache = null;

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
  title: "ANGEBOTE",
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
  title: "BLOG",
  intro: "Fotografie. Erinnerungen. Geschichten.\n\nVon alten Familienbildern über analoge Fotografie bis zu den aktuellen Projekten von Noir Frame.",
  items: [],
  footer: "",
};

const BLOG_SIGNATURE = "– Noir Frame | Only Light Matters";

const AKTUELL_FALLBACK = {
  title: "AKTUELL BEI UNS",
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

setTimeout(openMenuFromHero, HERO_HOLD_MS);

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
    '<button type="button" class="siteNav__toggle" id="siteNavToggle" aria-expanded="false" aria-controls="siteNavPanel">' +
    '<i class="ph-light ph-list"></i>' +
    '<span>Menü</span>' +
    "</button>" +
    '<div class="siteNav__panel siteNav__fadeSurface" id="siteNavPanel">' +
    '<div class="siteNav__panelInner">' +
    '<div class="siteNav__group" id="siteNavPortfolio">' +
    '<button type="button" class="siteNav__trigger" id="siteNavPortfolioTrigger" aria-expanded="false" aria-controls="siteNavPortfolioMenu">' +
    "Portfolio / Galerie" +
    '<i class="ph-light ph-caret-down siteNav__caret"></i>' +
    "</button>" +
    '<div class="siteNav__dropdown siteNav__fadeSurface" id="siteNavPortfolioMenu">' +
    '<div class="siteNav__dropdownGrid">' +
    '<button type="button" class="siteNav__dropdownItem" data-nav-action="gallery" data-gallery-folder="weddings">Wedding</button>' +
    '<button type="button" class="siteNav__dropdownItem" data-nav-action="gallery" data-gallery-folder="portrait">Portrait</button>' +
    '<button type="button" class="siteNav__dropdownItem" data-nav-action="gallery" data-gallery-folder="realestate">Reportage</button>' +
    '<button type="button" class="siteNav__dropdownItem" data-nav-action="video">Video</button>' +
    "</div>" +
    "</div>" +
    "</div>" +
    '<hr class="siteNav__divider" aria-hidden="true">' +
    '<button type="button" class="siteNav__link" data-nav-action="angebote">Angebote</button>' +
    '<hr class="siteNav__divider" aria-hidden="true">' +
    '<button type="button" class="siteNav__link" data-nav-action="aktuell">Aktuell bei uns</button>' +
    (BLOG_ENABLED
      ? '<hr class="siteNav__divider" aria-hidden="true">' +
        '<button type="button" class="siteNav__link" data-nav-action="blog">Blog</button>'
      : "") +
    '<hr class="siteNav__divider" aria-hidden="true">' +
    '<button type="button" class="siteNav__link" data-nav-action="about">About Us</button>' +
    '<hr class="siteNav__divider" aria-hidden="true">' +
    '<button type="button" class="siteNav__link" data-nav-action="contact">Kontakt</button>' +
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
  siteNav.setAttribute("aria-label", "Hauptnavigation");
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

  document.getElementById("siteNavPortfolioTrigger").addEventListener("click", function () {
    clearPortfolioHoverTimers();
    const group = document.getElementById("siteNavPortfolio");
    const isOpen = !group.classList.contains("is-open");
    setPortfolioMenuOpen(isOpen);
  });

  bindPortfolioDesktopHover();

  siteNav.querySelectorAll("[data-nav-action]").forEach(function (button) {
    button.addEventListener("click", function () {
      const action = button.getAttribute("data-nav-action");
      beginSubpageNavigation();

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
  return "images/" + folder + "/" + filename;
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
    title: data.title || ANGEBOTE_FALLBACK.title,
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
    pageBgPhotoHtml() +
    "<h1>" +
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
    backButtonHtml("backToMenuButton", "BACK TO MENU") +
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
    title: data.title || AKTUELL_FALLBACK.title,
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
      escapeHtml(item.qrAlt || "QR-Code scannen") +
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
    pageBgPhotoHtml() +
    "<h1>" +
    escapeHtml(data.title) +
    "</h1>" +
    "<p>" +
    escapeHtml(data.intro) +
    "</p>" +
    '<div class="aktuellList">' +
    itemsHtml +
    "</div>" +
    backButtonHtml("backToMenuButton", "BACK TO MENU") +
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
    '" id="' +
    id +
    '"><i class="ph-light ph-arrow-left"></i> ' +
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
      pageBgPhotoHtml() +
      (DARK_SIDE_ENABLED
        ? '<div class="menuIntro">' +
          '<button type="button" class="darkSideMoon" id="darkSideMoon" aria-label="The Dark Side">' +
          DARK_MOON_ICON +
          "</button>" +
          '<div class="nfLogo">NF<span>NOIЯFRAME</span></div>' +
          "</div>"
        : '<div class="nfLogo">NF<span>NOIЯFRAME</span></div>') +
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

function openGallery(folder) {
  beginSubpageNavigation();
  const loadId = ++galleryLoadId;

  fetchGalleryManifest(folder)
    .then(function (images) {
      if (loadId !== galleryLoadId) {
        return;
      }

      let imagesHtml = "";
      images.forEach(function (filename, index) {
        imagesHtml += galleryImageTag(folder, filename, index === 0);
      });

      transitionBody(
        '<div class="gallery fade">' +
          pageBgPhotoHtml() +
          imagesHtml +
          backButtonHtml("backToMenuButton", "BACK TO MENU") +
          "</div>",
        bindBackToMenu
      );
    })
    .catch(function () {
      if (loadId !== galleryLoadId) {
        return;
      }

      transitionBody(
        '<div class="gallery fade">' +
          pageBgPhotoHtml() +
          backButtonHtml("backToMenuButton", "BACK TO MENU") +
          "</div>",
        bindBackToMenu
      );
    });
}

function showAbout() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();
  aboutCache = null;
  fetchAboutData()
    .then(function (about) {
      transitionBody(renderAboutHtml(about), bindBackToMenu);
    })
    .catch(function () {
      transitionBody(renderAboutHtml(defaultAboutData()), bindBackToMenu);
    });
}

var aboutCache = null;

function defaultAboutData() {
  return {
    headline: "ABOUT US",
    subline: "Three people. One workflow.",
    members: [
      {
        file: "foto01.jpg",
        role: "Photo / Video Operator",
        description: "People, light and emotions.",
      },
      {
        file: "foto02.jpg",
        role: "Second Shooter",
        description: "Details and perspective.",
      },
      {
        file: "foto03.jpg",
        role: "Coordination",
        description: "Behind the scenes.\nMaking everything work.",
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

function aboutPhotoTag(file) {
  var name = String(file || "").trim();
  if (!name) {
    return "";
  }
  return (
    '<img src="images/team/' +
    encodeURI(name) +
    '" loading="lazy" decoding="async" alt="">'
  );
}

function renderAboutHtml(about) {
  var members = Array.isArray(about.members) ? about.members : [];
  var membersHtml = members
    .map(function (member) {
      return (
        '<div class="member">' +
        aboutPhotoTag(member.file) +
        "<h3>" +
        escapeHtml(member.role || "") +
        "</h3>" +
        "<p>" +
        aboutDescriptionHtml(member.description) +
        "</p>" +
        "</div>"
      );
    })
    .join("");

  return (
    '<div class="gallery fade">' +
    pageBgPhotoHtml() +
    "<h1>" +
    escapeHtml(about.headline || "ABOUT US") +
    "</h1>" +
    "<p>" +
    escapeHtml(about.subline || "") +
    "</p>" +
    '<div class="team">' +
    membersHtml +
    "</div>" +
    backButtonHtml("backToMenuButton", "BACK TO MENU") +
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

function pageBgPhotoHtml(desktop, portrait, landscape) {
  var bgDesktop = desktop || "images/layouts/layout_PC.jpg";
  var bgPortrait = portrait || "images/layouts/layout_02.jpg";
  var bgLandscape = landscape || "images/layouts/layout_03.jpg";

  return (
    '<picture class="pageBgPhoto" aria-hidden="true">' +
    '<source media="(max-width: 899px) and (orientation: portrait)" srcset="' +
    escapeHtml(bgPortrait) +
    '">' +
    '<source media="(orientation: landscape) and (hover: none) and (pointer: coarse)" srcset="' +
    escapeHtml(bgLandscape) +
    '">' +
    '<img src="' +
    escapeHtml(bgDesktop) +
    '" alt="" loading="eager" decoding="async">' +
    "</picture>"
  );
}

function contactBgPhotoHtml(contact) {
  var bgDesktop = contact.backgroundDesktop || "images/layouts/layout_PC_CONTACT.jpg";
  return pageBgPhotoHtml(
    bgDesktop,
    contact.backgroundMobilePortrait || bgDesktop,
    contact.backgroundMobileLandscape || bgDesktop
  );
}

function renderContactHtml(contact) {
  var ownerTel = contactTelHref(contact.ownerPhone);
  var officeTel = contactTelHref(contact.officePhone);

  return (
    '<div class="gallery gallery--contact fade">' +
      contactBgPhotoHtml(contact) +
      '<div class="contactLayout">' +
      '<div class="contactLayout__frame">' +
      '<div class="contactLayout__main">' +
      '<div class="contactLayout__panel">' +
      '<p class="contactLayout__brand">' + escapeHtml(contact.brand || "NOIЯFRAME") + "</p>" +
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
      '<hr class="contactLayout__divider" aria-hidden="true">' +
      '<div class="contact-group">' +
      '<p class="contact-row">' +
      '<span class="contact-row__icon" aria-hidden="true"><i class="ph-light ph-user"></i></span>' +
      '<span class="contact-row__body">' + escapeHtml(contact.officeLabel || "") + "</span>" +
      "</p>" +
      '<p class="contact-row">' +
      '<span class="contact-row__icon" aria-hidden="true"><i class="ph-light ph-user"></i></span>' +
      '<span class="contact-row__body">' + escapeHtml(contact.officeContact || "") + "</span>" +
      "</p>" +
      '<p class="contact-row">' +
      '<span class="contact-row__icon" aria-hidden="true"><i class="ph-light ph-phone"></i></span>' +
      '<a class="contact-row__body" href="tel:' + escapeHtml(officeTel) + '">' + escapeHtml(contact.officePhone || "") + "</a>" +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="contactLayout__languages">' +
      '<p class="contactLayout__languagesLead">' + escapeHtml(contact.languagesLead || "Wir sprechen") + "</p>" +
      '<p class="contactLayout__languagesList">' + escapeHtml(contact.languages || "") + "</p>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>" +
      backButtonHtml("backToMenuButton", "BACK TO MENU") +
      "</div>"
  );
}


function showContact() {
  cancelPendingGalleryLoads();
  beginSubpageNavigation();
  fetchContactData()
    .then(function (contact) {
      transitionBody(renderContactHtml(contact), bindBackToMenu);
    })
    .catch(function () {
      transitionBody(
        renderContactHtml({
          brand: "NOIЯFRAME",
          ownerName: "Marcin Porębski",
          ownerRole: "Fotograf & Inhaber",
          ownerPhone: "01774429815",
          ownerEmail: "info.noirframe@gmail.com",
          officeLabel: "Büro & Organisation",
          officeContact: "Hr. Rinaldo",
          officePhone: "01739147605",
          languagesLead: "Wir sprechen",
          languages: "Russisch · Polski · Deutsch · Italy",
          backgroundDesktop: "images/layouts/layout_PC_CONTACT.jpg",
        }),
        bindBackToMenu
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
    pageBgPhotoHtml() +
    "<h1>VIDEO</h1>" +
    itemsHtml +
    footerHtml +
    backButtonHtml("backToMenuButton", "BACK TO MENU") +
    "</div>"
  );
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
    title: data.title || BLOG_FALLBACK.title,
    intro: data.intro || BLOG_FALLBACK.intro,
    items: normalizedItems,
    footer: data.footer || "",
  };
}

function blogCaptionBody(caption) {
  if (!caption || !caption.trim()) {
    return "";
  }

  return caption
    .trim()
    .replace(/\n*–\s*Noir Frame\s*\|\s*Only Light Matters\s*$/i, "")
    .trim();
}

function blogCaptionHtml(caption) {
  const body = blogCaptionBody(caption);
  const paragraphs = body ? body.split(/\n\s*\n/) : [];
  paragraphs.push(BLOG_SIGNATURE);

  return paragraphs
    .map(function (paragraph, index) {
      const isSignature =
        index === paragraphs.length - 1 && paragraph.trim() === BLOG_SIGNATURE;
      const className = isSignature ? ' class="blogItem__signature"' : "";
      return "<p" + className + ">" + escapeHtml(paragraph.trim()) + "</p>";
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
    pageBgPhotoHtml() +
    '<div class="blogToolbar">' +
    backButtonHtml("backToMenuButtonTop", "BACK TO MENU") +
    "</div>" +
    '<div class="blogColumn">' +
    '<header class="blogHeader">' +
    "<h1>" +
    escapeHtml(data.title) +
    "</h1>" +
    blogIntroHtml(data.intro) +
    "</header>" +
    '<div class="blogList">' +
    itemsHtml +
    "</div>" +
    footerHtml +
    "</div>" +
    backButtonHtml("backToMenuButton", "BACK TO MENU") +
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
