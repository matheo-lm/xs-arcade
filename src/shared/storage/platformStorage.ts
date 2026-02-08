import type {
  BadgeProgress,
  ChildProfile,
  GameProgress,
  PlatformSettings
} from "@shared/types/storage";
import type { LocaleCode } from "@shared/types/i18n";

const STORAGE_KEY = "berries.platform.v1";
const STORAGE_VERSION = 1;

interface PlatformState {
  version: number;
  profiles: ChildProfile[];
  activeProfileId: string | null;
  progress: Record<string, Record<string, GameProgress>>;
  badges: Record<string, Record<string, BadgeProgress>>;
  settings: PlatformSettings;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PlatformStorageApi {
  listProfiles(): ChildProfile[];
  createProfile(name: string, avatarId: string): ChildProfile;
  setActiveProfile(profileId: string): void;
  getActiveProfileId(): string | null;
  getGameProgress(profileId: string, gameId: string): GameProgress;
  saveGameProgress(profileId: string, gameId: string, progress: Partial<GameProgress>): GameProgress;
  unlockBadge(profileId: string, badgeId: string): BadgeProgress;
  listBadges(profileId: string): Record<string, BadgeProgress>;
  setGlobalMute(muted: boolean): void;
  isGlobalMute(): boolean;
  setLocale(locale: LocaleCode): void;
  getLocale(): LocaleCode;
  setThemePreference(theme: "system" | "light" | "dark"): void;
  getThemePreference(): "system" | "light" | "dark";
}

const nowIso = (): string => new Date().toISOString();

const defaultProgress = (): GameProgress => ({
  highScore: 0,
  stars: 0,
  plays: 0,
  lastPlayedAt: ""
});

const defaultState = (): PlatformState => ({
  version: STORAGE_VERSION,
  profiles: [],
  activeProfileId: null,
  progress: {},
  badges: {},
  settings: {
    globalMute: false,
    locale: "en",
    themePreference: "system"
  }
});

const createMemoryStorage = (): StorageLike => {
  const values = new Map<string, string>();
  return {
    getItem(key: string): string | null {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      values.set(key, value);
    }
  };
};

const selectStorage = (candidate?: StorageLike): StorageLike => {
  if (candidate) return candidate;
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  return createMemoryStorage();
};

const sanitizeState = (raw: unknown): PlatformState => {
  if (!raw || typeof raw !== "object") return defaultState();

  const parsed = raw as Partial<PlatformState>;
  if (parsed.version !== STORAGE_VERSION) return defaultState();

  const safe = defaultState();
  safe.profiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];
  safe.activeProfileId = typeof parsed.activeProfileId === "string" ? parsed.activeProfileId : null;
  safe.progress = typeof parsed.progress === "object" && parsed.progress ? parsed.progress : {};
  safe.badges = typeof parsed.badges === "object" && parsed.badges ? parsed.badges : {};

  const settings = parsed.settings;
  if (settings && typeof settings === "object") {
    safe.settings.globalMute = !!settings.globalMute;
    safe.settings.locale = settings.locale === "es" ? "es" : "en";
    safe.settings.themePreference =
      settings.themePreference === "light" || settings.themePreference === "dark"
        ? settings.themePreference
        : "system";
  }

  return safe;
};

export const loadState = (storage: StorageLike): PlatformState => {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return sanitizeState(JSON.parse(raw));
  } catch (_err) {
    return defaultState();
  }
};

const saveState = (storage: StorageLike, state: PlatformState): void => {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const generateId = (prefix: string): string => {
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${rand}`;
};

export const createPlatformStorage = (storageCandidate?: StorageLike): PlatformStorageApi => {
  const storage = selectStorage(storageCandidate);

  const withState = <T>(fn: (state: PlatformState) => T): T => {
    const state = loadState(storage);
    const result = fn(state);
    saveState(storage, state);
    return result;
  };

  const listProfiles = (): ChildProfile[] => {
    const state = loadState(storage);
    return [...state.profiles];
  };

  const createProfile = (name: string, avatarId: string): ChildProfile =>
    withState((state) => {
      const trimmed = name.trim() || "player";
      const profile: ChildProfile = {
        id: generateId("profile"),
        name: trimmed,
        avatarId: avatarId.trim() || "rocket",
        createdAt: nowIso()
      };
      state.profiles.push(profile);
      if (!state.activeProfileId) state.activeProfileId = profile.id;
      return profile;
    });

  const setActiveProfile = (profileId: string): void => {
    withState((state) => {
      const exists = state.profiles.some((profile) => profile.id === profileId);
      if (exists) state.activeProfileId = profileId;
    });
  };

  const getActiveProfileId = (): string | null => {
    const state = loadState(storage);
    return state.activeProfileId;
  };

  const getGameProgress = (profileId: string, gameId: string): GameProgress => {
    const state = loadState(storage);
    return state.progress[profileId]?.[gameId] ?? defaultProgress();
  };

  const saveGameProgress = (profileId: string, gameId: string, progress: Partial<GameProgress>): GameProgress =>
    withState((state) => {
      const current = state.progress[profileId]?.[gameId] ?? defaultProgress();
      const merged: GameProgress = {
        highScore: Math.max(current.highScore, progress.highScore ?? current.highScore),
        stars: Math.max(current.stars, progress.stars ?? current.stars),
        plays: Math.max(0, progress.plays ?? current.plays),
        lastPlayedAt: progress.lastPlayedAt ?? current.lastPlayedAt
      };

      if (!state.progress[profileId]) state.progress[profileId] = {};
      state.progress[profileId][gameId] = merged;
      return merged;
    });

  const unlockBadge = (profileId: string, badgeId: string): BadgeProgress =>
    withState((state) => {
      if (!state.badges[profileId]) state.badges[profileId] = {};
      const existing = state.badges[profileId][badgeId];
      if (existing?.unlocked) return existing;

      const unlocked: BadgeProgress = {
        unlocked: true,
        unlockedAt: nowIso()
      };
      state.badges[profileId][badgeId] = unlocked;
      return unlocked;
    });

  const listBadges = (profileId: string): Record<string, BadgeProgress> => {
    const state = loadState(storage);
    return { ...(state.badges[profileId] ?? {}) };
  };

  const setGlobalMute = (muted: boolean): void => {
    withState((state) => {
      state.settings.globalMute = muted;
    });
  };

  const isGlobalMute = (): boolean => {
    const state = loadState(storage);
    return state.settings.globalMute;
  };

  const setLocale = (locale: LocaleCode): void => {
    withState((state) => {
      state.settings.locale = locale;
    });
  };

  const getLocale = (): LocaleCode => {
    const state = loadState(storage);
    return state.settings.locale;
  };

  const setThemePreference = (theme: "system" | "light" | "dark"): void => {
    withState((state) => {
      state.settings.themePreference = theme;
    });
  };

  const getThemePreference = (): "system" | "light" | "dark" => {
    const state = loadState(storage);
    return state.settings.themePreference;
  };

  return {
    listProfiles,
    createProfile,
    setActiveProfile,
    getActiveProfileId,
    getGameProgress,
    saveGameProgress,
    unlockBadge,
    listBadges,
    setGlobalMute,
    isGlobalMute,
    setLocale,
    getLocale,
    setThemePreference,
    getThemePreference
  };
};

export const platformStorage = createPlatformStorage();
