import {
  IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { ILatestProjectsProps, LatestProjects } from 'components/LatestProjects'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'

export default class LatestProjectsWebPart extends BasePortfolioWebPart<ILatestProjectsProps> {
  public render(): void {
    this.renderComponent<ILatestProjectsProps>(LatestProjects)
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
                  min: LatestProjects.defaultProps.minRowLimit,
                  max: LatestProjects.defaultProps.maxRowLimit,
                  step: 1
                }),
                PropertyPaneToggle('openInNewTab', {
                  label: strings.OpenInNewTabLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
