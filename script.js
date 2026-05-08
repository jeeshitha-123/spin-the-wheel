const REWARDS = [
  { label: "Pizza Time",   emoji: "🍕", color: "#ff3ea5" },
  { label: "Play Games",   emoji: "🎮", color: "#7c3aed" },
  { label: "Take a Nap",   emoji: "😴", color: "#06b6d4" },
  { label: "10 Pushups",   emoji: "💪", color: "#f59e0b" },
  { label: "Listen Music", emoji: "🎵", color: "#ec4899" },
  { label: "Study Time",   emoji: "📚", color: "#3b82f6" },
  { label: "Burger Break", emoji: "🍔", color: "#10b981" },
  { label: "Watch Memes",  emoji: "😂", color: "#a855f7" },
];

const SEGMENTS = REWARDS.length;
const SEG_ANGLE = 360 / SEGMENTS;

const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");
const resultEl = document.getElementById("result");
const resultEmoji = document.getElementById("resultEmoji");
const resultLabel = document.getElementById("resultLabel");
const historyList = document.getElementById("historyList");
const resetBtn = document.getElementById("resetBtn");

// Build conic-gradient background
const stops = REWARDS.map((r, i) => `${r.color} ${i * SEG_ANGLE}deg ${(i + 1) * SEG_ANGLE}deg`).join(", ");
wheel.style.background = `conic-gradient(${stops})`;

// Build labels
REWARDS.forEach((r, i) => {
  const angle = i * SEG_ANGLE + SEG_ANGLE / 2;
  const el = document.createElement("div");
  el.className = "segment-label";
  el.style.transform = `rotate(${angle}deg) translateX(15%)`;
  el.innerHTML = `<span style="font-size:1.4em">${r.emoji}</span> <span>${r.label}</span>`;
  wheel.appendChild(el);
});

let rotation = 0;
let spinning = false;
let history = [];

function playTone(freq, duration, type = "sine", volume = 0.1) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playWinSound() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.3, "triangle", 0.15), i * 120));
}

function launchConfetti() {
  const colors = ["#ff3ea5", "#7c3aed", "#06b6d4", "#f59e0b", "#ec4899", "#10b981"];
  for (let i = 0; i < 80; i++) {
    const p = document.createElement("div");
    p.className = "confetti";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = 2 + Math.random() * 2 + "s";
    p.style.animationDelay = Math.random() * 0.3 + "s";
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4500);
  }
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<li class="empty">No spins yet — give it a whirl!</li>';
    resetBtn.classList.add("hidden");
    return;
  }
  historyList.innerHTML = history.map(h => `<li>${h.emoji} ${h.label}</li>`).join("");
  resetBtn.classList.remove("hidden");
}

function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  spinBtn.textContent = "Spinning...";
  resultEl.classList.add("hidden");

  const winnerIdx = Math.floor(Math.random() * SEGMENTS);
  const targetWithin = 360 - (winnerIdx * SEG_ANGLE + SEG_ANGLE / 2);
  const fullSpins = 6 + Math.floor(Math.random() * 3);
  const currentMod = rotation % 360;
  const delta = fullSpins * 360 + ((targetWithin - currentMod + 360) % 360);
  rotation += delta;

  wheel.classList.add("spinning");
  wheel.style.transform = `rotate(${rotation}deg)`;

  // Tick sound
  let startTime = Date.now();
  const totalDur = 5000;
  function tick() {
    playTone(800, 0.04, "square", 0.05);
    const elapsed = Date.now() - startTime;
    if (elapsed < totalDur) {
      const rate = 60 + (elapsed / totalDur) * 200;
      setTimeout(tick, rate);
    }
  }
  tick();

  setTimeout(() => {
    const winner = REWARDS[winnerIdx];
    resultEmoji.textContent = winner.emoji;
    resultLabel.textContent = winner.label;
    resultEl.classList.remove("hidden");
    // restart pop animation
    resultEl.style.animation = "none";
    void resultEl.offsetWidth;
    resultEl.style.animation = "";

    history.unshift(winner);
    history = history.slice(0, 8);
    renderHistory();

    playWinSound();
    launchConfetti();

    spinning = false;
    spinBtn.disabled = false;
    spinBtn.textContent = "SPIN";
  }, totalDur);
}

spinBtn.addEventListener("click", spin);
resetBtn.addEventListener("click", () => {
  history = [];
  resultEl.classList.add("hidden");
  renderHistory();
});
