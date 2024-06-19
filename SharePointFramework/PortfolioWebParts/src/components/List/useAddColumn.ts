import { IColumn, IContextualMenuItem } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import styles from './List.module.scss'

/**
 * Hook for an add column used in a list for adding a new column and
 * configuring the order of the columns.
 *
 * @param condition Condition to use the add column
 * @param permissionCheck Check if the user has permission to the context menu items
 * @param key Key for the add column (default: `ADD_COLUMN`)
 */
export function useAddColumn(
  condition = true,
  permissionCheck: boolean = true,
  key = 'ADD_COLUMN'
) {
  /**
   * Add column object
   */
  const addColumn: IColumn = {
    key,
    fieldName: '',
    name: strings.ToggleColumnFormPanelLabel,
    iconName: 'CalculatorAddition',
    iconClassName: styles.addColumnIcon,
    minWidth: 175,
    data: {
      isHidden: !condition
    }
  }

  /**
   * Create contextual menu items for the add column.
   *
   * @param onToggleColumnFormPanel On toggle column form panel callback
   * @param onToggleEditViewColumnsPanel On toggle edit view columns panel callback
   * @param _isToggleColumnFormPanelDisabled Is toggle column form panel disabled
   * @param isToggleEditViewColumnsPanelDisabled Is toggle edit view columns panel disabled
   */
  const createContextualMenuItems = (
    onToggleColumnFormPanel: () => void,
    onToggleEditViewColumnsPanel: () => void,
    _isToggleColumnFormPanelDisabled = true,
    isToggleEditViewColumnsPanelDisabled = false
  ): IContextualMenuItem[] => [
    {
      key: 'TOGGLE_COLUMN_FORM_PANEL',
      text: strings.ToggleColumnFormPanelLabel,
      iconProps: { iconName: 'Add' },
      onClick: onToggleColumnFormPanel,
      disabled: true
    },
    {
      key: 'TOGGLE_EDIT_VIEW_COLUMNS_PANEL',
      text: strings.ToggleEditViewColumnsLabel,
      iconProps: { iconName: 'Eye' },
      onClick: onToggleEditViewColumnsPanel,
      disabled: isToggleEditViewColumnsPanelDisabled || !permissionCheck
    }
  ]

  /**
   * Returns `true` if the column is the add column. This is typically
   * used to check if the column is the add column before adding the
   * contextual menu items created by `createContextualMenuItems` to
   * the list of contextual menu items.
   *
   * @param column Column to check
   */
  const isAddColumn = (column: IColumn) => column.key === addColumn.key

  return {
    addColumn,
    isAddColumn,
    createContextualMenuItems
  }
}
