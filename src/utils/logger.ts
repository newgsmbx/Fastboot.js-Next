export type LogLevel = "info" | "success" | "warning" | "error" | "command";

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
}

export class AppLogger extends EventTarget {
  private entries: LogEntry[] = [];

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  log(level: LogLevel, message: string): void {
    this.entries = [
      ...this.entries,
      {
        id: crypto.randomUUID(),
        level,
        message,
        timestamp: new Date()
      }
    ];
    this.dispatchEvent(new Event("change"));
  }

  clear(): void {
    this.entries = [];
    this.dispatchEvent(new Event("change"));
  }

  toText(): string {
    return this.entries
      .map((entry) => `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()} ${entry.message}`)
      .join("\n");
  }
}
