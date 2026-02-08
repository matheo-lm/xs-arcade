import { expect, test } from "@playwright/test";

test("launcher shows nine game cards and supports filters", async ({ page }) => {
  await page.goto("/");

  const cards = page.locator("[data-game-id]");
  await expect(cards).toHaveCount(9);
  await expect(page.locator("[data-game-id] .card-icon-img")).toHaveCount(9);

  await page.selectOption("#skillFilter", "literacy");
  await expect(cards).toHaveCount(3);

  await page.selectOption("#skillFilter", "");
  await expect(cards).toHaveCount(9);
});

test("locale switch and fruit stacker navigation smoke", async ({ page }) => {
  await page.goto("/");

  await page.click("#settingsMenuBtn");
  await page.click("#langEs");
  await expect(page.locator(".launcher-subtitle")).toContainText("aprender");
  await page.selectOption("#themeSelect", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".launcher-subtitle")).toContainText("aprender");

  await page.locator('[data-game-id="fruit-stacker"] .button').click();
  await expect(page).toHaveURL(/\/games\/fruit-stacker\/?$/);

  await expect(page.locator("#score")).toBeVisible();
  await page.click("canvas#game", { position: { x: 220, y: 110 } });

  await page.click("a.pixel-link");
  await expect(page).toHaveURL(/\/$/);
});
