/* Player engine for "מה הקשר". Reads the game data either from the URL (a link
   someone created on create.html) or from DEMO_DATA (data.js) for the demo link. */

let GAME = null;

function storageKey() {
  return "meha_kesher_play_" + (GAME && GAME._id ? GAME._id : "unknown");
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { connections: {} };
}

let STATE = null;

function saveState() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(STATE));
  } catch (e) {}
}

/* Cheap stable id for a game so different links don't share saved progress. */
function hashId(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return String(h);
}

/* ---------- Bootstrap: decide home vs player, and load the right data ---------- */

function initApp() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const params = new URLSearchParams(hash);

  if (params.has("g")) {
    try {
      GAME = decodeGameData(params.get("g"));
      GAME._id = hashId(params.get("g"));
    } catch (e) {
      showLoadError("הקישור הזה לא תקין או פגום. 😕<br />בקשו מהשולח/ת קישור חדש, או צרו משחק משלכם.");
      return;
    }
  } else if (params.get("demo") === "1") {
    GAME = DEMO_DATA;
    GAME._id = "demo";
    const banner = document.getElementById("demo-banner");
    if (banner) banner.style.display = "block";
  } else {
    showLoadError('זה עמוד המשחק - אבל לא נשלח אליו שום משחק. 🤔<br />אם קיבלתם קישור למשחק, ודאו שהעתקתם אותו במלואו.<br />רוצים ליצור משחק חדש? <a href="create.html">לחצו כאן</a>.');
    return;
  }

  if (!GAME || !Array.isArray(GAME.boards) || GAME.boards.length === 0) {
    showLoadError("הקישור הזה לא תקין או פגום. 😕<br />בקשו מהשולח/ת קישור חדש, או צרו משחק משלכם.");
    return;
  }

  STATE = loadState();
  if (!STATE.connections) STATE.connections = {};

  renderHero();
  renderConnectionsList();
}

function showLoadError(message) {
  const view = document.getElementById("player-view");
  view.querySelector(".wrap").innerHTML = `
    <div class="empty-note">
      ${message}
      <div class="btn-row"><a class="action primary" href="index.html">חזרה לעמוד הבית</a></div>
    </div>`;
}

function renderHero() {
  document.getElementById("hero-title").textContent = GAME.title && GAME.title.trim() ? GAME.title : "מה הקשר";
  const noteEl = document.getElementById("hero-note");
  if (GAME.note && GAME.note.trim()) {
    noteEl.textContent = GAME.note;
    noteEl.style.display = "block";
  } else {
    noteEl.style.display = "none";
  }
}

/* =========================================================
   CONNECTIONS (מה הקשר)
   ========================================================= */

let currentBoardIndex = null;
let boardRuntime = null; // { order, selected, solvedGroups, triesLeft, clueUsed, solveHistory }

function getTries() {
  return GAME.tries || DEFAULT_TRIES;
}

function renderConnectionsList() {
  const container = document.getElementById("connections-list");
  const boards = GAME.boards || [];
  container.innerHTML = "";
  boards.forEach((board, idx) => {
    const st = STATE.connections[idx];
    const solvedCount = st ? st.solvedGroups.length : 0;
    let pillClass = "status-pill";
    let pillText = "טרם נפתר";
    if (solvedCount === 4) {
      pillClass += " solved";
      pillText = "נפתר! 🎉";
    } else if (st && st.triesLeft === 0) {
      pillClass += " failed";
      pillText = "נגמרו הנסיונות";
    } else if (solvedCount > 0) {
      pillText = solvedCount + "/4";
    }
    const div = document.createElement("div");
    div.className = "card card-list-item";
    div.innerHTML = `
      <div>
        <div class="title">לוח ${idx + 1}</div>
        <div class="sub">רמה: ${LEVEL_LABELS[board.level] || board.level}</div>
      </div>
      <div class="${pillClass}">${pillText}</div>
    `;
    div.addEventListener("click", () => openBoard(idx));
    container.appendChild(div);
  });
}

