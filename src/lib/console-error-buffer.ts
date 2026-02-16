const MAX_ENTRIES = 10;
const buffer: string[] = [];
let initialized = false;

export function initErrorBuffer(): void {
  if (initialized) return;
  initialized = true;

  window.addEventListener('error', (e) => {
    const ts = new Date().toISOString();
    const loc = e.filename ? ` (${e.filename}:${e.lineno})` : '';
    const entry = `[${ts}] ${e.message}${loc}`;
    buffer.push(entry);
    if (buffer.length > MAX_ENTRIES) buffer.shift();
  });

  window.addEventListener('unhandledrejection', (e) => {
    const ts = new Date().toISOString();
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    const entry = `[${ts}] Unhandled rejection: ${msg}`;
    buffer.push(entry);
    if (buffer.length > MAX_ENTRIES) buffer.shift();
  });
}

export function getErrors(): string[] {
  return [...buffer];
}
