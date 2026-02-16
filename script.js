/**
 * Green palette (50 tiles)
 * Generates 50 greens in a smooth range and renders them as equal squares.
 */

const TILE_COUNT = 60;

// Palette anchors (all included across the 60 tiles)
// Dark green -> warm green/brown -> off-white
const START_HEX = "#3a3b23";
const MID_HEX = "#736a46";
const END_HEX = "#d4c7a6";

const MID_INDEX = Math.round((TILE_COUNT - 1) / 2);

const INTERESTS = [
  "Architecture",
  "Photography",
  "3D visualisation",
  "Fashion",
  "Sport",
  "Music",
  "Graphic design",
  "Interior design",
];

/** Convert HSL (0-360, 0-100, 0-100) to hex string. */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));

  let r = 0,
    g = 0,
    b = 0;

  if (0 <= hh && hh < 1) {
    r = c;
    g = x;
  } else if (1 <= hh && hh < 2) {
    r = x;
    g = c;
  } else if (2 <= hh && hh < 3) {
    g = c;
    b = x;
  } else if (3 <= hh && hh < 4) {
    g = x;
    b = c;
  } else if (4 <= hh && hh < 5) {
    r = x;
    b = c;
  } else if (5 <= hh && hh < 6) {
    r = c;
    b = x;
  }

  const m = l - c / 2;
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Convert hex #rrggbb to {r,g,b} in 0..255 */
function hexToRgb(hex) {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length !== 6) throw new Error(`Expected 6-digit hex, got: ${hex}`);
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
}

/** Convert RGB 0..255 to HSL (h:0..360, s:0..100, l:0..100) */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  return {
    h,
    s: s * 100,
    l: l * 100,
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Interpolate hue the short way around the color wheel.
function lerpHue(h1, h2, t) {
  const delta = ((h2 - h1 + 540) % 360) - 180;
  return (h1 + delta * t + 360) % 360;
}

/**
 * Make greens around ~135° hue with slight variation.
 * We vary lightness from dark -> bright and saturation moderately high.
 */
function makeGreen(i, total) {
  const t = total <= 1 ? 0 : i / (total - 1);

  // Piecewise interpolation across 3 anchors.
  // First half: START -> MID, Second half: MID -> END (off-white).
  const a = t < 0.5 ? 0 : 1;
  const localT = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5;

  const fromHex = a === 0 ? START_HEX : MID_HEX;
  const toHex = a === 0 ? MID_HEX : END_HEX;

  const fromRgb = hexToRgb(fromHex);
  const toRgb = hexToRgb(toHex);
  const fromHsl = rgbToHsl(fromRgb.r, fromRgb.g, fromRgb.b);
  const toHsl = rgbToHsl(toRgb.r, toRgb.g, toRgb.b);

  const h = lerpHue(fromHsl.h, toHsl.h, localT);
  const s = lerp(fromHsl.s, toHsl.s, localT);
  const l = lerp(fromHsl.l, toHsl.l, localT);

  return hslToHex(h, s, l);
}

function buildPalette() {
  const palette = document.getElementById("palette");
  if (!palette) return;

  const frag = document.createDocumentFragment();

  // Pick a random tile each load (avoid the MID tile which is reserved for the Eye Color text).
  let interestsIndex = Math.floor(Math.random() * TILE_COUNT);
  if (interestsIndex === MID_INDEX) interestsIndex = (interestsIndex + 1) % TILE_COUNT;

  for (let i = 0; i < TILE_COUNT; i++) {
    // Force one exact MID_HEX tile so we can reliably place the eye on that color.
    const color = i === MID_INDEX ? MID_HEX : makeGreen(i, TILE_COUNT);

    const btn = document.createElement("button");
    btn.className = "swatch";
    btn.type = "button";
    btn.style.backgroundColor = color;
    btn.setAttribute("aria-label", `Color ${i + 1}: ${color}`);

    // Add the eye on the exact MID_HEX tile.
    if (i === MID_INDEX) {
      btn.classList.add("has-eye");
      btn.addEventListener("click", () => {
        window.location.href = "./eye.html";
      });

      const eyeText = document.createElement("div");
      eyeText.className = "eye-text";
      eyeText.textContent = "Eye Color";
      btn.appendChild(eyeText);
    }

    // Random tile that shows interests on hover.
    if (i === interestsIndex) {
      btn.classList.add("has-interests");

      const interests = document.createElement("div");
      interests.className = "interests";
      interests.innerHTML = `
        <div class="interests__title">These are my interests:</div>
        <ul class="interests__list">
          ${INTERESTS.map((x) => `<li>${x}</li>`).join("")}
        </ul>
      `;
      btn.appendChild(interests);
    }

    const label = document.createElement("div");
    label.className = "label";
    label.textContent = `#${String(i + 1).padStart(3, "0")}  ${color}`;

    btn.appendChild(label);
    frag.appendChild(btn);
  }

  palette.replaceChildren(frag);
}

buildPalette();
