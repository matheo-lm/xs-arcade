import "@shared/ui/base.css";
import "@shared/ui/settingsMenu.css";
import "@platform/styles.css";
import { createI18n } from "@shared/i18n";
import { playUiClick, setMuted, toggleMuted, unlockAudioContext, isMuted } from "@shared/audio/platformAudio";
import { filterGames } from "@platform/gameRegistry";
import { platformStorage } from "@shared/storage/platformStorage";
import { applyTheme, watchSystemTheme, type ThemePreference } from "@shared/ui/theme";
import { bindSettingsMenuEvents, renderSettingsMenu, type SettingsMenuConfig } from "@shared/ui/settingsMenu";
import type { AgeBand, GameManifest, SkillTag } from "@shared/types/game";

const app = document.getElementById("app");
if (!app) throw new Error("Launcher root #app is missing");

const i18n = createI18n(window.location.search);
const avatarRotation = ["berry", "rocket", "leaf", "sun"];

let selectedAge: AgeBand | "" = "";
let selectedSkill: SkillTag | "" = "";
let settingsMenuOpen = false;
let themePreference: ThemePreference = platformStorage.getThemePreference();
let stopThemeWatch: (() => void) | null = null;
let cleanupSettingsMenu: (() => void) | null = null;

const syncTheme = (): void => {
  applyTheme(themePreference);
  stopThemeWatch?.();
  stopThemeWatch = watchSystemTheme(themePreference, () => {
    applyTheme(themePreference);
  });
};

const setThemePreference = (next: ThemePreference): void => {
  themePreference = next;
  platformStorage.setThemePreference(next);
  syncTheme();
};

const ensureDefaultProfile = (): void => {
  const profiles = platformStorage.listProfiles();
  if (profiles.length === 0) {
    platformStorage.createProfile(i18n.t("profileGuest"), avatarRotation[0]);
  }
};

const getActiveProfile = () => {
  const profiles = platformStorage.listProfiles();
  const activeId = platformStorage.getActiveProfileId();
  return profiles.find((profile) => profile.id === activeId) ?? profiles[0] ?? null;
};

const ageLabel = (age: AgeBand): string => {
  if (age === "4-5") return i18n.t("ageBand45");
  if (age === "6-7") return i18n.t("ageBand67");
  return i18n.t("ageBand8");
};

const skillLabel = (skill: SkillTag): string => {
  const map: Record<SkillTag, ReturnType<typeof i18n.t>> = {
    numeracy: i18n.t("skillNumeracy"),
    literacy: i18n.t("skillLiteracy"),
    logic: i18n.t("skillLogic"),
    memory: i18n.t("skillMemory"),
    creativity: i18n.t("skillCreativity"),
    spatial: i18n.t("skillSpatial")
  };
  return map[skill];
};

const createProfile = (): void => {
  unlockAudioContext();
  playUiClick();
  const name = window.prompt(i18n.t("profileCreatePrompt"));
  if (!name) return;

  const avatarId = avatarRotation[Math.floor(Math.random() * avatarRotation.length)];
  const profile = platformStorage.createProfile(name, avatarId);
  platformStorage.setActiveProfile(profile.id);
};

const iconMarkup = (game: GameManifest): string => {
  const fallback = game.cardIconFallback ?? "/assets/icon.svg";
  return `<img class="card-icon-img" src="${game.cardIcon}" data-fallback="${fallback}" alt="" aria-hidden="true" loading="lazy" decoding="async" />`;
};

