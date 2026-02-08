import "@shared/ui/base.css";
import "@shared/ui/gameHeader.css";
import "@games/fruit-stacker/styles.css";
import { createI18n } from "@shared/i18n";
import { getAllGames } from "@platform/gameRegistry";
import { platformStorage } from "@shared/storage/platformStorage";
import { initFruitStacker } from "@games/fruit-stacker/game";
import { applyTheme, watchSystemTheme } from "@shared/ui/theme";
import { renderGameHeader } from "@shared/ui/gameHeader";

const byId = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing required element: #${id}`);
  return node as T;
};

const i18n = createI18n(window.location.search);
const themePreference = platformStorage.getThemePreference();

applyTheme(themePreference);
watchSystemTheme(themePreference, () => {
  applyTheme(themePreference);
});

const headerRoot = byId<HTMLElement>("gameHeaderMount");
const canvas = byId<HTMLCanvasElement>("game");
const boardEl = byId<HTMLElement>("board");
const gameOverEl = byId<HTMLElement>("gameOver");
const finalScoreEl = byId<HTMLElement>("finalScore");
const gameOverTitleEl = byId<HTMLElement>("gameOverTitle");
const playAgainBtn = byId<HTMLButtonElement>("playAgainBtn");
const hint = byId<HTMLElement>("hint");

const profiles = platformStorage.listProfiles();
let activeId = platformStorage.getActiveProfileId();
if (!activeId || !profiles.some((profile) => profile.id === activeId)) {
  const guest = platformStorage.createProfile(i18n.t("profileGuest"), "berry");
  platformStorage.setActiveProfile(guest.id);
  activeId = guest.id;
}

const profileId = activeId;
if (!profileId) throw new Error("No active profile available");

const manifest = getAllGames().find((game) => game.id === "fruit-stacker");
if (!manifest) throw new Error("Fruit Stacker manifest is missing");

renderGameHeader(headerRoot, {
  title: manifest.title[i18n.locale],
  backHref: "/",
  backLabel: i18n.t("gameBackToLauncher"),
  leftMeta: [
    { id: "score", text: `${i18n.t("gameScorePrefix")}: 0` },
    { id: "bestScore", text: `${i18n.t("highScoreLabel")}: 0` }
  ],
  rightActions: [
    { id: "soundToggleBtn", label: platformStorage.isGlobalMute() ? i18n.t("gameSoundOff") : i18n.t("gameSoundOn"), pressed: platformStorage.isGlobalMute() },
    { id: "restartBtn", label: i18n.t("gameRestart") }
  ],
  ariaLabel: "game status"
});

const scoreEl = byId<HTMLElement>("score");
const bestScoreEl = byId<HTMLElement>("bestScore");
const soundToggleBtn = byId<HTMLButtonElement>("soundToggleBtn");
const restartBtn = byId<HTMLButtonElement>("restartBtn");

hint.textContent = i18n.t("gameHintFruitStacker");

const mediumPreset = manifest.difficultyPresets["6-7"];

const calculateStars = (score: number): number => {
  if (score >= Math.round(mediumPreset.goalScore * 1.4)) return 3;
  if (score >= mediumPreset.goalScore) return 2;
  if (score >= Math.round(mediumPreset.goalScore * 0.6)) return 1;
  return 0;
};

const updateBestScoreUi = (): void => {
  const progress = platformStorage.getGameProgress(profileId, "fruit-stacker");
  bestScoreEl.textContent = `${i18n.t("highScoreLabel")}: ${progress.highScore}`;
};

updateBestScoreUi();

initFruitStacker({
  canvas,
  boardEl,
  scoreEl,
  gameOverEl,
  finalScoreEl,
  gameOverTitleEl,
  soundToggleBtn,
  restartBtn,
  playAgainBtn,
  strings: {
    scorePrefix: i18n.t("gameScorePrefix"),
    gameOverScore: `${i18n.t("gameOverScore")}:`,
    gameOverTitle: i18n.t("gameOverTitle"),
    gamePlayAgain: i18n.t("gamePlayAgain"),
    gameRestart: i18n.t("gameRestart"),
    gameNext: i18n.t("gameNext"),
    gameSoundOn: i18n.t("gameSoundOn"),
    gameSoundOff: i18n.t("gameSoundOff")
  },
  initialMuted: platformStorage.isGlobalMute(),
  dropCooldownMs: mediumPreset.dropCooldownMs,
  onMutedChange(muted) {
    platformStorage.setGlobalMute(muted);
  },
  onGameOver(score) {
    const current = platformStorage.getGameProgress(profileId, "fruit-stacker");
    const stars = calculateStars(score);
    platformStorage.saveGameProgress(profileId, "fruit-stacker", {
      highScore: Math.max(current.highScore, score),
      stars,
      plays: current.plays + 1,
      lastPlayedAt: new Date().toISOString()
    });

    if (stars >= 3) {
      platformStorage.unlockBadge(profileId, "fruit-stacker-master");
    }

    updateBestScoreUi();
  }
});
