import type { LocaleCode } from "@shared/types/i18n";
import type { ThemePreference } from "@shared/ui/theme";

export type ThemeControlMode = "select" | "icons";

export interface SettingsMenuLabels {
  settingsLabel: string;
  settingsOpen: string;
  settingsClose: string;
  themeLabel: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  languageLabel: string;
  audioLabel: string;
  soundOn: string;
  soundOff: string;
  profileLabel?: string;
  createProfileLabel?: string;
}

export interface SettingsMenuConfig {
  idPrefix: string;
  isOpen: boolean;
  locale: LocaleCode;
  themePreference: ThemePreference;
  themeControlMode?: ThemeControlMode;
  muted: boolean;
  labels: SettingsMenuLabels;
  includeCreateProfile?: boolean;
}

export interface SettingsMenuHandlers {
  onOpenChange: (open: boolean) => void;
  onThemeChange: (theme: ThemePreference) => void;
  onLocaleChange: (locale: LocaleCode) => void;
  onToggleMuted: () => void;
  onCreateProfile?: () => void;
}

const idFor = (prefix: string, name: string): string => `${prefix}${name}`;

export const renderSettingsMenu = (root: HTMLElement, config: SettingsMenuConfig): void => {
  const {
    idPrefix,
    isOpen,
    locale,
    themePreference,
    themeControlMode = "select",
    muted,
    labels,
    includeCreateProfile = false
  } = config;

  const toggleId = idFor(idPrefix, "SettingsMenuBtn");
  const panelId = idFor(idPrefix, "SettingsPanel");
  const themeId = idFor(idPrefix, "ThemeSelect");
  const themeSystemId = idFor(idPrefix, "ThemeSystemBtn");
  const themeLightId = idFor(idPrefix, "ThemeLightBtn");
  const themeDarkId = idFor(idPrefix, "ThemeDarkBtn");
  const langEnId = idFor(idPrefix, "LangEn");
  const langEsId = idFor(idPrefix, "LangEs");
  const muteId = idFor(idPrefix, "SoundBtn");
  const createId = idFor(idPrefix, "CreateProfileBtn");
  const themeMarkup =
    themeControlMode === "icons"
      ? `
          <div class="settings-row">
            <span class="field-label">${labels.themeLabel}</span>
            <div class="theme-switch" role="group" aria-label="${labels.themeLabel}">
              <button
                type="button"
                id="${themeSystemId}"
                class="theme-icon-button"
                aria-label="${labels.themeLabel}: ${labels.themeSystem}"
                aria-pressed="${themePreference === "system" ? "true" : "false"}"
                title="${labels.themeSystem}"
              >
                <img src="/assets/ui/theme-system.svg" alt="" aria-hidden="true" />
              </button>
              <button
                type="button"
                id="${themeLightId}"
                class="theme-icon-button"
                aria-label="${labels.themeLabel}: ${labels.themeLight}"
                aria-pressed="${themePreference === "light" ? "true" : "false"}"
                title="${labels.themeLight}"
              >
                <img src="/assets/ui/theme-light.svg" alt="" aria-hidden="true" />
              </button>
              <button
                type="button"
                id="${themeDarkId}"
                class="theme-icon-button"
                aria-label="${labels.themeLabel}: ${labels.themeDark}"
                aria-pressed="${themePreference === "dark" ? "true" : "false"}"
                title="${labels.themeDark}"
              >
                <img src="/assets/ui/theme-dark.svg" alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
        `
      : `
          <div class="settings-row">
            <label class="field-label" for="${themeId}">${labels.themeLabel}</label>
            <select class="select" id="${themeId}">
              <option value="system" ${themePreference === "system" ? "selected" : ""}>${labels.themeSystem}</option>
              <option value="light" ${themePreference === "light" ? "selected" : ""}>${labels.themeLight}</option>
              <option value="dark" ${themePreference === "dark" ? "selected" : ""}>${labels.themeDark}</option>
            </select>
          </div>
        `;

  root.innerHTML = `
    <button
      type="button"
      id="${toggleId}"
      class="menu-toggle"
      aria-label="${isOpen ? labels.settingsClose : labels.settingsOpen}"
      aria-controls="${panelId}"
      aria-expanded="${isOpen ? "true" : "false"}"
    >
      <span class="menu-toggle-lines" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
    </button>
    <section
      class="panel settings-menu ${isOpen ? "open" : ""}"
      id="${panelId}"
      aria-hidden="${isOpen ? "false" : "true"}"
      ${isOpen ? "" : "hidden"}
    >
      <h2>${labels.settingsLabel}</h2>
      ${themeMarkup}
      <div class="settings-row">
        <span class="field-label">${labels.languageLabel}</span>
        <div class="lang-switch">
          <button type="button" id="${langEnId}" ${locale === "en" ? "disabled" : ""}>en</button>
          <button type="button" id="${langEsId}" ${locale === "es" ? "disabled" : ""}>es</button>
        </div>
      </div>
      <div class="settings-row">
        <span class="field-label">${labels.audioLabel}</span>
        <button type="button" id="${muteId}">${muted ? labels.soundOff : labels.soundOn}</button>
      </div>
      ${
        includeCreateProfile
          ? `<div class="settings-row">
               ${labels.profileLabel ? `<span class="field-label">${labels.profileLabel}</span>` : ""}
               <button type="button" id="${createId}">${labels.createProfileLabel ?? "create profile"}</button>
             </div>`
          : ""
      }
    </section>
  `;
};

