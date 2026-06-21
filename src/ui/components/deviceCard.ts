import { MessageKey } from "../../i18n";
import { AppViewState } from "../renderApp";

export function renderDeviceCard(state: AppViewState, t: (key: MessageKey) => string): string {
  const statusLabel = state.status === "idle" ? t("notConnected") : t(state.status);
  const dot = state.status === "connected" || state.status === "success" ? "online" : state.status === "error" ? "error" : "idle";

  return `
    <section class="panel device-card" aria-label="${t("device")}">
      <div class="panel-title">
        <div>
          <p class="eyebrow-text">${t("device")}</p>
          <h2><span class="status-dot ${dot}" aria-hidden="true"></span>${statusLabel}</h2>
        </div>
        <span class="support-pill">${state.webUsbSupported ? "WebUSB" : "No WebUSB"}</span>
      </div>
      <p class="muted">${state.webUsbSupported ? t("browserNotice") : t("webusbUnavailable")}</p>
      <div class="device-actions">
        <button class="button filled" data-action="connect" type="button" ${state.status === "connecting" || state.status === "running" ? "disabled" : ""}>${t("connect")}</button>
        <button class="button outlined" data-action="refresh-info" type="button" ${state.status === "idle" || state.status === "connecting" ? "disabled" : ""}>${t("device")}</button>
      </div>
      ${state.lastError ? `<p class="error-text">${state.lastError}</p>` : ""}
    </section>
  `;
}
