import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { IProjectNewsProps, ProjectNews } from 'components/ProjectNews'
import '@fluentui/react/dist/css/fabric.min.css'
import * as strings from 'ProjectWebPartsStrings'
import { BaseProjectWebPart } from '../baseProjectWebPart'

export default class ProjectNewsWebPart extends BaseProjectWebPart<IProjectNewsProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectNewsProps>(ProjectNews, {
      siteUrl: this.properties.siteUrl,
      spHttpClient: this.context.spHttpClient
    })
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('siteUrl', {
                  label: 'URL til område for publisering',
                  value: this.properties.siteUrl
                })
              ]
            },

          ]
        }
      ]
    }
  }
}
