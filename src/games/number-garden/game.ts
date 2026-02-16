/**
 * Number Garden — core game engine
 *
 * A counting game where flowers bloom in a garden and the child taps
 * the numeral that matches the count. Canvas renders the garden scene;
 * DOM buttons form the number pad for accessibility / touch targets.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NumberGardenConfig {
    canvas: HTMLCanvasElement;
    boardEl: HTMLElement;
    numberPadEl: HTMLElement;
    scoreEl: HTMLElement;
    gameOverEl: HTMLElement;
    finalScoreEl: HTMLElement;
    gameOverTitleEl: HTMLElement;
    playAgainBtn: HTMLButtonElement;
    hintEl: HTMLElement;
    strings: {
        scorePrefix: string;
        gameOverScore: string;
        gameOverTitle: string;
        gamePlayAgain: string;
        gameRestart: string;
        gameTargetReached: string;
        correctLabel: string;
        tryAgainLabel: string;
        roundLabel: string;
    };
    maxNumber: number;       // Upper bound for number range (from difficulty preset)
    goalScore: number;       // Score to trigger "win"
    initialMuted: boolean;
    onMutedChange: (muted: boolean) => void;
    onGameOver: (score: number) => void;
    onScoreChange?: (score: number) => void;
}

export interface NumberGardenApi {
    getMuted: () => boolean;
    setMuted: (m: boolean) => void;
    restart: () => void;
}

/* ------------------------------------------------------------------ */
/*  Flower drawing helpers                                             */
/* ------------------------------------------------------------------ */

interface Flower {
    x: number;
    y: number;
    petalCount: number;
    color: string;
    size: number;
    bloomProgress: number;  // 0 → 1 animation
    swayOffset: number;
}

const FLOWER_COLORS = [
    "#ff6b8a", "#ff9f4e", "#ffd54f", "#81c784",
    "#64b5f6", "#ba68c8", "#f06292", "#4dd0e1",
    "#aed581", "#ffab91"
];