export const bindSettingsMenuEvents = (
  root: HTMLElement,
  config: SettingsMenuConfig,
  handlers: SettingsMenuHandlers
): (() => void) => {
  const attachedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const toggleButton = root.querySelector<HTMLButtonElement>(`#${idFor(config.idPrefix, "SettingsMenuBtn")}`);
  const panel = root.querySelector<HTMLElement>(`#${idFor(config.idPrefix, "SettingsPanel")}`);
  const themeSelect = root.querySelector<HTMLSelectElement>(`#${idFor(config.idPrefix, "ThemeSelect")}`);
  const themeSystemButton = root.querySelector<HTMLButtonElement>(`#${idFor(config.idPrefix, "ThemeSystemBtn")}`);
  const themeLightButton = root.querySelector<HTMLButtonElement>(`#${idFor(config.idPrefix, "ThemeLightBtn")}`);
  const themeDarkButton = root.querySelector<HTMLButtonElement>(`#${idFor(config.idPrefix, "ThemeDarkBtn")}`);
  const langEnButton = root.querySelector<HTMLButtonElement>(`#${idFor(config.idPrefix, "LangEn")}`);
  const langEsButton = root.querySelector<HTMLButtonElement>(`#${idFor(config.idPrefix, "LangEs")}`);
  const soundButton = root.querySelector<HTMLButtonElement>(`#${idFor(config.idPrefix, "SoundBtn")}`);
  const createProfileButton = root.querySelector<HTMLButtonElement>(
    `#${idFor(config.idPrefix, "CreateProfileBtn")}`
  );

  const onToggle = (event: Event): void => {
    event.stopPropagation();
    handlers.onOpenChange(!config.isOpen);
  };

  const onPanelClick = (event: Event): void => {
    event.stopPropagation();
  };

  const onThemeChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const next = target.value === "light" || target.value === "dark" ? target.value : "system";
    handlers.onThemeChange(next);
  };
  const onThemeSystemClick = (): void => handlers.onThemeChange("system");
  const onThemeLightClick = (): void => handlers.onThemeChange("light");
  const onThemeDarkClick = (): void => handlers.onThemeChange("dark");

  const onOutsideClick = (event: MouseEvent): void => {
    if (event.timeStamp <= attachedAt) return;
    if (!config.isOpen) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (root.contains(target)) return;
    handlers.onOpenChange(false);
  };

  const onEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || !config.isOpen) return;
    handlers.onOpenChange(false);
    toggleButton?.focus();
  };

  toggleButton?.addEventListener("click", onToggle);
  panel?.addEventListener("click", onPanelClick);
  themeSelect?.addEventListener("change", onThemeChange);
  themeSystemButton?.addEventListener("click", onThemeSystemClick);
  themeLightButton?.addEventListener("click", onThemeLightClick);
  themeDarkButton?.addEventListener("click", onThemeDarkClick);
  langEnButton?.addEventListener("click", () => handlers.onLocaleChange("en"));
  langEsButton?.addEventListener("click", () => handlers.onLocaleChange("es"));
  soundButton?.addEventListener("click", handlers.onToggleMuted);
  createProfileButton?.addEventListener("click", () => handlers.onCreateProfile?.());
  window.addEventListener("click", onOutsideClick);
  window.addEventListener("keydown", onEscape);

  return () => {
    toggleButton?.removeEventListener("click", onToggle);
    panel?.removeEventListener("click", onPanelClick);
    themeSelect?.removeEventListener("change", onThemeChange);
    themeSystemButton?.removeEventListener("click", onThemeSystemClick);
    themeLightButton?.removeEventListener("click", onThemeLightClick);
    themeDarkButton?.removeEventListener("click", onThemeDarkClick);
    window.removeEventListener("click", onOutsideClick);
    window.removeEventListener("keydown", onEscape);
  };
};
