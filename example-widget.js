/* Small interactive "try it yourself" board shown in the creator instructions.
   Not a real game (no tries, no state) - just lets people click tiles and feel
   how the mechanic works before they build their own board. */

function initExampleWidget() {
  const container = document.getElementById("example-widget");
  if (!container || typeof DEMO_DATA === "undefined") return;

  const board = DEMO_DATA.boards[1]; // "ראשי מפלגת העבודה" board - matches the clue example text above it
  let order = shuffle([0, 1, 2, 3].flatMap((g) => board.categories[g].words.map((w) => ({ word: w, group: g + 1 }))));
  let solvedGroups = [];
  let selected = [];
  let message = "";
  let justSolved = null;

  function render() {
    const remaining = order.filter((t) => !solvedGroups.includes(t.group));
    const done = solvedGroups.length === 4;

    const revealGroup = justSolved;
    justSolved = null;
    const solvedHtml = solvedGroups
      .map((g) => {
        const cat = board.categories[g - 1];
        const revealCls = g === revealGroup ? " reveal" : "";
        return `<div class="solved-row${revealCls} ${COLOR_KEYS[g]}">
          <div class="cat-title">${cat.title}</div>
          ${cat.words.map((w) => `<div class="word">${w}</div>`).join("")}
        </div>`;
      })
      .join("");

    const tilesHtml = done
      ? ""
      : `<div class="ew-grid">${remaining
          .map((t) => {
            const cls = ["ew-tile"];
            if (selected.includes(t.word)) cls.push("selected");
            return `<div class="${cls.join(" ")}" data-word="${t.word}">${t.word}</div>`;
          })
          .join("")}</div>`;

    container.innerHTML = `
      ${solvedHtml}
      <div class="ew-msg">${message}</div>
      ${tilesHtml}
      ${
        done
          ? `<div class="ew-done">🎉 בדיוק ככה זה עובד! עכשיו בואו נבנה לוח משלכם.</div>`
          : `<div class="ew-buttons">
              <button type="button" class="ew-check" ${selected.length === 4 ? "" : "disabled"}>בדקו</button>
              <button type="button" class="ew-reset">איפוס</button>
            </div>`
      }
    `;

    if (!done) {
      container.querySelectorAll(".ew-tile").forEach((el) => {
        el.addEventListener("click", () => {
          const word = el.dataset.word;
          const i = selected.indexOf(word);
          if (i >= 0) selected.splice(i, 1);
          else if (selected.length < 4) selected.push(word);
          render();
        });
      });
      container.querySelector(".ew-check").addEventListener("click", checkSelection);
      container.querySelector(".ew-reset").addEventListener("click", () => {
        order = shuffle(order);
        solvedGroups = [];
        selected = [];
        justSolved = null;
        message = "";
        render();
      });
    }
  }

  function checkSelection() {
    const counts = {};
    selected.forEach((word) => {
      const tile = order.find((t) => t.word === word);
      counts[tile.group] = (counts[tile.group] || 0) + 1;
    });
    const bestGroup = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
    const bestCount = counts[bestGroup];

    if (bestCount === 4) {
      const g = parseInt(bestGroup, 10);
      solvedGroups.push(g);
      justSolved = g;
      selected = [];
      message = "מעולה! קטגוריה נפתרה 🎯";
      render();
    } else {
      message = bestCount === 3 ? "כמעט! 3/4 באותה קטגוריה 👀" : "לא בדיוק... נסו שוב";
      const tiles = [...container.querySelectorAll(".ew-tile.selected")];
      tiles.forEach((el) => el.classList.add("shake"));
      selected = [];
      setTimeout(render, 350);
    }
  }

  render();
}

document.addEventListener("DOMContentLoaded", initExampleWidget);
