import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import '@pnp/polyfill-ie11'
import { IProjectTimelineProps, ProjectTimeline } from 'components/ProjectTimeline'
import 'office-ui-fabric-react/dist/css/fabric.min.css'
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart'

import * as strings from 'ProjectWebPartsStrings'

export default class ProjectTimelineWebPart extends BaseProjectWebPart<IProjectTimelineProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectTimelineProps>(ProjectTimeline)
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.ProjecttimelineGroupName,
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: strings.ListNameFieldLabel,
                  value: 'Tidslinjeinnhold'
                }),
                PropertyPaneToggle('showTimeline', {
                  label: strings.ShowTimelineLabel,
                  checked: true
                }),
                PropertyPaneToggle('showCmdTimelineList', {
                  label: strings.ShowCmdTimelineListLabel,
                  checked: true
                }),
                PropertyPaneToggle('showTimelineList', {
                  label: strings.ShowTimelineListLabel,
                  checked: true
                })
              ]
            },
            {
              groupName: strings.ProjectDeliveriesGroupName,
              groupFields: [
                PropertyPaneToggle('showProjectDeliveries', {
                  label: strings.ShowProjectDeliveriesLabel,
                  checked: false
                }),
                PropertyPaneTextField('projectDeliveriesListName', {
                  label: strings.ListNameFieldLabel,
                  value: 'Prosjektleveranser'
                }),
                PropertyPaneTextField('configItemTitle', {
                  label: strings.ConfigItemTitleFieldLabel,
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