function getOrInitBoardState(idx) {
  if (!STATE.connections[idx]) {
    STATE.connections[idx] = {
      order: shuffle([0, 1, 2, 3].flatMap((g) => GAME.boards[idx].categories[g].words.map((w) => ({ word: w, group: g + 1 })))),
      solvedGroups: [],
      triesLeft: getTries(),
      clueUsed: false,
      solveHistory: [],
      guessHistory: [], // every submitted guess, each an array of 4 group numbers, in submission order
      justSolved: null, // group number solved by the most recent guess, so only that row plays the reveal animation
    };
    saveState();
  }
  return STATE.connections[idx];
}

function openBoard(idx) {
  currentBoardIndex = idx;
  boardRuntime = getOrInitBoardState(idx);
  boardRuntime.selected = [];
  boardRuntime.message = "";
  renderBoardView();
  document.getElementById("connections-list-view").style.display = "none";
  document.getElementById("connections-board-view").style.display = "block";
}

function closeBoard() {
  document.getElementById("connections-board-view").style.display = "none";
  document.getElementById("connections-list-view").style.display = "block";
  renderConnectionsList();
}

function renderBoardView() {
  const board = GAME.boards[currentBoardIndex];
  const st = boardRuntime;
  const view = document.getElementById("connections-board-view");

  const justSolved = st.justSolved;
  st.justSolved = null;
  const solvedRowsHtml = st.solveHistory
    .map((g) => {
      const cat = board.categories[g - 1];
      const revealCls = g === justSolved ? " reveal" : "";
      return `<div class="solved-row${revealCls} ${COLOR_KEYS[g]}">
        <div class="cat-title">${cat.title}</div>
        ${cat.words.map((w) => `<div class="word">${w}</div>`).join("")}
      </div>`;
    })
    .join("");

  const remainingTiles = st.order.filter((t) => !st.solvedGroups.includes(t.group));

  const finished = st.solvedGroups.length === 4 || st.triesLeft === 0;
  const clueGroup = getClueGroup(board, st);
  const clueDisabled = clueGroup !== null && st.solvedGroups.includes(clueGroup);

  let tilesHtml = "";
  if (!finished) {
    tilesHtml = `<div class="conn-grid">${remainingTiles
      .map((t) => {
        const isSelected = st.selected.includes(t.word);
        const cls = ["conn-tile"];
        if (isSelected) cls.push("selected");
        return `<div class="${cls.join(" ")}" data-word="${t.word}">${t.word}</div>`;
      })
      .join("")}</div>`;
  }

  let endHtml = "";
  if (finished) {
    const won = st.solvedGroups.length === 4;
    endHtml = `
      <div class="msg-banner">${won ? "כל הכבוד! פתרתם את הלוח! 🎉" : "נגמרו הנסיונות... הנה הפתרון:"}</div>
      ${!won ? renderUnsolvedReveal(board, st) : ""}
      <div class="btn-row">
        <button class="action primary" id="share-btn">שתפו תוצאה בוואטסאפ 💬</button>
      </div>
    `;
  }

  view.innerHTML = `
    <div class="board-head">
      <button class="back" id="back-btn">→ חזרה ללוחות</button>
      ${GAME.createdBy ? `<div class="credit">נכתב על ידי: ${GAME.createdBy}</div>` : ""}
      <div class="level">רמה: ${LEVEL_LABELS[board.level] || board.level}</div>
      ${!finished ? `<div class="tries">נסיונות שנותרו: ${st.triesLeft}</div>` : ""}
    </div>
    <div class="msg-banner" id="msg-banner">${st.message || ""}</div>
    ${solvedRowsHtml}
    ${tilesHtml}
    ${
      !finished
        ? `<div class="btn-row">
            <button class="action secondary" id="clue-btn" ${clueDisabled ? "disabled" : ""}>רמז 💡</button>
            <button class="action secondary" id="clear-btn">נקו בחירה</button>
            <button class="action primary" id="submit-btn" ${st.selected.length === 4 ? "" : "disabled"}>הגישו</button>
          </div>`
        : ""
    }
    ${endHtml}
  `;

  view.querySelector("#back-btn").addEventListener("click", closeBoard);

  if (!finished) {
    view.querySelectorAll(".conn-tile").forEach((el) => {
      el.addEventListener("click", () => toggleTile(el.dataset.word));
    });
    view.querySelector("#clue-btn").addEventListener("click", useClue);
    view.querySelector("#clear-btn").addEventListener("click", () => {
      st.selected = [];
      renderBoardView();
    });
    view.querySelector("#submit-btn").addEventListener("click", submitGuess);
  } else {
    view.querySelector("#share-btn").addEventListener("click", onShareClick);
  }
}

