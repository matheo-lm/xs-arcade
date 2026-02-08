import "@shared/ui/base.css";
import "@games/placeholder/styles.css";
import { getAllGames } from "@platform/gameRegistry";
import { createI18n } from "@shared/i18n";
import { platformStorage } from "@shared/storage/platformStorage";
import { applyTheme, watchSystemTheme } from "@shared/ui/theme";

const root = document.getElementById("placeholderApp");
if (!root) throw new Error("Missing #placeholderApp root");

const slug = document.body.dataset.gameSlug;
const i18n = createI18n(window.location.search);
const game = getAllGames().find((entry) => entry.slug === slug);

const themePreference = platformStorage.getThemePreference();
applyTheme(themePreference);
watchSystemTheme(themePreference, () => {
  applyTheme(themePreference);
});

if (!game) {
  root.innerHTML = `<section class="panel placeholder"><h1>game not found</h1></section>`;
} else {
  const ageTags = game.ageBands.map((age) => `<span class=\"tag\">${age}</span>`).join("");
  const skillTags = game.skills.map((skill) => `<span class=\"tag\">${skill}</span>`).join("");
  const fallback = game.cardIconFallback ?? "/assets/icon.svg";

  root.innerHTML = `
    <section class="panel placeholder">
      <a class="pixel-link" href="/">&larr; ${i18n.t("gameBackToLauncher")}</a>
      <h1>
        <img class="placeholder-icon" src="${game.cardIcon}" data-fallback="${fallback}" alt="" aria-hidden="true" />
        <span>${game.title[i18n.locale]}</span>
      </h1>
      <p>${game.description[i18n.locale]}</p>
      <div class="tag-row">${ageTags}</div>
      <div class="tag-row">${skillTags}</div>
      <button type="button" disabled>${i18n.t("ctaComingSoon")}</button>
    </section>
  `;

  const icon = root.querySelector<HTMLImageElement>(".placeholder-icon");
  if (icon) {
    let usedFallback = false;
    icon.addEventListener("error", () => {
      if (usedFallback) return;
      usedFallback = true;
      icon.src = fallback;
    });
  }
}
