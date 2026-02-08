import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { FRUIT_TIERS } from "@games/fruit-stacker/config";
import { getAllGames } from "@platform/gameRegistry";

interface AssetEntry {
  id: string;
  path: string;
  familyId: string;
  styleProfile: string;
  sourceLibrary: string;
  normalized: boolean;
}

interface AssetCatalog {
  assets: AssetEntry[];
}

const CATALOG_PATH = join(process.cwd(), "content/assets/pixel-art.json");

const byPath = (): Map<string, AssetEntry> => {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as AssetCatalog;
  return new Map(catalog.assets.map((asset) => [asset.path, asset]));
};

describe("asset family consistency", () => {
  test("fruit stacker tiers use one normalized family style", () => {
    const catalog = byPath();
    const fruitPaths = new Set<string>();

    for (const tier of FRUIT_TIERS) {
      fruitPaths.add(tier.spriteUrl);
      fruitPaths.add(tier.fallbackSpriteUrl);
    }

    const styleProfiles = new Set<string>();

    for (const path of fruitPaths) {
      const asset = catalog.get(path);
      expect(asset).toBeTruthy();
      expect(asset?.familyId).toBe("fruit-stacker-fruits-v1");
      expect(asset?.normalized).toBe(true);
      if (asset) styleProfiles.add(asset.styleProfile);
      expect(
        [
          "opengameart-food-potions",
          "opengameart-fruit-vege-sprites",
          "opengameart-fruits-vegies-icons"
        ].includes(asset?.sourceLibrary ?? "")
      ).toBe(true);
    }

    expect(styleProfiles.size).toBe(1);
    expect(styleProfiles.has("fruit-stacker-hybrid-pixel-v1")).toBe(true);
  });

  test("launcher card icons use one phosphor-derived family", () => {
    const catalog = byPath();

    for (const game of getAllGames()) {
      const icon = catalog.get(game.cardIcon);
      expect(icon).toBeTruthy();
      expect(icon?.familyId).toBe("launcher-card-icons-v1");
      expect(icon?.styleProfile).toBe("launcher-phosphor-icons-v1");
      expect(icon?.sourceLibrary).toBe("phosphor-icons");
      expect(icon?.normalized).toBe(true);
      expect(game.cardIcon.startsWith("/assets/game-icons/")).toBe(true);

      if (!game.cardIconFallback) continue;
      const fallback = catalog.get(game.cardIconFallback);
      expect(fallback).toBeTruthy();
      expect(fallback?.familyId).toBe("launcher-card-icons-v1");
      expect(fallback?.styleProfile).toBe("launcher-phosphor-icons-v1");
      expect(fallback?.sourceLibrary).toBe("phosphor-icons");
      expect(fallback?.normalized).toBe(true);
      expect(game.cardIconFallback.startsWith("/assets/game-icons/")).toBe(true);
    }
  });
});
