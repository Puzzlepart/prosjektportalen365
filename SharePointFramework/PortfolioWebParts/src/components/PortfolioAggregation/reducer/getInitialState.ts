import { first } from 'underscore'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from '../types'

/**
 * Get nitial state for `<PortfolioAggregation />` component based on props for the component.
 *
 * @param props Props for `<PortfolioAggregation />` component
 */

export function getInitialState(props: IPortfolioAggregationProps) {
  return {
    loading: true,
    searchTerm: '',
    activeFilters: {},
    filters: [],
    items: [],
    columns: props.columns ?? [],
    allColumnsForCategory: props.columns ?? [],
    dataSource: props.dataSource ?? first(props.configuration.views)?.title,
    dataSources: props.configuration.views,
    dataSourceLevel: props.dataSourceLevel ?? props.configuration?.level,
    columnForm: { isOpen: false, column: null },
    viewForm: { isOpen: false, view: null },
    isEditViewColumnsPanelOpen: false
  } as IPortfolioAggregationState
}
