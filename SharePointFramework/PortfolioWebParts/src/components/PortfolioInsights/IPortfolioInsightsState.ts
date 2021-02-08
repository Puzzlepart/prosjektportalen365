import { ChartConfiguration, ChartData } from 'models'
import { IPortfolioConfiguration } from 'interfaces'
import { PortfolioOverviewView } from 'pp365-shared/lib/models/PortfolioOverviewView'

export interface IPortfolioInsightsState {
  isLoading: boolean
  chartData?: ChartData
  charts?: ChartConfiguration[]
  contentTypes?: { StringId: string; Name: string; NewFormUrl: string }[]
  currentView?: PortfolioOverviewView
  configuration?: IPortfolioConfiguration
  error?: string
}
