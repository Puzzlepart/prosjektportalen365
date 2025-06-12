import { IPortfolioAggregationProps } from 'components/PortfolioAggregation'

export interface IProjectCardProps extends IPortfolioAggregationProps {
  test?: string
}

export interface IProjectCardState {
  loading?: boolean
  refetch?: number
}
