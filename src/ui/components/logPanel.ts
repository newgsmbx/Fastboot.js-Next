import { MessageKey } from "../../i18n";
import { AppViewState, escapeHtml } from "../renderApp";

export function renderLogPanel(state: AppViewState, t: (key: MessageKey) => string): string {
  const lines = state.logs.length
    ? state.logs
        .map((entry) => {
          const time = entry.timestamp.toLocaleTimeString();
          return `<div class="${entry.level}"><span>${time}</span> ${escapeHtml(entry.message)}</div>`;
        })
        .join("")
    : `<div class="info"><span>--:--:--</span> ${t("mockMode")}</div>`;

  return `
    <section class="panel log-panel" aria-label="${t("logs")}">
      <div class="panel-title">
        <h2>${t("logs")}</h2>
        <div class="log-actions">
          <button class="button text" data-action="copy-logs" type="button">${t("copyLogs")}</button>
          <button class="button text" data-action="clear-logs" type="button">${t("clearLogs")}</button>
        </div>
      </div>
      <div class="terminal" role="log" aria-live="polite">
        ${lines}
      </div>
    </section>
  `;
}
