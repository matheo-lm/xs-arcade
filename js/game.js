const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("gameOver");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const W = canvas.width;
const H = canvas.height;
const TOP_LINE = 96;

const FRUITS = [
  {
    name: "Cherry",
    label: "CH",
    r: 18,
    points: 10,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f352.png",
    fallbackA: "#ff8a9a",
    fallbackB: "#ff2e50",
    drawScale: 1.02
  },
  {
    name: "Lemon",
    label: "LE",
    r: 24,
    points: 20,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f34b.png",
    fallbackA: "#fff08a",
    fallbackB: "#ffc738",
    drawScale: 1
  },
  {
    name: "Orange",
    label: "OR",
    r: 30,
    points: 40,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f34a.png",
    fallbackA: "#ffd390",
    fallbackB: "#ff922f",
    drawScale: 1
  },
  {
    name: "Apple",
    label: "AP",
    r: 38,
    points: 80,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f34e.png",
    fallbackA: "#ffb39f",
    fallbackB: "#ff3f3f",
    drawScale: 1
  },
  {
    name: "Pear",
    label: "PE",
    r: 46,
    points: 160,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f350.png",
    fallbackA: "#e5ffa5",
    fallbackB: "#90db44",
    drawScale: 1
  },
  {
    name: "Peach",
    label: "PC",
    r: 54,
    points: 320,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f351.png",
    fallbackA: "#ffd9bf",
    fallbackB: "#ff9e6a",
    drawScale: 1
  },
  {
    name: "Melon",
    label: "ML",
    r: 70,
    points: 640,
    spriteUrl: null,
    fallbackA: "#f4bf79",
    fallbackB: "#dd8b43",
    special: "cantaloupe",
    drawScale: 1
  },
  {
    name: "Watermelon",
    label: "WM",
    r: 88,
    points: 1280,
    spriteUrl: null,
    fallbackA: "#6acb57",
    fallbackB: "#2a8f43",
    special: "watermelon",
    drawScale: 1
  }
];

const GRAVITY = 0.23;
const AIR = 0.996;
const BOUNCE = 0.16;
const REST_SPEED = 0.06;
const COOLDOWN = 320;
const OVERFLOW_LIMIT = 42;
const KEY_STEP = 26;
const WALL_MARGIN = 3;

let fruits = [];
let effects = [];
let score = 0;
let spawnX = W / 2;
let nextType = 0;
let lastDropTime = 0;
let gameOver = false;
let overflowFrames = 0;

function loadSprite(url) {
  if (!url) return null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  return img;
}

for (const fruit of FRUITS) {
  fruit.sprite = loadSprite(fruit.spriteUrl);
}

function randType() {
  return Math.floor(Math.random() * 3);
}

function resetGame() {
  fruits = [];
  effects = [];
  score = 0;
  spawnX = W / 2;
  nextType = randType();
  lastDropTime = 0;
  gameOver = false;
  overflowFrames = 0;
  gameOverEl.classList.remove("show");
  updateScore();
}

function updateScore() {
  scoreEl.textContent = `Score: ${score}`;
}

