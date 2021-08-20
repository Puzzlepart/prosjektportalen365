import {
  IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField
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
                PropertyPaneSlider('width', {
                  label: strings.WidthFieldLabel,
                  min: 800,
                  max: 1600,
                  value: 800,
                  showValue: true
                }),
                PropertyPaneSlider('height', {
                  label: strings.HeightFieldLabel,
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
