/* Shared helpers used by both the player (app.js) and creator (create.js) pages. */

const LEVEL_LABELS = { easy: "קל", intermediate: "בינוני", hard: "קשה" };
const COLOR_KEYS = { 1: "g1", 2: "g2", 3: "g3", 4: "g4" };
const DEFAULT_TRIES = 5;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Encode/decode a JS object into a URL-safe base64 string (UTF-8 safe, so Hebrew works). */
function encodeGameData(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeGameData(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function buildShareUrl(gameObj) {
  const encoded = encodeGameData(gameObj);
  const url = new URL("play.html", window.location.href);
  url.hash = "g=" + encoded;
  return url.toString();
}

async function shareOrCopy(text, url) {
  const full = url ? text + "\n" + url : text;
  if (navigator.share) {
    try {
      await navigator.share(url ? { text, url } : { text });
      return true;
    } catch (e) {
      /* user cancelled or share failed, fall back to copy */
    }
  }
  try {
    await navigator.clipboard.writeText(full);
    return "copied";
  } catch (e) {
    prompt("העתיקו את הטקסט ושלחו בוואטסאפ:", full);
    return "prompted";
  }
}

function whatsappShareLink(text) {
  return "https://wa.me/?text=" + encodeURIComponent(text);
}
