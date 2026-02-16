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
