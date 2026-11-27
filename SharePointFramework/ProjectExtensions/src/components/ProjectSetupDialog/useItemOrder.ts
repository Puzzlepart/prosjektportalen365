import { useMemo } from 'react'

/**
 * The order a group lists its items in: what the template requires, then what it selects, then
 * the rest, each by title. It is settled when the template or the items change and kept while
 * the user ticks, so an item does not move away under the pointer.
 *
 * @param items The items to list
 * @param rank Where an item belongs: 0 required, 1 selected, 2 the rest
 * @param templateKey What identifies the template the items belong to
 */
export function useItemOrder<T extends { key: string | number; text: string }>(
  items: T[],
  rank: (item: T) => number,
  templateKey: unknown
): T[] {
  const itemKeys = items.map((item) => item.key).join('|')
  const order = useMemo(
    () =>
      [...items]
        .sort((a, b) => rank(a) - rank(b) || a.text.localeCompare(b.text, 'nb'))
        .map((item) => String(item.key)),
    [templateKey, itemKeys]
  )
  return useMemo(() => {
    const byKey = new Map(items.map((item) => [String(item.key), item]))
    return order.map((key) => byKey.get(key)).filter(Boolean)
  }, [order, items])
}
