/* Dark Side — jedno tło (cover) + wskazówki na wspólnej osi */

const NF_CLOCK_SCENE_IMAGE = "images/dark-side/alarm-clock.jpg";
const NF_CLOCK_VIEW_W = 1024;
const NF_CLOCK_VIEW_H = 682;

/** Stała oś obrotu w układzie obrazu (px viewBox) */
const NF_CLOCK_HUB_X = 491.1;
const NF_CLOCK_HUB_Y = 368.5;

const NF_CLOCK_HAND_COLOR = "#1a1a1a";

const NF_CLOCK_HANDS = {
  hour: { length: 62, width: 5, tail: 0 },
  minute: { length: 88, width: 3.5, tail: 0 },
  second: { length: 108, width: 1.5, tail: 14 },
};

/** true = statyczne kąty testowe osi; false = animacja czasu */
const NF_CLOCK_AXIS_TEST_MODE = false;

const NF_CLOCK_AXIS_TEST_ANGLES = {
  hour: 0,
  minute: 90,
  second: 180,
};

let nfClockRoot = null;
let nfClockRaf = null;

function nfClockHandLine(kind) {
  const spec = NF_CLOCK_HANDS[kind];
  const tipY = NF_CLOCK_HUB_Y - spec.length;
  const tailY = NF_CLOCK_HUB_Y + spec.tail;

  return (
    '<line x1="' +
    NF_CLOCK_HUB_X +
    '" y1="' +
    tailY +
    '" x2="' +
    NF_CLOCK_HUB_X +
    '" y2="' +
    tipY +
    '" stroke="' +
    NF_CLOCK_HAND_COLOR +
    '" stroke-width="' +
    spec.width +
    '" stroke-linecap="round"/>'
  );
}

function nfClockHandsMarkup() {
  return (
    '<svg class="darkSideClock__handsSvg" viewBox="0 0 ' +
    NF_CLOCK_VIEW_W +
    " " +
    NF_CLOCK_VIEW_H +
    '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<g class="darkSideClock__hand darkSideClock__hand--hour">' +
    nfClockHandLine("hour") +
    "</g>" +
    '<g class="darkSideClock__hand darkSideClock__hand--minute">' +
    nfClockHandLine("minute") +
    "</g>" +
    '<g class="darkSideClock__hand darkSideClock__hand--second">' +
    nfClockHandLine("second") +
    "</g>" +
    "</svg>"
  );
}

function nfClockHandAngles(date) {
  const ms = date.getMilliseconds();
  const seconds = date.getSeconds() + ms / 1000;
  const minutes = date.getMinutes() + seconds / 60;
  const hours = (date.getHours() % 12) + minutes / 60;

  return {
    hour: hours * 30,
    minute: minutes * 6,
    second: (60 - seconds) * 6,
  };
}

function nfClockApplyHandsToRoot(root, angles) {
  if (!root) {
    return;
  }

  const hour = root.querySelector(".darkSideClock__hand--hour");
  const minute = root.querySelector(".darkSideClock__hand--minute");
  const second = root.querySelector(".darkSideClock__hand--second");
  const pivot = NF_CLOCK_HUB_X + " " + NF_CLOCK_HUB_Y;

  if (hour) {
    hour.setAttribute("transform", "rotate(" + angles.hour + " " + pivot + ")");
  }
  if (minute) {
    minute.setAttribute("transform", "rotate(" + angles.minute + " " + pivot + ")");
  }
  if (second) {
    second.setAttribute("transform", "rotate(" + angles.second + " " + pivot + ")");
  }
}

function nfClockApplyHands() {
  const angles = NF_CLOCK_AXIS_TEST_MODE
    ? NF_CLOCK_AXIS_TEST_ANGLES
    : nfClockHandAngles(new Date());

  nfClockApplyHandsToRoot(nfClockRoot, angles);
}

function nfClockAnimationFrame() {
  nfClockApplyHands();
  nfClockRaf = requestAnimationFrame(nfClockAnimationFrame);
}

function initDarkSideClock(scene) {
  stopDarkSideClock();

  if (!scene) {
    return;
  }

  const handsMount = scene.querySelector("#darkSideClockHands");
  if (!handsMount) {
    return;
  }

  handsMount.innerHTML = nfClockHandsMarkup();
  nfClockRoot = handsMount;
  nfClockApplyHands();

  if (!NF_CLOCK_AXIS_TEST_MODE) {
    nfClockAnimationFrame();
  }
}

function stopDarkSideClock() {
  if (nfClockRaf) {
    cancelAnimationFrame(nfClockRaf);
    nfClockRaf = null;
  }

  nfClockRoot = null;
}

function darkSideClockStageHtml() {
  return (
    '<div class="darkSideClockStage" id="darkSideClockStage" aria-hidden="true">' +
    '<div class="darkSideClockScene" id="darkSideClockScene">' +
    '<div class="darkSideClockBackdrop" aria-hidden="true"></div>' +
    '<div class="darkSideClockHands" id="darkSideClockHands"></div>' +
    "</div>" +
    "</div>"
  );
}

function initDarkSideClockScene() {
  initDarkSideClock(document.getElementById("darkSideClockScene"));
}

function stopDarkSideClockScene() {
  stopDarkSideClock();
}
