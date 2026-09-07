/* Creator engine for "מה הקשר". Builds a game in memory (auto-saved as a draft
   to localStorage), then encodes it into a shareable link on create.html. */

const DRAFT_KEY = "meha_kesher_creator_draft";
const MAX_BOARDS = 10;
const LEVEL_OPTIONS = [
  ["easy", "קל"],
  ["intermediate", "בינוני"],
  ["hard", "קשה"],
];

/* Placeholder inspiration shown (greyed out) in each category slot, so an empty
   board still hints at the kind of thing that goes there. Purely cosmetic. */
const CATEGORY_PLACEHOLDERS = [
  { title: "פירות", words: ["תפוח", "בננה", "אגס", "ענב"] },
  { title: "ערי בירה באסיה", words: ["טוקיו", "בייג'ינג", "סאול", "בנגקוק"] },
  { title: "רכסי הרים", words: ["האלפים", "ההימלאיה", "האנדים", "הרוקי"] },
  { title: "מותגי נעלי הליכה", words: ["מרל", "סלומון", "קיין", "הוקה"] },
];

/* The order categories are entered in IS their difficulty color - no ranking needed. */
const CATEGORY_COLOR_LABELS = [
  { emoji: "🟩", label: "קל" },
  { emoji: "🟨", label: "בינוני" },
  { emoji: "🟧", label: "קשה" },
  { emoji: "🟥", label: "הכי קשה" },
];

function makeEmptyCategory() {
  return { title: "", words: ["", "", "", ""] };
}

function makeEmptyBoard() {
  return { level: "", collapsed: false, categories: [0, 1, 2, 3].map(makeEmptyCategory), clue: [] };
}

function makeEmptyDraft() {
  return { title: "", note: "", createdBy: "", boards: [makeEmptyBoard()] };
}

let draft = null;

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {}
}

