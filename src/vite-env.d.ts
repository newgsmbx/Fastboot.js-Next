/// <reference types="vite/client" />

declare module "android-fastboot" {
  export type FactoryAction = "flash" | "wipe" | "reboot" | string;

  export const USER_ACTION_MAP: Record<string, string>;

  export function setDebugLevel(level: number | boolean): void;

  export function configureZip(options: {
    workerScripts?: Record<string, string[]>;
    [key: string]: unknown;
  }): void;

  export class FastbootError extends Error {
    status: string;
    bootloaderMessage: string;
  }

  export class UsbError extends Error {}

  export class FastbootDevice {
    connected: boolean;
    device: USBDevice | null;
    connect(): Promise<void>;
    waitForDisconnect(): Promise<void>;
    waitForConnect(onReconnect?: () => void): Promise<void>;
    runCommand(command: string): Promise<{ status: string; text: string }>;
    getVariable(varName: string): Promise<string | null>;
    reboot(target?: string, wait?: boolean, onReconnect?: () => void): Promise<void>;
    flashBlob(partition: string, blob: Blob, onProgress?: (progress: number) => void): Promise<void>;
    bootBlob(blob: Blob, onProgress?: (progress: number) => void): Promise<void>;
    flashFactoryZip(
      blob: Blob,
      wipe?: boolean,
      onReconnect?: () => void,
      onProgress?: (action: FactoryAction, item: string, progress: number) => void
    ): Promise<void>;
  }
}
