import { describe, expect, test } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getAllGames } from "@platform/gameRegistry";
import { FRUIT_TIERS } from "@games/fruit-stacker/config";

interface PixelAssetEntry {
  id: string;
  category: "game-icons" | "fruits" | "ui" | "platform";
  path: string;
  contexts: string[];
  grid: string;
  palette: string[];
}

interface PixelAssetCatalog {
  styleVersion: string;
  pixelEra: string;
  assets: PixelAssetEntry[];
}

const ROOT = process.cwd();
const PUBLIC_ASSETS_DIR = join(ROOT, "public/assets");
const CATALOG_PATH = join(ROOT, "content/assets/pixel-art.json");
const MANIFEST_DIR = join(ROOT, "content/games");
const FRUIT_CONFIG_PATH = join(ROOT, "src/games/fruit-stacker/config.ts");

const listAssetPaths = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const output: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      output.push(...listAssetPaths(fullPath));
      continue;
    }

    if (!entry.endsWith(".svg")) continue;
    const runtimePath = fullPath
      .replace(`${ROOT}/public`, "")
      .replace(/\\/g, "/");
    output.push(runtimePath);
  }

  return output.sort();
};

describe("pixel asset catalog", () => {
  test("catalog entries are complete and local", () => {
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as PixelAssetCatalog;

    expect(catalog.styleVersion).toBe("retro-clean-v2");
    expect(catalog.pixelEra).toBe("16-bit-inspired");
    expect(Array.isArray(catalog.assets)).toBe(true);
    expect(catalog.assets.length).toBeGreaterThan(0);

    for (const asset of catalog.assets) {
      expect(asset.id).toBeTruthy();
      expect(["game-icons", "fruits", "ui", "platform"]).toContain(asset.category);
      expect(asset.path.startsWith("/assets/")).toBe(true);
      expect(asset.path.endsWith(".svg")).toBe(true);
      expect(Array.isArray(asset.contexts)).toBe(true);
      expect(asset.contexts.length).toBeGreaterThan(0);
      expect(asset.grid).toBeTruthy();
      expect(/^\d+x\d+@\d+px$/.test(asset.grid)).toBe(true);
      expect(Array.isArray(asset.palette)).toBe(true);
      expect(asset.palette.length).toBeGreaterThan(0);
    }
  });

  test("every runtime svg asset is cataloged", () => {
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as PixelAssetCatalog;
    const catalogPaths = new Set(catalog.assets.map((asset) => asset.path));
    const runtimePaths = listAssetPaths(PUBLIC_ASSETS_DIR);

    for (const runtimePath of runtimePaths) {
      expect(catalogPaths.has(runtimePath)).toBe(true);
    }

    for (const catalogPath of catalogPaths) {
      expect(runtimePaths.includes(catalogPath)).toBe(true);
    }
  });

  test("manifests and fruit config use local cataloged assets only", () => {
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as PixelAssetCatalog;
    const catalogPaths = new Set(catalog.assets.map((asset) => asset.path));

    for (const game of getAllGames()) {
      expect(game.cardIcon.startsWith("/assets/")).toBe(true);
      expect(catalogPaths.has(game.cardIcon)).toBe(true);
      if (game.cardIconFallback) {
        expect(game.cardIconFallback.startsWith("/assets/")).toBe(true);
        expect(catalogPaths.has(game.cardIconFallback)).toBe(true);
      }
    }

    for (const tier of FRUIT_TIERS) {
      expect(tier.spriteUrl.startsWith("/assets/")).toBe(true);
      expect(tier.fallbackSpriteUrl.startsWith("/assets/")).toBe(true);
      expect(catalogPaths.has(tier.spriteUrl)).toBe(true);
      expect(catalogPaths.has(tier.fallbackSpriteUrl)).toBe(true);
    }
  });

  test("no external image URLs remain in manifests or fruit config", () => {
    const manifestFiles = readdirSync(MANIFEST_DIR).filter((file) => file.endsWith(".json"));

    for (const file of manifestFiles) {
      const raw = readFileSync(join(MANIFEST_DIR, file), "utf8");
      expect(/https?:\/\//.test(raw)).toBe(false);
    }

    const fruitConfigRaw = readFileSync(FRUIT_CONFIG_PATH, "utf8");
    expect(/https?:\/\//.test(fruitConfigRaw)).toBe(false);
  });
});