const renderCards = (games: GameManifest[]): string =>
  games
    .map((game) => {
      const playable = game.status === "playable";
      const statusClass = playable ? "" : "status-placeholder";
      const buttonText = playable ? i18n.t("ctaPlay") : i18n.t("ctaComingSoon");
      const statusText = playable ? i18n.t("statusPlayable") : i18n.t("statusPlaceholder");
      const ageTags = game.ageBands.map((age) => `<span class=\"tag\">${ageLabel(age)}</span>`).join("");
      const skillTags = game.skills.map((skill) => `<span class=\"tag\">${skillLabel(skill)}</span>`).join("");

      return `
        <article class="panel game-card" data-game-id="${game.id}">
          <div class="card-top">
            <span class="card-icon" aria-hidden="true">${iconMarkup(game)}</span>
            <span class="status-pill ${statusClass}">${statusText}</span>
          </div>
          <h2>${game.title[i18n.locale]}</h2>
          <p>${game.description[i18n.locale]}</p>
          <div class="card-details">
            <div class="card-tags">
              <div class="tag-row">${ageTags}</div>
              <div class="tag-row">${skillTags}</div>
            </div>
            <div class="card-actions">
              <a href="${game.path}">
                <button class="button" type="button" ${playable ? "" : "disabled"}>${buttonText}</button>
              </a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

const wireImageFallbacks = (root: ParentNode): void => {
  const icons = root.querySelectorAll<HTMLImageElement>("img[data-fallback]");
  icons.forEach((img) => {
    const fallback = img.dataset.fallback;
    if (!fallback) return;

    let usedFallback = false;
    img.addEventListener("error", () => {
      if (usedFallback) return;
      usedFallback = true;
      img.src = fallback;
    });
  });
};

const registerServiceWorker = async (): Promise<void> => {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (_err) {
    // Ignore registration failures; app remains fully online-first.
  }
};

const render = (): void => {
  cleanupSettingsMenu?.();
  cleanupSettingsMenu = null;

  ensureDefaultProfile();

  const active = getActiveProfile();
  if (!active) return;

  const games = filterGames({
    ageBand: selectedAge || undefined,
    skillTag: selectedSkill || undefined,
    locale: i18n.locale
  });

  const totalStars = games.reduce((sum, game) => {
    return sum + platformStorage.getGameProgress(active.id, game.id).stars;
  }, 0);

  const totalBadges = Object.keys(platformStorage.listBadges(active.id)).length;
  const fruitBest = platformStorage.getGameProgress(active.id, "fruit-stacker").highScore;

  app.innerHTML = `
    <header class="panel launcher-header">
      <div class="launcher-header-main">
        <div class="launcher-brand">
          <h1 class="launcher-title">${i18n.t("appTitle")}</h1>
          <div class="launcher-stats" aria-label="profile summary">
            <span class="stat-chip" title="${i18n.t("statsStarsTooltip")}: ${totalStars}" aria-label="${i18n.t("statsStarsTooltip")}: ${totalStars}">
              <img src="/assets/ui/stat-stars.svg" alt="" aria-hidden="true" />
              <strong>${totalStars}</strong>
            </span>
            <span class="stat-chip" title="${i18n.t("statsBadgesTooltip")}: ${totalBadges}" aria-label="${i18n.t("statsBadgesTooltip")}: ${totalBadges}">
              <img src="/assets/ui/stat-badges.svg" alt="" aria-hidden="true" />
              <strong>${totalBadges}</strong>
            </span>
            <span class="stat-chip" title="${i18n.t("statsHighScoreTooltip")}: ${fruitBest}" aria-label="${i18n.t("statsHighScoreTooltip")}: ${fruitBest}">
              <img src="/assets/ui/stat-high-score.svg" alt="" aria-hidden="true" />
              <strong>${fruitBest}</strong>
            </span>
          </div>
        </div>
        <section class="launcher-controls" aria-label="launcher controls">
          <p class="launcher-subtitle">${i18n.t("appSubtitle")}</p>
          <div class="launcher-control-field">
            <label class="field-label launcher-control-label" for="profileSelect">${i18n.t("profileLabel")}</label>
            <select class="select" id="profileSelect">
              ${platformStorage
                .listProfiles()
                .map(
                  (profile) =>
                    `<option value="${profile.id}" ${profile.id === active.id ? "selected" : ""}>${profile.name}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="launcher-control-field">
            <label class="field-label launcher-control-label" for="ageFilter">${i18n.t("filterAge")}</label>
            <select class="select" id="ageFilter">
              <option value="">${i18n.t("filterAllAges")}</option>
              <option value="4-5" ${selectedAge === "4-5" ? "selected" : ""}>${i18n.t("ageBand45")}</option>
              <option value="6-7" ${selectedAge === "6-7" ? "selected" : ""}>${i18n.t("ageBand67")}</option>
              <option value="8" ${selectedAge === "8" ? "selected" : ""}>${i18n.t("ageBand8")}</option>
            </select>
          </div>
          <div class="launcher-control-field">
            <label class="field-label launcher-control-label" for="skillFilter">${i18n.t("filterSkill")}</label>
            <select class="select" id="skillFilter">
              <option value="">${i18n.t("filterAllSkills")}</option>
              <option value="numeracy" ${selectedSkill === "numeracy" ? "selected" : ""}>${i18n.t("skillNumeracy")}</option>
              <option value="literacy" ${selectedSkill === "literacy" ? "selected" : ""}>${i18n.t("skillLiteracy")}</option>
              <option value="logic" ${selectedSkill === "logic" ? "selected" : ""}>${i18n.t("skillLogic")}</option>
              <option value="memory" ${selectedSkill === "memory" ? "selected" : ""}>${i18n.t("skillMemory")}</option>
              <option value="creativity" ${selectedSkill === "creativity" ? "selected" : ""}>${i18n.t("skillCreativity")}</option>
              <option value="spatial" ${selectedSkill === "spatial" ? "selected" : ""}>${i18n.t("skillSpatial")}</option>
            </select>
          </div>
        </section>
      </div>
      <div class="launcher-header-actions">
        <div id="settingsMenuMount" class="settings-menu-wrap launcher-menu-wrap"></div>
      </div>
    </header>

    <section class="game-grid" aria-label="game list">
      ${renderCards(games)}
    </section>

    <footer class="panel launcher-footer" aria-label="launcher footer">
      <a
        class="pixel-link footer-link"
        href="https://github.com/matheo-lm/berries#readme"
        target="_blank"
        rel="noopener noreferrer"
      >${i18n.t("footerAbout")}</a>
      <p class="footer-credit">
        <span>${i18n.t("footerMadeWith")}</span>
        <span class="footer-heart" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="6" y="4" width="4" height="4"></rect>
            <rect x="14" y="4" width="4" height="4"></rect>
            <rect x="4" y="8" width="4" height="4"></rect>
            <rect x="8" y="8" width="4" height="4"></rect>
            <rect x="12" y="8" width="4" height="4"></rect>
            <rect x="16" y="8" width="4" height="4"></rect>
            <rect x="6" y="12" width="4" height="4"></rect>
            <rect x="10" y="12" width="4" height="4"></rect>
            <rect x="14" y="12" width="4" height="4"></rect>
            <rect x="8" y="16" width="4" height="4"></rect>
            <rect x="12" y="16" width="4" height="4"></rect>
            <rect x="10" y="20" width="4" height="2"></rect>
          </svg>
        </span>
        <span>${i18n.t("footerByX")}</span>
      </p>
      <a
        class="footer-github-link"
        href="https://github.com/matheo-lm/berries"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="${i18n.t("footerContributeAria")}"
      >
        <svg class="footer-github-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-2c-2.8.6-3.4-1.3-3.4-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 0 1.6 1 1.6 1 .9 1.5 2.4 1 3 1 .1-.7.3-1 .6-1.3-2.2-.2-4.6-1.1-4.6-4.9 0-1.1.4-2.1 1-2.8-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.9 1a9.7 9.7 0 0 1 5.2 0c2-1.3 2.9-1 2.9-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.7 1 2.8 0 3.8-2.4 4.7-4.7 4.9.4.3.7 1 .7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"></path>
        </svg>
        <span>${i18n.t("footerContribute")}</span>
      </a>
    </footer>
  `;

  const settingsMenuMount = document.getElementById("settingsMenuMount") as HTMLElement | null;
  const settingsConfig: SettingsMenuConfig = {
    idPrefix: "launcher",
    isOpen: settingsMenuOpen,
    locale: i18n.locale,
    themePreference,
    themeControlMode: "icons",
    muted: isMuted(),
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
      soundOn: i18n.t("muteOn"),
      soundOff: i18n.t("muteOff"),
      profileLabel: i18n.t("settingsProfileLabel"),
      createProfileLabel: i18n.t("profileCreate")
    }
  };

  if (settingsMenuMount) {
    renderSettingsMenu(settingsMenuMount, settingsConfig);
    cleanupSettingsMenu = bindSettingsMenuEvents(settingsMenuMount, settingsConfig, {
      onOpenChange(open) {
        settingsMenuOpen = open;
        render();
      },
      onThemeChange(theme) {
        setThemePreference(theme);
        render();
      },
      onLocaleChange(locale) {
        i18n.setLocale(locale);
        render();
      },
      onToggleMuted() {
        unlockAudioContext();
        toggleMuted();
        playUiClick();
        render();
      },
      onCreateProfile() {
        createProfile();
        settingsMenuOpen = false;
        render();
      }
    });
  }

  wireImageFallbacks(app);

  const profileSelect = document.getElementById("profileSelect") as HTMLSelectElement | null;
  const ageFilter = document.getElementById("ageFilter") as HTMLSelectElement | null;
  const skillFilter = document.getElementById("skillFilter") as HTMLSelectElement | null;

  profileSelect?.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    platformStorage.setActiveProfile(target.value);
    render();
  });

  ageFilter?.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    selectedAge = target.value as AgeBand | "";
    render();
  });

  skillFilter?.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    selectedSkill = target.value as SkillTag | "";
    render();
  });
};

window.addEventListener("pointerdown", unlockAudioContext, { passive: true });
registerServiceWorker().catch(() => undefined);
setMuted(platformStorage.isGlobalMute());
syncTheme();
render();
