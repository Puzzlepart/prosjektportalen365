import { ILatestProjectsProps, LatestProjects } from 'components/LatestProjects'
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneSlider
} from '@microsoft/sp-webpart-base'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export default class LatestProjectsWebPart extends BasePortfolioWebPart<ILatestProjectsProps> {
  public render(): void {
    this.renderComponent(LatestProjects)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('loadingText', {
                  label: strings.LoadingTextLabel,
                  description: strings.LoadingTextDescription
                }),
                PropertyPaneTextField('emptyMessage', {
                  label: strings.EmptyMessageLabel,
                  description: strings.EmptyMessageDescription
                }),
                PropertyPaneSlider('rowLimit', {
                  label: strings.RowLimitLabel,
                  min: 5,
                  max: 15,
                  step: 1
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
