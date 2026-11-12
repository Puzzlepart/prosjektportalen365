import { MouseEvent, ReactNode } from 'react'

/**
 * Describes a list column's value source, renderer, sizing and header interactions.
 */
export interface IListColumn<TItem = any> {
  key: string

  /**
   * Text shown in the column header.
   */
  name: string

  /**
   * Property of the item the column shows.
   */
  fieldName?: string

  /**
   * Narrowest the column may become, in pixels.
   */
  minWidth: number

  /**
   * Preferred starting width in pixels; the shared grid adapters map it to defaultWidth.
   */
  maxWidth?: number

  isResizable?: boolean

  isSorted?: boolean

  isSortedDescending?: boolean

  /**
   * Whether cell content may wrap onto several lines.
   */
  isMultiline?: boolean

  iconName?: string

  iconClassName?: string

  /**
   * Class applied to every cell in the column.
   */
  className?: string

  /**
   * Arbitrary payload. The solutions keep the column's data type, render options, groupability and
   * selection state here.
   */
  data?: any

  /**
   * Renders a cell, overriding the data-type renderer.
   */
  onRender?: (item?: TItem, index?: number, column?: IListColumn<TItem>) => ReactNode

  /**
   * Invoked when the column header is right-clicked or its chevron is used.
   */
  onColumnContextMenu?: (column?: IListColumn<TItem>, ev?: MouseEvent<HTMLElement>) => void
}
