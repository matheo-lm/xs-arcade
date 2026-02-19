import { FRUIT_TIERS, TERMINAL_FRUIT_ID, type FruitTier } from "@games/fruit-stacker/config";

type FruitMeta = FruitTier & {
  sprite?: HTMLImageElement;
};

interface FruitState {
  id: string;
  type: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  airDrift: number;
  ageFrames: number;
  eligibleForTopLoss: boolean;
  merged: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
}

interface RingEffect {
  x: number;
  y: number;
  radius: number;
  growth: number;
  maxRadius: number;
  life: number;
  decay: number;
  lineWidth: number;
  color: string;
}

interface SparkEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  drag: number;
  life: number;
  decay: number;
  size: number;
  color: string;
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
  gameTargetReached: string;
}

export interface FruitStackerOptions {
  canvas: HTMLCanvasElement;
  boardEl: HTMLElement;
  scoreEl: HTMLElement;
  gameOverEl: HTMLElement;
  finalScoreEl: HTMLElement;
  gameOverTitleEl: HTMLElement;
  playAgainBtn: HTMLButtonElement;
  strings: FruitStackerStrings;
  initialMuted: boolean;
  dropCooldownMs: number;
  onMutedChange: (muted: boolean) => void;
  onGameOver: (score: number) => void;
  onScoreChange?: (score: number) => void;
}

export interface FruitStackerApi {
  setMuted(next: boolean): void;
  getMuted(): boolean;
  restart(): void;
  toggleFullscreen(): Promise<void>;
  destroy(): void;
}

type RunMode = "playing" | "loss" | "win";
type EndReason = "top-line" | "pumpkin-touch" | null;

interface CelebrationState {
  active: boolean;
  remainingMs: number;
  burstCooldownMs: number;
}

const FIXED_FPS = 60;
const FIXED_DT_MS = 1000 / FIXED_FPS;
const TOP_LINE_Y = 98;
const PLAYFIELD_PADDING = 3;
const POINTER_KEY_STEP = 26;
const GRAVITY = 0.21;
const VELOCITY_DAMPING = 0.996;
const AIR_DRIFT_DECAY = 0.995;
const WALL_BOUNCE = 0.22;
const FLOOR_BOUNCE = 0.18;
const COLLISION_PASSES = 3;
const REST_THRESHOLD = 0.045;
const TOP_LINE_SPAWN_EXEMPT_FRAMES = 18;
const SPAWN_POOL_SIZE = 3;
const WIN_CELEBRATION_MS = 3000;

const FRUITS: FruitMeta[] = FRUIT_TIERS.map((tier) => ({ ...tier }));
const TERMINAL_TYPE_INDEX = Math.max(
  0,
  FRUITS.findIndex((fruit) => fruit.id === TERMINAL_FRUIT_ID)
);
const PUMPKIN_TYPE_INDEX = TERMINAL_TYPE_INDEX;

