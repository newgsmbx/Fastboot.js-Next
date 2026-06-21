export type ConnectionState = "idle" | "connecting" | "connected" | "running" | "success" | "error";

export type OperationKind = "connect" | "command" | "boot" | "flash" | "zip" | "disconnect";

export interface OperationStep {
  id: string;
  label: string;
  status: "pending" | "running" | "success" | "error";
}

export interface ProgressState {
  active: boolean;
  kind: OperationKind | null;
  label: string;
  value: number;
  steps: OperationStep[];
}

export interface CommandResult {
  status: string;
  text: string;
}
