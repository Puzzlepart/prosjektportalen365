import { DataAdapter } from 'data'
import { IPortfolioConfiguration } from 'pp365-portfoliowebparts/lib/interfaces'
import { ICommandBarProperties } from 'types'

export interface IProgramStatusProps {
  webPartTitle: string
  context: any
  commandBarProperties: ICommandBarProperties
  configuration: IPortfolioConfiguration
  dataAdapter: DataAdapter
  defaultViewId: string
}
