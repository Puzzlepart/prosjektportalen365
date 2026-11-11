import { MouseEvent, ReactNode } from 'react'

/**
 * A column in a list, as the solutions describe one.
 *
 * Replaces `IColumn` from Fluent UI v8 everywhere except inside the one shared v8 list (Decision A).
 * `IProjectColumn` and `IProjectContentColumn` used to extend `IColumn`, which pulled the whole v8
 * column surface into every file that touched a column. This declares the members the repository
 * actually reads and writes — measured on 2026-09-28 — and nothing else.
 *
 * It is deliberately a structural subset of the v8 `IColumn`, with the same names and types, so a
 * value of this type can be handed straight to the v8 list without a cast, and a v8 column can be
 * read as one of these. That is what lets the hub keep v8 inside while everything around it stops
 * depending on it.
 */
export interface IListColumn<TItem = any> {
  /**
   * Unique key for the column.
   */
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
   * Widest the column may become, in pixels.
   */
  maxWidth?: number

  /**
   * Whether the user may resize the column.
   */
  isResizable?: boolean

  /**
   * Whether the list is currently sorted on this column.
   */
  isSorted?: boolean

  /**
   * Sort direction, when sorted on this column.
   */
  isSortedDescending?: boolean

  /**
   * Whether cell content may wrap onto several lines.
   */
  isMultiline?: boolean

  /**
   * Icon shown in the header, by name.
   */
  iconName?: string

  /**
   * Class applied to the header icon.
   */
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