function dropFruit() {
  if (gameOver) return;
  const now = performance.now();
  if (now - lastDropTime < COOLDOWN) return;
  lastDropTime = now;

  const type = nextType;
  const meta = FRUITS[type];

  fruits.push({
    id: Math.random().toString(36).slice(2),
    type,
    x: clamp(spawnX, meta.r + WALL_MARGIN + 3, W - meta.r - WALL_MARGIN - 3),
    y: meta.r + 8,
    vx: (Math.random() - 0.5) * 0.2,
    vy: 0,
    merged: false
  });

  nextType = randType();
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function circleCollide(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const r = FRUITS[a.type].r + FRUITS[b.type].r;
  return dx * dx + dy * dy <= r * r;
}

function resolveCollision(a, b) {
  const ra = FRUITS[a.type].r;
  const rb = FRUITS[b.type].r;
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let dist = Math.hypot(dx, dy);

  if (dist === 0) {
    dist = 0.01;
    dx = 0.01;
    dy = 0;
  }

  const overlap = ra + rb - dist;
  if (overlap <= 0) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const push = overlap * 0.5;
  a.x -= nx * push;
  a.y -= ny * push;
  b.x += nx * push;
  b.y += ny * push;

  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const velAlongNormal = rvx * nx + rvy * ny;
  if (velAlongNormal > 0) return;

  const impulse = -(1 + BOUNCE) * velAlongNormal * 0.5;
  a.vx -= impulse * nx;
  a.vy -= impulse * ny;
  b.vx += impulse * nx;
  b.vy += impulse * ny;
}

function addEffect(x, y, text) {
  effects.push({ x, y, text, life: 1 });
}

function mergeFruits(a, b) {
  const type = a.type;
  if (type !== b.type) return false;
  if (type >= FRUITS.length - 1) return false;

  const nx = (a.x + b.x) * 0.5;
  const ny = (a.y + b.y) * 0.5;
  a.merged = true;
  b.merged = true;

  const newType = type + 1;

  fruits.push({
    id: Math.random().toString(36).slice(2),
    type: newType,
    x: nx,
    y: ny,
    vx: (a.vx + b.vx) * 0.35,
    vy: Math.min(a.vy, b.vy) - 0.8,
    merged: false
  });

  const points = FRUITS[newType].points;
  score += points;
  updateScore();
  addEffect(nx, ny, `+${points}`);
  return true;
}

function update() {
  if (gameOver) return;

  for (let i = 0; i < fruits.length; i++) {
    const f = fruits[i];
    const r = FRUITS[f.type].r;

    f.vy += GRAVITY;
    f.vx *= AIR;
    f.vy *= AIR;

    f.x += f.vx;
    f.y += f.vy;

    if (f.x - r < WALL_MARGIN) {
      f.x = r + WALL_MARGIN;
      f.vx *= -0.45;
    }
    if (f.x + r > W - WALL_MARGIN) {
      f.x = W - r - WALL_MARGIN;
      f.vx *= -0.45;
    }
    if (f.y + r > H - WALL_MARGIN) {
      f.y = H - r - WALL_MARGIN;
      f.vy *= -0.35;
      if (Math.abs(f.vy) < REST_SPEED) f.vy = 0;
    }
  }

  for (let loop = 0; loop < 2; loop++) {
    for (let i = 0; i < fruits.length; i++) {
      for (let j = i + 1; j < fruits.length; j++) {
        const a = fruits[i];
        const b = fruits[j];
        if (a.merged || b.merged) continue;
        if (!circleCollide(a, b)) continue;

        if (!mergeFruits(a, b)) {
          resolveCollision(a, b);
        }
      }
    }
  }

  fruits = fruits.filter((f) => !f.merged);

  for (const e of effects) {
    e.y -= 0.7;
    e.life -= 0.02;
  }
  effects = effects.filter((e) => e.life > 0);

  const blockedTop = fruits.some((f) => f.y - FRUITS[f.type].r < TOP_LINE);
  overflowFrames = blockedTop ? overflowFrames + 1 : 0;

  if (overflowFrames > OVERFLOW_LIMIT) {
    gameOver = true;
    finalScoreEl.textContent = `You scored ${score}`;
    gameOverEl.classList.add("show");
  }
}

function drawFallbackFruit(meta, r) {
  const grad = ctx.createRadialGradient(-r * 0.34, -r * 0.37, r * 0.18, 0, 0, r);
  grad.addColorStop(0, "#ffffffcc");
  grad.addColorStop(0.35, meta.fallbackA);
  grad.addColorStop(1, meta.fallbackB);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpecialFruit(meta, r) {
  if (meta.special === "cantaloupe") {
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.2, 0, 0, r);
    g.addColorStop(0, "#ffd9ad");
    g.addColorStop(0.45, "#f0af67");
    g.addColorStop(1, "#d47d37");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = "#d28a48";
    ctx.lineWidth = Math.max(1.5, r * 0.04);
    const step = Math.max(8, r * 0.3);
    for (let x = -r * 1.2; x <= r * 1.2; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, -r);
      ctx.lineTo(x + r * 1.4, r);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, r);
      ctx.lineTo(x + r * 1.4, -r);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = "#b8692e";
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    return true;
  }

  if (meta.special === "watermelon") {
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.2, 0, 0, r);
    g.addColorStop(0, "#8be170");
    g.addColorStop(0.5, "#4cb24d");
    g.addColorStop(1, "#277d3a");

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.97, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = "#1f6732";
    ctx.lineWidth = Math.max(2, r * 0.12);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * r * 0.27, 0, r * 0.22, r * 1.08, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "#ffffff55";
    ctx.beginPath();
    ctx.ellipse(-r * 0.34, -r * 0.3, r * 0.2, r * 0.13, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#1d5e2f";
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    return true;
  }

  return false;
}

