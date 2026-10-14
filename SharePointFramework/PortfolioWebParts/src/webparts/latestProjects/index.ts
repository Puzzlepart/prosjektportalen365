import {
  IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import {
  ILatestProjectsProps,
  LATEST_PROJECTS_DEFAULT_PROPS,
  LatestProjects
} from 'components/LatestProjects'
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
                  min: LATEST_PROJECTS_DEFAULT_PROPS.minRowLimit,
                  max: LATEST_PROJECTS_DEFAULT_PROPS.maxRowLimit,
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
