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
import { createElement } from 'react'
import {
  CustomCollectionFieldType,
  PropertyFieldCollectionData
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'
import _ from 'lodash'
import {
  PortalDataServiceDefaultConfiguration,
  UserMessage,
  ErrorWithIntent,
  PropertyPaneDescription,
  renderReact
} from 'pp365-shared-library'
import { TelemetryEventComponent, trackError, trackUsage } from 'pp365-shared-library/lib/telemetry'
import { DataAdapter } from 'data/DataAdapter'

/** Host portfolio projects and reconfigure data services when the selected hub changes. */
export default class PortfolioOverviewWebPart extends BasePortfolioWebPart<IPortfolioOverviewProps> {
  private _configuration: IPortfolioOverviewConfiguration
  private _error: ErrorWithIntent
  private _selectedPortfolioId: string

  public render(): void {
    if (!this._configuration) {
      renderReact(
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
      portfolios: this.properties.portfolios ?? [],
      selectedPortfolioId: this._selectedPortfolioId,
      showMergedView: true,
      showMergedViewInViewSelector: this.properties.showMergedViewInViewSelector ?? false
    })
  }

  /**
   * The id of the portfolio the web part shows: the one picked, or the first one while the id
   * names none. `null` is the merged view.
   */
  private get _shownPortfolioId(): string | null {
    if (this._selectedPortfolioId === null) return null
    const portfolios = this.properties.portfolios ?? []
    const picked = portfolios.find(({ uniqueId }) => uniqueId === this._selectedPortfolioId)
    return (picked ?? portfolios[0])?.uniqueId
  }

  /**
   * Callback function to set the portfolio to display in the web part. A switch that got the
   * portfolio's configuration is counted for usage statistics, once, before it is shown; a pick
   * of the portfolio shown already is no switch.
   *
   * Nothing of the web part changes until the picked portfolio's configuration is read. When it
   * cannot be read, the portfolio shown stays shown, with its id, its data adapter and its
   * configuration, the failure is counted once by its error code, and the caller, which tells
   * the user, gets `false`.
   *
   * @param portfolioId Unique ID of the portfolio, or null for merged view
   * @returns Whether the web part now shows the portfolio picked
   */
  private async setPortfolio(portfolioId: string | null): Promise<boolean> {
    const isSwitch = portfolioId !== this._shownPortfolioId
    try {
      // The merged view is read through the first portfolio, and left as it is without one.
      const portfolio =
        portfolioId === null
          ? this.properties.portfolios?.[0]
          : this.properties.portfolios.find(({ uniqueId }) => uniqueId === portfolioId)
      if (portfolioId !== null || portfolio) {
        const dataAdapter = await new DataAdapter(this.context, this.sp).configure(
          this.context,
          null,
          portfolio
        )
        const configuration = await dataAdapter.getPortfolioConfig()
        this.dataAdapter = dataAdapter
        this._configuration = configuration
      }
    } catch (error) {
      trackError(this._telemetryComponent, error)
      return false
    }
    this._selectedPortfolioId = portfolioId
    if (isSwitch) {
      trackUsage(
        this._telemetryComponent as TelemetryEventComponent<'portfolio.switched'>,
        'portfolio.switched'
      )
    }
    this.render()
    return true
  }

  public async onInit(): Promise<void> {
    try {
      const portfolios = this.properties.portfolios ?? []
      this._selectedPortfolioId = this.properties.selectedPortfolioId
      const portfolio =
        portfolios.find(({ uniqueId }) => uniqueId === this._selectedPortfolioId) ??
        _.first(portfolios)
      await super.onInit(portfolio)
      this._configuration = await this.dataAdapter.getPortfolioConfig()
    } catch (error) {
      this._error = error as ErrorWithIntent
      // Counted where the configuration fails to load, once, by the error's own code: `render`
      // shows the error every time it runs, and its message stays on the page.
      trackError(this._telemetryComponent, error)
    }
  }

  /**
   * Get dropdown options for the specified `targetProperty`. For now it only
   * handles the `defaultViewId` and `portfolios` properties.
   */
  protected _getOptions(
    targetProperty: keyof IPortfolioOverviewProps
  ): IPropertyPaneDropdownOption[] {
    switch (targetProperty) {
      case 'portfolios': {
        return this.properties.portfolios?.map((portfolio) => ({
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
          header: {
            description: strings.ShowFieldPortfolioLabel
          },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel
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
                PropertyPaneDescription(
                  strings.ShowPortfolioSelectorDescription,
                  !_.isEmpty(this.properties.portfolios)
                ),
                PropertyPaneToggle('showViewSelector', {
                  label: strings.ShowViewSelectorLabel
                }),
                this.properties.showViewSelector &&
                  PropertyPaneToggle('showProgramViews', {
                    label: strings.ShowProgramViewsLabel
                  }),
                this.properties.showViewSelector &&
                  !_.isEmpty(this.properties.portfolios) &&
                  this.properties.portfolios.length > 1 &&
                  PropertyPaneToggle('showMergedViewInViewSelector', {
                    label: strings.ShowMergedViewInViewSelectorLabel
                  }),
                PropertyPaneDescription(
                  strings.ShowMergedViewInViewSelectorDescription,
                  this.properties.showViewSelector &&
                    !_.isEmpty(this.properties.portfolios) &&
                    this.properties.portfolios.length > 1
                )
              ].filter(Boolean)
            },
            {
              groupName: strings.ListViewGroupName,
              groupFields: [
                PropertyPaneToggle('isListLayoutModeJustified', {
                  label: strings.ListLayoutModeJustifiedLabel
                })
              ]
            },
            {
              groupName: strings.AdvancedGroupName,
              isCollapsed: true,
              groupFields: [
                PropertyFieldCollectionData('portfolios', {
                  key: 'portfolios',
                  panelProps: {
                    type: 6
                  },
                  label: strings.PortfoliosFieldLabel,
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
                      id: 'iconName',
                      title: strings.IconNameFieldLabel,
                      placeholder: strings.IconNameFieldPlaceholder,
                      type: CustomCollectionFieldType.string,
                      required: false
                    },
                    {
                      id: 'projectListName',
                      title: strings.ProjectListNameFieldLabel,
                      type: CustomCollectionFieldType.string,
                      defaultValue: PortalDataServiceDefaultConfiguration?.listNames?.PROJECTS,
                      required: true
                    },
                    {
                      id: 'projectStatusListName',
                      title: strings.ProjectStatusListNameFieldLabel,
                      type: CustomCollectionFieldType.string,
                      defaultValue:
                        PortalDataServiceDefaultConfiguration?.listNames?.PROJECT_STATUS,
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
                    },
                    {
                      id: 'includeInMergedView',
                      title: strings.IncludeInMergedViewFieldLabel,
                      type: CustomCollectionFieldType.boolean,
                      defaultValue: true,
                      required: false
                    }
                  ]
                }),
                PropertyPaneDescription(strings.PortfoliosFieldDescription),
                PropertyPaneDropdown('selectedPortfolioId', {
                  label: strings.SelectedPortfolioLabel,
                  options: this._getOptions('portfolios'),
                  disabled: _.isEmpty(this.properties.portfolios)
                }),
                PropertyPaneDescription(strings.SelectedPortfolioDescription)
              ]
            }
          ]
        }
      ]
    }
  }
}
