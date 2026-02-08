export type ThemePreference = "system" | "light" | "dark";
export type ThemeMode = "light" | "dark";

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

export const resolveTheme = (preference: ThemePreference): ThemeMode => {
  if (preference === "light" || preference === "dark") return preference;
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia(MEDIA_QUERY).matches ? "dark" : "light";
};

export const applyTheme = (preference: ThemePreference): ThemeMode => {
  const mode = resolveTheme(preference);
  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.setAttribute("data-theme-preference", preference);
  return mode;
};

export const watchSystemTheme = (
  preference: ThemePreference,
  onChange: (mode: ThemeMode) => void
): (() => void) => {
  if (preference !== "system" || typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const media = window.matchMedia(MEDIA_QUERY);
  const handler = (): void => {
    onChange(media.matches ? "dark" : "light");
  };

  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }

  media.addListener(handler);
  return () => media.removeListener(handler);
};
