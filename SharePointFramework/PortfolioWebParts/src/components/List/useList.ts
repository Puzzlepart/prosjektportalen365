import { useMemo } from 'react'
import { useOnRenderItemColumn } from './ItemColumn'
import { useOnRenderDetailsHeader } from './ListHeader'
import { IListProps } from './types'
import { useAddColumn } from './useAddColumn'
import { DetailsListLayoutMode } from '@fluentui/react'

/**
 * Custom hook that returns the properties needed for rendering a list.
 * 
 * @param props - The props for the list.
 * 
 * @returns An object containing the properties needed for rendering a list, returns
 * the provided props aswell as the `onRenderItemColumn`, `onRenderDetailsHeader`,
 *  `columns` and `layoutMode` properties that is calculated based on the provided props.
 */
export function useList(props: IListProps<any>) {
  const { addColumn } = useAddColumn(props.isAddColumnEnabled)
  const onRenderItemColumn = useOnRenderItemColumn(props)
  const onRenderDetailsHeader = useOnRenderDetailsHeader(props)
  const columns = useMemo(() => [...props.columns, addColumn].filter(col => !col.data?.isHidden), [props.columns])
  const layoutMode = props.isListLayoutModeJustified
    ? DetailsListLayoutMode.justified
    : DetailsListLayoutMode.fixedColumns
  return { 
    ...props,
    onRenderItemColumn, 
    onRenderDetailsHeader, 
    columns, 
    layoutMode 
  } as IListProps<any>
}