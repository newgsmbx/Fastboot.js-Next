import { MessageKey } from "../../i18n";
import { AppViewState, escapeHtml } from "../renderApp";

export function renderProgressPanel(state: AppViewState, t: (key: MessageKey) => string): string {
  const percent = Math.round(state.progress.value * 100);

  return `
    <section class="panel progress-panel" aria-label="${t("progress")}">
      <div class="panel-title">
        <h2>${t("progress")}</h2>
        <span class="support-pill">${percent}%</span>
      </div>
      <p class="muted">${escapeHtml(state.progress.label || t("idleProgress"))}</p>
      <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
        <span style="width: ${percent}%"></span>
      </div>
      <ol class="timeline">
        ${state.progress.steps
          .map(
            (step) => `
              <li class="${step.status}">
                <span aria-hidden="true"></span>
                ${escapeHtml(step.label)}
              </li>
            `
          )
          .join("")}
      </ol>
    </section>
  `;
}
