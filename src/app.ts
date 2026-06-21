import { emptyDeviceInfo } from "./core/deviceInfo";
import { FastbootClient, FastbootProgress } from "./core/fastbootClient";
import { ConnectionState, OperationKind, ProgressState } from "./core/operationTypes";
import { getStoredLocale, Locale, storeLocale, translate } from "./i18n";
import { AppViewState, renderApp } from "./ui/renderApp";
import { describeFile, getSelectedFile } from "./utils/filePicker";
import { AppLogger } from "./utils/logger";
import { applyTheme, getStoredTheme, storeTheme, ThemeMode, watchSystemTheme } from "./utils/theme";

type TaskTab = AppViewState["activeTab"];

const idleProgress: ProgressState = {
  active: false,
  kind: null,
  label: "",
  value: 0,
  steps: [
    { id: "prepare", label: "Prepare", status: "pending" },
    { id: "transfer", label: "Transfer", status: "pending" },
    { id: "finish", label: "Finish", status: "pending" }
  ]
};

export class FastbootNextApp extends HTMLElement {
  private logger = new AppLogger();
  private client = new FastbootClient({
    onProgress: (progress) => this.updateProgress(progress),
    onReconnectNeeded: () => {
      this.logger.log("warning", translate(this.state.locale, "reconnectNeeded"));
      this.setProgressStep("transfer", "running");
    }
  });

  private state: AppViewState = {
    locale: getStoredLocale(),
    theme: getStoredTheme(),
    status: "idle",
    activeTab: "command",
    deviceInfo: { ...emptyDeviceInfo },
    progress: { ...idleProgress, steps: idleProgress.steps.map((step) => ({ ...step })) },
    logs: [],
    webUsbSupported: true,
    selectedBootFile: "",
    selectedFlashFile: "",
    selectedZipFile: "",
    lastError: null
  };

  private disposeSystemTheme: (() => void) | null = null;

  connectedCallback(): void {
    this.state.webUsbSupported = this.client.isWebUsbSupported;
    applyTheme(this.state.theme);
    storeLocale(this.state.locale);
    this.disposeSystemTheme = watchSystemTheme(() => applyTheme(this.state.theme));
    this.logger.addEventListener("change", () => {
      this.state.logs = this.logger.getEntries();
      this.render();
    });
    this.logger.log("info", "Fastboot.js Next initialized.");
    if (!this.state.webUsbSupported) {
      this.logger.log("warning", translate(this.state.locale, "webusbUnavailable"));
    }
    this.render();
  }

  disconnectedCallback(): void {
    this.disposeSystemTheme?.();
  }

  private render(): void {
    this.innerHTML = renderApp(this.state);
    this.bindEvents();
  }

  private bindEvents(): void {
    this.querySelectorAll<HTMLElement>("[data-action]").forEach((element) => {
      element.addEventListener("click", (event) => this.handleAction(event));
      element.addEventListener("change", (event) => this.handleAction(event));
    });

    this.querySelectorAll<HTMLFormElement>("form[data-form]").forEach((form) => {
      form.addEventListener("submit", (event) => this.handleSubmit(event));
    });

    this.querySelectorAll<HTMLInputElement>("input[type='file']").forEach((input) => {
      input.addEventListener("change", () => this.handleFileChange(input));
    });
  }

  private handleAction(event: Event): void {
    const target = event.currentTarget as HTMLElement;
    const action = target.dataset.action;

    if (action === "connect") {
      void this.connect();
      return;
    }

    if (action === "refresh-info") {
      void this.refreshDeviceInfo();
      return;
    }

    if (action === "set-tab") {
      this.state.activeTab = target.dataset.tab as TaskTab;
      this.render();
      return;
    }

    if (action === "set-locale") {
      const select = target as HTMLSelectElement;
      this.setLocale(select.value as Locale);
      return;
    }

    if (action === "set-theme") {
      const select = target as HTMLSelectElement;
      this.setTheme(select.value as ThemeMode);
      return;
    }

    if (action === "clear-logs") {
      this.logger.clear();
      return;
    }

    if (action === "copy-logs") {
      void this.copyLogs();
    }
  }

  private async handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const type = form.dataset.form as TaskTab;

