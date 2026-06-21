import { MessageKey } from "../../i18n";
import { AppViewState, escapeHtml } from "../renderApp";

export function renderDebugUsbPanel(state: AppViewState, t: (key: MessageKey) => string): string {
  const lines = state.usbDebugLines.length
    ? state.usbDebugLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")
    : `<div>${escapeHtml(t("debugUsbEmpty"))}</div>`;

  return `
    <section class="panel debug-panel" aria-label="${t("debugUsbTitle")}">
      <div class="panel-title">
        <div>
          <p class="eyebrow-text">Debug</p>
          <h2>${t("debugUsbTitle")}</h2>
        </div>
        <button class="button outlined" data-action="debug-usb" type="button">${t("debugUsbRun")}</button>
      </div>
      <p class="muted">${t("debugUsbText")}</p>
      <div class="debug-output" role="log" aria-live="polite">
        ${lines}
      </div>
    </section>
  `;
}
