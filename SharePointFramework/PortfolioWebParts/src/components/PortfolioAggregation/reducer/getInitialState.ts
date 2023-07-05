import { first } from 'underscore'
import {
  IPortfolioAggregationProps,
  IPortfolioAggregationState
} from '../types'

/**
 * Get nitial state for `<PortfolioAggregation />` component based on props for the component.
 *
 * @param props Props for `<PortfolioAggregation />` component
 */

export function getInitialState(props: IPortfolioAggregationProps): IPortfolioAggregationState {
  return {
    loading: true,
    isCompact: false,
    searchTerm: '',
    activeFilters: {},
    filters: [],
    items: [],
    columns: props.columns ?? [],
    dataSourceColumns: props.columns ?? [],
    dataSource: props.dataSource ?? first(props.configuration.views)?.title,
    dataSources: props.configuration.views,
    dataSourceLevel: props.dataSourceLevel ?? props.configuration?.level,
    groups: null,
    columnForm: { isOpen: false, column: null },
    isEditViewColumnsPanelOpen: false
  }
}
