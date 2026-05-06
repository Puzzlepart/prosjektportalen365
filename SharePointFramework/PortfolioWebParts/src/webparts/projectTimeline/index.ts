import { format } from '@fluentui/react'
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane'
import strings from 'PortfolioWebPartsStrings'
import { ProjectTimeline, IProjectTimelineProps } from 'pp365-shared-library/lib/components'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'

export default class PortfolioTimelineWebPart extends BasePortfolioWebPart<IProjectTimelineProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectTimelineProps>(ProjectTimeline)
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const propertiesWithDefaults = { ...ProjectTimeline.defaultProps, ...this.properties }
    const timeframeOptions = [
      [1, 'months'],
      [2, 'months'],
      [4, 'months'],
      [6, 'months'],
      [8, 'months'],
      [10, 'months'],
      [12, 'months'],
      [24, 'months'],
      [36, 'months']
    ]
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.ProjectDeliveriesGroupName,
              groupFields: [
                PropertyPaneDropdown('defaultTimeframeStart', {
                  label: strings.DefaultTimeframeStartLabel,
                  selectedKey: propertiesWithDefaults.defaultTimeframeStart,
                  options: timeframeOptions.map((val) => ({
                    key: val.toString(),
                    text: format(strings.DefaultTimeframeStartValue, val[0])
                  }))
                }),
                PropertyPaneDropdown('defaultTimeframeEnd', {
                  label: strings.DefaultTimeframeEndLabel,
                  selectedKey: propertiesWithDefaults.defaultTimeframeEnd,
                  options: timeframeOptions.map((val) => ({
                    key: val.toString(),
                    text: format(strings.DefaultTimeframeEndValue, val[0])
                  }))
                }),
                PropertyPaneTextField('dataSourceName', {
                  label: strings.DataSourceLabel
                }),
                PropertyPaneTextField('configItemTitle', {
                  label: strings.ConfigItemTitleFieldLabel,
                  description: strings.ConfigItemTitleFieldDescription
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
