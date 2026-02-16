export interface GameHeaderMetaItem {
  id: string;
  text: string;
  ariaLabel?: string;
}

export interface GameHeaderActionItem {
  id: string;
  label: string;
  icon?: string;
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
      const content = action.icon ? action.icon : escapeHtml(action.label);
      const ariaLabel = action.icon ? ` aria-label="${escapeHtml(action.label)}"` : "";
      return `<button type="button" class="game-header-action${action.icon ? " icon-btn" : ""}" id="${escapeHtml(action.id)}"${pressed}${disabled}${ariaLabel}>${content}</button>`;
    })
    .join("");

  // Home/Back Icon
  const homeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;

  root.innerHTML = `
    <section class="panel game-header" aria-label="${escapeHtml(config.ariaLabel ?? "game header")}">
      <div class="game-header-main">
        <a class="pixel-link game-header-back icon-btn" href="${escapeHtml(config.backHref)}" aria-label="${escapeHtml(config.backLabel)}">
          ${homeIcon}
        </a>
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

export const updateGameHeaderAction = (root: HTMLElement, id: string, update: Partial<GameHeaderActionItem>): void => {
  const btn = root.querySelector<HTMLButtonElement>(`#${id}`);
  if (!btn) return;

  if (update.icon !== undefined) {
    btn.innerHTML = update.icon;
    if (update.label) btn.setAttribute("aria-label", update.label);
    if (!btn.classList.contains("icon-btn")) btn.classList.add("icon-btn");
  } else if (update.label !== undefined) {
    btn.textContent = update.label;
    btn.removeAttribute("aria-label"); // Text content is sufficient
    btn.classList.remove("icon-btn");
  }

  if (update.pressed !== undefined) {
    btn.setAttribute("aria-pressed", update.pressed ? "true" : "false");
  }

  if (update.disabled !== undefined) {
    btn.disabled = update.disabled;
  }
};
