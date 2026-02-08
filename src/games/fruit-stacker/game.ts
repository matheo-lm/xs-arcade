interface FruitMeta {
  name: string;
  label: string;
  r: number;
  points: number;
  spriteUrl: string;
  fallbackSpriteUrl: string;
  fallbackA: string;
  fallbackB: string;
  special?: "watermelon";
  drawScale: number;
  spriteScale: number;
  sprite?: HTMLImageElement | null;
}

interface FruitState {
  id: string;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  merged: boolean;
}

interface EffectState {
  x: number;
  y: number;
  text: string;
  life: number;
}

interface FruitStackerStrings {
  scorePrefix: string;
  gameOverScore: string;
  gameOverTitle: string;
  gamePlayAgain: string;
  gameRestart: string;
  gameNext: string;
  gameSoundOn: string;
  gameSoundOff: string;
}

export interface FruitStackerOptions {
  canvas: HTMLCanvasElement;
  boardEl: HTMLElement;
  scoreEl: HTMLElement;
  gameOverEl: HTMLElement;
  finalScoreEl: HTMLElement;
  gameOverTitleEl: HTMLElement;
  soundToggleBtn: HTMLButtonElement;
  restartBtn: HTMLButtonElement;
  playAgainBtn: HTMLButtonElement;
  strings: FruitStackerStrings;
  initialMuted: boolean;
  dropCooldownMs: number;
  onMutedChange: (muted: boolean) => void;
  onGameOver: (score: number) => void;
}

export interface FruitStackerApi {
  setMuted(next: boolean): void;
  getMuted(): boolean;
  reset(): void;
}

const TOP_LINE = 96;

const FRUITS: FruitMeta[] = [
  {
    name: "Cherry",
    label: "CH",
    r: 18,
    points: 10,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f352.png",
    fallbackSpriteUrl: "/assets/fruits/cherry.svg",
    fallbackA: "#ff8a9a",
    fallbackB: "#ff2e50",
    drawScale: 1.02,
    spriteScale: 1.1
  },
  {
    name: "Lemon",
    label: "LE",
    r: 23,
    points: 20,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f34b.png",
    fallbackSpriteUrl: "/assets/fruits/lemon.svg",
    fallbackA: "#fff08a",
    fallbackB: "#ffc738",
    drawScale: 1,
    spriteScale: 1.1
  },
  {
    name: "Orange",
    label: "OR",
    r: 34,
    points: 80,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f34a.png",
    fallbackSpriteUrl: "/assets/fruits/orange.svg",
    fallbackA: "#ffd390",
    fallbackB: "#ff922f",
    drawScale: 1,
    spriteScale: 1.08
  },
  {
    name: "Apple",
    label: "AP",
    r: 41,
    points: 160,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f34e.png",
    fallbackSpriteUrl: "/assets/fruits/apple.svg",
    fallbackA: "#ffb39f",
    fallbackB: "#ff3f3f",
    drawScale: 1,
    spriteScale: 1.08
  },
  {
    name: "Pear",
    label: "PE",
    r: 49,
    points: 320,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f350.png",
    fallbackSpriteUrl: "/assets/fruits/pear.svg",
    fallbackA: "#e5ffa5",
    fallbackB: "#90db44",
    drawScale: 1,
    spriteScale: 1.07
  },
  {
    name: "Peach",
    label: "PC",
    r: 59,
    points: 640,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f351.png",
    fallbackSpriteUrl: "/assets/fruits/peach.svg",
    fallbackA: "#ffd9bf",
    fallbackB: "#ff9e6a",
    drawScale: 1,
    spriteScale: 1.06
  },
  {
    name: "Melon",
    label: "ML",
    r: 72,
    points: 1280,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f348.png",
    fallbackSpriteUrl: "/assets/fruits/melon.svg",
    fallbackA: "#f4bf79",
    fallbackB: "#dd8b43",
    drawScale: 1,
    spriteScale: 1.08
  },
  {
    name: "Watermelon",
    label: "WM",
    r: 92,
    points: 2560,
    spriteUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f349.png",
    fallbackSpriteUrl: "/assets/fruits/watermelon.svg",
    fallbackA: "#6acb57",
    fallbackB: "#2a8f43",
    special: "watermelon",
    drawScale: 1,
    spriteScale: 1.06
  }
];

const GRAVITY = 0.23;
const AIR = 0.996;
const BOUNCE = 0.16;
const REST_SPEED = 0.06;
const OVERFLOW_LIMIT = 42;
const KEY_STEP = 26;
const WALL_MARGIN = 3;

