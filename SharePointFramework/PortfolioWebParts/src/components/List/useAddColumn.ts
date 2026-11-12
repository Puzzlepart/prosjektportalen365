import strings from 'PortfolioWebPartsStrings'
import styles from './List.module.scss'
import { IListColumn, IMenuItem } from 'pp365-shared-library'

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
  const addColumn: IListColumn = {
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
   */
  const createContextualMenuItems = (
    onToggleColumnFormPanel: () => void,
    onToggleEditViewColumnsPanel: () => void,
    isToggleColumnFormPanelDisabled = false,
    isToggleEditViewColumnsPanelDisabled = false
  ): IMenuItem[] => [
    {
      key: 'TOGGLE_COLUMN_FORM_PANEL',
      text: strings.ToggleColumnFormPanelLabel,
      iconProps: { iconName: 'Add' },
      onClick: onToggleColumnFormPanel,
      disabled: isToggleColumnFormPanelDisabled || !permissionCheck
    },
    {
      key: 'SHOW_HIDE_COLUMNS',
      text: strings.ShowHideColumnsLabel,
      iconProps: { iconName: 'Eye' },
      onClick: onToggleEditViewColumnsPanel,
      disabled: isToggleEditViewColumnsPanelDisabled || !permissionCheck
    }
  ]

  /**
   * Identify the synthetic column that opens creation and ordering commands.
   */
  const isAddColumn = (column: IListColumn) => column.key === addColumn.key

  return {
    addColumn,
    isAddColumn,
    createContextualMenuItems
  }
}
