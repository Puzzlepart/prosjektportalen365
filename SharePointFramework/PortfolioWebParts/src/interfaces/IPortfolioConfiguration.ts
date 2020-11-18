import { ProjectColumn, PortfolioOverviewView } from 'shared/lib/models'

export interface IPortfolioConfiguration {
  columns: ProjectColumn[]
  refiners: ProjectColumn[]
  views: PortfolioOverviewView[]
  viewsUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }
  columnUrls: { defaultNewFormUrl: string; defaultEditFormUrl: string }
}
