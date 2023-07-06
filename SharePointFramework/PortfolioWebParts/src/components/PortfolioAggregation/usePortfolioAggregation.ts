import { useEffect } from 'react'
import {
  EXECUTE_SEARCH,
  SET_CURRENT_VIEW,
  TOGGLE_COLUMN_CONTEXT_MENU,
  usePortfolioAggregationReducer
} from './reducer'
import { IPortfolioAggregationProps } from './types'
import { useDefaultColumns } from './useDefaultColumns'
import { usePortfolioAggregationDataFetch } from './usePortfolioAggregationDataFetch'
import { usePortfolioAggregationFilteredItems } from './usePortfolioAggregationFilteredItems'
import { ISearchBoxProps, format } from '@fluentui/react'
import { stringIsNullOrEmpty } from '@pnp/common'
import strings from 'PortfolioWebPartsStrings'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { OnColumnContextMenu } from '../List'

/**
 * Component logic hook for the Portfolio Aggregation component. This
 * hook is responsible for fetching data, managing state and dispatching
 * actions to the reducer.
 *
 * @param props Props for the Portfolio Aggregation component
 */
export const usePortfolioAggregation = (props: IPortfolioAggregationProps) => {
  const context = usePortfolioAggregationReducer(props)

  useEffect(() => {
    if (props.dataSourceCategory) {
      context.dispatch(SET_CURRENT_VIEW)
    }
  }, [props.dataSourceCategory, props.defaultViewId])

  usePortfolioAggregationDataFetch(context, [context.state.currentView])

  context.items = usePortfolioAggregationFilteredItems(context)
  context.columns = useDefaultColumns(context)

  const searchBox: ISearchBoxProps = {
    placeholder: !stringIsNullOrEmpty(props.searchBoxPlaceholderText)
      ? props.searchBoxPlaceholderText
      : context.state.dataSource &&
        format(strings.SearchBoxPlaceholderText, context.state.dataSource.toLowerCase()),
    onChange: (_, searchTerm) => context.dispatch(EXECUTE_SEARCH(searchTerm)),
    onClear: () => context.dispatch(EXECUTE_SEARCH(''))
  }

  const onColumnContextMenu = (contextMenu: OnColumnContextMenu) => {
    context.dispatch(TOGGLE_COLUMN_CONTEXT_MENU(contextMenu))
  }

  const editViewColumnsPanelProps = useEditViewColumnsPanel(context)

  return { context, editViewColumnsPanelProps, onColumnContextMenu, searchBox } as const
}
