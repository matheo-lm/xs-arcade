import { describe, expect, test } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { getAllGames } from "@platform/gameRegistry";
import { FRUIT_TIERS } from "@games/fruit-stacker/config";

interface AssetEntry {
  id: string;
  category: "game-icons" | "fruits" | "ui" | "platform";
  path: string;
  contexts: string[];
  familyId: string;
  styleProfile: string;
  sourceLibrary: string;
  sourceAssetId: string;
  sourceLicense: string;
  sourceUrl: string;
  normalized: boolean;
  grid?: string;
  palette?: string[];
}

interface AssetCatalog {
  styleVersion: string;
  familyPolicyVersion: string;
  assets: AssetEntry[];
}

const ROOT = process.cwd();
const PUBLIC_ASSETS_DIR = join(ROOT, "public/assets");
const CATALOG_PATH = join(ROOT, "content/assets/pixel-art.json");
const MANIFEST_DIR = join(ROOT, "content/games");
const FRUIT_CONFIG_PATH = join(ROOT, "src/games/fruit-stacker/config.ts");
const RUNTIME_IMAGE_EXTENSIONS = new Set([".svg", ".png"]);

const listAssetPaths = (dir: string): string[] => {
  const entries = readdirSync(dir);
  const output: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      output.push(...listAssetPaths(fullPath));
      continue;
    }

    const lower = entry.toLowerCase();
    const hasSupportedExtension = [...RUNTIME_IMAGE_EXTENSIONS].some((ext) => lower.endsWith(ext));
    if (!hasSupportedExtension) continue;
    const runtimePath = fullPath.replace(`${ROOT}/public`, "").replace(/\\/g, "/");
    output.push(runtimePath);
  }

  return output.sort();
};

describe("asset catalog", () => {
  test("catalog entries are complete and local", () => {
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as AssetCatalog;

    expect(catalog.styleVersion).toBe("family-consistency-v2");
    expect(catalog.familyPolicyVersion).toBe("family-level-consistency-v2");
    expect(Array.isArray(catalog.assets)).toBe(true);
    expect(catalog.assets.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    const paths = new Set<string>();

    for (const asset of catalog.assets) {
      expect(asset.id).toBeTruthy();
      expect(ids.has(asset.id)).toBe(false);
      ids.add(asset.id);

      expect(["game-icons", "fruits", "ui", "platform"]).toContain(asset.category);
      expect(asset.path.startsWith("/assets/")).toBe(true);
      const lowerPath = asset.path.toLowerCase();
      const hasSupportedExtension = [...RUNTIME_IMAGE_EXTENSIONS].some((ext) => lowerPath.endsWith(ext));
      expect(hasSupportedExtension).toBe(true);
      expect(paths.has(asset.path)).toBe(false);
      paths.add(asset.path);

      expect(Array.isArray(asset.contexts)).toBe(true);
      expect(asset.contexts.length).toBeGreaterThan(0);
      expect(asset.familyId).toBeTruthy();
      expect(asset.styleProfile).toBeTruthy();

      expect(asset.sourceLibrary).toBeTruthy();
      expect(asset.sourceAssetId).toBeTruthy();
      expect(asset.sourceLicense).toBeTruthy();
      expect(asset.sourceUrl).toBeTruthy();
      expect(typeof asset.normalized).toBe("boolean");

      if (asset.sourceLibrary === "berries-internal") {
        expect(asset.sourceUrl.startsWith("local://")).toBe(true);
      } else {
        expect(asset.sourceUrl.startsWith("https://")).toBe(true);
      }

      if (asset.styleProfile.includes("pixel")) {
        expect(asset.grid).toBeTruthy();
        expect(/^\d+x\d+@\d+px$/.test(asset.grid as string)).toBe(true);
        expect(Array.isArray(asset.palette)).toBe(true);
        expect((asset.palette ?? []).length).toBeGreaterThan(0);
      }
    }
  });

  test("every runtime image asset is cataloged", () => {
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as AssetCatalog;
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
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as AssetCatalog;
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
