import { MessageKey } from "../../i18n";
import { AppViewState } from "../renderApp";

export function renderHeroSection(state: AppViewState, t: (key: MessageKey) => string): string {
  const isBusy = state.status === "connecting" || state.status === "running";
  const isConnected = state.status === "connected" || state.status === "success";

  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="hero-pills">
          <span>WebUSB</span>
          <span>android-fastboot</span>
          <span>Material Design 3</span>
        </div>
        <h1>${t("heroTitle")}</h1>
        <p>${t("heroSubtitle")}</p>
        <p class="relationship">${t("relationship")}</p>
        <div class="hero-actions">
          <button class="button filled" data-action="connect" type="button" ${isBusy ? "disabled" : ""}>
            ${isConnected ? t("connected") : t("connect")}
          </button>
          <a class="button tonal" href="#safety">${t("navSafety")}</a>
          <a class="button outlined" href="https://github.com/TG-Twilight/Fastboot.js-Next" target="_blank" rel="noreferrer">${t("github")}</a>
        </div>
      </div>
      <div class="hero-visual" aria-label="${t("device")}">
        <div class="phone-shell">
          <div class="phone-screen">
            <div class="screen-row strong"></div>
            <div class="screen-row"></div>
            <div class="screen-grid">
              <span></span><span></span><span></span><span></span>
            </div>
            <div class="terminal-mini">
              <span>$ fastboot getvar product</span>
              <span class="ok">OKAY ${state.deviceInfo.product ?? "device"}</span>
              <span>$ fastboot flash boot boot.img</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
