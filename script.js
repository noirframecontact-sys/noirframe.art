const FADE_MS = 520;

const galleryManifestCache = {};

const enterButton = document.getElementById("enterButton");

enterButton.addEventListener("click", function () {
  const container = document.querySelector(".container");
  if (container) {
    container.classList.remove("show");
    setTimeout(function () {
      showMenu(true);
    }, FADE_MS);
    return;
  }
  showMenu();
});

function transitionBody(html, onReady, skipFadeOut) {
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
  if (screen) {
    screen.classList.add("fade");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        screen.classList.add("show");
      });
    });
  }
  if (onReady) {
    onReady();
  }
}

function galleryAssetPath(folder, filename) {
  return "images/" + folder + "/" + filename;
}

function fetchGalleryManifest(folder) {
  if (galleryManifestCache[folder]) {
    return Promise.resolve(galleryManifestCache[folder]);
  }

  return fetch(galleryAssetPath(folder, "gallery.json"))
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

function backButtonHtml(id, label) {
  return (
    '<button id="' +
    id +
    '"><i class="ph-light ph-arrow-left"></i> ' +
    label +
    "</button>"
  );
}

function showMenu(skipFadeOut) {
  transitionBody(
    '<div class="menuWrapper fade">' +
      '<div class="nfLogo">NF<span>NOIЯFRAME</span></div>' +
      '<div class="menu">' +
      '<div class="tile" id="weddingTile"><i class="ph-light ph-heart-straight"></i><span>Wedding</span></div>' +
      '<div class="tile" id="realEstateTile"><i class="ph-light ph-house"></i><span>Real Estate</span></div>' +
      '<div class="tile" id="portraitTile"><i class="ph-light ph-user-focus"></i><span>Portrait</span></div>' +
      '<div class="tile" id="videoTile"><i class="ph-light ph-film-reel"></i><span>Video</span></div>' +
      '<div class="tile" id="aboutTile"><i class="ph-light ph-users"></i><span>About us</span></div>' +
      '<div class="tile" id="contactTile"><i class="ph-light ph-envelope"></i><span>Contact</span></div>' +
      "</div>" +
      "</div>",
    setupTiles,
    skipFadeOut
  );
}

function setupTiles() {
  document.getElementById("weddingTile").addEventListener("click", function () {
    openGallery("weddings");
  });

  document.getElementById("realEstateTile").addEventListener("click", function () {
    openGallery("realestate");
  });

  document.getElementById("portraitTile").addEventListener("click", function () {
    openGallery("portrait");
  });

  document.getElementById("videoTile").addEventListener("click", function () {
    showFilms();
  });

  document.getElementById("aboutTile").addEventListener("click", function () {
    showAbout();
  });

  document.getElementById("contactTile").addEventListener("click", function () {
    showContact();
  });
}

function bindBackToMenu() {
  document.getElementById("backToMenuButton").addEventListener("click", showMenu);
}

function openGallery(folder) {
  fetchGalleryManifest(folder)
    .then(function (images) {
      let imagesHtml = "";
      images.forEach(function (filename, index) {
        imagesHtml += galleryImageTag(folder, filename, index === 0);
      });

      transitionBody(
        '<div class="gallery fade">' +
          imagesHtml +
          backButtonHtml("backToMenuButton", "BACK TO MENU") +
          "</div>",
        bindBackToMenu
      );
    })
    .catch(function () {
      transitionBody(
        '<div class="gallery fade">' +
          backButtonHtml("backToMenuButton", "BACK TO MENU") +
          "</div>",
        bindBackToMenu
      );
    });
}

function showAbout() {
  transitionBody(
    '<div class="gallery fade">' +
      "<h1>ABOUT US</h1>" +
      "<p>Three people. One workflow.</p>" +
      '<div class="team">' +
      '<div class="member">' +
      teamImageTag("foto01") +
      "<h3>Photo / Video Operator</h3>" +
      "<p>People, light and emotions.</p>" +
      "</div>" +
      '<div class="member">' +
      teamImageTag("foto02") +
      "<h3>Second Shooter</h3>" +
      "<p>Details and perspective.</p>" +
      "</div>" +
      '<div class="member">' +
      teamImageTag("foto03") +
      "<h3>Coordination</h3>" +
      "<p>Behind the scenes.<br>Making everything work.</p>" +
      "</div>" +
      "</div>" +
      backButtonHtml("backToMenuButton", "BACK TO MENU") +
      "</div>",
    bindBackToMenu
  );
}

function showContact() {
  transitionBody(
    '<div class="gallery fade">' +
      "<h1>CONTACT</h1>" +
      '<div class="contact-box">' +
      "<p>NOIЯFRAME</p>" +
      '<p><i class="ph-light ph-envelope"></i> info.noirframe@gmail.com</p>' +
      "<p><i class=\"ph-light ph-user\"></i> Marcin Porębski</p>" +
      '<p><i class="ph-light ph-phone"></i> 01774429815</p>' +
      "</div>" +
      backButtonHtml("backToMenuButton", "BACK TO MENU") +
      "</div>",
    bindBackToMenu
  );
}

function showFilms() {
  transitionBody(
    '<div class="gallery fade">' +
      "<h1>VIDEO</h1>" +
      "<p>31 seconds of NOIЯFRAME</p>" +
      '<video id="motionVideo" controls preload="metadata" playsinline>' +
      '<source src="images/motion/Video01.mp4" type="video/mp4">' +
      "</video>" +
      "<p>Only light matters.</p>" +
      backButtonHtml("backToMenuButton", "BACK TO MENU") +
      "</div>",
    bindBackToMenu
  );
}
