import { ContextualMenuItemType, IContextualMenuItem } from '@fluentui/react'
import { isArray } from '@pnp/common'
import _ from 'lodash'
import * as strings from 'PortfolioWebPartsStrings'
import { PortfolioOverviewView } from 'pp365-shared/lib/models/PortfolioOverviewView'
import ExcelExportService from 'pp365-shared/lib/services/ExcelExportService'
import { redirect } from 'pp365-shared/lib/util'
import { useState } from 'react'
import { IFilterProps } from '../../FilterPanel'
import { IPortfolioOverviewCommandsProps, IPortfolioOverviewCommandsState } from './types'

/**
 * Converts a collection of `PortfolioOverviewView` objects to 
 * a collection of `IContextualMenuItem` objects.
 * 
 * @param props Props for the PortfolioOverviewCommands component
 * @param filterFunc Optional filter function to filter the views
 */
function convertViewsToContextualMenuItems(props: IPortfolioOverviewCommandsProps, filterFunc: (view: PortfolioOverviewView) => boolean) {
  return  props.configuration.views.filter(filterFunc).map(view => (
    {
      key: view.id.toString(),
      name: view.title,
      iconProps: { iconName: view.iconName },
      canCheck: true,
      checked: view.id === props.currentView?.id,
      onClick: () => props.events.onChangeView(view),
    } as IContextualMenuItem
  ))
}

/**
 * Component logic hook for the PortfolioOverviewCommands component. Handles the logic for
 * the command bar and the filter panel.
 * 
 * Renders the following context menu items for the command bar:
 * - `EXCEL_EXPORT`: Excel export button
 * - `NEW_VIEW`: New view button
 * - `VIEW_OPTIONS`: View options button
 * - `FILTERS`: Filters button
 *
 * @param props Props for the PortfolioOverviewCommands component
 */
export function usePortfolioOverviewCommands(props: IPortfolioOverviewCommandsProps) {
  const [state, setState] = useState<IPortfolioOverviewCommandsState>({ showFilterPanel: false })

  const sharedViews = convertViewsToContextualMenuItems(props, (v) => !v.isPersonal)
  const personalViews = convertViewsToContextualMenuItems(props, (v) => v.isPersonal)

  const items: IContextualMenuItem[] = [
    {
      key: 'EXCEL_EXPORT',
      name: strings.ExcelExportButtonLabel,
      iconProps: {
        iconName: 'ExcelDocument',
        styles: { root: { color: 'green !important' } }
      },
      buttonStyles: { root: { border: 'none' } },
      data: { isVisible: props.showExcelExportButton },
      disabled: state.isExporting,
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
        isVisible: props.configuration.userCanAddViews && props.showViewSelector
      },
      onClick: () => redirect(props.configuration.viewsUrls.defaultNewFormUrl)
    } as IContextualMenuItem,
    {
      key: 'VIEW_OPTIONS',
      name: props.currentView?.title,
      iconProps: { iconName: 'List' },
      buttonStyles: { root: { border: 'none' } },
      itemType: ContextualMenuItemType.Header,
      data: { isVisible: props.showViewSelector },
      subMenuProps: {
        items: [
          {
            key: 'VIEW_LIST',
            name: strings.ListViewText,
            iconProps: { iconName: 'List' },
            canCheck: true,
            checked: !props.isCompact,
            onClick: () => props.events.onSetCompact(false)
          },
          {
            key: 'VIEW_COMPACT',
            name: strings.CompactViewText,
            iconProps: { iconName: 'AlignLeft' },
            canCheck: true,
            checked: props.isCompact,
            onClick: () => props.events.onSetCompact(true)
          },
          {
            key: 'VIEWS_DIVIDER',
            itemType: ContextualMenuItemType.Divider
          },
          ...sharedViews,
          !_.isEmpty(personalViews) && {
            key: 'PERSONAL_VIEWS_HEADER',
            itemType: ContextualMenuItemType.Header,
            text: strings.PersonalViewsHeaderText,
          },
          ...personalViews,
          {
            key: 'VIEW_ACTIONS_DIVIDER',
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
            onClick: () =>
              redirect(
                `${props.configuration.viewsUrls.defaultEditFormUrl}?ID=${props.currentView?.id}`
              )
          }
        ].filter(Boolean)
      }
    } as IContextualMenuItem,
    {
      key: 'FILTERS',
      name: '',
      iconProps: { iconName: 'Filter' },
      buttonStyles: { root: { border: 'none' } },
      itemType: ContextualMenuItemType.Normal,
      canCheck: true,
      checked: state.showFilterPanel,
      data: { isVisible: props.showFilters },
      onClick: (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        setState((prevState) => ({ showFilterPanel: !prevState.showFilterPanel }))
      }
    } as IContextualMenuItem
  ].filter((i) => i.data.isVisible)

  const filters: IFilterProps[] = [
    {
      column: {
        key: 'SelectedColumns',
        fieldName: 'SelectedColumns',
        name: strings.SelectedColumnsLabel,
        minWidth: 0
      },
      items: props.configuration.columns.map((col) => ({
        name: col.name,
        value: col.fieldName,
        selected: props.fltColumns.indexOf(col) !== -1
      })),
      defaultCollapsed: true
    },
    ...props.filters
  ]

  /**
   * Callback function for Excel export. Handles the export to Excel with state updates and
   * error handling.
   */
  async function exportToExcel(): Promise<void> {
    setState({ ...state, isExporting: true })
    try {
      const { fltItems, fltColumns, selectedItems } = props

      const items = isArray(selectedItems) && selectedItems.length > 0 ? selectedItems : fltItems

      fltColumns.forEach((col) => {
        if (col.dataType === 'date') {
          items.map((item) => {
            item[col.fieldName] = new Date(item[col.fieldName])
          })
        }
      })

      await ExcelExportService.export(items, fltColumns)
      setState({ ...state, isExporting: false })
    } catch (error) {
      setState({ ...state, isExporting: false })
    }
  }

  return { items, farItems, filters, exportToExcel, state, setState } as const
}
