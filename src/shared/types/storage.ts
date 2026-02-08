import type { LocaleCode } from "@shared/types/i18n";

export interface ChildProfile {
  id: string;
  name: string;
  avatarId: string;
  createdAt: string;
}

export interface GameProgress {
  highScore: number;
  stars: number;
  plays: number;
  lastPlayedAt: string;
}

export interface BadgeProgress {
  unlocked: boolean;
  unlockedAt: string;
}

export interface PlatformSettings {
  globalMute: boolean;
  locale: LocaleCode;
}
