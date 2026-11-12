import { first } from 'underscore'
import { IPortfolioAggregationProps, IPortfolioAggregationState } from '../types'

/**
 * Initialize aggregation source, columns and closed editing panels from web-part properties.
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
    dataSource: props.dataSource ?? first(props.configuration?.views)?.title,
    views: props.configuration?.views ?? [],
    dataSourceLevel: props.dataSourceLevel ?? props.configuration?.level,
    dataSourceCategory: props.dataSourceCategory,
    columnForm: { isOpen: false, column: null },
    viewForm: { isOpen: false, view: null },
    isEditViewColumnsPanelOpen: false
  } as IPortfolioAggregationState
}
