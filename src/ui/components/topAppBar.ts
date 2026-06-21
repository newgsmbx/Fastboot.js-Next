import { AppViewState } from "../renderApp";
import { MessageKey } from "../../i18n";

export function renderTopAppBar(state: AppViewState, t: (key: MessageKey) => string): string {
  return `
    <header class="top-app-bar">
      <a class="brand" href="#top" aria-label="${t("productName")}">
        <span class="brand-mark" aria-hidden="true">F</span>
        <span>
          <strong>${t("productName")}</strong>
          <small>${t("tagline")}</small>
        </span>
      </a>
      <nav class="top-nav" aria-label="Primary">
        <a href="#workspace">${t("navWorkspace")}</a>
        <a href="#safety">${t("navSafety")}</a>
        <a href="#deploy">${t("navDeploy")}</a>
      </nav>
      <div class="app-controls">
        <label class="select-label">
          <span>${t("language")}</span>
          <select data-action="set-locale" aria-label="${t("language")}">
            <option value="zh-CN" ${state.locale === "zh-CN" ? "selected" : ""}>中文</option>
            <option value="en-US" ${state.locale === "en-US" ? "selected" : ""}>English</option>
          </select>
        </label>
        <label class="select-label">
          <span>${t("theme")}</span>
          <select data-action="set-theme" aria-label="${t("theme")}">
            <option value="system" ${state.theme === "system" ? "selected" : ""}>${t("themeSystem")}</option>
            <option value="light" ${state.theme === "light" ? "selected" : ""}>${t("themeLight")}</option>
            <option value="dark" ${state.theme === "dark" ? "selected" : ""}>${t("themeDark")}</option>
          </select>
        </label>
        <a class="icon-link" href="https://github.com/TG-Twilight/Fastboot.js-Next" target="_blank" rel="noreferrer" aria-label="${t("github")}">
          <span aria-hidden="true">GH</span>
        </a>
      </div>
    </header>
  `;
}
