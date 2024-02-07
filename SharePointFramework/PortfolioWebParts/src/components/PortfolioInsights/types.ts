import { ChartConfiguration, ChartData } from 'models'
import { PortfolioOverviewView } from 'pp365-shared-library/lib/models/PortfolioOverviewView'
import { IPortfolioOverviewConfiguration } from '../../components/PortfolioOverview'
import { IBaseComponentProps } from '../types'

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
  configuration?: IPortfolioOverviewConfiguration
  error?: string
}
