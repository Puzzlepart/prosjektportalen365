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
   */
  onSave(columns: IColumn[]): void

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
}
