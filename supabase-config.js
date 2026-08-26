/* Fill these in after creating your Supabase project - see BACKEND_SETUP.md
   for exactly where to find them. Both values are safe to have in public
   code: the anon key only allows whatever the database's Row Level Security
   rules (set up by supabase_setup.sql) explicitly permit, nothing more. */

const SUPABASE_URL = "YOUR_SUPABASE_URL"; // looks like https://xxxxxxxx.supabase.co
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const supabaseClient =
  SUPABASE_URL.startsWith("http") && SUPABASE_ANON_KEY.length > 20 && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

/* True once the two values above have been filled in. Every backend-dependent
   feature (short links, saved boards, analytics) checks this first and falls
   back to the old link-only behavior when it's false, so the site never
   breaks just because the backend isn't set up yet. */
function backendReady() {
  return !!supabaseClient;
}

/* Fire-and-forget page view logging. Never blocks the page, never throws. */
async function logVisit(page, gameId) {
  if (!backendReady()) return;
  try {
    await supabaseClient.from("visits").insert({ page, game_id: gameId || null });
  } catch (e) {
    /* analytics failing silently is fine - never let it affect the actual site */
  }
}

/* Fire-and-forget play-result logging, used once per finished board. */
async function logPlayResult(gameId, boardIndex, result) {
  if (!backendReady() || !gameId) return;
  try {
    await supabaseClient.from("plays").insert({
      game_id: gameId,
      board_index: boardIndex,
      mistakes: result.mistakes,
      used_clue: result.usedClue,
      solved: result.solved,
    });
  } catch (e) {}
}
