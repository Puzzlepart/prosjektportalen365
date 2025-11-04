import { PortfolioOverviewView } from 'pp365-shared-library/lib/models/PortfolioOverviewView'
import { IPortfolioOverviewConfiguration } from '../../../components/PortfolioOverview'

export interface ICommandsProps {
  newFormUrl: string
  currentView: PortfolioOverviewView
  configuration: Partial<IPortfolioOverviewConfiguration>
  contentTypes: { StringId: string; Name: string }[]
  onViewChanged: (view: PortfolioOverviewView) => Promise<void>
}
