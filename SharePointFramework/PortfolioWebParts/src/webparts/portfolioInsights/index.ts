import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { PortfolioInsights, IPortfolioInsightsProps } from 'components/PortfolioInsights'
import '@fluentui/react/dist/css/fabric.min.css'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export default class PortfolioInsightsWebPart extends BasePortfolioWebPart<IPortfolioInsightsProps> {
  public render(): void {
    this.renderComponent<IPortfolioInsightsProps>(PortfolioInsights)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.ConfigurationGroupName,
              groupFields: [
                PropertyPaneTextField('chartConfigurationListName', {
                  label: strings.ChartConfigurationListNameLabel
                }),
                PropertyPaneTextField('columnConfigListName', {
                  label: strings.ColumnConfigListNameLabel
                }),
                PropertyPaneTextField('columnsListName', {
                  label: strings.ColumnsListNameLabel
                }),
                PropertyPaneTextField('viewsListName', {
                  label: strings.ViewsListNameLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
