export function getSelectedFile(input: HTMLInputElement): File | null {
  return input.files && input.files.length > 0 ? input.files[0] : null;
}

export function describeFile(file: File | null): string {
  if (!file) {
    return "";
  }
  const size = file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MiB` : `${Math.max(1, Math.round(file.size / 1024))} KiB`;
  return `${file.name} (${size})`;
}
