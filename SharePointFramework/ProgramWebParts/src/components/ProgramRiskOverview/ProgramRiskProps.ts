import { DataAdapter } from 'data'
import { IAggregatedPortfolioPropertyPane } from 'models'
import { IPortfolioConfiguration } from 'pp365-portfoliowebparts/lib/interfaces'

export interface IProgramRiskOverview {
  webPartTitle: string
  context: any
  dataAdapter: DataAdapter
  properties: IAggregatedPortfolioPropertyPane
}

export const SelectedRiskProperties = ["Path", "SPWebURL", "Title", "ListItemId", "SiteTitle", "SiteId", "ContentTypeID", "GtRiskProbabilityOWSNMBR", "GtRiskProbabilityPostActionOWSNMBR", "GtRiskConsequenceOWSNMBR", "GtRiskConsequencePostActionOWSNMBR", "GtRiskActionOWSMTXT", "Path", "SPWebURL", "SiteTitle"]