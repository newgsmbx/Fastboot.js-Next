import { DeviceInfo } from "../core/deviceInfo";
import { ProgressState } from "../core/operationTypes";
import { Locale, MessageKey, translate } from "../i18n";
import { LogEntry } from "../utils/logger";
import { ThemeMode } from "../utils/theme";
import { renderTopAppBar } from "./components/topAppBar";
import { renderHeroSection } from "./components/heroSection";
import { renderSafetyBanner } from "./components/safetyBanner";
import { renderDeviceCard } from "./components/deviceCard";
import { renderTaskPanel } from "./components/taskPanel";
import { renderDeviceInfoPanel } from "./components/deviceInfoPanel";
import { renderProgressPanel } from "./components/progressPanel";
import { renderLogPanel } from "./components/logPanel";
import { renderDebugUsbPanel } from "./components/debugUsbPanel";

export interface AppViewState {
  locale: Locale;
  theme: ThemeMode;
  status: "idle" | "connecting" | "connected" | "running" | "success" | "error";
  activeTab: "command" | "boot" | "flash" | "zip";
  deviceInfo: DeviceInfo;
  progress: ProgressState;
  logs: LogEntry[];
  webUsbSupported: boolean;
  selectedBootFile: string;
  selectedFlashFile: string;
  selectedZipFile: string;
  usbDebugLines: string[];
  lastError: string | null;
}

export function renderApp(state: AppViewState): string {
  const t = (key: MessageKey) => translate(state.locale, key);

  return `
    ${renderTopAppBar(state, t)}
    <main id="top" class="app-main">
      ${renderHeroSection(state, t)}
      <section class="content-grid" id="workspace" aria-label="${t("navWorkspace")}">
        <div class="main-column">
          ${renderSafetyBanner(t)}
          ${renderTaskPanel(state, t)}
        </div>
        <aside class="side-column">
          ${renderDeviceCard(state, t)}
          ${renderDeviceInfoPanel(state, t)}
        </aside>
      </section>
      <section class="content-grid lower-grid">
        ${renderProgressPanel(state, t)}
        ${renderLogPanel(state, t)}
      </section>
      ${renderDebugUsbPanel(state, t)}
      <section class="deploy-section" id="deploy">
        <div>
          <p class="eyebrow-text">${t("buildFor")}</p>
          <h2>${t("deployTitle")}</h2>
          <p>${t("deployText")}</p>
        </div>
        <div class="deploy-chips" aria-label="${t("deployTitle")}">
          <span>npm run build</span>
          <span>GitHub Pages</span>
          <span>Cloudflare Pages</span>
          <span>Chromium WebUSB</span>
        </div>
      </section>
    </main>
  `;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
