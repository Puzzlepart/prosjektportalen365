import { IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneToggle } from '@microsoft/sp-property-pane'
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
                PropertyPaneToggle('showProjectLogo', {
                  label: strings.ShowProjectLogoFieldLabel
                }),
                PropertyPaneSlider('rowLimit', {
                  label: strings.RowLimitLabel,
                  min: LatestProjects.defaultProps.minRowLimit,
                  max: LatestProjects.defaultProps.maxRowLimit,
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
