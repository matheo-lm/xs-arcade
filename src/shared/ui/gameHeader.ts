export interface GameHeaderMetaItem {
  id: string;
  text: string;
  ariaLabel?: string;
}

export interface GameHeaderActionItem {
  id: string;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
}

export interface GameHeaderConfig {
  title: string;
  backHref: string;
  backLabel: string;
  leftMeta?: GameHeaderMetaItem[];
  rightActions?: GameHeaderActionItem[];
  ariaLabel?: string;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const renderGameHeader = (root: HTMLElement, config: GameHeaderConfig): void => {
  const meta = (config.leftMeta ?? [])
    .map((item) => {
      const aria = item.ariaLabel ? ` aria-label="${escapeHtml(item.ariaLabel)}"` : "";
      return `<span class="game-header-pill" id="${escapeHtml(item.id)}" data-meta-id="${escapeHtml(item.id)}"${aria}>${escapeHtml(item.text)}</span>`;
    })
    .join("");

  const actions = (config.rightActions ?? [])
    .map((action) => {
      const pressed = typeof action.pressed === "boolean" ? ` aria-pressed="${action.pressed ? "true" : "false"}"` : "";
      const disabled = action.disabled ? " disabled" : "";
      return `<button type="button" class="game-header-action" id="${escapeHtml(action.id)}"${pressed}${disabled}>${escapeHtml(action.label)}</button>`;
    })
    .join("");

  root.innerHTML = `
    <section class="panel game-header" aria-label="${escapeHtml(config.ariaLabel ?? "game header")}">
      <div class="game-header-main">
        <a class="pixel-link game-header-back" href="${escapeHtml(config.backHref)}">&larr; ${escapeHtml(config.backLabel)}</a>
        <h1 class="game-header-title">${escapeHtml(config.title)}</h1>
      </div>
      <div class="game-header-meta">${meta}</div>
      <div class="game-header-actions">${actions}</div>
    </section>
  `;
};

export const updateGameHeaderMeta = (root: HTMLElement, id: string, text: string): void => {
  const node = root.querySelector<HTMLElement>(`[data-meta-id="${id}"]`);
  if (!node) return;
  node.textContent = text;
};
