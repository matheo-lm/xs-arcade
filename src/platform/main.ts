import "@shared/ui/base.css";
import "@platform/styles.css";
import { createI18n } from "@shared/i18n";
import { playUiClick, setMuted, toggleMuted, unlockAudioContext, isMuted } from "@shared/audio/platformAudio";
import { filterGames } from "@platform/gameRegistry";
import { platformStorage } from "@shared/storage/platformStorage";
import type { AgeBand, GameManifest, SkillTag } from "@shared/types/game";

const app = document.getElementById("app");
if (!app) throw new Error("Launcher root #app is missing");

const i18n = createI18n(window.location.search);
const avatarRotation = ["berry", "rocket", "leaf", "sun"];

let selectedAge: AgeBand | "" = "";
let selectedSkill: SkillTag | "" = "";

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
            <span class="card-icon" aria-hidden="true">${game.cardIcon}</span>
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
      <h1 class="launcher-title">${i18n.t("appTitle")}</h1>
      <p class="launcher-subtitle">${i18n.t("appSubtitle")}</p>
    </header>

    <section class="panel top-controls" aria-label="Launcher controls">
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

      <div class="lang-switch">
        <button type="button" id="langEn" ${i18n.locale === "en" ? "disabled" : ""}>EN</button>
        <button type="button" id="langEs" ${i18n.locale === "es" ? "disabled" : ""}>ES</button>
      </div>

      <div>
        <button type="button" id="createProfileBtn">${i18n.t("profileCreate")}</button>
      </div>

      <div>
        <button type="button" id="muteBtn">${isMuted() ? i18n.t("muteOff") : i18n.t("muteOn")}</button>
      </div>
    </section>

    <section class="panel profile-stats" aria-label="Profile summary">
      <span class="stat-pill">${i18n.t("starsLabel")}: ${totalStars}</span>
      <span class="stat-pill">${i18n.t("badgesLabel")}: ${totalBadges}</span>
      <span class="stat-pill">${i18n.t("highScoreLabel")} (Fruit Stacker): ${fruitBest}</span>
    </section>

    <section class="game-grid" aria-label="Game list">
      ${renderCards(games)}
    </section>
  `;

  const profileSelect = document.getElementById("profileSelect") as HTMLSelectElement | null;
  const ageFilter = document.getElementById("ageFilter") as HTMLSelectElement | null;
  const skillFilter = document.getElementById("skillFilter") as HTMLSelectElement | null;
  const createProfileBtn = document.getElementById("createProfileBtn") as HTMLButtonElement | null;
  const muteBtn = document.getElementById("muteBtn") as HTMLButtonElement | null;
  const langEn = document.getElementById("langEn") as HTMLButtonElement | null;
  const langEs = document.getElementById("langEs") as HTMLButtonElement | null;

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
};

window.addEventListener("pointerdown", unlockAudioContext, { passive: true });
registerServiceWorker().catch(() => undefined);
setMuted(platformStorage.isGlobalMute());
render();