function escapeAttr(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- Rendering ---------- */

function renderMetaFields() {
  document.getElementById("game-title").value = draft.title || "";
  document.getElementById("game-note").value = draft.note || "";
  document.getElementById("game-createdby").value = draft.createdBy || "";
}

function renderBoardCard(boardIndex) {
  const board = draft.boards[boardIndex];
  const collapsedClass = board.collapsed ? " collapsed" : "";

  const catsHtml = board.categories
    .map((cat, c) => {
      const example = CATEGORY_PLACEHOLDERS[c % CATEGORY_PLACEHOLDERS.length];
      const colorLabel = CATEGORY_COLOR_LABELS[c];
      const wordsHtml = cat.words
        .map((w, wi) => {
          const isClue = board.clue.some((ref) => ref.cat === c && ref.word === wi);
          return `<div class="word-row">
            <input type="text" class="word-input" data-board="${boardIndex}" data-cat="${c}" data-word="${wi}" value="${escapeAttr(w)}" placeholder="${escapeAttr(example.words[wi])}" />
            <label class="clue-check"><input type="checkbox" class="clue-checkbox" data-board="${boardIndex}" data-cat="${c}" data-word="${wi}" ${isClue ? "checked" : ""} /> רמז</label>
          </div>`;
        })
        .join("");
      return `<div class="category-block">
        <div class="cat-head">
          <span class="cat-color-badge">${colorLabel.emoji} ${colorLabel.label}</span>
          <input type="text" class="cat-title-input" data-board="${boardIndex}" data-cat="${c}" value="${escapeAttr(cat.title)}" placeholder="לדוגמה: ${escapeAttr(example.title)}" />
        </div>
        ${wordsHtml}
      </div>`;
    })
    .join("");

  const levelOptions = LEVEL_OPTIONS.map(
    ([v, l]) => `<option value="${v}" ${board.level === v ? "selected" : ""}>${l}</option>`
  ).join("");

  return `<div class="board-card${collapsedClass}" data-board-card="${boardIndex}">
    <div class="board-card-head" data-toggle="${boardIndex}">
      <div class="title">לוח ${boardIndex + 1}</div>
      <div class="actions">
        <button type="button" class="remove-btn" data-remove="${boardIndex}" title="מחיקת לוח">🗑</button>
        <span class="chevron">▾</span>
      </div>
    </div>
    <div class="board-card-body">
      <div class="field">
        <label>רמת קושי כללית ללוח</label>
        <select class="level-select" data-board="${boardIndex}">
          <option value="" ${!board.level ? "selected" : ""}>בחרו רמה</option>
          ${levelOptions}
        </select>
      </div>
      <div class="clue-hint">בחרו 2 מילים לרמז (סמנו "רמז" ליד המילה) - מומלץ מהקטגוריה הקשה ביותר. סומנו: <span data-clue-count="${boardIndex}">${board.clue.length}</span>/2</div>
      ${catsHtml}
    </div>
  </div>`;
}

function renderBoards() {
  const container = document.getElementById("boards-container");
  container.innerHTML = draft.boards.map((_, i) => renderBoardCard(i)).join("");
  attachBoardListeners();
  updateBoardsCount();
}

function updateBoardsCount() {
  document.getElementById("boards-count").textContent = `${draft.boards.length}/${MAX_BOARDS} לוחות`;
  document.getElementById("add-board-btn").disabled = draft.boards.length >= MAX_BOARDS;
}

function attachBoardListeners() {
  const container = document.getElementById("boards-container");

  container.querySelectorAll(".board-card-head").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.target.closest(".remove-btn")) return;
      const idx = parseInt(el.dataset.toggle, 10);
      draft.boards[idx].collapsed = !draft.boards[idx].collapsed;
      el.closest(".board-card").classList.toggle("collapsed");
      saveDraft();
    });
  });

  container.querySelectorAll(".remove-btn").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.remove, 10);
      if (!confirm(`למחוק את לוח ${idx + 1}?`)) return;
      draft.boards.splice(idx, 1);
      saveDraft();
      renderBoards();
    });
  });

  container.querySelectorAll(".level-select").forEach((el) => {
    el.addEventListener("change", () => {
      draft.boards[parseInt(el.dataset.board, 10)].level = el.value;
      saveDraft();
    });
  });

  container.querySelectorAll(".cat-title-input").forEach((el) => {
    el.addEventListener("input", () => {
      draft.boards[parseInt(el.dataset.board, 10)].categories[parseInt(el.dataset.cat, 10)].title = el.value;
      saveDraft();
    });
  });

  container.querySelectorAll(".word-input").forEach((el) => {
    el.addEventListener("input", () => {
      const b = parseInt(el.dataset.board, 10);
      const c = parseInt(el.dataset.cat, 10);
      const w = parseInt(el.dataset.word, 10);
      draft.boards[b].categories[c].words[w] = el.value;
      saveDraft();
    });
  });

  container.querySelectorAll(".clue-checkbox").forEach((el) => {
    el.addEventListener("change", () => {
      const b = parseInt(el.dataset.board, 10);
      const c = parseInt(el.dataset.cat, 10);
      const w = parseInt(el.dataset.word, 10);
      const board = draft.boards[b];
      if (el.checked) {
        if (board.clue.length >= 2) {
          el.checked = false;
          alert('אפשר לסמן עד 2 מילים לרמז. בטלו סימון של מילה אחרת קודם.');
          return;
        }
        board.clue.push({ cat: c, word: w });
      } else {
        board.clue = board.clue.filter((ref) => !(ref.cat === c && ref.word === w));
      }
      const countEl = container.querySelector(`[data-clue-count="${b}"]`);
      if (countEl) countEl.textContent = board.clue.length;
      saveDraft();
    });
  });
}

/* ---------- Validation + generation ---------- */

function validateDraft() {
  const errors = [];
  if (draft.boards.length === 0) {
    errors.push("הוסיפו לפחות לוח אחד.");
    return errors;
  }

  draft.boards.forEach((board, bi) => {
    const label = `לוח ${bi + 1}`;
    if (!board.level) errors.push(`${label}: בחרו רמת קושי כללית.`);

    const allWords = [];
    let missingText = false;
    board.categories.forEach((cat) => {
      if (!cat.title.trim()) missingText = true;
      cat.words.forEach((w) => {
        if (!w.trim()) missingText = true;
        allWords.push(w.trim());
      });
    });
    if (missingText) errors.push(`${label}: מלאו שם לכל קטגוריה וארבע מילים בכל אחת.`);

    const lower = allWords.filter(Boolean).map((w) => w.toLowerCase());
    if (new Set(lower).size !== lower.length && lower.length === 16) {
      errors.push(`${label}: יש מילים שחוזרות על עצמן - כל 16 המילים בלוח צריכות להיות שונות.`);
    }

    if (board.clue.length !== 2) errors.push(`${label}: בחרו בדיוק 2 מילים לרמז.`);
  });

  return errors;
}

function buildGameFromDraft() {
  return {
    title: draft.title.trim(),
    note: draft.note.trim(),
    createdBy: draft.createdBy.trim(),
    tries: DEFAULT_TRIES,
    boards: draft.boards.map((board) => {
      const categories = board.categories.map((cat) => ({ title: cat.title.trim(), words: cat.words.map((w) => w.trim()) }));
      const clue = board.clue.map((ref) => board.categories[ref.cat].words[ref.word].trim());
      return { level: board.level, categories, clue };
    }),
  };
}

