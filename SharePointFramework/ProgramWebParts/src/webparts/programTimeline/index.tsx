import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import {
  ProjectTimeline,
  IProjectTimelineProps
} from 'pp365-shared-library/lib/components/ProjectTimeline'
import strings from 'ProgramWebPartsStrings'
import { unmountComponentAtNode } from 'react-dom'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import resource from 'SharedResources'

export default class ProgramTimelineWebPart extends BaseProgramWebPart<IProjectTimelineProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectTimelineProps>(ProjectTimeline)
  }

  protected onDispose(): void {
    unmountComponentAtNode(this.domElement)
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
                  value: resource.Lists_DataSources_Category_ProjectDeliveries_All
                }),
                PropertyPaneTextField('configItemTitle', {
                  label: strings.ConfigItemTitleFieldLabel,
                  description: strings.ConfigItemTitleFieldDescription,
                  value: strings.ProjectDeliveryLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
