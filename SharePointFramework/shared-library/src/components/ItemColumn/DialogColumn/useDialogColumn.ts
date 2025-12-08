import { tryParseJson } from 'pp365-shared-library'
import { IDialogColumnProps } from './types'
import { useInfoText } from './useInfoText'
import _ from 'lodash'
import { TableColumnSizingOptions } from '@fluentui/react-components'
import { useColumns } from './useColumns'

/**
 * Hook that returns the necessary props for rendering a dialog with a list of items.
 *
 * @param props - The props for the dialog column.
 *
 * @returns An object containing the necessary props for rendering a dialog column.
 */
export function useDialogColumn(props: IDialogColumnProps) {
  const infoText = useInfoText(props)
  const title = props.item[props.headerTitleField]
  const subTitle = props.item[props.headerSubTitleField]
  const items = tryParseJson(props.columnValue, [])
  const shouldRenderList = !_.isEmpty(items)
  const columns = useColumns()

  const columnSizingOptions: TableColumnSizingOptions = columns.reduce(
    (options, col) => ({
      ...options,
      [col.columnId]: {
        defaultWidth: col.defaultWidth,
        minWidth: col.minWidth
      }
    }),
    {}
  )

  return {
    infoText,
    title,
    subTitle,
    items,
    columns,
    columnSizingOptions,
    shouldRenderList
  } as const
}
