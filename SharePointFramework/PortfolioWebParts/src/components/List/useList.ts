import { IListColumn } from 'pp365-shared-library'
import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useOnRenderItemColumn } from './ItemColumn'
import { IListProps } from './types'
import { useAddColumn } from './useAddColumn'

/**
 * Height of an element, kept up to date as it changes.
 */
function useElementHeight(ref: RefObject<HTMLElement>): number {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const measure = () => setHeight(element.getBoundingClientRect().height)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return height
}

/**
 * Component logic hook for `List`: the columns to show (the add column last, hidden ones left
 * out), the cell renderer, the column header click, and the height of the pinned command bar,
 * under which the column headers are pinned.
 *
 * @param props - The props for the list.
 */
export function useList(props: IListProps<any>) {
  const { addColumn } = useAddColumn(props.isAddColumnEnabled)
  const onRenderItemColumn = useOnRenderItemColumn()
  const columns = useMemo(
    () =>
      [...props.columns, addColumn].filter(
        (column: IListColumn & { internalName?: string }) =>
          !column?.data?.isHidden && !props.hiddenColumns?.includes(column?.internalName)
      ),
    [props.columns, props.hiddenColumns, props.isAddColumnEnabled]
  )
  const onColumnHeaderClick = (column: IListColumn, target: HTMLElement) => {
    props.onColumnContextMenu?.({ column, target })
  }
  const commandBarRef = useRef<HTMLDivElement>(null)
  const stickyTop = useElementHeight(commandBarRef)

  return { columns, onRenderItemColumn, onColumnHeaderClick, commandBarRef, stickyTop } as const
}
