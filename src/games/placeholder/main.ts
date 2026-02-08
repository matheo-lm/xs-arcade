import "@shared/ui/base.css";
import "@games/placeholder/styles.css";
import { getAllGames } from "@platform/gameRegistry";
import { createI18n } from "@shared/i18n";

const root = document.getElementById("placeholderApp");
if (!root) throw new Error("Missing #placeholderApp root");

const slug = document.body.dataset.gameSlug;
const i18n = createI18n(window.location.search);
const game = getAllGames().find((entry) => entry.slug === slug);

if (!game) {
  root.innerHTML = `<section class="panel placeholder"><h1>Game not found</h1></section>`;
} else {
  const ageTags = game.ageBands.map((age) => `<span class=\"tag\">${age}</span>`).join("");
  const skillTags = game.skills.map((skill) => `<span class=\"tag\">${skill}</span>`).join("");

  root.innerHTML = `
    <section class="panel placeholder">
      <a class="pixel-link" href="/">&larr; ${i18n.t("gameBackToLauncher")}</a>
      <h1>${game.cardIcon} ${game.title[i18n.locale]}</h1>
      <p>${game.description[i18n.locale]}</p>
      <div class="tag-row">${ageTags}</div>
      <div class="tag-row">${skillTags}</div>
      <button type="button" disabled>${i18n.t("ctaComingSoon")}</button>
    </section>
  `;
}
