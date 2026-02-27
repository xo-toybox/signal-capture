async function patchSignal(
  signalId: string,
  field: string,
  value: unknown,
): Promise<void> {
  const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  });
  if (!res.ok) throw new Error(`Failed to patch ${field}: ${res.status}`);
}

export async function toggleStar(
  signalId: string,
  currentValue: boolean,
): Promise<boolean> {
  const next = !currentValue;
  await patchSignal(signalId, 'is_starred', next);
  return next;
}

export async function toggleArchive(
  signalId: string,
  currentValue: boolean,
): Promise<boolean> {
  const next = !currentValue;
  await patchSignal(signalId, 'is_archived', next);
  return next;
}

export async function togglePublish(
  signalId: string,
  currentValue: boolean,
): Promise<boolean> {
  const next = !currentValue;
  await patchSignal(signalId, 'is_published', next);
  return next;
}

export async function deleteSignal(signalId: string): Promise<void> {
  const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete: ${res.status}`);
}

/** Re-create a deleted signal by POSTing it back. Returns the new signal data. */
export async function restoreSignal(raw_input: string, source_url: string | null): Promise<unknown> {
  const res = await fetch('/api/signals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_input, source_url }),
  });
  if (!res.ok) throw new Error(`Failed to restore: ${res.status}`);
  return res.json();
}
