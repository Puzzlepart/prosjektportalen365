import { useMemo } from 'react'
import { useOnRenderItemColumn } from './ItemColumn'
import { useOnRenderDetailsHeader } from './ListHeader/useOnRenderDetailsHeader'
import { IListProps } from './types'
import { useAddColumn } from './useAddColumn'
import { DetailsListLayoutMode, IColumn, Target } from '@fluentui/react'

/**
 * Custom hook that returns the properties needed for rendering a list.
 *
 * @param props - The props for the list.
 *
 * @returns An object containing the properties needed for rendering a list, returns
 * the provided props as well as the `onRenderItemColumn`, `onRenderDetailsHeader`,
 *  `columns` and `layoutMode` properties that is calculated based on the provided props.
 */
export function useList(props: IListProps<any>) {
  const { addColumn } = useAddColumn(props.isAddColumnEnabled)
  const onRenderItemColumn = useOnRenderItemColumn()
  const onRenderDetailsHeader = useOnRenderDetailsHeader(props)
  const columns = useMemo(
    () =>
      [...props.columns, addColumn].filter(
        (col) => !col?.data?.isHidden && !props.hiddenColumns?.includes(col?.internalName)
      ),
    [props.columns, props.hiddenColumns]
  )
  const layoutMode = props.isListLayoutModeJustified
    ? DetailsListLayoutMode.justified
    : DetailsListLayoutMode.fixedColumns
  const onColumnHeaderClick = (ev: React.MouseEvent<HTMLElement>, column: IColumn) => {
    props.onColumnContextMenu({ column, target: ev.target as Target })
  }
  const onColumnHeaderContextMenu = (column: IColumn, ev: React.MouseEvent<HTMLElement>) => {
    props.onColumnContextMenu({ column, target: ev.target as Target })
  }
  return {
    ...props,
    onRenderItemColumn,
    onRenderDetailsHeader,
    onColumnHeaderClick,
    onColumnHeaderContextMenu,
    columns,
    layoutMode
  } as IListProps<any>
}
