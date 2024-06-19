import { IButtonProps, IColumn, IPanelProps } from '@fluentui/react'

interface IRevertOrderButtonProps extends Omit<IButtonProps, 'onClick'> {
  /**
   * Callback to call when the user clicks the revert order button.
   *
   * @param columns The selected columns
   */
  onClick(columns: IColumn[]): void
}

export interface IEditViewColumnsPanelProps extends IPanelProps {
  /**
   * Callback to call when the user clicks the save button.
   *
   * @param columns The selected columns
   * @param columnIds The selected column IDs
   */
  onSave(columns: IColumn[], columnIds?: number[]): void

  /**
   * Columns with selected state in the `data.isSelected` property.
   */
  columns?: IColumn[]

  /**
   * Help text to display at the top of the panel in
   * the header section.
   */
  helpText?: string

  /**
   * Revert order button props.
   */
  revertOrder?: IRevertOrderButtonProps

  /**
   * Custom column order. If provided, the columns will be sorted
   * based on this order.
   */
  customColumnOrder?: number[]

  /**
   * Sort mode for the columns.
   *
   * - `SelectedOnTop`: Selected columns will be on top, the rest will be based on the columns order in the provided
   * `columns` property.
   * - `CustomSelectedOnTop`: Selected columns will be on top, the rest will be based on `sortOrder` and `customColumnOrder`.
   */
  sortMode: EditViewColumnsPanelSortMode
}

export enum EditViewColumnsPanelSortMode {
  SelectedOnTop = 'selectedOnTop',
  CustomSelectedOnTop = 'customSelectedOnTop'
}
