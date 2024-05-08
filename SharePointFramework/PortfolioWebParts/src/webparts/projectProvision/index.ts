/* eslint-disable quotes */
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import { IProjectProvisionProps, ProjectProvision } from 'components/ProjectProvision'

export default class ProjectProvisionWebPart extends BasePortfolioWebPart<IProjectProvisionProps> {
  public render(): void {
    this.renderComponent<IProjectProvisionProps>(ProjectProvision)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Test web part description'
          },
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.TitleDescription
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
