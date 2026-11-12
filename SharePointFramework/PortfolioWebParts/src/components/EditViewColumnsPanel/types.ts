import { ButtonProps } from '@fluentui/react-components'
import { IBasePanelProps, IListColumn } from 'pp365-shared-library'

interface IRevertOrderButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * Callback to call when the user clicks the revert order button.
   *
   * @param columns All selectable columns in their current order.
   */
  onClick(columns: IListColumn[]): void
}

/** Column selection, ordering and save callbacks for the view editor. */
export interface IEditViewColumnsPanelProps extends IBasePanelProps {
  /**
   * Title shown above the column list.
   */
  title?: string

  /**
   * Callback to call when the user clicks the save button.
   */
  onSave(columns: IListColumn[], columnIds?: number[]): void

  /**
   * Columns with selected state in the `data.isSelected` property.
   */
  columns?: IListColumn[]

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
   * Selected columns come first in either mode, with `customColumnOrder` taking
   * precedence within each selection group. `CustomSelectedOnTop` also uses
   * `sortOrder` for columns absent from the custom order.
   */
  sortMode: EditViewColumnsPanelSortMode
}

/** Fallback ordering for columns outside the custom order. */
export enum EditViewColumnsPanelSortMode {
  SelectedOnTop = 'selectedOnTop',
  CustomSelectedOnTop = 'customSelectedOnTop'
}
