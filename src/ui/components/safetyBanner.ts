import { MessageKey } from "../../i18n";

export function renderSafetyBanner(t: (key: MessageKey) => string): string {
  return `
    <section class="safety-banner" id="safety" role="region" aria-label="${t("safetyTitle")}">
      <div class="banner-icon" aria-hidden="true">!</div>
      <div>
        <h2>${t("safetyTitle")}</h2>
        <p>${t("safetyText")}</p>
        <p class="muted">${t("browserNotice")}</p>
      </div>
    </section>
  `;
}
