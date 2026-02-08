import { describe, expect, test } from "vitest";
import { FRUIT_TIERS, TERMINAL_FRUIT_ID } from "@games/fruit-stacker/config";

describe("fruit stacker config", () => {
  test("uses kiwi + pumpkin chain order", () => {
    expect(FRUIT_TIERS.map((tier) => tier.id)).toEqual([
      "cherry",
      "lemon",
      "kiwi",
      "orange",
      "apple",
      "pear",
      "peach",
      "melon",
      "watermelon",
      "pumpkin"
    ]);
  });

  test("sets pumpkin as terminal fruit", () => {
    expect(TERMINAL_FRUIT_ID).toBe("pumpkin");
    expect(FRUIT_TIERS[FRUIT_TIERS.length - 1].id).toBe("pumpkin");
  });

  test("uses local sprite URLs only", () => {
    for (const tier of FRUIT_TIERS) {
      expect(tier.spriteUrl.startsWith("/assets/fruits/")).toBe(true);
      expect(tier.fallbackSpriteUrl.startsWith("/assets/fruits/")).toBe(true);
    }
  });
});
