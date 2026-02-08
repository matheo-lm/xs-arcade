import fruitStacker from "@content/games/fruit-stacker.json";
import numberGarden from "@content/games/number-garden.json";
import shapeBuilder from "@content/games/shape-builder.json";
import patternParade from "@content/games/pattern-parade.json";
import memoryTrails from "@content/games/memory-trails.json";
import letterLanterns from "@content/games/letter-lanterns.json";
import phonicsPop from "@content/games/phonics-pop.json";
import wordMatch from "@content/games/word-match.json";
import colorCraft from "@content/games/color-craft.json";
import type { AgeBand, GameManifest, SkillTag } from "@shared/types/game";

const manifests = [
  fruitStacker,
  numberGarden,
  shapeBuilder,
  patternParade,
  memoryTrails,
  letterLanterns,
  phonicsPop,
  wordMatch,
  colorCraft
] as GameManifest[];

export interface GameFilter {
  ageBand?: AgeBand;
  skillTag?: SkillTag;
  locale?: "en" | "es";
}

export const validateManifest = (manifest: GameManifest): string[] => {
  const errors: string[] = [];

  if (!manifest.id) errors.push("id is required");
  if (!manifest.slug) errors.push("slug is required");
  if (!manifest.path.startsWith("/games/")) errors.push("path must start with /games/");
  if (!manifest.title.en || !manifest.title.es) errors.push("title.en and title.es are required");
  if (!manifest.description.en || !manifest.description.es) {
    errors.push("description.en and description.es are required");
  }
  if (!manifest.cardIcon || !manifest.cardIcon.trim()) {
    errors.push("cardIcon is required");
  }
  if (/^https?:\/\//.test(manifest.cardIcon) && !manifest.cardIconFallback) {
    errors.push("cardIconFallback is required for external cardIcon");
  }
  if (!Array.isArray(manifest.ageBands) || manifest.ageBands.length === 0) {
    errors.push("ageBands must be a non-empty array");
  }
  if (!Array.isArray(manifest.skills) || manifest.skills.length === 0) {
    errors.push("skills must be a non-empty array");
  }

  const presets = manifest.difficultyPresets;
  for (const band of ["4-5", "6-7", "8"] as const) {
    if (!presets[band]) errors.push(`difficultyPresets.${band} is required`);
  }

  return errors;
};

for (const manifest of manifests) {
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`Invalid manifest for ${manifest.slug}: ${errors.join(", ")}`);
  }
}

export const getAllGames = (): GameManifest[] => manifests.map((manifest) => ({ ...manifest }));

export const filterGames = ({ ageBand, skillTag }: GameFilter): GameManifest[] =>
  manifests.filter((manifest) => {
    const ageMatch = !ageBand || manifest.ageBands.includes(ageBand);
    const skillMatch = !skillTag || manifest.skills.includes(skillTag);
    return ageMatch && skillMatch;
  });
