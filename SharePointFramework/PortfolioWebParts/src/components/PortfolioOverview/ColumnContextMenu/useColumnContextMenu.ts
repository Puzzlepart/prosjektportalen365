import {
  ContextualMenuItemType,
  format,
  IContextualMenuItem,
  IContextualMenuProps
} from '@fluentui/react'
import _ from 'lodash'
import strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared-library/lib/helpers/getObjectValue'
import { useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import {
  SET_GROUP_BY,
  SET_SORT,
  TOGGLE_COLUMN_FORM_PANEL,
  TOGGLE_EDIT_VIEW_COLUMNS_PANEL
} from '../reducer'
import { useAddColumn } from '../../List'

/**
 * Hook for the column header context menu. Handles the logic for the context menu. Creates a context menu
 * for the column header.
 *
 * The menu contains the following items:
 * - `SORT_DESC`: Sorts the column in descending order
 * - `SORT_ASC`: Sorts the column in ascending order
 * - `DIVIDER_01`: Divider conditionally rendered if there are custom sort options
 * - `CUSTOM_SORT_{key}`: Custom sort options defined in the column configuration
 * - `DIVIDER_02`: Divider
 * - `GROUP_BY`: Group by column
 * - `DIVIDER_03`: Divider
 * - `COLUMN_SETTINGS`: Column settings
 */
export function useColumnContextMenu(): IContextualMenuProps {
  const context = useContext(PortfolioOverviewContext)
  if (!context.state.columnContextMenu) return null
  const { column, target } = context.state.columnContextMenu
  const { isAddColumn, createContextualMenuItems } = useAddColumn(
    true,
    context.props.pageContext.legacyPageContext.isSiteAdmin
  )
  const columnContextMenu: IContextualMenuProps = {
    target,
    items: []
  }
  if (isAddColumn(column)) {
    columnContextMenu.items = createContextualMenuItems(
      () => context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true })),
      () => context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: true })),
      context.state.currentView?.isProgramView,
      context.state.currentView?.isProgramView
    )
  } else {
    const columnCustomSorts = column.customSorts.map<IContextualMenuItem>((customSort, idx) => ({
      key: `CUSTOM_SORT_${idx}`,
      name: customSort.name,
      canCheck: true,
      checked: column.isSorted && context.state.sortBy?.customSort?.name === customSort.name,
      onClick: () => context.dispatch(SET_SORT({ column, customSort }))
    }))
    columnContextMenu.items = [
      {
        key: 'SORT_DESC',
        name: strings.SortDescLabel,
        canCheck: true,
        checked: column.isSorted && !context.state.sortBy?.customSort && column.isSortedDescending,
        onClick: () => context.dispatch(SET_SORT({ column, isSortedDescending: true }))
      },
      {
        key: 'SORT_ASC',
        name: strings.SortAscLabel,
        canCheck: true,
        checked: column.isSorted && !context.state.sortBy?.customSort && !column.isSortedDescending,
        onClick: () => context.dispatch(SET_SORT({ column, isSortedDescending: false }))
      },
      !_.isEmpty(columnCustomSorts) &&
        ({
          key: 'CUSTOM_SORTS_HEADER',
          text: strings.CustomSortsText,
          subMenuProps: {
            items: columnCustomSorts
          }
        } as IContextualMenuItem),
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
        disabled: context.props.isParentProject,
        subMenuProps: {
          items: [
            {
              key: 'EDIT_COLUMN',
              name: strings.EditColumnLabel,
              onClick: () => {
                context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true, column }))
              },
              disabled: !context.props.pageContext.legacyPageContext.isSiteAdmin
            },
            {
              key: 'DIVIDER_03',
              itemType: ContextualMenuItemType.Divider
            },
            {
              key: 'ADD_COLUMN',
              name: strings.AddColumnLabel,
              onClick: () => {
                context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true }))
              },
              disabled: !context.props.pageContext.legacyPageContext.isSiteAdmin
            }
          ]
        }
      }
    ].filter(Boolean)
  }
  return columnContextMenu
}
