import { MessageKey } from "../../i18n";
import { AppViewState, escapeHtml } from "../renderApp";

export function renderDeviceInfoPanel(state: AppViewState, t: (key: MessageKey) => string): string {
  const rows = [
    [t("serial"), state.deviceInfo.serial],
    [t("product"), state.deviceInfo.product],
    [t("variant"), state.deviceInfo.variant],
    [t("bootloader"), state.deviceInfo.bootloaderVersion],
    [t("secure"), state.deviceInfo.secure],
    [t("unlocked"), state.deviceInfo.unlocked],
    [t("currentSlot"), state.deviceInfo.currentSlot],
    [t("battery"), state.deviceInfo.batteryVoltage],
    [t("maxDownload"), state.deviceInfo.maxDownloadSize]
  ];

  return `
    <section class="panel" aria-label="${t("device")}">
      <div class="panel-title">
        <h2>${t("device")}</h2>
      </div>
      <dl class="info-list">
        ${rows
          .map(
            ([label, value]) => `
              <div>
                <dt>${label}</dt>
                <dd>${escapeHtml(value ?? t("unknown"))}</dd>
              </div>
            `
          )
          .join("")}
      </dl>
    </section>
  `;
}
