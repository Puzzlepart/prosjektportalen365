import { cloneElement, isValidElement, ReactElement, ReactNode } from 'react'
import strings from 'SharedLibraryStrings'
import { format } from './format'

/**
 * A Fluent table header cell's props (`columnSizing.getTableHeaderCellProps`) with the column's
 * resize handle, the `aside` they hold, named in the page's language: Fluent names it «Resize
 * column» and its value «… pixels», in English, and reads them once the keyboard mode puts the
 * focus on it (WCAG 3.1.2, 4.1.2). The hub's lists (`ListGrid`) and the dynamic list's table use
 * it, so both say «Bredde på kolonnen Tittel» and «160 piksler».
 *
 * @param headerCellProps The header cell's props, with the handle in `aside` where it has one
 * @param columnName The column's name, which names the handle
 * @param width The column's width in pixels, the handle's value
 *
 * @returns The props, the handle named; unchanged where there is no handle
 */
export function nameColumnResizeHandle<T extends object>(
  headerCellProps: T,
  columnName: string,
  width: number
): T {
  const aside = (headerCellProps as { aside?: ReactNode }).aside
  if (!isValidElement(aside)) return headerCellProps
  return {
    ...headerCellProps,
    aside: cloneElement(aside as ReactElement<Record<string, unknown>>, {
      'aria-label': format(strings.Aria.ColumnResizeHandleLabel, columnName),
      'aria-valuetext': format(strings.Aria.ColumnWidthValueText, Math.round(width))
    })
  }
}