function getOrCreateCreatorKey() {
  let key = localStorage.getItem("meha_kesher_creator_key");
  if (!key) {
    key = generateShortCode(16);
    localStorage.setItem("meha_kesher_creator_key", key);
  }
  return key;
}

/* Saves the game to Supabase and returns a short play.html?id=... link.
   Returns null (never throws) if the backend isn't configured or the save
   fails, so the caller can fall back to the old self-contained long link. */
async function saveGameToBackend(game) {
  const creatorKey = getOrCreateCreatorKey();
  for (let attempt = 0; attempt < 5; attempt++) {
    const shortCode = generateShortCode();
    const { error } = await supabaseClient.from("games").insert({
      short_code: shortCode,
      title: game.title,
      note: game.note,
      created_by: game.createdBy,
      creator_key: creatorKey,
      tries: game.tries,
      boards: game.boards,
    });
    if (!error) return buildShortShareUrl(shortCode);
    if (error.code !== "23505") {
      console.error("Supabase save failed:", error);
      return null;
    }
    // 23505 = unique_violation on short_code - vanishingly rare, just retry with a new code
  }
  return null;
}

async function onGenerateClick() {
  const errors = validateDraft();
  const errorBox = document.getElementById("error-box");
  const resultBox = document.getElementById("result-box");

  if (errors.length) {
    errorBox.style.display = "block";
    errorBox.textContent = errors.join("\n");
    resultBox.style.display = "none";
    errorBox.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  errorBox.style.display = "none";
  const game = buildGameFromDraft();

  const genBtn = document.getElementById("generate-btn");
  genBtn.disabled = true;
  genBtn.textContent = "רגע, יוצרים קישור...";

  let url = null;
  if (backendReady()) {
    url = await saveGameToBackend(game);
  }
  if (!url) {
    url = buildShareUrl(game); // fallback: everything baked into the link itself, no backend needed
  }

  genBtn.disabled = false;
  genBtn.textContent = "✅ צרו קישור לשיתוף";

  document.getElementById("result-link").value = url;
  const shareText = `בואו לשחק "${game.title || "מה הקשר"}" 🧩`;
  document.getElementById("whatsapp-btn").href = whatsappShareLink(shareText + "\n" + url);
  document.getElementById("preview-btn").href = url;
  resultBox.style.display = "block";
  resultBox.scrollIntoView({ behavior: "smooth", block: "center" });

  loadMyGames();
}

async function onCopyClick() {
  const input = document.getElementById("result-link");
  input.select();
  try {
    await navigator.clipboard.writeText(input.value);
  } catch (e) {
    document.execCommand("copy");
  }
  const btn = document.getElementById("copy-link-btn");
  const original = btn.textContent;
  btn.textContent = "הועתק! ✓";
  setTimeout(() => (btn.textContent = original), 1500);
}

/* ---------- Creator's own past games (backend-saved only) ---------- */

async function loadMyGames() {
  if (!backendReady()) return;
  const section = document.getElementById("my-games-section");
  const container = document.getElementById("my-games-list");
  if (!section || !container) return;

  const creatorKey = getOrCreateCreatorKey();
  const { data, error } = await supabaseClient.rpc("get_my_games", { p_creator_key: creatorKey });
  if (error || !data || data.length === 0) {
    section.style.display = "none";
    return;
  }

  container.innerHTML = data
    .map((g) => {
      const url = buildShortShareUrl(g.short_code);
      const date = new Date(g.created_at).toLocaleDateString("he-IL");
      return `<div class="my-game-card">
        <div class="card card-list-item" style="cursor:default;margin-bottom:0">
          <div>
            <div class="title">${escapeAttr(g.title || "(ללא כותרת)")}</div>
            <div class="sub">${date}</div>
          </div>
          <div style="display:flex;gap:8px;flex:0 0 auto">
            <button type="button" class="action secondary my-game-stats-btn" data-game-id="${g.id}" style="padding:8px 14px">תוצאות</button>
            <a class="action secondary" style="padding:8px 14px" href="${url}" target="_blank" rel="noopener">פתיחה</a>
          </div>
        </div>
        <div class="my-game-stats" data-stats-for="${g.id}" style="display:none"></div>
      </div>`;
    })
    .join("");
  section.style.display = "block";

  container.querySelectorAll(".my-game-stats-btn").forEach((btn) => {
    btn.addEventListener("click", () => onMyGameStatsClick(btn));
  });
}

async function onMyGameStatsClick(btn) {
  const gameId = btn.dataset.gameId;
  const panel = document.querySelector(`[data-stats-for="${gameId}"]`);
  if (!panel) return;

  if (panel.dataset.loaded === "1") {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
    return;
  }

  btn.disabled = true;
  btn.textContent = "טוען...";
  const creatorKey = getOrCreateCreatorKey();
  const { data, error } = await supabaseClient.rpc("get_my_game_stats", { p_creator_key: creatorKey, p_game_id: gameId });
  btn.disabled = false;
  btn.textContent = "תוצאות";

  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) {
    panel.innerHTML = '<div class="stat-note">לא הצלחנו לטעון תוצאות כרגע.</div>';
  } else {
    const boards = row.boards || [];
    const plays = row.plays || [];
    panel.innerHTML = boards.map((board, bi) => renderMyBoardStats(board, plays.filter((p) => p.board_index === bi), bi)).join("");
  }
  panel.dataset.loaded = "1";
  panel.style.display = "block";
}

