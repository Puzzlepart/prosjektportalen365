import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { PortfolioInsights, IPortfolioInsightsProps } from 'components/PortfolioInsights'
import '@fluentui/react/dist/css/fabric.min.css'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import _ from 'lodash'
import resource from 'SharedResources'

export default class PortfolioInsightsWebPart extends BasePortfolioWebPart<IPortfolioInsightsProps> {
  public render(): void {
    this.renderComponent<IPortfolioInsightsProps>(PortfolioInsights)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  /**
   * Gets the value of a property. If the property is empty, it returns the default value
   * from the `defaultProps` of the component `PortfolioInsights`.
   *
   * @param key Key of the property to get
   */
  private _getPropertyValue(key: keyof IPortfolioInsightsProps): string {
    return _.isEmpty(this.properties[key])
      ? PortfolioInsights.defaultProps[key as string]
      : this.properties[key as string]
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
                  label: resource.Lists_ChartConfiguration_Title,
                  value: this._getPropertyValue('chartConfigurationListName')
                }),
                PropertyPaneTextField('columnConfigListName', {
                  label: resource.Lists_ProjectColumnConfiguration_Title,
                  value: this._getPropertyValue('columnConfigListName')
                }),
                PropertyPaneTextField('columnsListName', {
                  label: resource.Lists_ProjectColumns_Title,
                  value: this._getPropertyValue('columnsListName')
                }),
                PropertyPaneTextField('viewsListName', {
                  label: resource.Lists_PortfolioViews_Title,
                  value: this._getPropertyValue('viewsListName')
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
