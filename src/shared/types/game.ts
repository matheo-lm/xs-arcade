import type { LocaleCode } from "@shared/types/i18n";

export type AgeBand = "4-5" | "6-7" | "8";

export type SkillTag =
  | "numeracy"
  | "literacy"
  | "logic"
  | "memory"
  | "creativity"
  | "spatial";

export interface DifficultyPreset {
  dropCooldownMs: number;
  goalScore: number;
  maxObjectsHint: number;
}

export interface GameManifest {
  id: string;
  slug: string;
  path: string;
  status: "playable" | "placeholder";
  title: Record<LocaleCode, string>;
  description: Record<LocaleCode, string>;
  // Local image asset path under /assets/...svg.
  cardIcon: string;
  // Optional local fallback under /assets/...svg.
  cardIconFallback?: string;
  ageBands: AgeBand[];
  skills: SkillTag[];
  learningGoals: string[];
  difficultyPresets: Record<AgeBand, DifficultyPreset>;
}
