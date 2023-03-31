import { ContextualMenuItemType, IContextualMenuItem } from '@fluentui/react'
import { IFilterProps } from 'components/FilterPanel'
import _ from 'lodash'
import * as strings from 'PortfolioWebPartsStrings'
import { ExcelExportService } from 'pp365-shared/lib/services'
import { redirect } from 'pp365-shared/lib/util'
import { useCallback, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import {
  CHANGE_VIEW,
  EXCEL_EXPORT_ERROR,
  EXCEL_EXPORT_SUCCESS,
  START_EXCEL_EXPORT,
  TOGGLE_COMPACT,
  TOGGLE_FILTER_PANEL
} from '../reducer'
import { usePortfolioOverviewFilters } from '../usePortfolioOverviewFilters'
import { IPortfolioOverviewCommandsProps } from './types'

/**
 * Component logic hook for the PortfolioOverviewCommands component. Handles the logic for
 * the command bar and the filter panel.
 *
 * @param props Props for the component `<PortfolioOverviewCommands />`
 */
export function usePortfolioOverviewCommands(props: IPortfolioOverviewCommandsProps) {
  const context = useContext(PortfolioOverviewContext)
  const filters = usePortfolioOverviewFilters()

  /**
   * Callback function for Excel export. Handles the export to Excel with state updates and
   * error handling.
   */
  const exportToExcel = useCallback(async () => {
    context.dispatch(START_EXCEL_EXPORT())
    try {
      // If no items are selected, export all items
      const items =
        _.isArray(context.state.selectedItems) && context.state.selectedItems.length > 0
          ? context.state.selectedItems
          : props.filteredData.items

      // Convert date columns to Date objects
      props.filteredData.columns.forEach((col) => {
        if (col.dataType === 'date') {
          items.map((item) => {
            item[col.fieldName] = new Date(item[col.fieldName])
          })
        }
      })

      // Export to Excel using the `ExcelExportService` from `pp365-shared`
      await ExcelExportService.export(items, props.filteredData.columns)

      context.dispatch(EXCEL_EXPORT_SUCCESS())
    } catch (error) {
      context.dispatch(EXCEL_EXPORT_ERROR(error))
    }
  }, [context.state])

  const items: IContextualMenuItem[] = [
    {
      key: 'EXCEL_EXPORT',
      name: strings.ExcelExportButtonLabel,
      iconProps: {
        iconName: 'ExcelDocument',
        styles: { root: { color: 'green !important' } }
      },
      buttonStyles: { root: { border: 'none' } },
      data: { isVisible: context.props.showExcelExportButton },
      disabled: context.state.isExporting || context.state.loading,
      onClick: () => {
        exportToExcel()
      }
    } as IContextualMenuItem
  ].filter((i) => i.data.isVisible)

  const farItems: IContextualMenuItem[] = [
    {
      key: 'NEW_VIEW',
      name: strings.NewViewText,
      iconProps: { iconName: 'CirclePlus' },
      buttonStyles: { root: { border: 'none' } },
      data: {
        isVisible: context.props.configuration.userCanAddViews && context.props.showViewSelector
      },
      disabled: context.state.loading,
      onClick: () => redirect(context.props.configuration.viewsUrls.defaultNewFormUrl)
    } as IContextualMenuItem,
    {
      key: 'VIEW_OPTIONS',
      name: context.state.currentView?.title,
      iconProps: { iconName: 'List' },
      buttonStyles: { root: { border: 'none' } },
      itemType: ContextualMenuItemType.Header,
      data: { isVisible: context.props.showViewSelector },
      disabled: context.state.loading,
      subMenuProps: {
        items: [
          {
            key: 'VIEW_LIST',
            name: 'Liste',
            iconProps: { iconName: 'List' },
            canCheck: true,
            checked: !context.state.isCompact,
            onClick: () => {
              context.dispatch(TOGGLE_COMPACT())
            }
          },
          {
            key: 'VIEW_COMPACT',
            name: 'Kompakt liste',
            iconProps: { iconName: 'AlignLeft' },
            canCheck: true,
            checked: context.state.isCompact,
            onClick: () => {
              context.dispatch(TOGGLE_COMPACT())
            }
          },
          {
            key: 'DIVIDER_01',
            itemType: ContextualMenuItemType.Divider
          },
          ...context.props.configuration.views.map(
            (view) =>
              ({
                key: view.id.toString(),
                name: view.title,
                iconProps: { iconName: view.iconName },
                canCheck: true,
                checked: view.id === context.state.currentView?.id,
                onClick: () => context.dispatch(CHANGE_VIEW(view))
              } as IContextualMenuItem)
          ),
          {
            key: 'DIVIDER_02',
            itemType: ContextualMenuItemType.Divider
          },
          {
            key: 'SAVE_VIEW_AS',
            name: strings.SaveViewAsText,
            disabled: true
          },
          {
            key: 'EDIT_VIEW',
            name: strings.EditViewText,
            disabled: context.state.loading,
            onClick: () =>
              redirect(
                `${context.props.configuration.viewsUrls.defaultEditFormUrl}?ID=${context.state.currentView?.id}`
              )
          }
        ]
      }
    } as IContextualMenuItem,
    {
      key: 'FILTERS',
      name: '',
      iconProps: { iconName: 'Filter' },
      buttonStyles: { root: { border: 'none' } },
      itemType: ContextualMenuItemType.Normal,
      canCheck: true,
      checked: context.state.showFilterPanel,
      disabled: context.state.loading,
      data: { isVisible: context.props.showFilters },
      onClick: (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        context.dispatch(TOGGLE_FILTER_PANEL())
      }
    } as IContextualMenuItem
  ].filter((i) => i.data.isVisible)

  return {
    items,
    farItems,
    filters: [
      {
        column: {
          key: 'SelectedColumns',
          fieldName: 'SelectedColumns',
          name: strings.SelectedColumnsLabel,
          minWidth: 0
        },
        items: context.props.configuration.columns.map((col) => ({
          name: col.name,
          value: col.fieldName,
          selected: props.filteredData.columns.indexOf(col) !== -1
        })),
        defaultCollapsed: true
      },
      ...filters
    ] as IFilterProps[]
  } as const
}
