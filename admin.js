/* Admin dashboard: sign in with the one admin account created in Supabase,
   then see visit counts, every created game, and per-board play stats. */

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function showLogin() {
  el("login-view").style.display = "block";
  el("dashboard-view").style.display = "none";
}

function showDashboard() {
  el("login-view").style.display = "none";
  el("dashboard-view").style.display = "block";
  loadDashboard();
}

async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) showDashboard();
  else showLogin();
}

async function onLoginSubmit(e) {
  e.preventDefault();
  const email = el("login-email").value.trim();
  const password = el("login-password").value;
  const errorBox = el("login-error");
  errorBox.style.display = "none";

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errorBox.textContent = "התחברות נכשלה: " + error.message;
    errorBox.style.display = "block";
    return;
  }
  showDashboard();
}

async function onLogoutClick() {
  await supabaseClient.auth.signOut();
  showLogin();
}

async function loadDashboard() {
  const [gamesRes, visitsRes, playsRes] = await Promise.all([
    supabaseClient.from("games").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("visits").select("page"),
    supabaseClient.from("plays").select("*"),
  ]);

  renderVisitSummary(visitsRes.data || []);
  renderGamesList(gamesRes.data || [], playsRes.data || []);
}

function renderVisitSummary(visits) {
  const counts = { home: 0, create: 0, play: 0 };
  visits.forEach((v) => {
    counts[v.page] = (counts[v.page] || 0) + 1;
  });
  el("visit-summary").innerHTML = `
    <div class="stat-box"><div class="stat-num">${counts.home}</div><div class="stat-label">כניסות לעמוד הבית</div></div>
    <div class="stat-box"><div class="stat-num">${counts.create}</div><div class="stat-label">כניסות ליצירת משחק</div></div>
    <div class="stat-box"><div class="stat-num">${counts.play}</div><div class="stat-label">כניסות למשחקים</div></div>
  `;
}

function renderGamesList(games, plays) {
  const container = el("games-list");
  if (games.length === 0) {
    container.innerHTML = '<div class="empty-note">עדיין לא נוצרו משחקים.</div>';
    return;
  }
  container.innerHTML = games
    .map((g) => {
      const gamePlays = plays.filter((p) => p.game_id === g.id);
      const boardsHtml = (g.boards || []).map((board, bi) => renderBoardStats(board, gamePlays.filter((p) => p.board_index === bi), bi)).join("");
      const date = new Date(g.created_at).toLocaleDateString("he-IL");
      return `<div class="admin-game-card">
        <div class="admin-game-head">
          <div class="admin-game-title">${escapeHtml(g.title || "(ללא כותרת)")}</div>
          <div class="admin-game-meta">נוצר על ידי: ${escapeHtml(g.created_by || "לא צוין")} · ${date} · קוד: <code>${escapeHtml(g.short_code)}</code></div>
        </div>
        ${boardsHtml}
      </div>`;
    })
    .join("");
}

function renderBoardStats(board, boardPlays, bi) {
  const catsHtml = (board.categories || [])
    .map((c) => `<div class="stat-cat">${escapeHtml(c.title)}: ${(c.words || []).map(escapeHtml).join(", ")}</div>`)
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

document.addEventListener("DOMContentLoaded", () => {
  if (!backendReady()) {
    document.getElementById("backend-missing").style.display = "block";
    return;
  }
  checkSession();
  document.getElementById("login-form").addEventListener("submit", onLoginSubmit);
  document.getElementById("logout-btn").addEventListener("click", onLogoutClick);
});
