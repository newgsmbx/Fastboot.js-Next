import {
  FastbootDevice,
  USER_ACTION_MAP,
  configureZip,
  setDebugLevel
} from "android-fastboot";
import { DEVICE_VARIABLES, DeviceInfo, emptyDeviceInfo } from "./deviceInfo";
import { CommandResult } from "./operationTypes";

export interface FastbootProgress {
  label: string;
  value: number;
  action?: string;
  item?: string;
}

export interface FastbootClientOptions {
  onProgress?: (progress: FastbootProgress) => void;
  onReconnectNeeded?: () => void;
}

export class FastbootClient {
  private device: FastbootDevice | null = null;
  private options: FastbootClientOptions;

  constructor(options: FastbootClientOptions = {}) {
    this.options = options;
    setDebugLevel(2);
    configureZip({
      workerScripts: {
        inflate: []
      }
    });
  }

  get isWebUsbSupported(): boolean {
    return typeof navigator !== "undefined" && "usb" in navigator;
  }

  get isConnected(): boolean {
    return Boolean(this.device?.connected);
  }

  async connectDevice(): Promise<DeviceInfo> {
    this.assertWebUsb();
    this.device = new FastbootDevice();
    await this.device.connect();
    return this.getDeviceInfo();
  }

  async disconnectDevice(): Promise<void> {
    if (!this.device) {
      return;
    }
    await this.runCommand("reboot");
    this.device = null;
  }

  async runCommand(command: string): Promise<CommandResult> {
    const device = this.requireDevice();
    return device.runCommand(command);
  }

  async bootImage(file: Blob): Promise<void> {
    const device = this.requireDevice();
    this.options.onProgress?.({ label: "download boot image", value: 0 });
    await device.bootBlob(file, (value) => {
      this.options.onProgress?.({ label: "download boot image", value });
    });
    this.options.onProgress?.({ label: "boot image", value: 1 });
  }

  async flashImage(partition: string, file: Blob): Promise<void> {
    const device = this.requireDevice();
    this.options.onProgress?.({ label: `flash ${partition}`, value: 0 });
    await device.flashBlob(partition, file, (value) => {
      this.options.onProgress?.({ label: `flash ${partition}`, value });
    });
    this.options.onProgress?.({ label: `flash ${partition}`, value: 1 });
  }

  async flashZip(file: Blob): Promise<void> {
    const device = this.requireDevice();
    await device.flashFactoryZip(
      file,
      false,
      () => this.options.onReconnectNeeded?.(),
      (action, item, value) => {
        const userAction = USER_ACTION_MAP[action] ?? action;
        this.options.onProgress?.({
          action,
          item,
          label: `${userAction} ${item}`,
          value
        });
      }
    );
    this.options.onProgress?.({ label: "factory zip complete", value: 1 });
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const device = this.requireDevice();
    const entries = await Promise.all(
      DEVICE_VARIABLES.map(async ([key, variable]) => {
        try {
          return [key, await device.getVariable(variable)] as const;
        } catch {
          return [key, null] as const;
        }
      })
    );

    return entries.reduce<DeviceInfo>(
      (info, [key, value]) => ({
        ...info,
        [key]: value
      }),
      { ...emptyDeviceInfo }
    );
  }

  private requireDevice(): FastbootDevice {
    if (!this.device || !this.device.connected) {
      throw new Error("No fastboot device is connected.");
    }
    return this.device;
  }

  private assertWebUsb(): void {
    if (!this.isWebUsbSupported) {
      throw new Error("WebUSB is not available in this browser.");
    }
  }
}
