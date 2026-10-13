import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IListGroup } from '../types'

type Item = Record<string, any>

/**
 * State of a check that stands for several rows: all of them, none, or some (`'mixed'`).
 */
export type ListCheckState = boolean | 'mixed'

function checkState(selectedCount: number, total: number): ListCheckState {
  if (selectedCount === 0) return false
  return selectedCount === total ? true : 'mixed'
}

function groupItems(items: Item[], group: IListGroup): Item[] {
  return items.slice(group.startIndex, group.startIndex + group.count)
}

/**
 * The list's selection, kept by item rather than by row position, so it survives sorting and
 * grouping. A row's check toggles that row; a shift-click selects the rows from the last checked
 * one to it, as they stand on the screen; a group's check selects or clears the group's items; the
 * header's check selects every item, the collapsed groups' too, or clears the selection. Items that
 * leave the list (a search, a filter) leave the selection, so an export never takes along rows the
 * user no longer sees. The selected items are reported in list order.
 *
 * Given `selectedItems`, the caller keeps the selection: the hook reads it from there, and a toggle
 * reports the next selection without keeping it, so the rows show what the caller passes.
 *
 * @param items The list's items
 * @param visibleItems The items on the screen, in display order
 * @param onSelectionChange Called with the selected items whenever the selection changes
 * @param selectedItems The selection, when the caller keeps it
 */
export function useListSelection(
  items: Item[],
  visibleItems: Item[],
  onSelectionChange?: (selectedItems: Item[]) => void,
  selectedItems?: Item[]
) {
  const isControlled = selectedItems !== undefined
  const [ownSelection, setOwnSelection] = useState<ReadonlySet<Item>>(() => new Set())
  const givenSelection = useMemo(
    () => (isControlled ? new Set(selectedItems) : null),
    [isControlled, selectedItems]
  )
  const selected: ReadonlySet<Item> = givenSelection ?? ownSelection
  const anchor = useRef<Item>(null)
  // The overview builds its items anew on every render, so the report reads the latest items and
  // runs only when the selection itself changed; reporting on every new items array would render
  // the overview again, and again.
  const latest = useRef({ items, onSelectionChange, selected })
  latest.current = { items, onSelectionChange, selected }

  // Applies a change: to the grid's own selection, or, kept by the caller, as a report of the
  // next selection.
  const setSelected = useCallback(
    (next: (previous: ReadonlySet<Item>) => ReadonlySet<Item>) => {
      if (!isControlled) {
        setOwnSelection(next)
        return
      }
      const nextSelection = next(latest.current.selected)
      latest.current.onSelectionChange?.(
        latest.current.items.filter((item) => nextSelection.has(item))
      )
    },
    [isControlled]
  )

  useEffect(() => {
    if (isControlled) return
    const current = new Set(items)
    setOwnSelection((previous) => {
      const kept = Array.from(previous).filter((item) => current.has(item))
      return kept.length === previous.size ? previous : new Set(kept)
    })
  }, [items, isControlled])

  // The first render has nothing to report, and a selection the caller keeps is reported as it
  // changes.
  const reportedOnce = useRef(false)
  useEffect(() => {
    if (isControlled) return
    if (!reportedOnce.current) {
      reportedOnce.current = true
      return
    }
    const { items: currentItems, onSelectionChange: report } = latest.current
    report?.(currentItems.filter((item) => ownSelection.has(item)))
  }, [ownSelection, isControlled])

  const toggleRow = useCallback(
    (item: Item, range = false) => {
      setSelected((previous) => {
        const next = new Set(previous)
        const from = range && anchor.current ? visibleItems.indexOf(anchor.current) : -1
        const to = visibleItems.indexOf(item)
        if (from !== -1 && to !== -1) {
          const [start, end] = from < to ? [from, to] : [to, from]
          visibleItems.slice(start, end + 1).forEach((rangeItem) => next.add(rangeItem))
          return next
        }
        if (next.has(item)) next.delete(item)
        else next.add(item)
        return next
      })
      // A range keeps its starting point, so a second shift-click reaches from the same row.
      if (!range || !anchor.current) anchor.current = item
    },
    [visibleItems, setSelected]
  )

  const toggleGroup = useCallback(
    (group: IListGroup) => {
      setSelected((previous) => {
        const members = groupItems(items, group)
        const allSelected = members.every((item) => previous.has(item))
        const next = new Set(previous)
        members.forEach((item) => (allSelected ? next.delete(item) : next.add(item)))
        return next
      })
    },
    [items, setSelected]
  )

  const toggleAll = useCallback(() => {
    setSelected((previous) =>
      items.length > 0 && items.every((item) => previous.has(item)) ? new Set() : new Set(items)
    )
  }, [items, setSelected])

  const allState = useMemo(
    () => checkState(items.filter((item) => selected.has(item)).length, items.length),
    [items, selected]
  )

  const groupState = useCallback(
    (group: IListGroup): ListCheckState => {
      const members = groupItems(items, group)
      return checkState(members.filter((item) => selected.has(item)).length, members.length)
    },
    [items, selected]
  )

  const isSelected = useCallback((item: Item) => selected.has(item), [selected])

  return { isSelected, toggleRow, toggleGroup, toggleAll, allState, groupState } as const
}
