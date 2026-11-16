import { ColumnRenderComponentRegistry, IListColumn } from 'pp365-shared-library'
import { ReactNode, RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useOnRenderItemColumn } from './ItemColumn'
import { IListProps, ResizeColumn } from './types'
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
 * The registered component of a column's data type, or null. Looked up as the grid renders: the
 * portfolio's own data types register after the list's first render, and a column's data reaches
 * the column later still.
 */
function getDataTypeComponent(column: IListColumn) {
  return ColumnRenderComponentRegistry.getComponent(column['dataType'])
}

/**
 * What a column's data type shows under the column's name in its header (the status report
 * column's section legend), or null.
 */
function renderHeaderAddon(column: IListColumn): ReactNode {
  return getDataTypeComponent(column)?.renderHeaderAddon?.(column) ?? null
}

/**
 * The least width a column's data type needs for the column's data (the status report column's
 * strip), or undefined.
 */
function getColumnMinWidth(column: IListColumn): number | undefined {
  return getDataTypeComponent(column)?.getMinWidth?.(column)
}

/**
 * Component logic hook for `List`: the columns to show (the add column last, hidden ones left
 * out), the cell renderer, the column header click, what a column's data type adds to its header
 * and its width, and the height of the pinned command bar, under which the column headers are
 * pinned.
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
  const onColumnHeaderClick = (
    column: IListColumn,
    target: HTMLElement,
    resizeColumn?: ResizeColumn
  ) => {
    props.onColumnContextMenu?.({ column, target, resizeColumn })
  }
  const commandBarRef = useRef<HTMLDivElement>(null)
  const stickyTop = useElementHeight(commandBarRef)

  return {
    columns,
    onRenderItemColumn,
    onColumnHeaderClick,
    renderHeaderAddon,
    getColumnMinWidth,
    commandBarRef,
    stickyTop
  } as const
}
