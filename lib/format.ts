export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(2)}${units[unitIndex]}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export interface EmbedTemplateVars {
  filename: string;
  size: string;
  uploader: string;
  site: string;
}

export function renderEmbedTemplate(template: string, vars: EmbedTemplateVars): string {
  return template
    .replaceAll("{filename}", vars.filename)
    .replaceAll("{size}", vars.size)
    .replaceAll("{uploader}", vars.uploader)
    .replaceAll("{site}", vars.site);
}
