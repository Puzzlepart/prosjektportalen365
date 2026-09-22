import type { IItems } from '@pnp/sp/items'

/**
 * Default page size. PnPjs v3's `getAll()` used 2000; v4's async iterator sets no `$top` at all,
 * which makes SharePoint fall back to 100-item pages and multiplies request counts ~20x on large
 * lists. Always sending an explicit `$top` keeps request volume identical to before the migration.
 */
export const DEFAULT_PAGE_SIZE = 2000

/**
 * Fetches every item behind a PnPjs items query by following server paging until exhausted.
 *
 * Replaces PnPjs v3's `items.getAll()`, which was removed in v4 in favour of async iteration.
 * Any `select`, `filter`, `expand` or `orderBy` already applied to `items` is preserved; a
 * caller-supplied `top()` is overridden by `pageSize`, because under v4 `$top` is the page size,
 * not a cap on the result set.
 *
 * @param items PnPjs items query, e.g. `list.items.select('Title')`
 * @param pageSize Items per request; defaults to the 2000 that v3 used
 */
export async function getAllItems<T = any>(
  items: IItems,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<T[]> {
  const all: T[] = []
  for await (const page of items.top(pageSize)) {
    all.push(...(page as T[]))
  }
  return all
}
