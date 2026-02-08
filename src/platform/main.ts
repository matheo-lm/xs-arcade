import "@shared/ui/base.css";
import "@platform/styles.css";
import { createI18n } from "@shared/i18n";
import { playUiClick, setMuted, toggleMuted, unlockAudioContext, isMuted } from "@shared/audio/platformAudio";
import { filterGames } from "@platform/gameRegistry";
import { platformStorage } from "@shared/storage/platformStorage";
import { applyTheme, watchSystemTheme, type ThemePreference } from "@shared/ui/theme";
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
          <div class="tag-row">${ageTags}</div>
          <div class="tag-row">${skillTags}</div>
          <div class="card-actions">
            <a href="${game.path}">
              <button class="button" type="button" ${playable ? "" : "disabled"}>${buttonText}</button>
            </a>
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
      <div class="launcher-brand">
        <h1 class="launcher-title">${i18n.t("appTitle")}</h1>
        <p class="launcher-subtitle">${i18n.t("appSubtitle")}</p>
      </div>
      <div class="launcher-menu-wrap">
        <button
          type="button"
          id="settingsMenuBtn"
          class="menu-toggle"
          aria-label="${settingsMenuOpen ? i18n.t("settingsClose") : i18n.t("settingsOpen")}"
          aria-controls="settingsPanel"
          aria-expanded="${settingsMenuOpen ? "true" : "false"}"
        >
          <span class="menu-toggle-lines" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
        </button>
        <section
          class="panel settings-menu ${settingsMenuOpen ? "open" : ""}"
          id="settingsPanel"
          aria-hidden="${settingsMenuOpen ? "false" : "true"}"
          ${settingsMenuOpen ? "" : "hidden"}
        >
          <h2>${i18n.t("settingsLabel")}</h2>
          <div class="settings-row">
            <label class="field-label" for="themeSelect">${i18n.t("themeLabel")}</label>
            <select class="select" id="themeSelect">
              <option value="system" ${themePreference === "system" ? "selected" : ""}>${i18n.t("themeSystem")}</option>
              <option value="light" ${themePreference === "light" ? "selected" : ""}>${i18n.t("themeLight")}</option>
              <option value="dark" ${themePreference === "dark" ? "selected" : ""}>${i18n.t("themeDark")}</option>
            </select>
          </div>
          <div class="settings-row">
            <span class="field-label">${i18n.t("languageLabel")}</span>
            <div class="lang-switch">
              <button type="button" id="langEn" ${i18n.locale === "en" ? "disabled" : ""}>en</button>
              <button type="button" id="langEs" ${i18n.locale === "es" ? "disabled" : ""}>es</button>
            </div>
          </div>
          <div class="settings-row">
            <span class="field-label">${i18n.t("audioLabel")}</span>
            <button type="button" id="muteBtn">${isMuted() ? i18n.t("muteOff") : i18n.t("muteOn")}</button>
          </div>
        </section>
      </div>
    </header>

    <section class="panel top-controls" aria-label="launcher controls">
      <div>
        <label class="field-label" for="profileSelect">${i18n.t("profileLabel")}</label>
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

      <div>
        <label class="field-label" for="ageFilter">${i18n.t("filterAge")}</label>
        <select class="select" id="ageFilter">
          <option value="">${i18n.t("filterAllAges")}</option>
          <option value="4-5" ${selectedAge === "4-5" ? "selected" : ""}>${i18n.t("ageBand45")}</option>
          <option value="6-7" ${selectedAge === "6-7" ? "selected" : ""}>${i18n.t("ageBand67")}</option>
          <option value="8" ${selectedAge === "8" ? "selected" : ""}>${i18n.t("ageBand8")}</option>
        </select>
      </div>

      <div>
        <label class="field-label" for="skillFilter">${i18n.t("filterSkill")}</label>
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

      <div>
        <button type="button" id="createProfileBtn">${i18n.t("profileCreate")}</button>
      </div>
    </section>

    <section class="panel profile-stats" aria-label="profile summary">
      <span class="stat-pill">${i18n.t("starsLabel")}: ${totalStars}</span>
      <span class="stat-pill">${i18n.t("badgesLabel")}: ${totalBadges}</span>
      <span class="stat-pill">${i18n.t("highScoreLabel")} (fruit stacker): ${fruitBest}</span>
    </section>

    <section class="game-grid" aria-label="game list">
      ${renderCards(games)}
    </section>
  `;

  wireImageFallbacks(app);

  const profileSelect = document.getElementById("profileSelect") as HTMLSelectElement | null;
  const ageFilter = document.getElementById("ageFilter") as HTMLSelectElement | null;
  const skillFilter = document.getElementById("skillFilter") as HTMLSelectElement | null;
  const createProfileBtn = document.getElementById("createProfileBtn") as HTMLButtonElement | null;
  const muteBtn = document.getElementById("muteBtn") as HTMLButtonElement | null;
  const langEn = document.getElementById("langEn") as HTMLButtonElement | null;
  const langEs = document.getElementById("langEs") as HTMLButtonElement | null;
  const themeSelect = document.getElementById("themeSelect") as HTMLSelectElement | null;
  const settingsMenuBtn = document.getElementById("settingsMenuBtn") as HTMLButtonElement | null;
  const settingsPanel = document.getElementById("settingsPanel") as HTMLElement | null;

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

  createProfileBtn?.addEventListener("click", () => {
    unlockAudioContext();
    playUiClick();
    const name = window.prompt(i18n.t("profileCreatePrompt"));
    if (!name) return;

    const avatarId = avatarRotation[Math.floor(Math.random() * avatarRotation.length)];
    const profile = platformStorage.createProfile(name, avatarId);
    platformStorage.setActiveProfile(profile.id);
    render();
  });

  muteBtn?.addEventListener("click", () => {
    unlockAudioContext();
    toggleMuted();
    playUiClick();
    render();
  });

  langEn?.addEventListener("click", () => {
    i18n.setLocale("en");
    render();
  });

  langEs?.addEventListener("click", () => {
    i18n.setLocale("es");
    render();
  });

  themeSelect?.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    const next = target.value === "light" || target.value === "dark" ? target.value : "system";
    setThemePreference(next);
  });

  settingsMenuBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    settingsMenuOpen = !settingsMenuOpen;
    render();
  });

  settingsPanel?.addEventListener("click", (event) => {
    event.stopPropagation();
  });
};

window.addEventListener("pointerdown", unlockAudioContext, { passive: true });
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !settingsMenuOpen) return;
  settingsMenuOpen = false;
  render();
  const button = document.getElementById("settingsMenuBtn") as HTMLButtonElement | null;
  button?.focus();
});
window.addEventListener("click", (event) => {
  if (!settingsMenuOpen) return;
  const panel = document.getElementById("settingsPanel");
  const button = document.getElementById("settingsMenuBtn");
  const eventTarget = event.target;
  if (
    eventTarget instanceof Node &&
    (panel?.contains(eventTarget) || button?.contains(eventTarget))
  ) {
    return;
  }
  settingsMenuOpen = false;
  render();
});

registerServiceWorker().catch(() => undefined);
setMuted(platformStorage.isGlobalMute());
syncTheme();
render();
