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

function onGenerateClick() {
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
  const url = buildShareUrl(game);

  document.getElementById("result-link").value = url;
  const shareText = `בואו לשחק "${game.title || "מה הקשר"}" 🧩`;
  document.getElementById("whatsapp-btn").href = whatsappShareLink(shareText + "\n" + url);
  document.getElementById("preview-btn").href = url;
  resultBox.style.display = "block";
  resultBox.scrollIntoView({ behavior: "smooth", block: "center" });
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
}

document.addEventListener("DOMContentLoaded", initCreator);
