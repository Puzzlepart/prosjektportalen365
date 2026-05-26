import { ArchiveOverview, IArchiveOverviewProps } from 'components/ArchiveOverview'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'

export default class ArchiveOverviewWebPart extends BasePortfolioWebPart<IArchiveOverviewProps> {
  public render(): void {
    this.renderComponent<IArchiveOverviewProps>(ArchiveOverview)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
  }
}
