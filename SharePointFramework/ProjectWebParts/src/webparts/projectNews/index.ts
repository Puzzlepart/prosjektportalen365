import '@fluentui/react/dist/css/fabric.min.css'
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'

import { PortalDataService } from 'pp365-shared-library/lib/services/PortalDataService'
import { IProjectNewsProps, ProjectNews } from 'components/ProjectNews'
import * as strings from 'ProjectWebPartsStrings'
import { BaseProjectWebPart } from '../baseProjectWebPart'

export default class ProjectNewsWebPart extends BaseProjectWebPart<IProjectNewsProps> {
  private _portalDataService: PortalDataService
  private _globalSettings: Map<string, string>
  private _projectNewsFolderName: string
  private _projectNewsHubUrl: string
  public async onInit(): Promise<void> {
    await super.onInit()
    this._portalDataService = await new PortalDataService().configure({
      spfxContext: this.context
    })
    this._globalSettings = await this._portalDataService.getGlobalSettings()
    this._projectNewsFolderName =
      this._globalSettings.get('ProjectNewsFolderName') || strings.NewsFolderNameDefault
    this._projectNewsHubUrl =
      this._globalSettings.get('ProjectNewsHubUrl') || this.properties.siteUrl

    if (!this.properties.newsFolderName) {
      this.properties.newsFolderName = this._projectNewsFolderName
    }
    if (!this.properties.siteUrl) {
      this.properties.siteUrl = this._projectNewsHubUrl
    }
  }

  public render(): void {
    this.renderComponent<IProjectNewsProps>(ProjectNews, {
      siteUrl: this.properties.siteUrl,
      spHttpClient: this.context.spHttpClient,
      context: this.context,
      maxVisibleNews: this.properties.maxVisibleNews,
      newsFolderName: this.properties.newsFolderName
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
                  label: strings.SiteUrlLabel,
                  description: strings.SiteUrlDescription,
                  value: this.properties.siteUrl
                }),
                PropertyPaneTextField('maxVisibleNews', {
                  label: strings.MaxVisibleNewsLabel,
                  value: this.properties.maxVisibleNews?.toString() ?? '',
                  description: strings.MaxVisibleNewsDescription
                }),
                PropertyPaneTextField('newsFolderName', {
                  label: strings.NewsFolderNameLabel,
                  value: this.properties.newsFolderName,
                  description: strings.NewsFolderNameDescription
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
