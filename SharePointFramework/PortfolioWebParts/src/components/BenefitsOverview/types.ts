import { IPortfolioAggregationProps } from 'components/PortfolioAggregation/types'

export interface IBenefitsOverviewProps extends IPortfolioAggregationProps {
  /**
   * Columns to hide from the DetailsList
   */
  hiddenColumns?: string[]
}