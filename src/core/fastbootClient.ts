import {
  FastbootDevice,
  USER_ACTION_MAP,
  configureZip,
  setDebugLevel
} from "android-fastboot";
import { DEVICE_VARIABLES, DeviceInfo, emptyDeviceInfo } from "./deviceInfo";
import { CommandResult } from "./operationTypes";

const FASTBOOT_USB_FILTER = {
  classCode: 0xff,
  subclassCode: 0x42,
  protocolCode: 0x03
} satisfies USBDeviceFilter;

export interface FastbootProgress {
  label: string;
  value: number;
  action?: string;
  item?: string;
}

export interface FastbootClientOptions {
  onProgress?: (progress: FastbootProgress) => void;
  onReconnectNeeded?: () => void;
  onDiagnostic?: (message: string) => void;
}

type FastbootDeviceInternals = FastbootDevice & {
  isConnected: boolean;
  device: USBDevice | null;
  _validateAndConnectDevice?: () => Promise<void>;
};

export interface UsbDebugReport {
  lines: string[];
}

export class FastbootConnectionError extends Error {
  constructor(
    public readonly stage:
      | "webusb-unsupported"
      | "user-cancelled"
      | "device-selection"
      | "device-validation"
      | "open-or-claim"
      | "fastboot-getvar"
      | "not-connected",
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FastbootConnectionError";
  }
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
    return this.isDeviceReady(this.device);
  }

  async connectDevice(): Promise<DeviceInfo> {
    this.assertWebUsb();

    const selectedDevice = await this.requestFastbootDevice();
    const device = new FastbootDevice() as FastbootDeviceInternals;
    device.device = selectedDevice;
    this.device = device;

    try {
      this.options.onDiagnostic?.("Opening selected USB device with android-fastboot.");
      await this.validateAndConnectDevice(device);
    } catch (error) {
      this.device = null;
      throw this.wrapConnectionError("open-or-claim", "Failed to open or claim the selected fastboot interface.", error);
    }

    try {
      return await this.getDeviceInfo();
    } catch (error) {
      throw this.wrapConnectionError("fastboot-getvar", "Connected to USB, but fastboot getvar failed.", error);
    }
  }

  async disconnectDevice(): Promise<void> {
    if (!this.device) {
      return;
    }
    const usbDevice = (this.device as FastbootDeviceInternals).device;
    if (usbDevice?.opened) {
      const firstInterface = usbDevice.configuration?.interfaces[0];
      if (firstInterface?.claimed) {
        await usbDevice.releaseInterface(firstInterface.interfaceNumber);
      }
      await usbDevice.close();
    }
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
        } catch (error) {
          this.options.onDiagnostic?.(`getvar:${variable} failed\n${formatErrorDetails(error)}`);
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

  async debugUsbRequest(): Promise<UsbDebugReport> {
    this.assertWebUsb();
    const lines: string[] = ["navigator.usb is available.", "Calling navigator.usb.requestDevice({ filters: [] })."];
    let device: USBDevice;

    try {
      device = await navigator.usb.requestDevice({ filters: [] });
    } catch (error) {
      throw this.wrapConnectionError("device-selection", "USB debug requestDevice failed.", error);
    }

    lines.push(`Selected: vendorId=0x${hex(device.vendorId)}, productId=0x${hex(device.productId)}`);
    lines.push(`Product: ${device.productName ?? "(unknown)"}`);
    lines.push(`Manufacturer: ${device.manufacturerName ?? "(unknown)"}`);
    lines.push(`Serial: ${device.serialNumber ?? "(unknown)"}`);
    lines.push(...describeUsbTopology(device));

    try {
      lines.push("Testing open().");
      await device.open();
      lines.push(`open(): ok, opened=${String(device.opened)}`);
    } catch (error) {
      lines.push(`open(): failed\n${formatErrorDetails(error)}`);
      return { lines };
    }

    try {
      lines.push("Testing selectConfiguration(1).");
      await device.selectConfiguration(1);
      lines.push("selectConfiguration(1): ok");
    } catch (error) {
      lines.push(`selectConfiguration(1): failed\n${formatErrorDetails(error)}`);
    }

    try {
      lines.push("Testing claimInterface(0).");
      await device.claimInterface(0);
      lines.push("claimInterface(0): ok");
    } catch (error) {
      lines.push(`claimInterface(0): failed\n${formatErrorDetails(error)}`);
    }

    try {
      const claimed = device.configuration?.interfaces[0]?.claimed;
      if (claimed) {
        await device.releaseInterface(0);
        lines.push("releaseInterface(0): ok");
      }
      await device.close();
      lines.push("close(): ok");
    } catch (error) {
      lines.push(`cleanup failed\n${formatErrorDetails(error)}`);
    }

    return { lines };
  }

  private requireDevice(): FastbootDevice {
    const device = this.device;
    if (!device || !this.isDeviceReady(device)) {
      throw new FastbootConnectionError("not-connected", "No fastboot device is connected.");
    }
    return device;
  }

  private assertWebUsb(): void {
    if (!this.isWebUsbSupported) {
      throw new FastbootConnectionError("webusb-unsupported", "WebUSB is not available in this browser.");
    }
  }

  private async requestFastbootDevice(): Promise<USBDevice> {
    this.options.onDiagnostic?.("Calling navigator.usb.requestDevice() with fastboot class filters.");
    try {
      return await navigator.usb.requestDevice({
        filters: [FASTBOOT_USB_FILTER]
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError") {
        throw this.wrapConnectionError("user-cancelled", "No fastboot device was selected.", error);
      }
      throw this.wrapConnectionError("device-selection", "Failed to select a fastboot USB device.", error);
    }
  }

  private async validateAndConnectDevice(device: FastbootDeviceInternals): Promise<void> {
    if (typeof device._validateAndConnectDevice === "function") {
      await device._validateAndConnectDevice();
      return;
    }

    this.options.onDiagnostic?.("Falling back to FastbootDevice.connect(); package internals are unavailable.");
    await device.connect();
  }

  private isDeviceReady(device: FastbootDevice | null): boolean {
    if (!device) {
      return false;
    }
    const maybeDevice = device as FastbootDeviceInternals;
    if (typeof maybeDevice.isConnected === "boolean") {
      return maybeDevice.isConnected;
    }
    return Boolean(maybeDevice.device?.opened && maybeDevice.device.configuration?.interfaces[0]?.claimed);
  }

  private wrapConnectionError(stage: FastbootConnectionError["stage"], message: string, error: unknown): FastbootConnectionError {
    if (error instanceof FastbootConnectionError) {
      return error;
    }
    const detail = error instanceof Error ? `${message} ${error.message}` : message;
    return new FastbootConnectionError(stage, detail, error);
  }
}

export function formatErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const lines = [
      `name: ${error.name}`,
      `message: ${error.message}`,
      error.stack ? `stack: ${error.stack}` : "stack: (none)"
    ];
    const cause = "cause" in error ? error.cause : undefined;
    if (cause) {
      lines.push("cause:");
      lines.push(formatErrorDetails(cause));
    }
    return lines.join("\n");
  }
  return `name: NonError\nmessage: ${String(error)}\nstack: (none)`;
}

function describeUsbTopology(device: USBDevice): string[] {
  const lines: string[] = [];
  const configurations = device.configurations ?? [];
  lines.push(`Configurations: ${configurations.length}`);
  for (const configuration of configurations) {
    lines.push(`configuration=${configuration.configurationValue}, interfaces=${configuration.interfaces.length}`);
    for (const usbInterface of configuration.interfaces) {
      lines.push(`  interface=${usbInterface.interfaceNumber}, claimed=${String(usbInterface.claimed)}, alternates=${usbInterface.alternates.length}`);
      for (const alternate of usbInterface.alternates) {
        lines.push(
          `    alternate=${alternate.alternateSetting}, class=0x${hex(alternate.interfaceClass)}, subclass=0x${hex(alternate.interfaceSubclass)}, protocol=0x${hex(alternate.interfaceProtocol)}, endpoints=${alternate.endpoints.length}`
        );
        for (const endpoint of alternate.endpoints) {
          lines.push(`      endpoint=${endpoint.endpointNumber}, direction=${endpoint.direction}, type=${endpoint.type}, packetSize=${endpoint.packetSize}`);
        }
      }
    }
  }
  return lines;
}

function hex(value: number): string {
  return value.toString(16).padStart(4, "0");
}
