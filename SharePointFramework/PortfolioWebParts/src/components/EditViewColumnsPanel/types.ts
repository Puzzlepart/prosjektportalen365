import { ButtonProps } from '@fluentui/react-components'
import { IBasePanelProps, IListColumn } from 'pp365-shared-library'

interface IRevertOrderButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * Callback to call when the user clicks the revert order button. A promise it returns is
   * waited for, as `onSave`'s is.
   *
   * @param columns All selectable columns in their current order.
   */
  onClick(columns: IListColumn[]): void | Promise<void>
}

/** Column selection, ordering and save callbacks for the view editor. */
export interface IEditViewColumnsPanelProps extends IBasePanelProps {
  /**
   * Title shown above the column list.
   */
  title?: string

  /**
   * Callback to call when the user clicks the save button. A promise it returns is waited for:
   * when it rejects, the panel stays open with the columns as chosen, says that the view could
   * not be saved, and counts the failure for usage statistics. The callback closes the panel
   * itself once the save is taken, and neither tells nor counts a failure.
   */
  onSave(columns: IListColumn[], columnIds?: number[]): void | Promise<void>

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
