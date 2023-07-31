import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import strings from 'PortfolioWebPartsStrings'
import { ProjectTimeline, IProjectTimelineProps } from 'pp365-shared-library/lib/components'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export default class PortfolioTimelineWebPart extends BasePortfolioWebPart<IProjectTimelineProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectTimelineProps>(ProjectTimeline)
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.ProjectDeliveriesGroupName,
              groupFields: [
                PropertyPaneTextField('dataSourceName', {
                  label: strings.DataSourceLabel,
                  value: 'Alle prosjektleveranser'
                }),
                PropertyPaneTextField('configItemTitle', {
                  label: strings.ConfigItemTitleFieldLabel,
                  description: strings.ConfigItemTitleFieldDescription,
                  value: 'Prosjektleveranse'
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