export const initFruitStacker = (options: FruitStackerOptions): FruitStackerApi => {
  const ctx = options.canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is unavailable");

  options.gameOverTitleEl.textContent = options.strings.gameOverTitle;
  options.playAgainBtn.textContent = options.strings.gamePlayAgain;

  let boardWidth = 1;
  let boardHeight = 1;
  let currentDpr = 1;

  let fruits: FruitState[] = [];
  let effects: FloatingText[] = [];
  let rings: RingEffect[] = [];
  let sparks: SparkEffect[] = [];
  let celebration: CelebrationState = {
    active: false,
    remainingMs: 0,
    burstCooldownMs: 0
  };

  let score = 0;
  let spawnX = 0;
  let nextType = 0;
  let simulationMs = 0;
  let lastDropMs = -999_999;
  let queuedDrop = false;
  let runMode: RunMode = "playing";
  let endReason: EndReason = null;
  let rafHandle = 0;
  let lastRafMs = 0;
  let accumulatorMs = 0;
  let externalStepperActive = false;
  let idSequence = 0;
  let muted = options.initialMuted;

  let audioCtx: AudioContext | null = null;
  let masterGain: GainNode | null = null;

  const loadSprite = (url: string, fallbackUrl: string): HTMLImageElement => {
    const sprite = new Image();
    let fallbackAttempted = false;

    sprite.onerror = () => {
      if (fallbackAttempted) return;
      fallbackAttempted = true;
      sprite.src = fallbackUrl;
    };

    sprite.src = url;
    return sprite;
  };

  for (const fruit of FRUITS) {
    fruit.sprite = loadSprite(fruit.spriteUrl, fruit.fallbackSpriteUrl);
  }

  const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

  const randomSpawnType = (): number => Math.floor(Math.random() * Math.min(SPAWN_POOL_SIZE, FRUITS.length));

  const getSpawnRadius = (): number => FRUITS[nextType].r + PLAYFIELD_PADDING + 6;

  const getDropCooldownRemaining = (): number => Math.max(0, options.dropCooldownMs - (simulationMs - lastDropMs));

  const getDropCooldownRatio = (): number => {
    if (options.dropCooldownMs <= 0) return 1;
    return 1 - getDropCooldownRemaining() / options.dropCooldownMs;
  };

  const setSpawnX = (rawX: number): void => {
    const radius = getSpawnRadius();
    spawnX = clamp(rawX, radius, boardWidth - radius);
  };

  const updateScoreUi = (): void => {
    const text = `${options.strings.scorePrefix}: ${score}`;
    options.scoreEl.textContent = text;
    options.onScoreChange?.(score);
  };

  const WebKitWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };

  const ensureAudioContext = (): AudioContext | null => {
    if (audioCtx) return audioCtx;
    const AudioCtx = window.AudioContext ?? WebKitWindow.webkitAudioContext;
    if (!AudioCtx) return null;

    audioCtx = new AudioCtx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.18;
    masterGain.connect(audioCtx.destination);
    return audioCtx;
  };

  const unlockAudio = (): void => {
    const ac = ensureAudioContext();
    if (!ac || ac.state !== "suspended") return;
    void ac.resume();
  };

  const playTone = ({
    frequency,
    slideTo = null,
    duration = 0.09,
    type = "square",
    volume = 0.045,
    when = 0
  }: {
    frequency: number;
    slideTo?: number | null;
    duration?: number;
    type?: OscillatorType;
    volume?: number;
    when?: number;
  }): void => {
    if (muted) return;
    const ac = ensureAudioContext();
    if (!ac || ac.state !== "running" || !masterGain) return;

    const start = ac.currentTime + when;
    const end = start + duration;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), end);
    }

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(start);
    osc.stop(end + 0.02);
  };

  const playUiSfx = (): void => {
    playTone({ frequency: 360, slideTo: 300, duration: 0.06, volume: 0.038 });
  };

  const playDropSfx = (type: number): void => {
    const base = 210 + type * 22;
    playTone({ frequency: base, slideTo: base - 42, type: "triangle", duration: 0.08, volume: 0.038 });
  };

  const playMergeSfx = (type: number): void => {
    const base = 300 + Math.min(7, type) * 20;
    playTone({ frequency: base, slideTo: base * 1.05, duration: 0.06, volume: 0.042 });
    playTone({ frequency: base * 1.24, duration: 0.06, volume: 0.035, when: 0.05 });
  };

  const playGameOverSfx = (): void => {
    playTone({ frequency: 310, slideTo: 250, type: "sawtooth", duration: 0.12, volume: 0.04 });
    playTone({ frequency: 240, slideTo: 190, type: "sawtooth", duration: 0.14, volume: 0.038, when: 0.12 });
    playTone({ frequency: 180, slideTo: 140, type: "triangle", duration: 0.2, volume: 0.04, when: 0.26 });
  };

  const playWinSfx = (): void => {
    playTone({ frequency: 440, slideTo: 520, type: "triangle", duration: 0.12, volume: 0.045 });
    playTone({ frequency: 560, slideTo: 660, type: "triangle", duration: 0.12, volume: 0.043, when: 0.1 });
    playTone({ frequency: 680, slideTo: 820, type: "sine", duration: 0.14, volume: 0.04, when: 0.2 });
  };

  const setMuted = (next: boolean): void => {
    muted = !!next;
    options.onMutedChange(muted);
  };

  const resizeCanvas = (): void => {
    const rect = options.canvas.getBoundingClientRect();
    boardWidth = Math.max(1, Math.round(rect.width));
    boardHeight = Math.max(1, Math.round(rect.height));
    currentDpr = Math.max(1, window.devicePixelRatio || 1);

    options.canvas.width = Math.max(1, Math.round(boardWidth * currentDpr));
    options.canvas.height = Math.max(1, Math.round(boardHeight * currentDpr));

    ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    setSpawnX(spawnX || boardWidth / 2);
  };

  const createFruit = (type: number, x: number, y: number, vx = 0, vy = 0): FruitState => ({
    id: `fruit-${idSequence++}`,
    type,
    x,
    y,
    vx,
    vy,
    airDrift: (Math.random() - 0.5) * 0.012,
    ageFrames: 0,
    eligibleForTopLoss: false,
    merged: false
  });

  const addEffect = (x: number, y: number, text: string): void => {
    effects.push({ x, y, text, life: 1 });
  };

  const addRing = (x: number, y: number, color: string, maxRadius: number, growth: number, decay: number): void => {
    rings.push({
      x,
      y,
      radius: 6,
      growth,
      maxRadius,
      life: 1,
      decay,
      lineWidth: 3,
      color
    });
  };

  const addSparkBurst = (
    x: number,
    y: number,
    count: number,
    palette: string[],
    speedBase: number,
    gravity = 0.08,
    decay = 0.02
  ): void => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const speed = speedBase * (0.6 + Math.random() * 0.8);
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        gravity,
        drag: 0.985,
        life: 1,
        decay,
        size: 2 + Math.random() * 3,
        color: palette[Math.floor(Math.random() * palette.length)]
      });
    }
  };

  const spawnPumpkinMergeCelebration = (x: number, y: number): void => {
    addRing(x, y, "#ffd56a", 76, 2.7, 0.03);
    addRing(x, y, "#ff9f4e", 104, 3.2, 0.024);
    addSparkBurst(x, y, 26, ["#ffd56a", "#ffa54b", "#fff0b1", "#ff7b40"], 3.8, 0.09, 0.028);
    addEffect(x, y - 12, "+PUMPKIN!");
  };

  const spawnFireworkBurst = (x: number, y: number): void => {
    const palette = ["#ffe57d", "#80e8ff", "#ff9ed1", "#9dffba", "#ffd28a"];
    addRing(x, y, palette[Math.floor(Math.random() * palette.length)], 92, 3.1, 0.024);
    addSparkBurst(x, y, 34, palette, 4.2, 0.065, 0.02);
  };

  const startWinCelebration = (): void => {
    celebration = {
      active: true,
      remainingMs: WIN_CELEBRATION_MS,
      burstCooldownMs: 0
    };
    spawnFireworkBurst(boardWidth * 0.5, TOP_LINE_Y + 78);
  };

  const clearTransientEffects = (): void => {
    effects = [];
    rings = [];
    sparks = [];
    celebration = {
      active: false,
      remainingMs: 0,
      burstCooldownMs: 0
    };
  };

  const endRun = (reason: Exclude<EndReason, null>): void => {
    if (runMode !== "playing") return;

    endReason = reason;
    runMode = reason === "pumpkin-touch" ? "win" : "loss";

    options.gameOverEl.dataset.state = runMode;
    options.gameOverTitleEl.textContent =
      runMode === "win" ? options.strings.gameTargetReached : options.strings.gameOverTitle;
    options.finalScoreEl.textContent = `${options.strings.gameOverScore} ${score}`;
    options.gameOverEl.classList.add("visible");

    if (runMode === "win") {
      playWinSfx();
      startWinCelebration();
    } else {
      playGameOverSfx();
    }

    options.onGameOver(score);
  };

  const resetGame = (): void => {
    fruits = [];
    clearTransientEffects();
    score = 0;
    nextType = randomSpawnType();
    spawnX = boardWidth / 2;
    setSpawnX(spawnX);
    simulationMs = 0;
    lastDropMs = -999_999;
    queuedDrop = false;
    runMode = "playing";
    endReason = null;
    accumulatorMs = 0;
    lastRafMs = 0;

    options.gameOverEl.classList.remove("visible");
    options.gameOverEl.dataset.state = "loss";
    options.gameOverTitleEl.textContent = options.strings.gameOverTitle;
    updateScoreUi();
    draw();
  };

  const canDropNow = (): boolean => {
    if (runMode !== "playing") return false;
    return getDropCooldownRemaining() <= 0;
  };

  const dropFruit = (): boolean => {
    if (!canDropNow()) return false;

    const type = nextType;
    const radius = FRUITS[type].r;
    const x = clamp(spawnX, radius + PLAYFIELD_PADDING + 3, boardWidth - radius - PLAYFIELD_PADDING - 3);
    const y = TOP_LINE_Y - radius - 7;

    fruits.push(createFruit(type, x, y, (Math.random() - 0.5) * 0.2, 0));
    nextType = randomSpawnType();
    lastDropMs = simulationMs;
    playDropSfx(type);
    return true;
  };

  const attemptPlayerDrop = (): void => {
    if (dropFruit()) {
      queuedDrop = false;
      return;
    }

    if (runMode !== "playing") return;

    if (!queuedDrop) {
      playUiSfx();
    }
    queuedDrop = true;
  };

  const consumeQueuedDropIfReady = (): void => {
    if (!queuedDrop) return;
    if (!dropFruit()) return;
    queuedDrop = false;
  };

  const resolveWorldBounds = (fruit: FruitState): void => {
    const radius = FRUITS[fruit.type].r;
    const left = radius + PLAYFIELD_PADDING;
    const right = boardWidth - radius - PLAYFIELD_PADDING;
    const floor = boardHeight - radius - PLAYFIELD_PADDING;

    if (fruit.x < left) {
      fruit.x = left;
      fruit.vx *= -WALL_BOUNCE;
    } else if (fruit.x > right) {
      fruit.x = right;
      fruit.vx *= -WALL_BOUNCE;
    }

    if (fruit.y > floor) {
      fruit.y = floor;
      fruit.vy *= -FLOOR_BOUNCE;
      if (Math.abs(fruit.vy) < REST_THRESHOLD) fruit.vy = 0;
    }
  };

  const tryMerge = (a: FruitState, b: FruitState, distance: number, targetDistance: number): boolean => {
    if (a.type !== b.type) return false;
    if (a.type >= TERMINAL_TYPE_INDEX) return false;
    if (distance > targetDistance * 0.98) return false;

    a.merged = true;
    b.merged = true;

    const mergedType = a.type + 1;
    const x = (a.x + b.x) * 0.5;
    const y = (a.y + b.y) * 0.5;
    const vx = (a.vx + b.vx) * 0.35;
    const vy = Math.min(a.vy, b.vy) - 0.65;
    fruits.push(createFruit(mergedType, x, y, vx, vy));

    const points = FRUITS[mergedType].points;
    score += points;
    updateScoreUi();
    addEffect(x, y, `+${points}`);
    playMergeSfx(mergedType);

    if (mergedType === PUMPKIN_TYPE_INDEX) {
      spawnPumpkinMergeCelebration(x, y);
    }

    return true;
  };

  const resolveCollision = (a: FruitState, b: FruitState): void => {
    const ra = FRUITS[a.type].r;
    const rb = FRUITS[b.type].r;
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let distance = Math.hypot(dx, dy);
    const targetDistance = ra + rb;

    if (distance >= targetDistance) return;
    if (distance === 0) {
      dx = 0.0001;
      dy = 0;
      distance = 0.0001;
    }

    if (tryMerge(a, b, distance, targetDistance)) return;

    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = targetDistance - distance;
    const push = overlap * 0.5;
    a.x -= nx * push;
    a.y -= ny * push;
    b.x += nx * push;
    b.y += ny * push;

    const rvx = b.vx - a.vx;
    const rvy = b.vy - a.vy;
    const velocityAlongNormal = rvx * nx + rvy * ny;
    if (velocityAlongNormal > 0) return;

    const impulse = -(1 + 0.18) * velocityAlongNormal * 0.5;
    a.vx -= impulse * nx;
    a.vy -= impulse * ny;
    b.vx += impulse * nx;
    b.vy += impulse * ny;
  };

  const hasImmediateTopLineBreach = (): boolean => {
    for (const fruit of fruits) {
      if (fruit.merged) continue;
      if (!fruit.eligibleForTopLoss) continue;
      if (fruit.ageFrames < TOP_LINE_SPAWN_EXEMPT_FRAMES) continue;
      const radius = FRUITS[fruit.type].r;
      const top = fruit.y - radius;
      if (top < TOP_LINE_Y) return true;
    }
    return false;
  };

  const hasPumpkinTouch = (): boolean => {
    const pumpkins = fruits.filter((fruit) => !fruit.merged && fruit.type === PUMPKIN_TYPE_INDEX);
    if (pumpkins.length < 2) return false;

    for (let i = 0; i < pumpkins.length; i++) {
      for (let j = i + 1; j < pumpkins.length; j++) {
        const a = pumpkins[i];
        const b = pumpkins[j];
        const targetDistance = FRUITS[a.type].r + FRUITS[b.type].r;
        const distance = Math.hypot(b.x - a.x, b.y - a.y);
        if (distance <= targetDistance * 0.99) {
          return true;
        }
      }
    }

    return false;
  };

  const stepTransientEffects = (): void => {
    for (const effect of effects) {
      effect.y -= 0.6;
      effect.life -= 0.02;
    }
    effects = effects.filter((effect) => effect.life > 0);

    for (const ring of rings) {
      ring.radius = Math.min(ring.maxRadius, ring.radius + ring.growth);
      ring.life -= ring.decay;
    }
    rings = rings.filter((ring) => ring.life > 0);

    for (const spark of sparks) {
      spark.vx *= spark.drag;
      spark.vy = spark.vy * spark.drag + spark.gravity;
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.life -= spark.decay;
    }
    sparks = sparks.filter((spark) => spark.life > 0);

    if (!celebration.active) return;

    celebration.remainingMs -= FIXED_DT_MS;
    celebration.burstCooldownMs -= FIXED_DT_MS;

    if (celebration.remainingMs > 0 && celebration.burstCooldownMs <= 0) {
      const burstX = clamp(26 + Math.random() * (boardWidth - 52), 26, boardWidth - 26);
      const burstY = clamp(TOP_LINE_Y + 36 + Math.random() * 170, TOP_LINE_Y + 32, boardHeight * 0.7);
      spawnFireworkBurst(burstX, burstY);
      celebration.burstCooldownMs = 240 + Math.random() * 120;
    }

    if (celebration.remainingMs <= 0) {
      celebration.active = false;
    }
  };

  const stepFixed = (): void => {
    simulationMs += FIXED_DT_MS;

    if (runMode !== "playing") {
      stepTransientEffects();
      return;
    }

    consumeQueuedDropIfReady();

    for (const fruit of fruits) {
      if (fruit.merged) continue;
      fruit.ageFrames += 1;
      const radius = FRUITS[fruit.type].r;
      const floorY = boardHeight - radius - PLAYFIELD_PADDING;
      const airborne = fruit.y < floorY - 3 || Math.abs(fruit.vy) > REST_THRESHOLD * 1.8;
      if (airborne) {
        fruit.vx += fruit.airDrift;
        fruit.airDrift *= AIR_DRIFT_DECAY;
      }
      fruit.vy += GRAVITY;
      fruit.vx *= VELOCITY_DAMPING;
      fruit.vy *= VELOCITY_DAMPING;
      fruit.x += fruit.vx;
      fruit.y += fruit.vy;
      resolveWorldBounds(fruit);
      const top = fruit.y - radius;
      if (!fruit.eligibleForTopLoss && top >= TOP_LINE_Y) {
        fruit.eligibleForTopLoss = true;
      }
    }

    for (let pass = 0; pass < COLLISION_PASSES; pass++) {
      for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
          const a = fruits[i];
          const b = fruits[j];
          if (a.merged || b.merged) continue;
          resolveCollision(a, b);
        }
      }
    }

    for (const fruit of fruits) {
      if (fruit.merged) continue;
      resolveWorldBounds(fruit);
    }

    fruits = fruits.filter((fruit) => !fruit.merged);

    stepTransientEffects();

    if (hasImmediateTopLineBreach()) {
      endRun("top-line");
      return;
    }

    if (hasPumpkinTouch()) {
      endRun("pumpkin-touch");
    }
  };

  const drawFallbackFruit = (meta: FruitMeta, radius: number): void => {
    const gradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, radius * 0.15, 0, 0, radius);
    gradient.addColorStop(0, "#ffffffdd");
    gradient.addColorStop(0.34, meta.fallbackA);
    gradient.addColorStop(1, meta.fallbackB);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawFruit = (fruit: { type: number; x: number; y: number }, alpha = 1, scale = 1): void => {
    const meta = FRUITS[fruit.type];
    const drawRadius = meta.r * (meta.drawScale || 1) * scale;
    const spriteScale = meta.spriteScale || 1;
    const spriteSize = drawRadius * 2 * spriteScale;
    const spriteReady = !!(meta.sprite && meta.sprite.complete && meta.sprite.naturalWidth > 0);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(fruit.x, fruit.y);
    if (spriteReady && meta.sprite) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(meta.sprite, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
    } else {
      drawFallbackFruit(meta, meta.r * scale);
    }
    ctx.restore();
  };

  const drawBackground = (): void => {
    const sky = ctx.createLinearGradient(0, 0, 0, boardHeight);
    sky.addColorStop(0, "#2b3a77");
    sky.addColorStop(0.33, "#3c5aa1");
    sky.addColorStop(1, "#74a2d5");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, boardWidth, boardHeight);

    ctx.fillStyle = "#0b1238d9";
    ctx.fillRect(0, 0, boardWidth, TOP_LINE_Y - 2);

    const floorGlow = ctx.createLinearGradient(0, TOP_LINE_Y, 0, boardHeight);
    floorGlow.addColorStop(0, "#ffffff08");
    floorGlow.addColorStop(1, "#0000002c");
    ctx.fillStyle = floorGlow;
    ctx.fillRect(0, TOP_LINE_Y, boardWidth, boardHeight - TOP_LINE_Y);
  };

  const drawHud = (): void => {
    const nextMeta = FRUITS[nextType];

    ctx.fillStyle = "#040c2dca";
    ctx.fillRect(6, 8, 174, 47);
    ctx.strokeStyle = "#8bb4f67d";
    ctx.lineWidth = 1;
    ctx.strokeRect(6.5, 8.5, 173, 46);

    ctx.fillStyle = "#ffe57d";
    ctx.font = '700 13px "Press Start 2P", "Courier New", monospace';
    ctx.textAlign = "left";
    ctx.fillText(options.strings.gameNext.toUpperCase(), 14, 24);

    ctx.fillStyle = "#d7ecff";
    ctx.font = '700 11px "Press Start 2P", "Courier New", monospace';
    ctx.fillText(nextMeta.name.toUpperCase(), 14, 45);

    drawFruit({ type: nextType, x: boardWidth - 36, y: 32 }, 0.95, 0.62);
  };

  const drawTopLine = (): void => {
    ctx.strokeStyle = runMode === "loss" ? "#ff6a6a" : "#ffd45a";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.moveTo(0, TOP_LINE_Y);
    ctx.lineTo(boardWidth, TOP_LINE_Y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawLauncher = (): void => {
    const radius = getSpawnRadius();
    const launchY = TOP_LINE_Y - radius;

    ctx.strokeStyle = "#b7f7ff96";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(spawnX, TOP_LINE_Y);
    ctx.lineTo(spawnX, boardHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    drawFruit({ type: nextType, x: spawnX, y: launchY }, 0.62);

    const cooldownRatio = getDropCooldownRatio();
    if (cooldownRatio >= 0.999 && !queuedDrop) return;

    const pulse = 0.55 + 0.45 * Math.sin(simulationMs / 90);
    const ringColor = queuedDrop
      ? `rgba(157, 255, 186, ${0.5 + pulse * 0.35})`
      : `rgba(255, 212, 90, ${0.45 + pulse * 0.25})`;

    ctx.strokeStyle = ringColor;
    ctx.lineWidth = queuedDrop ? 4 : 3;
    ctx.beginPath();
    ctx.arc(
      spawnX,
      launchY,
      radius + 7,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.max(0.06, cooldownRatio)
    );
    ctx.stroke();

    if (!queuedDrop) return;

    ctx.fillStyle = `rgba(157, 255, 186, ${0.72 + pulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(spawnX + radius + 12, launchY - radius + 3, 4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawEffects = (): void => {
    for (const effect of effects) {
      ctx.save();
      ctx.globalAlpha = effect.life;
      ctx.fillStyle = "#9dffba";
      ctx.font = '700 16px "Press Start 2P", "Courier New", monospace';
      ctx.textAlign = "center";
      ctx.fillText(effect.text, effect.x, effect.y);
      ctx.restore();
    }

    for (const ring of rings) {
      ctx.save();
      ctx.globalAlpha = ring.life;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.lineWidth;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const spark of sparks) {
      ctx.save();
      ctx.globalAlpha = spark.life;
      ctx.fillStyle = spark.color;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const draw = (): void => {
    ctx.clearRect(0, 0, boardWidth, boardHeight);
    drawBackground();
    drawTopLine();

    for (const fruit of fruits) {
      drawFruit(fruit);
    }

    drawLauncher();
    drawEffects();
    drawHud();
  };

  const stepForMs = (ms: number): void => {
    accumulatorMs += ms;
    while (accumulatorMs >= FIXED_DT_MS) {
      stepFixed();
      accumulatorMs -= FIXED_DT_MS;
    }
  };

  const runRaf = (rafMs: number): void => {
    if (!lastRafMs) lastRafMs = rafMs;
    const deltaMs = Math.min(100, rafMs - lastRafMs);
    lastRafMs = rafMs;

    if (!externalStepperActive) {
      stepForMs(deltaMs);
    }
    draw();
    rafHandle = window.requestAnimationFrame(runRaf);
  };

  const getCanvasWorldX = (clientX: number): number => {
    const rect = options.canvas.getBoundingClientRect();
    if (rect.width === 0) return spawnX;
    return ((clientX - rect.left) / rect.width) * boardWidth;
  };

  const toggleFullscreen = async (): Promise<void> => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (options.boardEl.requestFullscreen) {
      await options.boardEl.requestFullscreen();
    }
  };

  const testingWindow = window as typeof window & {
    advanceTime?: (ms: number) => void;
    render_game_to_text?: () => string;
  };

  testingWindow.advanceTime = (ms: number): void => {
    externalStepperActive = true;
    const safeMs = Number.isFinite(ms) ? Math.max(0, ms) : 0;
    const steps = Math.max(1, Math.round(safeMs / FIXED_DT_MS));
    for (let i = 0; i < steps; i++) {
      stepFixed();
    }
    draw();
  };

  testingWindow.render_game_to_text = (): string => {
    const payload = {
      coordinateSystem: "origin=(0,0) top-left; +x right; +y down; units are canvas pixels",
      mode: runMode,
      endReason,
      score,
      muted,
      nextFruit: FRUITS[nextType].id,
      launcher: {
        x: Number(spawnX.toFixed(2)),
        y: Number((TOP_LINE_Y - getSpawnRadius()).toFixed(2)),
        cooldownMsRemaining: Number(getDropCooldownRemaining().toFixed(2)),
        cooldownRatio: Number(getDropCooldownRatio().toFixed(3)),
        queuedDrop
      },
      overflow: {
        lineY: TOP_LINE_Y,
        immediate: true,
        spawnExemptFrames: TOP_LINE_SPAWN_EXEMPT_FRAMES
      },
      fruits: fruits.map((fruit) => ({
        id: fruit.id,
        type: FRUITS[fruit.type].id,
        x: Number(fruit.x.toFixed(2)),
        y: Number(fruit.y.toFixed(2)),
        vx: Number(fruit.vx.toFixed(2)),
        vy: Number(fruit.vy.toFixed(2)),
        drift: Number(fruit.airDrift.toFixed(4)),
        ageFrames: fruit.ageFrames,
        eligibleForTopLoss: fruit.eligibleForTopLoss,
        r: FRUITS[fruit.type].r
      }))
    };

    return JSON.stringify(payload);
  };

  const handlePointerMove = (event: PointerEvent): void => {
    setSpawnX(getCanvasWorldX(event.clientX));
  };

  const handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    unlockAudio();
    setSpawnX(getCanvasWorldX(event.clientX));
    attemptPlayerDrop();
    event.preventDefault();
  };

  const handlePlayAgain = (): void => {
    unlockAudio();
    playUiSfx();
    resetGame();
  };

  const handleWindowPointerDown = (): void => {
    unlockAudio();
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    let handled = false;

    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      setSpawnX(spawnX - POINTER_KEY_STEP);
      handled = true;
    } else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      setSpawnX(spawnX + POINTER_KEY_STEP);
      handled = true;
    } else if (event.key === " " || event.key === "Enter") {
      unlockAudio();
      attemptPlayerDrop();
      handled = true;
    } else if (event.key === "f" || event.key === "F") {
      void toggleFullscreen();
      handled = true;
    } else if (event.key === "Escape" && document.fullscreenElement) {
      void document.exitFullscreen();
      handled = true;
    }

    if (handled) event.preventDefault();
  };

  const handleResize = (): void => {
    resizeCanvas();
    draw();
  };

  options.canvas.addEventListener("pointermove", handlePointerMove);
  options.canvas.addEventListener("pointerdown", handlePointerDown);
  options.playAgainBtn.addEventListener("click", handlePlayAgain);
  window.addEventListener("pointerdown", handleWindowPointerDown, { passive: true });
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("resize", handleResize);
  document.addEventListener("fullscreenchange", handleResize);

  resizeCanvas();
  resetGame();
  rafHandle = window.requestAnimationFrame(runRaf);

  return {
    setMuted(next: boolean) {
      setMuted(next);
    },
    getMuted() {
      return muted;
    },
    restart() {
      resetGame();
    },
    async toggleFullscreen() {
      await toggleFullscreen();
    },
    destroy() {
      window.cancelAnimationFrame(rafHandle);
      options.canvas.removeEventListener("pointermove", handlePointerMove);
      options.canvas.removeEventListener("pointerdown", handlePointerDown);
      options.playAgainBtn.removeEventListener("click", handlePlayAgain);
      window.removeEventListener("pointerdown", handleWindowPointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleResize);
    }
  };
};
