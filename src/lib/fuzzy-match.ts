/**
 * Simple fuzzy match: checks if all characters in query appear in target in order.
 * Returns a score (lower = better match) or -1 if no match.
 */
export function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (q.length === 0) return 0;

  let qi = 0;
  let score = 0;
  let lastMatch = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Bonus for consecutive matches
      score += lastMatch === ti - 1 ? 0 : ti - lastMatch;
      lastMatch = ti;
      qi++;
    }
  }

  return qi === q.length ? score : -1;
}

/** Filter + sort items by fuzzy match score. Returns matched items with their original indices. */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
): T[] {
  if (!query) return items;

  return items
    .map((item) => ({ item, score: fuzzyMatch(query, getText(item)) }))
    .filter((r) => r.score >= 0)
    .sort((a, b) => a.score - b.score)
    .map((r) => r.item);
}
