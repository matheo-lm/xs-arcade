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
  const settingsPanel = page.locator("#settingsPanel");

  await expect(settingsPanel).toBeHidden();
  await page.click("#settingsMenuBtn");
  await expect(settingsPanel).toBeVisible();
  await page.click("#settingsMenuBtn");
  await expect(settingsPanel).toBeHidden();

  await page.click("#settingsMenuBtn");
  await expect(settingsPanel).toBeVisible();
  await page.mouse.click(8, 8);
  await expect(settingsPanel).toBeHidden();

  await page.click("#settingsMenuBtn");
  await expect(settingsPanel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(settingsPanel).toBeHidden();

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

  await expect(page.locator(".game-header")).toBeVisible();
  await expect(page.locator(".game-header-title")).toBeVisible();
  await expect(page.locator(".game-header-back")).toBeVisible();
  await expect(page.locator("#score")).toBeVisible();
  await expect(page.locator("#bestScore")).toBeVisible();
  await expect(page.locator("#soundToggleBtn")).toBeVisible();
  await expect(page.locator("#restartBtn")).toBeVisible();
  await page.click("canvas#game", { position: { x: 220, y: 110 } });

  await page.click("a.game-header-back");
  await expect(page).toHaveURL(/\/$/);
});
