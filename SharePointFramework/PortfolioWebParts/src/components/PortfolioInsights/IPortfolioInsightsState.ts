import { ChartConfiguration, ChartData } from 'models'
import { IPortfolioConfiguration } from 'interfaces'
import { PortfolioOverviewView } from 'shared/lib/models/PortfolioOverviewView'

export interface IPortfolioInsightsState {
  isLoading: boolean
  chartData?: ChartData
  charts?: ChartConfiguration[]
  contentTypes?: { StringId: string; Name: string; NewFormUrl: string }[]
  currentView?: PortfolioOverviewView
  configuration?: IPortfolioConfiguration
  error?: string
}
