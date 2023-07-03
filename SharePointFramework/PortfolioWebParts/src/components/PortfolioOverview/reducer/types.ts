import { ProjectColumn } from 'pp365-shared-library/lib/models'
import { IPortfolioOverviewProps } from '../types'

export interface IPortfolioOverviewReducerParams {
  props: IPortfolioOverviewProps;
  placeholderColumns?: ProjectColumn[];
}