export const initFruitStacker = (options: FruitStackerOptions): FruitStackerApi => {
  const ctx = options.canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable");

  options.gameOverTitleEl.textContent = options.strings.gameOverTitle;
  options.playAgainBtn.textContent = options.strings.gamePlayAgain;
  options.restartBtn.textContent = options.strings.gameRestart;

  const W = options.canvas.width;
  const H = options.canvas.height;

  let fruits: FruitState[] = [];
  let effects: EffectState[] = [];
  let score = 0;
  let spawnX = W / 2;
  let nextType = 0;
  let lastDropTime = 0;
  let gameOver = false;
  let overflowFrames = 0;
  let sfxMuted = options.initialMuted;
  let audioCtx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let lastMergeSfxTime = 0;

  const loadSprite = (url: string, fallbackUrl: string): HTMLImageElement => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let fallbackAttempted = false;

    img.onerror = () => {
      if (fallbackAttempted) return;
      fallbackAttempted = true;
      img.removeAttribute("crossorigin");
      img.src = fallbackUrl;
    };

    img.src = url;
    return img;
  };

  for (const fruit of FRUITS) {
    fruit.sprite = loadSprite(fruit.spriteUrl, fruit.fallbackSpriteUrl);
  }

  const ensureAudioContext = (): AudioContext | null => {
    if (audioCtx) return audioCtx;
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    audioCtx = new AudioCtx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.2;
    masterGain.connect(audioCtx.destination);
    return audioCtx;
  };

  const unlockAudio = (): void => {
    const ac = ensureAudioContext();
    if (!ac || sfxMuted || ac.state !== "suspended") return;
    ac.resume().catch(() => undefined);
  };

  const playArcadeTone = ({
    type = "square",
    freq = 280,
    slideTo = null,
    duration = 0.1,
    volume = 0.06,
    when = 0
  }: {
    type?: OscillatorType;
    freq?: number;
    slideTo?: number | null;
    duration?: number;
    volume?: number;
    when?: number;
  } = {}): void => {
    if (sfxMuted) return;
    const ac = ensureAudioContext();
    if (!ac || !masterGain || ac.state !== "running") return;

    const start = ac.currentTime + when;
    const end = start + duration;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), end);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(end + 0.01);
  };

  const playUiSfx = (): void => {
    playArcadeTone({ type: "square", freq: 360, slideTo: 300, duration: 0.06, volume: 0.04 });
  };

  const playDropSfx = (type: number): void => {
    const base = 220 + type * 18;
    playArcadeTone({ type: "triangle", freq: base, slideTo: base - 45, duration: 0.07, volume: 0.038 });
  };

  const playMergeSfx = (type: number): void => {
    const now = performance.now();
    if (now - lastMergeSfxTime < 85) return;
    lastMergeSfxTime = now;
    const base = 300 + Math.min(type, 7) * 22;
    playArcadeTone({ type: "square", freq: base, slideTo: base * 1.06, duration: 0.06, volume: 0.045 });
    playArcadeTone({ type: "square", freq: base * 1.22, duration: 0.06, volume: 0.038, when: 0.055 });
  };

  const playGameOverSfx = (): void => {
    playArcadeTone({ type: "sawtooth", freq: 310, slideTo: 250, duration: 0.13, volume: 0.042, when: 0 });
    playArcadeTone({ type: "sawtooth", freq: 250, slideTo: 205, duration: 0.13, volume: 0.04, when: 0.12 });
    playArcadeTone({ type: "triangle", freq: 210, slideTo: 160, duration: 0.19, volume: 0.04, when: 0.24 });
  };

  const updateSoundToggleUi = (): void => {
    options.soundToggleBtn.textContent = sfxMuted ? options.strings.gameSoundOff : options.strings.gameSoundOn;
    options.soundToggleBtn.setAttribute("aria-pressed", sfxMuted ? "true" : "false");
  };

  const setSoundMuted = (nextMuted: boolean): void => {
    sfxMuted = !!nextMuted;
    options.onMutedChange(sfxMuted);
    updateSoundToggleUi();
  };

  const randType = (): number => Math.floor(Math.random() * 3);

  const updateScore = (): void => {
    options.scoreEl.textContent = `${options.strings.scorePrefix}: ${score}`;
  };

  const resetGame = (): void => {
    fruits = [];
    effects = [];
    score = 0;
    spawnX = W / 2;
    nextType = randType();
    lastDropTime = 0;
    gameOver = false;
    overflowFrames = 0;
    options.gameOverEl.classList.remove("show");
    updateScore();
  };

  const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

  const dropFruit = (): void => {
    if (gameOver) return;
    const now = performance.now();
    if (now - lastDropTime < options.dropCooldownMs) return;

    unlockAudio();
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
    playDropSfx(type);
  };

  const circleCollide = (a: FruitState, b: FruitState): boolean => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const radius = FRUITS[a.type].r + FRUITS[b.type].r;
    return dx * dx + dy * dy <= radius * radius;
  };

  const resolveCollision = (a: FruitState, b: FruitState): void => {
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
  };

  const addEffect = (x: number, y: number, text: string): void => {
    effects.push({ x, y, text, life: 1 });
  };

  const mergeFruits = (a: FruitState, b: FruitState): boolean => {
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
    playMergeSfx(newType);
    return true;
  };

  const drawFallbackFruit = (meta: FruitMeta, radius: number): void => {
    const grad = ctx.createRadialGradient(-radius * 0.34, -radius * 0.37, radius * 0.18, 0, 0, radius);
    grad.addColorStop(0, "#ffffffcc");
    grad.addColorStop(0.35, meta.fallbackA);
    grad.addColorStop(1, meta.fallbackB);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSpecialFruit = (meta: FruitMeta, radius: number): boolean => {
    if (meta.special !== "watermelon") return false;

    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.4, radius * 0.2, 0, 0, radius);
    gradient.addColorStop(0, "#8be170");
    gradient.addColorStop(0.5, "#4cb24d");
    gradient.addColorStop(1, "#277d3a");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.97, 0, Math.PI * 2);
    ctx.clip();

    ctx.strokeStyle = "#1f6732";
    ctx.lineWidth = Math.max(2, radius * 0.12);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * radius * 0.27, 0, radius * 0.22, radius * 1.08, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "#ffffff55";
    ctx.beginPath();
    ctx.ellipse(-radius * 0.34, -radius * 0.3, radius * 0.2, radius * 0.13, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#1d5e2f";
    ctx.lineWidth = Math.max(2, radius * 0.07);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    return true;
  };

  const drawFruitSprite = (fruit: { type: number; x: number; y: number }, alpha = 1, scale = 1): void => {
    const meta = FRUITS[fruit.type];
    const radius = meta.r * scale;
    const drawRadius = radius * (meta.drawScale || 1);
    const spriteScale = meta.spriteScale || 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fruit.x, fruit.y);

    const ready = !!(meta.sprite && meta.sprite.complete && meta.sprite.naturalWidth > 0);
    if (ready && meta.sprite) {
      try {
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(
          meta.sprite,
          -drawRadius * spriteScale,
          -drawRadius * spriteScale,
          drawRadius * 2 * spriteScale,
          drawRadius * 2 * spriteScale
        );
      } catch (_err) {
        if (!drawSpecialFruit(meta, radius)) drawFallbackFruit(meta, radius);
      }
    } else if (!drawSpecialFruit(meta, radius)) {
      drawFallbackFruit(meta, radius);
    }

    if (ready && meta.name === "Cherry") {
      ctx.fillStyle = "#78f2ffcc";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, radius * 0.14), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawTopHud = (preview: FruitMeta): void => {
    ctx.fillStyle = "#101946e6";
    ctx.fillRect(0, 0, W, TOP_LINE - 2);

    ctx.fillStyle = "#ffe57d";
    ctx.font = "700 16px \"Press Start 2P\", \"Courier New\", monospace";
    ctx.textAlign = "left";
    ctx.fillText(options.strings.gameNext.toUpperCase(), 10, 24);
    ctx.font = "700 11px \"Press Start 2P\", \"Courier New\", monospace";
    ctx.fillText(preview.name.toUpperCase(), 86, 24);
  };

  const update = (): void => {
    if (gameOver) return;

    for (let i = 0; i < fruits.length; i++) {
      const fruit = fruits[i];
      const radius = FRUITS[fruit.type].r;

      fruit.vy += GRAVITY;
      fruit.vx *= AIR;
      fruit.vy *= AIR;

      fruit.x += fruit.vx;
      fruit.y += fruit.vy;

      if (fruit.x - radius < WALL_MARGIN) {
        fruit.x = radius + WALL_MARGIN;
        fruit.vx *= -0.45;
      }

      if (fruit.x + radius > W - WALL_MARGIN) {
        fruit.x = W - radius - WALL_MARGIN;
        fruit.vx *= -0.45;
      }

      if (fruit.y + radius > H - WALL_MARGIN) {
        fruit.y = H - radius - WALL_MARGIN;
        fruit.vy *= -0.35;
        if (Math.abs(fruit.vy) < REST_SPEED) fruit.vy = 0;
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

    fruits = fruits.filter((fruit) => !fruit.merged);

    for (const effect of effects) {
      effect.y -= 0.7;
      effect.life -= 0.02;
    }
    effects = effects.filter((effect) => effect.life > 0);

    const blockedTop = fruits.some((fruit) => fruit.y - FRUITS[fruit.type].r < TOP_LINE);
    overflowFrames = blockedTop ? overflowFrames + 1 : 0;

    if (overflowFrames > OVERFLOW_LIMIT) {
      gameOver = true;
      options.finalScoreEl.textContent = `${options.strings.gameOverScore} ${score}`;
      options.gameOverEl.classList.add("show");
      playGameOverSfx();
      options.onGameOver(score);
    }
  };

  const draw = (): void => {
    ctx.clearRect(0, 0, W, H);

    const preview = FRUITS[nextType];
    drawTopHud(preview);

    ctx.strokeStyle = "#ffdc58";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, TOP_LINE);
    ctx.lineTo(W, TOP_LINE);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const fruit of fruits) {
      drawFruitSprite(fruit);
    }

    const launchMeta = FRUITS[nextType];
    const launchRadius = launchMeta.r;
    const launchX = clamp(spawnX, launchRadius + WALL_MARGIN + 6, W - launchRadius - WALL_MARGIN - 6);
    const launchY = TOP_LINE - launchRadius - 8;

    ctx.strokeStyle = "#7deeff9f";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(launchX, TOP_LINE);
    ctx.lineTo(launchX, H);
    ctx.stroke();
    ctx.setLineDash([]);

    drawFruitSprite({ type: nextType, x: launchX, y: launchY }, 0.58);

    for (const effect of effects) {
      ctx.save();
      ctx.globalAlpha = effect.life;
      ctx.fillStyle = "#79ff9f";
      ctx.font = "700 16px \"Press Start 2P\", \"Courier New\", monospace";
      ctx.textAlign = "center";
      ctx.fillText(effect.text, effect.x, effect.y);
      ctx.restore();
    }

    ctx.fillStyle = "#00000022";
    for (let y = 0; y < H; y += 4) {
      ctx.fillRect(0, y, W, 1);
    }
  };

  const loop = (): void => {
    update();
    draw();
    window.requestAnimationFrame(loop);
  };

  const setSpawnFromClientX = (clientX: number): void => {
    const rect = options.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const radius = FRUITS[nextType].r + WALL_MARGIN + 6;
    spawnX = clamp(x, radius, W - radius);
  };

  options.canvas.addEventListener("mousemove", (event) => {
    setSpawnFromClientX(event.clientX);
  });

  options.canvas.addEventListener("click", () => {
    dropFruit();
  });

  options.canvas.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      setSpawnFromClientX(touch.clientX);
      event.preventDefault();
    },
    { passive: false }
  );

  options.canvas.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      setSpawnFromClientX(touch.clientX);
      dropFruit();
      event.preventDefault();
    },
    { passive: false }
  );

  options.soundToggleBtn.addEventListener("click", () => {
    const nextMuted = !sfxMuted;
    setSoundMuted(nextMuted);
    if (!nextMuted) {
      unlockAudio();
      playUiSfx();
    }
  });

  options.restartBtn.addEventListener("click", () => {
    unlockAudio();
    playUiSfx();
    resetGame();
  });

  options.playAgainBtn.addEventListener("click", () => {
    unlockAudio();
    playUiSfx();
    resetGame();
  });

  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", (event) => {
    let handled = false;

    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      spawnX -= KEY_STEP;
      handled = true;
    }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      spawnX += KEY_STEP;
      handled = true;
    }
    if (event.key === " " || event.key === "Enter") {
      dropFruit();
      handled = true;
    }

    const radius = FRUITS[nextType].r + WALL_MARGIN + 6;
    spawnX = clamp(spawnX, radius, W - radius);

    if (handled) event.preventDefault();
  });

  resetGame();
  updateSoundToggleUi();
  loop();

  return {
    setMuted(next: boolean) {
      setSoundMuted(next);
    },
    getMuted() {
      return sfxMuted;
    },
    reset() {
      resetGame();
    }
  };
};