function drawFruitSprite(f, alpha = 1, scale = 1) {
  const meta = FRUITS[f.type];
  const r = meta.r * scale;
  const drawR = r * (meta.drawScale || 1);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(f.x, f.y);

  const drewSpecial = drawSpecialFruit(meta, r);
  if (!drewSpecial) {
    const ready = meta.sprite && meta.sprite.complete && meta.sprite.naturalWidth > 0;
    if (ready) {
      try {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(meta.sprite, -drawR, -drawR, drawR * 2, drawR * 2);
      } catch (_err) {
        drawFallbackFruit(meta, r);
      }
    } else {
      drawFallbackFruit(meta, r);
    }
  }

  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#1a2454";
  ctx.fillRect(0, 0, W, TOP_LINE);

  ctx.strokeStyle = "#ffdc58";
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, TOP_LINE);
  ctx.lineTo(W, TOP_LINE);
  ctx.stroke();
  ctx.setLineDash([]);

  for (const f of fruits) {
    drawFruitSprite(f);
  }

  const launchMeta = FRUITS[nextType];
  const launchR = launchMeta.r;
  const launchX = clamp(
    spawnX,
    launchR + WALL_MARGIN + 6,
    W - launchR - WALL_MARGIN - 6
  );

  ctx.strokeStyle = "#7deeff88";
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(launchX, TOP_LINE);
  ctx.lineTo(launchX, H);
  ctx.stroke();
  ctx.setLineDash([]);

  drawFruitSprite({ type: nextType, x: launchX, y: launchR + 10 }, 0.5);

  const preview = FRUITS[nextType];
  const previewScale = 0.42;
  const previewR = preview.r * previewScale * (preview.drawScale || 1);
  const previewX = 92;
  const previewY = 36;
  drawFruitSprite({ type: nextType, x: previewX, y: previewY }, 1, previewScale);

  ctx.fillStyle = "#ffe57d";
  ctx.font = "700 16px \"Press Start 2P\", \"Courier New\", monospace";
  ctx.textAlign = "left";
  ctx.fillText("NEXT", 10, 24);
  ctx.font = "700 11px \"Press Start 2P\", \"Courier New\", monospace";
  ctx.fillText(preview.name.toUpperCase(), previewX + previewR + 12, 24);

  for (const e of effects) {
    ctx.save();
    ctx.globalAlpha = e.life;
    ctx.fillStyle = "#79ff9f";
    ctx.font = "700 16px \"Press Start 2P\", \"Courier New\", monospace";
    ctx.textAlign = "center";
    ctx.fillText(e.text, e.x, e.y);
    ctx.restore();
  }

  ctx.fillStyle = "#00000022";
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function setSpawnFromClientX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * W;
  const r = FRUITS[nextType].r + WALL_MARGIN + 6;
  spawnX = clamp(x, r, W - r);
}

canvas.addEventListener("mousemove", (e) => {
  setSpawnFromClientX(e.clientX);
});

canvas.addEventListener("click", () => {
  dropFruit();
});

canvas.addEventListener(
  "touchmove",
  (e) => {
    const t = e.touches[0];
    if (!t) return;
    setSpawnFromClientX(t.clientX);
    e.preventDefault();
  },
  { passive: false }
);

canvas.addEventListener(
  "touchstart",
  (e) => {
    const t = e.touches[0];
    if (!t) return;
    setSpawnFromClientX(t.clientX);
    dropFruit();
    e.preventDefault();
  },
  { passive: false }
);

restartBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", resetGame);

window.addEventListener("keydown", (e) => {
  let handled = false;

  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    spawnX -= KEY_STEP;
    handled = true;
  }
  if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    spawnX += KEY_STEP;
    handled = true;
  }
  if (e.key === " " || e.key === "Enter") {
    dropFruit();
    handled = true;
  }

  const r = FRUITS[nextType].r + WALL_MARGIN + 6;
  spawnX = clamp(spawnX, r, W - r);

  if (handled) e.preventDefault();
});

resetGame();
loop();
