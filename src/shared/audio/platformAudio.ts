import { platformStorage } from "@shared/storage/platformStorage";

let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;

const ensureAudio = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;

  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;

  audioCtx = new Ctx();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.18;
  gainNode.connect(audioCtx.destination);
  return audioCtx;
};

export const unlockAudioContext = (): void => {
  const ctx = ensureAudio();
  if (!ctx || ctx.state !== "suspended") return;
  ctx.resume().catch(() => undefined);
};

export const isMuted = (): boolean => platformStorage.isGlobalMute();

export const setMuted = (muted: boolean): void => {
  platformStorage.setGlobalMute(muted);
};

export const toggleMuted = (): boolean => {
  const next = !isMuted();
  setMuted(next);
  return next;
};

const playTone = (frequency: number, duration = 0.07): void => {
  if (isMuted()) return;
  const ctx = ensureAudio();
  if (!ctx || !gainNode || ctx.state !== "running") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(frequency, now);

  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(env);
  env.connect(gainNode);
  osc.start(now);
  osc.stop(now + duration + 0.01);
};

export const playUiClick = (): void => playTone(330, 0.06);
