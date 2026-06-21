export interface DeviceInfo {
  serial: string | null;
  product: string | null;
  variant: string | null;
  bootloaderVersion: string | null;
  secure: string | null;
  unlocked: string | null;
  currentSlot: string | null;
  batteryVoltage: string | null;
  maxDownloadSize: string | null;
}

export const emptyDeviceInfo: DeviceInfo = {
  serial: null,
  product: null,
  variant: null,
  bootloaderVersion: null,
  secure: null,
  unlocked: null,
  currentSlot: null,
  batteryVoltage: null,
  maxDownloadSize: null
};

export const DEVICE_VARIABLES: Array<[keyof DeviceInfo, string]> = [
  ["serial", "serialno"],
  ["product", "product"],
  ["variant", "variant"],
  ["bootloaderVersion", "version-bootloader"],
  ["secure", "secure"],
  ["unlocked", "unlocked"],
  ["currentSlot", "current-slot"],
  ["batteryVoltage", "battery-voltage"],
  ["maxDownloadSize", "max-download-size"]
];