function renderMyBoardStats(board, boardPlays, bi) {
  const catsHtml = (board.categories || [])
    .map((c) => `<div class="stat-cat">${escapeAttr(c.title)}: ${(c.words || []).map(escapeAttr).join(", ")}</div>`)
    .join("");

  const total = boardPlays.length;
  if (total === 0) {
    return `<div class="stat-board">
      <div class="stat-board-title">לוח ${bi + 1}</div>
      ${catsHtml}
      <div class="stat-note">אף אחד עדיין לא שיחק בלוח הזה.</div>
    </div>`;
  }

  const solved = boardPlays.filter((p) => p.solved);
  const notSolved = total - solved.length;
  const withClue = solved.filter((p) => p.used_clue).length;

  const byMistakes = {};
  solved.forEach((p) => {
    byMistakes[p.mistakes] = (byMistakes[p.mistakes] || 0) + 1;
  });

  const pct = (n) => Math.round((n / total) * 100);
  let rows = "";
  Object.keys(byMistakes)
    .sort((a, b) => a - b)
    .forEach((m) => {
      const n = byMistakes[m];
      const label = m === "0" ? "ניחוש ראשון" : `אחרי ${m} טעויות`;
      rows += `<div class="stat-bar-row"><span>${label}</span><div class="stat-bar"><div class="stat-bar-fill" style="width:${pct(n)}%"></div></div><span>${pct(n)}% (${n})</span></div>`;
    });
  rows += `<div class="stat-bar-row"><span>לא פתרו</span><div class="stat-bar"><div class="stat-bar-fill fail" style="width:${pct(notSolved)}%"></div></div><span>${pct(notSolved)}% (${notSolved})</span></div>`;

  return `<div class="stat-board">
    <div class="stat-board-title">לוח ${bi + 1} - ${total} שיחקו · ${withClue} השתמשו ברמז</div>
    ${catsHtml}
    ${rows}
  </div>`;
}

/* ---------- Init ---------- */

function initCreator() {
  const loaded = loadDraft();
  const hadDraft = !!(loaded && (loaded.title || loaded.note || loaded.createdBy || (loaded.boards && loaded.boards.length > 1) || (loaded.boards && loaded.boards[0] && loaded.boards[0].categories[0].title)));
  draft = loaded || makeEmptyDraft();
  if (!draft.boards || draft.boards.length === 0) draft.boards = [makeEmptyBoard()];

  if (hadDraft) document.getElementById("draft-restored-note").style.display = "block";

  renderMetaFields();
  renderBoards();

  document.getElementById("game-title").addEventListener("input", (e) => {
    draft.title = e.target.value;
    saveDraft();
  });
  document.getElementById("game-note").addEventListener("input", (e) => {
    draft.note = e.target.value;
    saveDraft();
  });
  document.getElementById("game-createdby").addEventListener("input", (e) => {
    draft.createdBy = e.target.value;
    saveDraft();
  });

  document.getElementById("add-board-btn").addEventListener("click", () => {
    if (draft.boards.length >= MAX_BOARDS) return;
    draft.boards.push(makeEmptyBoard());
    saveDraft();
    renderBoards();
  });

  document.getElementById("generate-btn").addEventListener("click", onGenerateClick);
  document.getElementById("copy-link-btn").addEventListener("click", onCopyClick);

  logVisit("create");
  loadMyGames();
}

document.addEventListener("DOMContentLoaded", initCreator);
