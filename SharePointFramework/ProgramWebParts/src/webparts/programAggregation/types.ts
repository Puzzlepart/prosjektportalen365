import { IBaseComponentProps } from 'components/types'

export interface IProgramAggregationWebPartProps extends IBaseComponentProps {
  /**
   * Data source name
   */
  dataSource?: string

  /**
   * Show search box
   */
  showSearchBox?: boolean;
}
