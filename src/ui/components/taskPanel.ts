import { MessageKey } from "../../i18n";
import { AppViewState } from "../renderApp";

export function renderTaskPanel(state: AppViewState, t: (key: MessageKey) => string): string {
  const tabs = [
    ["command", t("commandTab")],
    ["boot", t("bootTab")],
    ["flash", t("flashTab")],
    ["zip", t("zipTab")]
  ] as const;

  return `
    <section class="panel task-panel" aria-label="${t("tasks")}">
      <div class="panel-title">
        <div>
          <p class="eyebrow-text">${t("tasks")}</p>
          <h2>${t("tasks")}</h2>
        </div>
      </div>
      <div class="tabs" role="tablist" aria-label="${t("tasks")}">
        ${tabs
          .map(
            ([id, label]) => `
              <button class="tab ${state.activeTab === id ? "active" : ""}" type="button" role="tab" aria-selected="${state.activeTab === id}" data-action="set-tab" data-tab="${id}">
                ${label}
              </button>
            `
          )
          .join("")}
      </div>
      <div class="tab-panels">
        ${renderActiveTask(state, t)}
      </div>
    </section>
  `;
}

function renderActiveTask(state: AppViewState, t: (key: MessageKey) => string): string {
  const disabled = state.status === "running" || state.status === "connecting" || state.status === "idle" || state.status === "error";

  if (state.activeTab === "boot") {
    return `
      <form class="form-grid" data-form="boot">
        <label class="file-field">
          <span>${t("selectBootImage")}</span>
          <input type="file" data-input="boot-file" accept=".img,application/octet-stream" />
          <small>${state.selectedBootFile || "boot.img"}</small>
        </label>
        <button class="button danger" type="submit" ${disabled ? "disabled" : ""}>${t("bootImage")}</button>
      </form>
    `;
  }

  if (state.activeTab === "flash") {
    return `
      <form class="form-grid" data-form="flash">
        <label class="text-field">
          <span>${t("partitionLabel")}</span>
          <input type="text" name="partition" autocomplete="off" placeholder="${t("partitionPlaceholder")}" />
        </label>
        <label class="file-field">
          <span>${t("selectImage")}</span>
          <input type="file" data-input="flash-file" accept=".img,application/octet-stream" />
          <small>${state.selectedFlashFile || "image.img"}</small>
        </label>
        <button class="button danger" type="submit" ${disabled ? "disabled" : ""}>${t("flashPartition")}</button>
      </form>
    `;
  }

  if (state.activeTab === "zip") {
    return `
      <form class="form-grid" data-form="zip">
        <label class="file-field">
          <span>${t("selectZip")}</span>
          <input type="file" data-input="zip-file" accept=".zip,application/zip" />
          <small>${state.selectedZipFile || "factory.zip"}</small>
        </label>
        <button class="button danger" type="submit" ${disabled ? "disabled" : ""}>${t("flashZip")}</button>
      </form>
    `;
  }

  return `
    <form class="form-grid" data-form="command">
      <label class="text-field">
        <span>${t("commandLabel")}</span>
        <input type="text" name="command" autocomplete="off" placeholder="${t("commandPlaceholder")}" />
      </label>
      <button class="button filled" type="submit" ${disabled ? "disabled" : ""}>${t("runCommand")}</button>
    </form>
  `;
}
