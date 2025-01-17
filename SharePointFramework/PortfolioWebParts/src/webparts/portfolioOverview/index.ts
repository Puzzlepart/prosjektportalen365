import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import {
  IPortfolioOverviewConfiguration,
  IPortfolioOverviewProps
} from '../../components/PortfolioOverview'
import { PortfolioOverview } from 'components/PortfolioOverview'
import { render } from 'react-dom'
import { createElement } from 'react'
import {
  CustomCollectionFieldType,
  PropertyFieldCollectionData
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'
import _ from 'lodash'
import {
  PortalDataServiceDefaultConfiguration,
  UserMessage,
  ErrorWithIntent
} from 'pp365-shared-library'
import { DataAdapter } from 'data'

export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration
  private _error: ErrorWithIntent
  private _selectedPortfolioId: string

  public render(): void {
    if (!this._configuration) {
      render(
        createElement(UserMessage, {
          title: this._error?.name,
          text: this._error?.message,
          intent: this._error?.intent
        }),
        this.domElement
      )
      return
    }
    this.renderComponent<IPortfolioOverviewProps>(PortfolioOverview, {
      configuration: this._configuration,
      onSetPortfolio: this.setPortfolio.bind(this),
      selectedPortfolioId: this._selectedPortfolioId,
      selectedPortfolio: this.properties.portfolios.find(
        ({ uniqueId }) => uniqueId === this._selectedPortfolioId
      )
    })
  }

  /**
   * Callback function to set the portfolio to display in the web part.
   *
   * @param portfolioId Unique ID of the portfolio
   */
  private async setPortfolio(portfolioId: string): Promise<void> {
    this._selectedPortfolioId = portfolioId
    const portfolio = this.properties.portfolios.find(
      ({ uniqueId }) => uniqueId === this._selectedPortfolioId
    )
    this.dataAdapter = await new DataAdapter(this.context, this.sp).configure(
      this.context,
      null,
      portfolio
    )
    this._configuration = await this.dataAdapter.getPortfolioConfig()
    this.render()
  }

  public async onInit(): Promise<void> {
    try {
      this._selectedPortfolioId = this.properties.selectedPortfolioId
      const portfolio = this.properties.portfolios.find(
        ({ uniqueId }) => uniqueId === this._selectedPortfolioId
      )
      await super.onInit(portfolio)
      this._configuration = await this.dataAdapter.getPortfolioConfig()
    } catch (error) {
      this._error = error
    }
  }

  /**
   * Get dropdown options for the specified `targetProperty`. For now it only
   * handles the `defaultViewId` and `portfolios` properties.
   *
   * @param targetProperty Target property
   */
  protected _getOptions(
    targetProperty: keyof IPortfolioOverviewProps
  ): IPropertyPaneDropdownOption[] {
    switch (targetProperty) {
      case 'portfolios': {
        return this.properties.portfolios.map((portfolio) => ({
          key: portfolio.uniqueId,
          text: portfolio.title
        }))
      }
      case 'defaultViewId':
        {
          if (this._configuration) {
            return [
              { key: null, text: '' },
              ...this._configuration.views.map((view) => ({ key: view.id, text: view.title }))
            ]
          }
        }
        break
    }
    return []
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
                }),
                !_.isEmpty(this.properties.portfolios) &&
                  PropertyPaneDropdown('selectedPortfolioId', {
                    label: strings.SelectedPortfolioLabel,
                    options: this._getOptions('portfolios')
                  }),
                PropertyPaneDropdown('defaultViewId', {
                  label: strings.DefaultViewLabel,
                  options: this._getOptions('defaultViewId')
                })
              ].filter(Boolean)
            },
            {
              groupName: strings.CommandBarGroupName,
              groupFields: [
                PropertyPaneToggle('showGroupBy', {
                  label: strings.ShowGroupByLabel
                }),
                PropertyPaneToggle('showFilters', {
                  label: strings.ShowFiltersLabel
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel
                }),
                this.properties.showExcelExportButton &&
                  PropertyPaneToggle('includeViewNameInExcelExportFilename', {
                    label: strings.IncludeViewNameInExcelExportFilenameLabel
                  }),
                !_.isEmpty(this.properties.portfolios) &&
                  PropertyPaneToggle('showPortfolioSelector', {
                    label: strings.ShowPortfolioSelectorLabel,
                    onText: strings.ShowPortfolioSelectorOnText,
                    offText: strings.ShowPortfolioSelectorOffText
                  }),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel
                }),
                this.properties.showViewSelector &&
                  PropertyPaneToggle('showProgramViews', {
                    label: strings.ShowProgramViewsLabel
                  })
              ].filter(Boolean)
            },
            {
              groupName: strings.AdvancedGroupName,
              groupFields: [
                PropertyFieldCollectionData('portfolios', {
                  key: 'portfolios',
                  label: strings.PortfoliosLabel,
                  panelHeader: strings.PortfoliosPanelHeader,
                  manageBtnLabel: strings.PortfoliosManageBtnLabel,
                  value: this.properties.portfolios,
                  fields: [
                    {
                      id: 'title',
                      title: strings.TitleLabel,
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'url',
                      title: strings.UrlFieldLabel,
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'viewsListName',
                      title: strings.ViewsListNameFieldLabel,
                      type: CustomCollectionFieldType.string,
                      defaultValue:
                        PortalDataServiceDefaultConfiguration?.listNames?.PORTFOLIO_VIEWS,
                      required: true
                    },
                    {
                      id: 'columnsListName',
                      title: strings.ColumnsListNameFieldLabel,
                      type: CustomCollectionFieldType.string,
                      defaultValue:
                        PortalDataServiceDefaultConfiguration?.listNames?.PROJECT_COLUMNS,
                      required: true
                    },
                    {
                      id: 'columnConfigListName',
                      title: strings.ColumnConfigListNameFieldLabel,
                      type: CustomCollectionFieldType.string,
                      defaultValue:
                        PortalDataServiceDefaultConfiguration?.listNames
                          ?.PROJECT_COLUMN_CONFIGURATION,
                      required: true
                    }
                  ]
                })
              ]
            },
            {
              groupName: strings.ListViewGroupName,
              groupFields: [
                PropertyPaneToggle('isListLayoutModeJustified', {
                  label: strings.ListLayoutModeJustifiedLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