const drawFlower = (ctx: CanvasRenderingContext2D, f: Flower): void => {
    const bp = f.bloomProgress;
    if (bp <= 0) return;

    ctx.save();
    ctx.translate(f.x, f.y);

    // Stem
    const stemH = f.size * 1.2 * bp;
    ctx.strokeStyle = "#4caf50";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, stemH);
    ctx.stroke();

    // Leaf (left)
    if (bp > 0.4) {
        const leafP = Math.min(1, (bp - 0.4) / 0.3);
        ctx.fillStyle = "#66bb6a";
        ctx.beginPath();
        ctx.ellipse(-8 * leafP, stemH * 0.6, 10 * leafP, 5 * leafP, -0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    // Petals
    if (bp > 0.3) {
        const petalP = Math.min(1, (bp - 0.3) / 0.5);
        const petals = f.petalCount;
        const petalR = f.size * 0.38 * petalP;
        const cx = 0;
        const cy = -2;
        ctx.fillStyle = f.color;
        for (let i = 0; i < petals; i++) {
            const angle = (Math.PI * 2 * i) / petals - Math.PI / 2;
            const px = cx + Math.cos(angle) * (f.size * 0.28);
            const py = cy + Math.sin(angle) * (f.size * 0.28);
            ctx.beginPath();
            ctx.ellipse(px, py, petalR, petalR * 0.7, angle, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center
        if (bp > 0.6) {
            ctx.fillStyle = "#fff59d";
            ctx.beginPath();
            ctx.arc(cx, cy, f.size * 0.16 * petalP, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffb300";
            ctx.beginPath();
            ctx.arc(cx, cy, f.size * 0.09 * petalP, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
};

/* ------------------------------------------------------------------ */
/*  Canvas background                                                  */
/* ------------------------------------------------------------------ */

const drawGardenBackground = (ctx: CanvasRenderingContext2D, w: number, h: number): void => {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    sky.addColorStop(0, "#87ceeb");
    sky.addColorStop(1, "#b3e5fc");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.55);

    // Sun
    ctx.fillStyle = "#fff59d";
    ctx.beginPath();
    ctx.arc(w - 60, 50, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(w - 60, 50, 24, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    drawCloud(ctx, 70, 40, 40);
    drawCloud(ctx, 200, 60, 30);
    drawCloud(ctx, w / 2 + 30, 35, 35);

    // Ground
    const ground = ctx.createLinearGradient(0, h * 0.5, 0, h);
    ground.addColorStop(0, "#81c784");
    ground.addColorStop(0.35, "#66bb6a");
    ground.addColorStop(1, "#558b2f");
    ctx.fillStyle = ground;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // Dirt rows
    ctx.fillStyle = "#8d6e63";
    const rowH = 6;
    for (let i = 0; i < 3; i++) {
        const ry = h * 0.58 + i * (h * 0.12);
        ctx.beginPath();
        ctx.roundRect(20, ry, w - 40, rowH, 3);
        ctx.fill();
    }

    // Fence at bottom
    ctx.strokeStyle = "#a1887f";
    ctx.lineWidth = 2;
    const fenceY = h - 20;
    ctx.beginPath();
    ctx.moveTo(10, fenceY);
    ctx.lineTo(w - 10, fenceY);
    ctx.stroke();
    for (let fx = 20; fx < w - 10; fx += 35) {
        ctx.beginPath();
        ctx.moveTo(fx, fenceY - 12);
        ctx.lineTo(fx, fenceY + 5);
        ctx.stroke();
    }
};

const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.arc(x + r * 0.8, y - r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x + r * 1.4, y, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
};

/* ------------------------------------------------------------------ */
/*  Sound helpers using Web Audio oscillators                          */
/* ------------------------------------------------------------------ */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const ensureAudio = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.15;
    masterGain.connect(audioCtx.destination);
    return audioCtx;
};

const playTone = (freq: number, duration: number, type: OscillatorType, muted: boolean): void => {
    if (muted) return;
    const ctx = ensureAudio();
    if (!ctx || !masterGain || ctx.state !== "running") return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(env);
    env.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
};

const playCorrectSound = (muted: boolean): void => {
    playTone(523, 0.08, "square", muted);
    setTimeout(() => playTone(659, 0.08, "square", muted), 80);
    setTimeout(() => playTone(784, 0.12, "square", muted), 160);
};

const playWrongSound = (muted: boolean): void => {
    playTone(200, 0.15, "sawtooth", muted);
};

const playBloomSound = (muted: boolean): void => {
    playTone(440, 0.06, "sine", muted);
};

const playWinSound = (muted: boolean): void => {
    playTone(523, 0.1, "square", muted);
    setTimeout(() => playTone(659, 0.1, "square", muted), 100);
    setTimeout(() => playTone(784, 0.1, "square", muted), 200);
    setTimeout(() => playTone(1047, 0.2, "square", muted), 300);
};

/* ------------------------------------------------------------------ */
/*  Main game init                                                     */
/* ------------------------------------------------------------------ */

export const initNumberGarden = (config: NumberGardenConfig): NumberGardenApi => {
    const {
        canvas, boardEl, numberPadEl, scoreEl, gameOverEl,
        finalScoreEl, gameOverTitleEl, playAgainBtn, hintEl,
        strings, maxNumber, goalScore, onGameOver
    } = config;

    const ctx = canvas.getContext("2d")!;
    let muted = config.initialMuted;
    let score = 0;
    let round = 0;
    let currentCount = 0;
    let flowers: Flower[] = [];
    let animFrame = 0;
    let gameRunning = true;
    let feedbackText = "";
    let feedbackColor = "";
    let feedbackTimer = 0;
    let bloomAnimating = false;
    let numberPadDisabled = false;

    // Unlock audio context on first interaction
    const unlockAudio = (): void => {
        const ctx = ensureAudio();
        if (ctx?.state === "suspended") ctx.resume().catch(() => undefined);
    };
    document.addEventListener("pointerdown", unlockAudio, { once: true });

    /* ---- Layout helpers ---- */

    const resizeCanvas = (): void => {
        const rect = boardEl.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = Math.min(rect.width, 480);
        const h = Math.round(w * 0.85);
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /* ---- Flower generation ---- */

    const generateFlowers = (count: number): Flower[] => {
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        const result: Flower[] = [];
        const padding = 50;
        const availW = w - padding * 2;
        const gardenTop = h * 0.42;
        const gardenH = h * 0.42;

        // Position flowers in a grid-like pattern
        const cols = Math.min(count, Math.ceil(Math.sqrt(count * 1.5)));
        const rows = Math.ceil(count / cols);
        const cellW = availW / cols;
        const cellH = gardenH / rows;

        for (let i = 0; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const jitterX = (Math.random() - 0.5) * cellW * 0.3;
            const jitterY = (Math.random() - 0.5) * cellH * 0.2;
            result.push({
                x: padding + col * cellW + cellW / 2 + jitterX,
                y: gardenTop + row * cellH + cellH / 2 + jitterY,
                petalCount: 5 + Math.floor(Math.random() * 4),
                color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
                size: 22 + Math.random() * 12,
                bloomProgress: 0,
                swayOffset: Math.random() * Math.PI * 2
            });
        }
        return result;
    };

    /* ---- Number pad ---- */

    const buildNumberPad = (): void => {
        numberPadEl.innerHTML = "";
        for (let i = 1; i <= maxNumber; i++) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "ng-num-btn";
            btn.textContent = String(i);
            btn.dataset.num = String(i);
            btn.addEventListener("click", () => handleNumberClick(i));
            numberPadEl.appendChild(btn);
        }
    };

    const setNumberPadEnabled = (enabled: boolean): void => {
        numberPadDisabled = !enabled;
        const btns = numberPadEl.querySelectorAll<HTMLButtonElement>(".ng-num-btn");
        btns.forEach((b) => { b.disabled = !enabled; });
    };

    /* ---- Round logic ---- */

    const nextRound = (): void => {
        round++;
        currentCount = 1 + Math.floor(Math.random() * maxNumber);
        flowers = generateFlowers(currentCount);
        feedbackText = "";
        bloomAnimating = true;
        numberPadDisabled = false;

        // Animate flowers blooming in sequence
        let idx = 0;
        const bloomNext = (): void => {
            if (idx >= flowers.length) {
                bloomAnimating = false;
                setNumberPadEnabled(true);
                return;
            }
            const f = flowers[idx];
            const startTime = performance.now();
            const dur = 400;
            const animate = (now: number): void => {
                const t = Math.min(1, (now - startTime) / dur);
                f.bloomProgress = easeOutBack(t);
                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    f.bloomProgress = 1;
                    playBloomSound(muted);
                    idx++;
                    setTimeout(bloomNext, 80);
                }
            };
            requestAnimationFrame(animate);
        };

        setNumberPadEnabled(false);
        setTimeout(bloomNext, 300);
    };

    const handleNumberClick = (num: number): void => {
        if (!gameRunning || bloomAnimating || numberPadDisabled) return;

        if (num === currentCount) {
            // Correct!
            score++;
            if (config.onScoreChange) config.onScoreChange(score);
            scoreEl.textContent = `${strings.scorePrefix}: ${score}`;
            feedbackText = `✓ ${strings.correctLabel}`;
            feedbackColor = "#4caf50";
            feedbackTimer = performance.now();
            playCorrectSound(muted);
            setNumberPadEnabled(false);

            // Highlight the correct button
            const btns = numberPadEl.querySelectorAll<HTMLButtonElement>(".ng-num-btn");
            btns.forEach((b) => {
                if (b.dataset.num === String(num)) b.classList.add("ng-correct");
            });

            if (score >= goalScore) {
                // Win!
                setTimeout(() => endGame(true), 800);
            } else {
                setTimeout(() => {
                    // Clear highlights
                    btns.forEach((b) => b.classList.remove("ng-correct"));
                    nextRound();
                }, 900);
            }
        } else {
            // Wrong
            feedbackText = `✗ ${strings.tryAgainLabel}`;
            feedbackColor = "#e53935";
            feedbackTimer = performance.now();
            playWrongSound(muted);

            // Shake the board
            boardEl.classList.add("ng-shake");
            setTimeout(() => boardEl.classList.remove("ng-shake"), 400);

            // Briefly highlight the wrong button
            const btns = numberPadEl.querySelectorAll<HTMLButtonElement>(".ng-num-btn");
            btns.forEach((b) => {
                if (b.dataset.num === String(num)) b.classList.add("ng-wrong");
            });
            setTimeout(() => {
                btns.forEach((b) => b.classList.remove("ng-wrong"));
            }, 500);
        }
    };

    /* ---- End game ---- */

    const endGame = (won: boolean): void => {
        gameRunning = false;
        setNumberPadEnabled(false);

        if (won) {
            playWinSound(muted);
            gameOverTitleEl.textContent = `🌻 ${strings.gameTargetReached}`;
        } else {
            gameOverTitleEl.textContent = strings.gameOverTitle;
        }

        finalScoreEl.textContent = `${strings.gameOverScore} ${score}`;
        playAgainBtn.textContent = strings.gamePlayAgain;
        gameOverEl.classList.add("visible");

        onGameOver(score);
    };

    /* ---- Restart ---- */

    const restart = (): void => {
        score = 0;
        round = 0;
        gameRunning = true;
        feedbackText = "";
        scoreEl.textContent = `${strings.scorePrefix}: 0`;
        gameOverEl.classList.remove("visible");

        const btns = numberPadEl.querySelectorAll<HTMLButtonElement>(".ng-num-btn");
        btns.forEach((b) => {
            b.classList.remove("ng-correct", "ng-wrong");
        });

        nextRound();
    };

    /* ---- Render loop ---- */

    const render = (): void => {
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, w, h);
        drawGardenBackground(ctx, w, h);

        // Draw flowers
        for (const f of flowers) {
            drawFlower(ctx, f);
        }

        // Draw count prompt
        if (!bloomAnimating && gameRunning && flowers.length > 0) {
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,0.85)";
            ctx.beginPath();
            ctx.roundRect(w / 2 - 100, 8, 200, 32, 8);
            ctx.fill();
            ctx.fillStyle = "#333";
            ctx.font = "bold 14px 'Press Start 2P', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`${strings.roundLabel} ${round}`, w / 2, 24);
            ctx.restore();
        }

        // Feedback text
        if (feedbackText && performance.now() - feedbackTimer < 1200) {
            const alpha = Math.max(0, 1 - (performance.now() - feedbackTimer) / 1200);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = feedbackColor;
            ctx.font = "bold 18px 'Press Start 2P', monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(feedbackText, w / 2, h * 0.32);
            ctx.restore();
        }

        animFrame = requestAnimationFrame(render);
    };

    /* ---- Easing ---- */

    const easeOutBack = (t: number): number => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    /* ---- Event handlers ---- */

    playAgainBtn.addEventListener("click", () => restart());

    const onResize = (): void => {
        resizeCanvas();
    };
    window.addEventListener("resize", onResize);

    /* ---- Init ---- */

    resizeCanvas();
    buildNumberPad();
    nextRound();
    render();

    hintEl.textContent = strings.roundLabel ? `${strings.correctLabel}` : "";
    // Set initial hint

    return {
        getMuted: () => muted,
        setMuted: (m: boolean) => {
            muted = m;
            config.onMutedChange(m);
        },
        restart
    };
};
