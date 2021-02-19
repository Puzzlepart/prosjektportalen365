import { IPortfolioConfiguration } from 'interfaces'
import { PortfolioOverviewView } from 'pp365-shared/lib/models/PortfolioOverviewView'

export interface ICommandsProps {
  newFormUrl: string
  currentView: PortfolioOverviewView
  configuration: IPortfolioConfiguration
  contentTypes: { StringId: string; Name: string }[]
  onViewChanged: (view: PortfolioOverviewView) => Promise<void>
}
