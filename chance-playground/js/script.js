const STORAGE_KEY = "coin_toss_progress_v1";

const state = {
  guess: null,        // "H" or "T"
  heads: 0,
  tails: 0,
  total: 0,
  correct: 0,
  isFlipping: false,
};

const el = {
  coin: document.getElementById("coin"),
  coinFace: document.getElementById("coinFace"),
  message: document.getElementById("message"),
  currentGuess: document.getElementById("currentGuess"),

  headsCount: document.getElementById("headsCount"),
  tailsCount: document.getElementById("tailsCount"),
  totalFlips: document.getElementById("totalFlips"),
  correctGuesses: document.getElementById("correctGuesses"),
  headsBar: document.getElementById("headsBar"),
  tailsBar: document.getElementById("tailsBar"),

  guessHeads: document.getElementById("guessHeads"),
  guessTails: document.getElementById("guessTails"),

  flip1: document.getElementById("flip1"),
  flip10: document.getElementById("flip10"),
  flip50: document.getElementById("flip50"),
  flip100: document.getElementById("flip100"),

  reset: document.getElementById("reset"),
};

function saveProgress() {
  const data = {
    heads: state.heads,
    tails: state.tails,
    total: state.total,
    correct: state.correct,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    state.heads = Number(data.heads) || 0;
    state.tails = Number(data.tails) || 0;
    state.total = Number(data.total) || 0;
    state.correct = Number(data.correct) || 0;
  } catch {
    // If storage is corrupted, ignore it
  }
}

function setGuess(g) {
  state.guess = g;
  const text = g === "H" ? "Heads 🙂" : "Tails 😎";
  el.currentGuess.textContent = `You picked: ${text}`;
  el.message.textContent = "Nice! Now flip the coin.";
}

function randomFlip() {
  // 50/50
  return Math.random() < 0.5 ? "H" : "T";
}

function faceFor(result) {
  return result === "H" ? "🙂" : "😎";
}

function updateUI() {
  el.headsCount.textContent = String(state.heads);
  el.tailsCount.textContent = String(state.tails);
  el.totalFlips.textContent = String(state.total);
  el.correctGuesses.textContent = String(state.correct);

  // Bar width based on proportions (avoid divide-by-zero)
  const total = Math.max(state.total, 1);
  const headsPct = (state.heads / total) * 100;
  const tailsPct = (state.tails / total) * 100;

  el.headsBar.style.width = `${headsPct.toFixed(1)}%`;
  el.tailsBar.style.width = `${tailsPct.toFixed(1)}%`;

  // Change bar color depending on which is bigger (still simple)
  if (state.heads >= state.tails) {
    el.headsBar.style.background = "rgba(124, 221, 124, 0.75)";
    el.tailsBar.style.background = "rgba(255, 255, 255, 0.35)";
  } else {
    el.headsBar.style.background = "rgba(255, 255, 255, 0.35)";
    el.tailsBar.style.background = "rgba(124, 221, 124, 0.75)";
  }
}

function setButtonsEnabled(enabled) {
  el.flip1.disabled = !enabled;
  el.flip10.disabled = !enabled;
  el.flip50.disabled = !enabled;
  el.flip100.disabled = !enabled;
  el.guessHeads.disabled = !enabled;
  el.guessTails.disabled = !enabled;

  // Visual hint for disabled buttons
  const btns = [el.flip1, el.flip10, el.flip50, el.flip100, el.guessHeads, el.guessTails];
  for (const b of btns) {
    b.style.opacity = enabled ? "1" : "0.6";
    b.style.cursor = enabled ? "pointer" : "not-allowed";
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function flipMany(times) {
  if (state.isFlipping) return;

  if (!state.guess) {
    el.message.textContent = "Pick Heads or Tails first 🙂";
    return;
  }

  state.isFlipping = true;
  setButtonsEnabled(false);

  let localHeads = 0;
  let localTails = 0;
  let localCorrect = 0;

  // Animate a little for short runs; for large runs, keep it fast
  const animate = times <= 20;

  for (let i = 0; i < times; i++) {
    const result = randomFlip();

    if (result === "H") localHeads++;
    else localTails++;

    if (result === state.guess) localCorrect++;

    if (animate) {
      el.coinFace.textContent = faceFor(result);
      el.coin.style.transform = "rotateY(180deg)";
      await sleep(80);
      el.coin.style.transform = "rotateY(0deg)";
      await sleep(60);
    }
  }

  state.heads += localHeads;
  state.tails += localTails;
  state.correct += localCorrect;
  state.total += times;

  saveProgress();
  updateUI();

  // Friendly message
  const best = localHeads === localTails ? "It was a tie!" : (localHeads > localTails ? "Heads showed up more!" : "Tails showed up more!");
  el.message.textContent = `You flipped ${times} time(s). ${best} You guessed right ${localCorrect} time(s).`;

  state.isFlipping = false;
  setButtonsEnabled(true);
}

function resetProgress() {
  state.guess = null;
  state.heads = 0;
  state.tails = 0;
  state.total = 0;
  state.correct = 0;

  localStorage.removeItem(STORAGE_KEY);

  el.currentGuess.textContent = "No guess yet";
  el.coinFace.textContent = "🙂";
  el.message.textContent = "Make a guess, then flip!";
  updateUI();
}

// Events
el.guessHeads.addEventListener("click", () => setGuess("H"));
el.guessTails.addEventListener("click", () => setGuess("T"));

el.flip1.addEventListener("click", () => flipMany(1));
el.flip10.addEventListener("click", () => flipMany(10));
el.flip50.addEventListener("click", () => flipMany(50));
el.flip100.addEventListener("click", () => flipMany(100));

el.reset.addEventListener("click", resetProgress);

// Init
loadProgress();
updateUI();
