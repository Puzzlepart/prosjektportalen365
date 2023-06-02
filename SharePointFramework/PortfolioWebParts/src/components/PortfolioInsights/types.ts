import { IBaseComponentProps } from '../types'
import { ChartConfiguration, ChartData } from 'models'
import { IPortfolioConfiguration } from 'interfaces'
import { PortfolioOverviewView } from 'pp365-shared-library/lib/models/PortfolioOverviewView'

export interface IPortfolioInsightsProps extends IBaseComponentProps {
  chartConfigurationListName: string
  columnConfigListName: string
  columnsListName: string
  viewsListName: string
}
export interface IPortfolioInsightsState {
  loading: boolean
  chartData?: ChartData
  charts?: ChartConfiguration[]
  contentTypes?: { StringId: string; Name: string; NewFormUrl: string }[]
  currentView?: PortfolioOverviewView
  configuration?: IPortfolioConfiguration
  error?: string
}
