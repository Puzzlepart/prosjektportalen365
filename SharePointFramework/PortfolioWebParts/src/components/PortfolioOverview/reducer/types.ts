import { ProjectColumn } from 'pp365-shared-library/lib/models'
import { IPortfolioOverviewProps } from '../types'

/** Overview configuration and cached columns used to initialize reducer state. */
export interface IPortfolioOverviewReducerParams {
  props: IPortfolioOverviewProps
  placeholderColumns?: ProjectColumn[]
}
