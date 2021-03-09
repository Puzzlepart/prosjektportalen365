import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { IProjectTimelineProps, ProjectTimeline } from 'components/ProjectTimeline'
import { BasePortfolioWebPart } from 'webparts/@basePortfolioWebPart'

export default class ProjectTimelineWebPart extends BasePortfolioWebPart<
  IProjectTimelineProps
> {
  public render(): void {
    this.renderComponent<IProjectTimelineProps>(ProjectTimeline)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return super.getPropertyPaneConfiguration()
  }
}
