export async function toggleStar(
  signalId: string,
  currentValue: boolean,
): Promise<boolean> {
  const next = !currentValue;
  const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_starred: next }),
  });
  if (!res.ok) throw new Error(`Failed to toggle star: ${res.status}`);
  return next;
}

export async function toggleArchive(
  signalId: string,
  currentValue: boolean,
): Promise<boolean> {
  const next = !currentValue;
  const res = await fetch(`/api/signals?id=${encodeURIComponent(signalId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_archived: next }),
  });
  if (!res.ok) throw new Error(`Failed to toggle archive: ${res.status}`);
  return next;
}
