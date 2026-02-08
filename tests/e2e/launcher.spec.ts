import { expect, test } from "@playwright/test";

test("launcher shows nine game cards and supports filters", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");

  const cards = page.locator("[data-game-id]");
  await expect(page.locator(".launcher-controls")).toBeVisible();
  await expect(page.locator(".launcher-controls .launcher-subtitle")).toContainText("pick a game");
  await expect(page.locator('label[for="profileSelect"]')).toContainText(/player|jugador/i);
  await expect(page.locator('label[for="ageFilter"]')).toContainText(/age|edad/i);
  await expect(page.locator('label[for="skillFilter"]')).toContainText(/skill|habilidad/i);
  await expect(cards).toHaveCount(9);
  await expect(page.locator("[data-game-id] .card-icon-img")).toHaveCount(9);
  const iconSources = await page.locator("[data-game-id] .card-icon-img").evaluateAll((nodes) =>
    nodes.map((node) => (node as HTMLImageElement).getAttribute("src") ?? "")
  );
  expect(iconSources.every((src) => src.startsWith("/assets/"))).toBe(true);
  await expect(page.locator(".launcher-stats .stat-chip")).toHaveCount(3);
  await expect(page.locator("#createProfileBtn")).toHaveCount(0);
  await expect(page.locator("[data-game-id] .card-details .card-actions .button").first()).toBeVisible();
  await expect(page.locator(".launcher-footer")).toBeVisible();
  await expect(page.locator('.launcher-footer a[href*="github.com/matheo-lm/berries#readme"]')).toBeVisible();
  await expect(page.locator('.launcher-footer a[href="https://github.com/matheo-lm/berries"]')).toBeVisible();
  await expect(page.locator(".launcher-footer .footer-credit .footer-heart .footer-heart-img")).toBeVisible();

  const viewportFit = await page.evaluate(() => {
    return document.documentElement.scrollHeight <= document.documentElement.clientHeight;
  });
  expect(viewportFit).toBe(true);

  await page.selectOption("#skillFilter", "literacy");
  await expect(cards).toHaveCount(3);

  await page.selectOption("#skillFilter", "");
  await expect(cards).toHaveCount(9);
});

test("locale switch and fruit stacker navigation smoke", async ({ page }) => {
  await page.goto("/");
  const settingsPanel = page.locator("#launcherSettingsPanel");

  await expect(settingsPanel).toBeHidden();
  await page.click("#launcherSettingsMenuBtn");
  await expect(settingsPanel).toBeVisible();
  await expect(page.locator("#launcherCreateProfileBtn")).toBeVisible();
  await page.click("#launcherSettingsMenuBtn");
  await expect(settingsPanel).toBeHidden();

  await page.click("#launcherSettingsMenuBtn");
  await expect(settingsPanel).toBeVisible();
  await page.mouse.click(8, 8);
  await expect(settingsPanel).toBeHidden();

  await page.click("#launcherSettingsMenuBtn");
  await expect(settingsPanel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(settingsPanel).toBeHidden();

  await page.click("#launcherSettingsMenuBtn");
  await page.click("#launcherLangEs");
  await expect(page.locator(".launcher-subtitle")).toContainText("aprender");
  await page.click("#launcherThemeDarkBtn");
  await expect(page.locator("#launcherThemeDarkBtn")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".launcher-subtitle")).toContainText("aprender");

  await page.locator('[data-game-id="fruit-stacker"] .button').click();
  await expect(page).toHaveURL(/\/games\/fruit-stacker\/?$/);

  await expect(page.locator(".game-header")).toBeVisible();
  await expect(page.locator(".game-header-title")).toBeVisible();
  await expect(page.locator(".game-header-back")).toBeVisible();
  await expect(page.locator("#gameSettingsMenuBtn")).toBeVisible();
  await expect(page.locator("#score")).toBeVisible();
  await expect(page.locator("#bestScore")).toBeVisible();
  await expect(page.locator("#soundToggleBtn")).toBeVisible();
  await expect(page.locator("#restartBtn")).toBeVisible();

  const gameSettingsPanel = page.locator("#gameSettingsPanel");
  await expect(gameSettingsPanel).toBeHidden();
  await page.click("#gameSettingsMenuBtn");
  await expect(gameSettingsPanel).toBeVisible();
  await page.selectOption("#gameThemeSelect", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.click("#gameSoundBtn");
  await expect(page.locator("#soundToggleBtn")).toContainText(/sound|sonido/i);
  await page.keyboard.press("Escape");
  await expect(gameSettingsPanel).toBeHidden();

  await page.click("canvas#game", { position: { x: 220, y: 110 } });

  await page.click("a.game-header-back");
  await expect(page).toHaveURL(/\/$/);
});
