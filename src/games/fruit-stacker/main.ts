import "@shared/ui/base.css";
import "@shared/ui/gameHeader.css";
import "@shared/ui/settingsMenu.css";
import "@games/fruit-stacker/styles.css";
import { createI18n } from "@shared/i18n";
import { getAllGames } from "@platform/gameRegistry";
import { platformStorage } from "@shared/storage/platformStorage";
import { initFruitStacker } from "@games/fruit-stacker/game";
import { applyTheme, watchSystemTheme, type ThemePreference } from "@shared/ui/theme";
import { renderGameHeader, updateGameHeaderAction, updateGameHeaderMeta } from "@shared/ui/gameHeader";
import { bindSettingsMenuEvents, renderSettingsMenu, type SettingsMenuConfig } from "@shared/ui/settingsMenu";

const byId = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing required element: #${id}`);
  return node as T;
};

const i18n = createI18n(window.location.search);
let themePreference: ThemePreference = platformStorage.getThemePreference();
let gameSettingsOpen = false;
let cleanupGameSettingsMenu: (() => void) | null = null;
let stopThemeWatch: (() => void) | null = null;

const syncTheme = (): void => {
  applyTheme(themePreference);
  stopThemeWatch?.();
  stopThemeWatch = watchSystemTheme(themePreference, () => {
    applyTheme(themePreference);
  });
};

syncTheme();

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

const renderHeader = () => {
  renderGameHeader(headerRoot, {
    title: manifest.title[i18n.locale],
    backHref: "/",
    backLabel: i18n.t("gameBackToLauncher"),
    leftMeta: [{ id: "score", text: `${i18n.t("gameScorePrefix")}: 0` }],
    rightActions: [], // Removed sound, restart, immersive from main header
    ariaLabel: "game status"
  });
};

renderHeader();

const scoreEl = byId<HTMLElement>("score");

hint.textContent = i18n.t("gameHintFruitStacker");

const mediumPreset = manifest.difficultyPresets["6-7"];

const calculateStars = (score: number): number => {
  if (score >= Math.round(mediumPreset.goalScore * 1.4)) return 3;
  if (score >= mediumPreset.goalScore) return 2;
  if (score >= Math.round(mediumPreset.goalScore * 0.6)) return 1;
  return 0;
};

const gameApi = initFruitStacker({
  canvas,
  boardEl,
  scoreEl,
  gameOverEl,
  finalScoreEl,
  gameOverTitleEl,
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
    renderGameSettingsMenu();
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
  },
  onScoreChange(score) {
    updateGameHeaderMeta(headerRoot, "score", `${i18n.t("gameScorePrefix")}: ${score}`);
  }
});

const createProfile = (): void => {
  const name = window.prompt(i18n.t("profileCreatePrompt"));
  if (!name) return;
  const profile = platformStorage.createProfile(name, "berry");
  platformStorage.setActiveProfile(profile.id);
  window.location.reload();
};

const ensureSettingsRoot = (): HTMLElement => {
  let root = headerRoot.querySelector<HTMLElement>("#gameSettingsMenuMount");
  if (root) return root;

  root = document.createElement("div");
  root.id = "gameSettingsMenuMount";
  root.className = "settings-menu-wrap game-settings-wrap";
  const actions = headerRoot.querySelector<HTMLElement>(".game-header-actions");
  actions?.appendChild(root);
  return root;
};

const renderGameSettingsMenu = (): void => {
  cleanupGameSettingsMenu?.();
  cleanupGameSettingsMenu = null;

  const menuRoot = ensureSettingsRoot();

  const config: SettingsMenuConfig = {
    idPrefix: "game",
    isOpen: gameSettingsOpen,
    locale: i18n.locale,
    themePreference,
    muted: gameApi.getMuted(),
    includeCreateProfile: true,
    labels: {
      settingsLabel: i18n.t("settingsLabel"),
      settingsOpen: i18n.t("settingsOpen"),
      settingsClose: i18n.t("settingsClose"),
      themeLabel: i18n.t("themeLabel"),
      themeSystem: i18n.t("themeSystem"),
      themeLight: i18n.t("themeLight"),
      themeDark: i18n.t("themeDark"),
      languageLabel: i18n.t("languageLabel"),
      audioLabel: i18n.t("audioLabel"),
      soundOn: i18n.t("gameSoundOn"),
      soundOff: i18n.t("gameSoundOff"),
      profileLabel: i18n.t("settingsProfileLabel"),
      createProfileLabel: i18n.t("profileCreate"),
      restartLabel: i18n.t("gameRestart"), // Moved to menu
      fullscreenLabel: "Fullscreen" // Moved to menu
    }
  };

  renderSettingsMenu(menuRoot, config);

  cleanupGameSettingsMenu = bindSettingsMenuEvents(menuRoot, config, {
    onOpenChange(open) {
      gameSettingsOpen = open;
      renderGameSettingsMenu();
    },
    onThemeChange(theme) {
      themePreference = theme;
      platformStorage.setThemePreference(theme);
      syncTheme();
      renderGameSettingsMenu();
    },
    onLocaleChange(locale) {
      i18n.setLocale(locale);
      window.location.reload();
    },
    onToggleMuted() {
      const next = !gameApi.getMuted();
      gameApi.setMuted(next);
      renderGameSettingsMenu();
    },
    onRestart() {
      gameApi.restart();
      gameSettingsOpen = false;
      renderGameSettingsMenu();
    },
    onToggleImmersive() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      gameSettingsOpen = false;
      renderGameSettingsMenu();
    },
    onCreateProfile() {
      createProfile();
      gameSettingsOpen = false;
      renderGameSettingsMenu();
    }
  });
};

renderGameSettingsMenu();
