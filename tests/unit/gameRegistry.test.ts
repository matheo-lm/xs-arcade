import { describe, expect, test } from "vitest";
import { filterGames, getAllGames, validateManifest } from "@platform/gameRegistry";
import type { GameManifest } from "@shared/types/game";

describe("game registry", () => {
  test("includes exactly nine game slots", () => {
    expect(getAllGames()).toHaveLength(9);
  });

  test("filters by age and skill", () => {
    const filtered = filterGames({ ageBand: "4-5", skillTag: "literacy" });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((game) => game.ageBands.includes("4-5"))).toBe(true);
    expect(filtered.every((game) => game.skills.includes("literacy"))).toBe(true);
  });

  test("manifest validator reports missing required fields", () => {
    const badManifest = {
      id: "",
      slug: "broken-game",
      path: "/broken",
      status: "placeholder",
      title: { en: "", es: "" },
      description: { en: "", es: "" },
      cardIcon: "https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/1F9E9.svg",
      ageBands: [],
      skills: [],
      learningGoals: [],
      difficultyPresets: {
        "4-5": { dropCooldownMs: 0, goalScore: 0, maxObjectsHint: 0 },
        "6-7": { dropCooldownMs: 0, goalScore: 0, maxObjectsHint: 0 },
        "8": { dropCooldownMs: 0, goalScore: 0, maxObjectsHint: 0 }
      }
    } as GameManifest;

    const errors = validateManifest(badManifest);
    expect(errors).toContain("id is required");
    expect(errors).toContain("path must start with /games/");
    expect(errors).toContain("cardIconFallback is required for external cardIcon");
    expect(errors).toContain("ageBands must be a non-empty array");
    expect(errors).toContain("skills must be a non-empty array");
  });
});
