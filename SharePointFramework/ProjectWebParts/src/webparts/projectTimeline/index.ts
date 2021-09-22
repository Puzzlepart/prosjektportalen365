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
                PropertyPaneToggle('showFilterButton', {
                  label: 'Vis filterknapp',
                  checked: true
                }),
                PropertyPaneToggle('showTimeline', {
                  label: 'Vis tidslinje',
                  checked: true
                }),
                PropertyPaneToggle('showInfoMessage', {
                  label: 'Vis infomelding',
                  checked: true
                }),
                PropertyPaneToggle('showCmdTimelineList', {
                  label: 'Vis kommandolinje for liste',
                  checked: true
                }),
                PropertyPaneToggle('showTimelineList', {
                  label: 'Vis liste',
                  checked: true
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
