const PAGE_SIZE = 1000;

/**
 * Fetches every row of a query by paging through `.range()`, since a single
 * request's response is capped (`max_rows`, 1000 by default) regardless of
 * how many rows actually match. The query must request `{ count: "exact" }`
 * and have a stable order so pages don't overlap.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
    count: number | null;
  }>,
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;
  let total: number | null = null;

  for (;;) {
    const { data, error, count } = await page(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);

    const batch = data ?? [];
    rows.push(...batch);
    if (total === null) total = count;
    offset += batch.length;

    if (batch.length === 0 || (total !== null && offset >= total)) break;
  }

  return rows;
}
