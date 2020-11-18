import { IPortfolioConfiguration } from 'interfaces'
import { PortfolioOverviewView } from 'shared/lib/models/PortfolioOverviewView'

export interface IPortfolioInsightsCommandBarProps {
  newFormUrl: string
  currentView: PortfolioOverviewView
  configuration: IPortfolioConfiguration
  contentTypes: { StringId: string; Name: string }[]
  onViewChanged: (view: PortfolioOverviewView) => Promise<void>
}
