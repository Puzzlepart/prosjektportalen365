import { ContextualMenuItemType, format, IContextualMenuProps } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import { ProjectColumn } from 'pp365-shared/lib/models'
import { redirect } from 'pp365-shared/lib/util/redirect'
import { IPortfolioOverviewContext } from './context'
import { SET_COLUMN_CONTEXT_MENU, SET_GROUP_BY, SET_SORT } from './reducer'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'

/**
 * Hook for the column header context menu. Handles the logic for the context menu.
 *
 * Creates a context menu for the column header and dispatches the `SET_COLUMN_CONTEXT_MENU` action.
 *
 * The menu contains the following items:
 * - `SORT_DESC`: Sorts the column in descending order
 * - `SORT_ASC`: Sorts the column in ascending order
 * - `DIVIDER_01`: Divider
 * - `GROUP_BY`: Group by column
 * - `DIVIDER_03`: Divider
 * - `COLUMN_SETTINGS`: Column settings
 *
 * @param context `PortfolioOverview` context needs to be passed as a prop to the hook
 * as it is not available yet using `useContext` in the hook.
 */
export function useColumnHeaderContextMenu(context: IPortfolioOverviewContext) {
  const onColumnHeaderContextMenu = (
    column?: ProjectColumn,
    ev?: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    if (column.key === 'AddColumn') return
    const columnContextMenu: IContextualMenuProps = {
      target: ev.currentTarget,
      items: [
        {
          key: 'SORT_DESC',
          name: strings.SortDescLabel,
          canCheck: true,
          checked: column.isSorted && column.isSortedDescending,
          onClick: () => context.dispatch(SET_SORT({ column, isSortedDescending: true }))
        },
        {
          key: 'SORT_ASC',
          name: strings.SortAscLabel,
          canCheck: true,
          checked: column.isSorted && !column.isSortedDescending,
          onClick: () => context.dispatch(SET_SORT({ column, isSortedDescending: false }))
        },
        {
          key: 'DIVIDER_01',
          itemType: ContextualMenuItemType.Divider
        },
        {
          key: 'GROUP_BY',
          name: format(strings.GroupByColumnLabel, column.name),
          canCheck: true,
          checked: get<string>(context.state, 'groupBy.fieldName', '') === column.fieldName,
          disabled: !column.isGroupable,
          onClick: () => context.dispatch(SET_GROUP_BY(column))
        },
        {
          key: 'DIVIDER_02',
          itemType: ContextualMenuItemType.Divider
        },
        {
          key: 'COLUMN_SETTINGS',
          name: strings.ColumSettingsLabel,
          onClick: () =>
            redirect(
              `${context.props.configuration.columnUrls.defaultEditFormUrl}?ID=${column.id}`
            ),
          disabled: !context.props.pageContext.legacyPageContext.isSiteAdmin
        }
      ],
      onDismiss: () => context.dispatch(SET_COLUMN_CONTEXT_MENU(null))
    }
    context.dispatch(SET_COLUMN_CONTEXT_MENU(columnContextMenu))
  }
  return onColumnHeaderContextMenu
}