    try {
      if (type === "command") {
        await this.submitCommand(form);
      } else if (type === "boot") {
        await this.submitBoot(form);
      } else if (type === "flash") {
        await this.submitFlash(form);
      } else if (type === "zip") {
        await this.submitZip(form);
      }
    } catch (error) {
      this.fail(error);
    }
  }

  private handleFileChange(input: HTMLInputElement): void {
    const label = describeFile(getSelectedFile(input));
    const kind = input.dataset.input;
    if (kind === "boot-file") {
      this.state.selectedBootFile = label;
    } else if (kind === "flash-file") {
      this.state.selectedFlashFile = label;
    } else if (kind === "zip-file") {
      this.state.selectedZipFile = label;
    }
    this.render();
  }

  private async connect(): Promise<void> {
    if (this.state.status === "connecting" || this.state.status === "running") {
      return;
    }

    this.setStatus("connecting");
    this.startProgress("connect", translate(this.state.locale, "connecting"));
    this.logger.log("info", "Requesting WebUSB fastboot device.");

    try {
      this.state.deviceInfo = await this.client.connectDevice();
      this.setProgressStep("finish", "success");
      this.state.progress = { ...this.state.progress, value: 1, label: translate(this.state.locale, "connected") };
      this.setStatus("connected");
      this.logger.log("success", `Connected to ${this.state.deviceInfo.product ?? "fastboot device"}.`);
    } catch (error) {
      this.fail(error);
    }
  }

  private async refreshDeviceInfo(): Promise<void> {
    this.setStatus("running");
    try {
      this.state.deviceInfo = await this.client.getDeviceInfo();
      this.setStatus("connected");
      this.logger.log("success", "Device variables refreshed.");
    } catch (error) {
      this.fail(error);
    }
  }

  private async submitCommand(form: HTMLFormElement): Promise<void> {
    const input = form.elements.namedItem("command") as HTMLInputElement | null;
    const command = input?.value.trim() ?? "";
    if (!command) {
      throw new Error(translate(this.state.locale, "emptyCommand"));
    }

    this.startOperation("command", `fastboot ${command}`);
    this.logger.log("command", `$ fastboot ${command}`);
    const result = await this.client.runCommand(command);
    this.logger.log("success", result.text || result.status);
    input!.value = "";
    this.finishOperation();
  }

  private async submitBoot(form: HTMLFormElement): Promise<void> {
    const fileInput = form.querySelector<HTMLInputElement>("[data-input='boot-file']");
    const file = fileInput ? getSelectedFile(fileInput) : null;
    if (!file) {
      throw new Error(translate(this.state.locale, "noFile"));
    }
    this.confirmDanger();

    this.startOperation("boot", `boot ${file.name}`);
    this.logger.log("warning", `Booting selected image: ${file.name}`);
    await this.client.bootImage(file);
    this.finishOperation();
  }

  private async submitFlash(form: HTMLFormElement): Promise<void> {
    const fileInput = form.querySelector<HTMLInputElement>("[data-input='flash-file']");
    const partitionInput = form.elements.namedItem("partition") as HTMLInputElement | null;
    const partition = partitionInput?.value.trim() ?? "";
    const file = fileInput ? getSelectedFile(fileInput) : null;
    if (!partition) {
      throw new Error(translate(this.state.locale, "noPartition"));
    }
    if (!file) {
      throw new Error(translate(this.state.locale, "noFile"));
    }
    this.confirmDanger();

    this.startOperation("flash", `flash ${partition}`);
    this.logger.log("warning", `Flashing ${file.name} to ${partition}.`);
    await this.client.flashImage(partition, file);
    partitionInput!.value = "";
    this.finishOperation();
  }

  private async submitZip(form: HTMLFormElement): Promise<void> {
    const fileInput = form.querySelector<HTMLInputElement>("[data-input='zip-file']");
    const file = fileInput ? getSelectedFile(fileInput) : null;
    if (!file) {
      throw new Error(translate(this.state.locale, "noFile"));
    }
    this.confirmDanger();

    this.startOperation("zip", `flash zip ${file.name}`);
    this.logger.log("warning", `Flashing factory/update ZIP: ${file.name}`);
    await this.client.flashZip(file);
    this.finishOperation();
  }

  private setLocale(locale: Locale): void {
    this.state.locale = locale;
    storeLocale(locale);
    this.logger.log("info", `Language changed to ${locale}.`);
    this.render();
  }

  private setTheme(theme: ThemeMode): void {
    this.state.theme = theme;
    storeTheme(theme);
    this.render();
  }

  private setStatus(status: ConnectionState): void {
    this.state.status = status;
    this.render();
  }

  private startOperation(kind: OperationKind, label: string): void {
    this.setStatus("running");
    this.startProgress(kind, label);
  }

  private startProgress(kind: OperationKind, label: string): void {
    this.state.lastError = null;
    this.state.progress = {
      active: true,
      kind,
      label,
      value: 0,
      steps: [
        { id: "prepare", label: "Prepare", status: "success" },
        { id: "transfer", label: "Transfer", status: "running" },
        { id: "finish", label: "Finish", status: "pending" }
      ]
    };
    this.render();
  }

  private updateProgress(progress: FastbootProgress): void {
    this.state.progress = {
      ...this.state.progress,
      label: progress.label,
      value: Math.max(0, Math.min(1, progress.value))
    };
    this.setProgressStep("transfer", progress.value >= 1 ? "success" : "running", false);
    this.render();
  }

  private setProgressStep(id: string, status: ProgressState["steps"][number]["status"], shouldRender = true): void {
    this.state.progress = {
      ...this.state.progress,
      steps: this.state.progress.steps.map((step) => (step.id === id ? { ...step, status } : step))
    };
    if (shouldRender) {
      this.render();
    }
  }

  private finishOperation(): void {
    this.setProgressStep("transfer", "success", false);
    this.setProgressStep("finish", "success", false);
    this.state.progress = { ...this.state.progress, value: 1, label: translate(this.state.locale, "success") };
    this.setStatus("success");
    window.setTimeout(() => {
      if (this.state.status === "success") {
        this.state.status = "connected";
        this.render();
      }
    }, 1200);
    this.logger.log("success", "Operation completed.");
  }

  private fail(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.state.lastError = message;
    this.setProgressStep("finish", "error", false);
    this.state.progress = { ...this.state.progress, label: message };
    this.state.status = "error";
    this.logger.log("error", message);
    this.render();
  }

  private confirmDanger(): void {
    if (!window.confirm(translate(this.state.locale, "confirmDanger"))) {
      throw new Error("Operation cancelled by user.");
    }
  }

  private async copyLogs(): Promise<void> {
    await navigator.clipboard.writeText(this.logger.toText());
    this.logger.log("success", translate(this.state.locale, "copied"));
  }
}
