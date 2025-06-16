/* eslint-disable quotes */
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import { IProjectCardProps, ProjectCard } from 'components/ProjectCard'

export default class ProjectCardWebPart extends BasePortfolioWebPart<IProjectCardProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectCardProps>(ProjectCard)
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Prosjektkort'
          },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('projectSiteId', {
                  label: 'Område ID',
                  description: 'ID for SharePoint-området (Prosjektet)'
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
