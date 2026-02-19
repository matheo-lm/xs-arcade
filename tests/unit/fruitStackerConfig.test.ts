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

  test("keeps high-tier rendered size progression", () => {
    const renderedDiameterById = new Map(
      FRUIT_TIERS.map((tier) => [tier.id, tier.r * tier.drawScale * tier.spriteScale * 2])
    );

    const peach = renderedDiameterById.get("peach");
    const melon = renderedDiameterById.get("melon");
    const watermelon = renderedDiameterById.get("watermelon");
    const pumpkin = renderedDiameterById.get("pumpkin");

    expect(peach).toBeDefined();
    expect(melon).toBeDefined();
    expect(watermelon).toBeDefined();
    expect(pumpkin).toBeDefined();

    expect(peach as number).toBeLessThan(melon as number);
    expect(melon as number).toBeLessThan(watermelon as number);
    expect(watermelon as number).toBeLessThan(pumpkin as number);
  });
});
