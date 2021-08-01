import { isArray } from '@pnp/common'
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar'
import {
  ContextualMenuItemType,
  IContextualMenuItem
} from 'office-ui-fabric-react/lib/ContextualMenu'
import * as strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared/lib/services/ExcelExportService'
import { redirect } from 'pp365-shared/lib/util'
import React, { Component } from 'react'
import { FilterPanel, IFilterProps } from '../../FilterPanel'
import { IPortfolioOverviewCommandsProps, IPortfolioOverviewCommandsState } from './types'

export class PortfolioOverviewCommands extends Component<
  IPortfolioOverviewCommandsProps,
  IPortfolioOverviewCommandsState
> {
  constructor(props: IPortfolioOverviewCommandsProps) {
    super(props)
    this.state = { showFilterPanel: false }
  }

  public render() {
    return (
      <div className={this.props.className} hidden={this.props.hidden}>
        <CommandBar items={this._items} farItems={this._farItems} />
        <FilterPanel
          isOpen={this.state.showFilterPanel}
          layerHostId={this.props.layerHostId}
          headerText={strings.FiltersString}
          onDismissed={() => this.setState({ showFilterPanel: false })}
          isLightDismiss={true}
          filters={this._filters}
          onFilterChange={this.props.events.onFilterChange}
        />
      </div>
    )
  }

  protected get _items(): IContextualMenuItem[] {
    return [
      {
        key: 'EXCEL_EXPORT',
        name: strings.ExcelExportButtonLabel,
        iconProps: {
          iconName: 'ExcelDocument',
          styles: { root: { color: 'green !important' } }
        },
        buttonStyles: { root: { border: 'none' } },
        data: { isVisible: this.props.showExcelExportButton },
        disabled: this.state.isExporting,
        onClick: this._exportToExcel.bind(this)
      } as IContextualMenuItem
    ].filter((i) => i.data.isVisible)
  }

  protected get _farItems(): IContextualMenuItem[] {
    return [
      {
        key: 'NEW_VIEW',
        name: strings.NewViewText,
        iconProps: { iconName: 'CirclePlus' },
        buttonStyles: { root: { border: 'none' } },
        data: {
          isVisible:
            this.props.pageContext.legacyPageContext.isSiteAdmin && this.props.showViewSelector
        },
        onClick: () => redirect(this.props.configuration.viewsUrls.defaultNewFormUrl)
      } as IContextualMenuItem,
      {
        key: 'VIEW_OPTIONS',
        name: this.props.currentView?.title,
        iconProps: { iconName: 'List' },
        buttonStyles: { root: { border: 'none' } },
        itemType: ContextualMenuItemType.Header,
        data: { isVisible: this.props.showViewSelector },
        subMenuProps: {
          items: [
            {
              key: 'VIEW_LIST',
              name: 'Liste',
              iconProps: { iconName: 'List' },
              canCheck: true,
              checked: !this.props.isCompact,
              onClick: () => this.props.events.onSetCompact(false)
            },
            {
              key: 'VIEW_COMPACT',
              name: 'Kompakt liste',
              iconProps: { iconName: 'AlignLeft' },
              canCheck: true,
              checked: this.props.isCompact,
              onClick: () => this.props.events.onSetCompact(true)
            },
            {
              key: 'DIVIDER_01',
              itemType: ContextualMenuItemType.Divider
            },
            ...this.props.configuration.views.map(
              (view) =>
                ({
                  key: view.id.toString(),
                  name: view.title,
                  iconProps: { iconName: view.iconName },
                  canCheck: true,
                  checked: view.id === this.props.currentView?.id,
                  onClick: () => this.props.events.onChangeView(view)
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
              onClick: () =>
                redirect(
                  `${this.props.configuration.viewsUrls.defaultEditFormUrl}?ID=${this.props.currentView?.id}`
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
        checked: this.state.showFilterPanel,
        data: { isVisible: this.props.showFilters },
        onClick: (ev) => {
          ev.preventDefault()
          ev.stopPropagation()
          this.setState((prevState) => ({ showFilterPanel: !prevState.showFilterPanel }))
        }
      } as IContextualMenuItem
    ].filter((i) => i.data.isVisible)
  }

  protected get _filters(): IFilterProps[] {
    const filters: IFilterProps[] = [
      {
        column: {
          key: 'SelectedColumns',
          fieldName: 'SelectedColumns',
          name: strings.SelectedColumnsLabel,
          minWidth: 0
        },
        items: this.props.configuration.columns.map((col) => ({
          name: col.name,
          value: col.fieldName,
          selected: this.props.fltColumns.indexOf(col) !== -1
        })),
        defaultCollapsed: true
      },
      ...this.props.filters
    ]
    return filters
  }

  /**
   * Export to Excel
   */
  protected async _exportToExcel(): Promise<void> {
    this.setState({ isExporting: true })
    try {
      const { fltItems, fltColumns, selectedItems } = this.props

      let items = isArray(selectedItems) && selectedItems.length > 0 ? selectedItems : fltItems

      items = items.map((item) => {
        if (item.GtStartDateOWSDATE !== undefined) {
          item.GtStartDateOWSDATE = new Date(item.GtStartDateOWSDATE)
        }
        if (item.GtEndDateOWSDATE !== undefined) {
          item.GtEndDateOWSDATE = new Date(item.GtEndDateOWSDATE)
        }
        return item
      })

      await ExcelExportService.export(items, fltColumns)
      this.setState({ isExporting: false })
    } catch (error) {
      this.setState({ isExporting: false })
    }
  }
}
