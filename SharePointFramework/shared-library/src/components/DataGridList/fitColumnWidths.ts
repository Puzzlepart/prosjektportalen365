import { TableColumnSizingOptions } from '@fluentui/react-components'
import { IDataGridColumn } from './types'

/**
 * Sizing options that share a container's width across the columns in proportion to their preferred
 * widths, never narrower than each column's `minWidth`.
 *
 * Fluent's own auto-fit takes width from the last column first and only down to `minWidth`, which
 * leaves the first columns wide and the last ones narrow, and cannot fit at all once the minimum
 * widths alone exceed the container. Giving every column an ideal width that already sums to the
 * container, as the v8 justified layout did, sidesteps the first; the second is only solved by the
 * minimum widths themselves.
 *
 * @param columns The columns, with `defaultWidth` as the preferred width and `minWidth` as the floor
 * @param containerWidth The width to share, in pixels; nothing is shared for `0` or less
 */
export function fitColumnWidths(
  columns: IDataGridColumn[],
  containerWidth: number
): TableColumnSizingOptions {
  const weights = columns.map((column) => column.defaultWidth ?? column.minWidth ?? 0)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  return columns.reduce<TableColumnSizingOptions>((options, column, index) => {
    const minWidth = column.minWidth ?? 0
    const share =
      containerWidth > 0 && totalWeight > 0
        ? Math.floor((containerWidth * weights[index]) / totalWeight)
        : (column.defaultWidth ?? minWidth)
    const width = Math.max(minWidth, share)
    return { ...options, [column.columnId]: { minWidth, defaultWidth: width, idealWidth: width } }
  }, {})
}
