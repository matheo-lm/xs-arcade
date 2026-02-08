import { describe, expect, test } from "vitest";
import { createPlatformStorage, loadState } from "@shared/storage/platformStorage";

class MemoryStorage implements Storage {
  public length = 0;
  private values = new Map<string, string>();

  clear(): void {
    this.values.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
    this.length = this.values.size;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
    this.length = this.values.size;
  }
}

describe("platform storage", () => {
  test("creates profile and persists progress", () => {
    const memory = new MemoryStorage();
    const storage = createPlatformStorage(memory);

    const profile = storage.createProfile("Mia", "rocket");
    storage.setActiveProfile(profile.id);

    storage.saveGameProgress(profile.id, "fruit-stacker", {
      highScore: 1500,
      stars: 2,
      plays: 3,
      lastPlayedAt: "2026-02-08T00:00:00.000Z"
    });

    const progress = storage.getGameProgress(profile.id, "fruit-stacker");
    expect(progress.highScore).toBe(1500);
    expect(progress.stars).toBe(2);
    expect(progress.plays).toBe(3);
  });

  test("migrates invalid storage version to defaults", () => {
    const memory = new MemoryStorage();
    memory.setItem(
      "berries.platform.v1",
      JSON.stringify({ version: 0, settings: { locale: "es", globalMute: true } })
    );

    const state = loadState(memory);
    expect(state.version).toBe(1);
    expect(state.settings.locale).toBe("en");
    expect(state.settings.globalMute).toBe(false);
  });

  test("stores global mute and locale settings", () => {
    const memory = new MemoryStorage();
    const storage = createPlatformStorage(memory);

    storage.setGlobalMute(true);
    storage.setLocale("es");

    expect(storage.isGlobalMute()).toBe(true);
    expect(storage.getLocale()).toBe("es");
  });
});