function renderUnsolvedReveal(board, st) {
  let html = "";
  for (let g = 1; g <= 4; g++) {
    if (!st.solvedGroups.includes(g)) {
      const cat = board.categories[g - 1];
      html += `<div class="solved-row ${COLOR_KEYS[g]}">
        <div class="cat-title">${cat.title}</div>
        ${cat.words.map((w) => `<div class="word">${w}</div>`).join("")}
      </div>`;
    }
  }
  return html;
}

function toggleTile(word) {
  const st = boardRuntime;
  const i = st.selected.indexOf(word);
  if (i >= 0) {
    st.selected.splice(i, 1);
  } else {
    if (st.selected.length >= 4) return;
    st.selected.push(word);
  }
  renderBoardView();
}

function getClueWords(board) {
  return Array.isArray(board.clue) && board.clue.length === 2 ? board.clue : board.categories[3].words.slice(0, 2);
}

/* Which group the clue's words belong to, so we know when to disable the clue button
   (once that category is solved, there's nothing left to hint). */
function getClueGroup(board, st) {
  const tile = st.order.find((t) => t.word === getClueWords(board)[0]);
  return tile ? tile.group : null;
}

function useClue() {
  const board = GAME.boards[currentBoardIndex];
  const st = boardRuntime;
  const clueGroup = getClueGroup(board, st);
  if (clueGroup !== null && st.solvedGroups.includes(clueGroup)) return;
  st.selected = getClueWords(board);
  st.clueUsed = true;
  st.message = "רמז: שתי המילים שנבחרו שייכות לאותה קטגוריה 💡";
  saveState();
  renderBoardView();
}

function submitGuess() {
  const board = GAME.boards[currentBoardIndex];
  const st = boardRuntime;
  if (st.selected.length !== 4) return;

  const guessGroups = st.selected.map((word) => st.order.find((t) => t.word === word).group);
  const counts = {};
  guessGroups.forEach((g) => {
    counts[g] = (counts[g] || 0) + 1;
  });
  const bestGroup = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  const bestCount = counts[bestGroup];

  st.guessHistory.push(guessGroups);

  if (bestCount === 4) {
    const g = parseInt(bestGroup, 10);
    st.solvedGroups.push(g);
    st.solveHistory.push(g);
    st.justSolved = g;
    st.selected = [];
    st.message = "מעולה! קטגוריה נפתרה 🎯";
  } else {
    st.triesLeft -= 1;
    if (bestCount === 3) {
      st.message = "כמעט! 3/4 באותה קטגוריה 👀";
    } else {
      st.message = "לא בדיוק... נסו שוב";
    }
    st.selected = [];
  }
  saveState();
  renderBoardView();
}

function buildConnectionsShareText(board, st) {
  const lines = [];
  const titlePrefix = GAME.title && GAME.title.trim() ? GAME.title : "מה הקשר";
  lines.push(`${titlePrefix} - לוח ${currentBoardIndex + 1} 🧩`);

  const emoji = { g1: "🟩", g2: "🟨", g3: "🟧", g4: "🟥" };
  (st.guessHistory || []).forEach((groups) => {
    lines.push(groups.map((g) => emoji[COLOR_KEYS[g]]).join(""));
  });

  const won = st.solvedGroups.length === 4;
  const mistakes = getTries() - st.triesLeft;
  const clueNote = st.clueUsed ? " ועם רמז" : "";
  if (won) {
    lines.push(mistakes === 0 ? `נפתר בלי טעויות${clueNote}! ✅` : `נפתר עם ${mistakes} טעויות${clueNote} ✅`);
  } else {
    lines.push(`לא נפתר הפעם - ${mistakes} טעויות${clueNote} 😅`);
  }
  return lines.join("\n");
}

async function onShareClick() {
  const board = GAME.boards[currentBoardIndex];
  const text = buildConnectionsShareText(board, boardRuntime);
  const result = await shareOrCopy(text);
  if (result === "copied") alert("הועתק! עכשיו אפשר להדביק בוואטסאפ 💬");
}

document.addEventListener("DOMContentLoaded", initApp);
