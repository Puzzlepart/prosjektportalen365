import { DataAdapter } from 'data'
import { IAggregatedPortfolioPropertyPane } from 'models'

export interface IProgramDeliveriesProps {
  webPartTitle: string
  context: any
  dataAdapter: DataAdapter
  properties: IAggregatedPortfolioPropertyPane
  onUpdateProperty: (key: string, value: any) => void
  childProjects?: string[]
}
