import { ContextualMenuItemType, format, IContextualMenuItem } from '@fluentui/react'
import _ from 'lodash'
import strings from 'PortfolioWebPartsStrings'
import { getObjectValue as get } from 'pp365-shared-library/lib/util/getObjectValue'
import { useContext, useEffect, useState } from 'react'
import { PortfolioOverviewContext } from '../context'
import {
  SET_GROUP_BY,
  SET_SORT,
  TOGGLE_COLUMN_FORM_PANEL,
  SET_EDIT_VIEW_COLUMNS_PANEL
} from '../reducer'
import { useAddColumn } from '../../List'
import { MenuProps } from '@fluentui/react-components'

/**
 * Hook for the column header context menu. Handles the logic for the context menu. Creates a context menu
 * for the column header.
 */
export function useColumnContextMenu() {
  const context = useContext(PortfolioOverviewContext)
  const [open, setOpen] = useState(false)
  const { isAddColumn, createContextualMenuItems } = useAddColumn(
    true,
    context.props.pageContext.legacyPageContext.isSiteAdmin
  )
  const onOpenChange: MenuProps['onOpenChange'] = (_, data) => setOpen(data.open)
  const [checkedValues, setCheckedValues] = useState<MenuProps['checkedValues']>({})
  const onCheckedValueChange: MenuProps['onCheckedValueChange'] = (_event, data) => {
    setCheckedValues({ ...checkedValues, [data.name]: [_.last(data.checkedItems)].filter(Boolean) })
  }

  useEffect(() => {
    setOpen(!!context.state.columnContextMenu?.column)
  }, [context.state.columnContextMenu])

  const columnContextMenu = {
    open,
    setOpen,
    onOpenChange,
    onCheckedValueChange,
    checkedValues,
    target: null,
    items: []
  }
  if (!context.state.columnContextMenu) return columnContextMenu

  const { column, target } = context.state.columnContextMenu
  columnContextMenu.target = target

  if (isAddColumn(column)) {
    columnContextMenu.items = createContextualMenuItems(
      () => context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true })),
      () => context.dispatch(SET_EDIT_VIEW_COLUMNS_PANEL({ isOpen: true })),
      context.state.currentView?.isProgramView,
      context.state.currentView?.isProgramView
    )
  } else {
    const columnCustomSorts = column.data?.customSorts.map<IContextualMenuItem>(
      (customSort, idx) => ({
        key: `CUSTOM_SORT_${idx}`,
        text: customSort.name,
        data: {
          name: 'sort',
          value: customSort.name
        },
        canCheck: true,
        checked: column.isSorted && context.state.sortBy?.customSort?.name === customSort.name,
        onClick: () => context.dispatch(SET_SORT({ column, customSort }))
      })
    )
    columnContextMenu.items = [
      {
        key: 'SORT_DESC',
        data: {
          name: 'sort',
          value: 'desc'
        },
        text: strings.SortDescLabel,
        iconProps: { iconName: 'TextSortAscending' },
        canCheck: true,
        checked: column.isSorted && !context.state.sortBy?.customSort && column.isSortedDescending,
        onClick: () => context.dispatch(SET_SORT({ column, isSortedDescending: true }))
      },
      {
        key: 'SORT_ASC',
        data: {
          name: 'sort',
          value: 'asc'
        },
        text: strings.SortAscLabel,
        iconProps: { iconName: 'TextSortDescending' },
        canCheck: true,
        checked: column.isSorted && !context.state.sortBy?.customSort && !column.isSortedDescending,
        onClick: () => context.dispatch(SET_SORT({ column, isSortedDescending: false }))
      },
      !_.isEmpty(columnCustomSorts) &&
        ({
          key: 'CUSTOM_SORTS_HEADER',
          text: strings.CustomSortsText,
          iconProps: { iconName: 'ArrowSort' },
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
        text: format(strings.GroupByColumnLabel, column.name),
        canCheck: true,
        checked: get<string>(context.state, 'groupBy.fieldName', '') === column.fieldName,
        disabled: !column?.data?.isGroupable,
        onClick: () => context.dispatch(SET_GROUP_BY(column)),
        iconProps: { iconName: 'GroupList' }
      },
      {
        key: 'DIVIDER_02',
        itemType: ContextualMenuItemType.Divider
      },
      {
        key: 'COLUMN_SETTINGS',
        text: strings.ColumSettingsLabel,
        disabled: context.props.isParentProject,
        iconProps: { iconName: 'TableSettings' },
        subMenuProps: {
          items: [
            {
              key: 'EDIT_COLUMN',
              text: strings.EditColumnLabel,
              onClick: () => {
                context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true, column }))
              },
              disabled: !context.props.pageContext.legacyPageContext.isSiteAdmin,
              iconProps: { iconName: 'TableCellEdit' }
            },
            {
              key: 'DIVIDER_03',
              itemType: ContextualMenuItemType.Divider
            },
            {
              key: 'ADD_COLUMN',
              text: strings.AddColumnLabel,
              onClick: () => {
                context.dispatch(TOGGLE_COLUMN_FORM_PANEL({ isOpen: true }))
              },
              disabled: !context.props.pageContext.legacyPageContext.isSiteAdmin,
              iconProps: { iconName: 'Add' }
            }
          ]
        }
      }
    ].filter(Boolean)
  }
  return columnContextMenu
}
