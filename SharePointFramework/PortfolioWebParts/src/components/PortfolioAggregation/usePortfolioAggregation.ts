import { format } from '@fluentui/react'
import { SearchBoxProps } from '@fluentui/react-search-preview'
import { stringIsNullOrEmpty } from '@pnp/core'
import strings from 'PortfolioWebPartsStrings'
import { IFilterPanelProps, ProjectContentColumn } from 'pp365-shared-library'
import { useEffect, useMemo } from 'react'
import { OnColumnContextMenu } from '../List'
import {
  EXECUTE_SEARCH,
  ON_FILTER_CHANGE,
  SET_CURRENT_VIEW,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_FILTER_PANEL,
  usePortfolioAggregationReducer
} from './reducer'
import { IPortfolioAggregationProps } from './types'
import { useDefaultColumns } from './useDefaultColumns'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { usePortfolioAggregationDataFetch } from './usePortfolioAggregationDataFetch'
import { usePortfolioAggregationFilteredItems } from './usePortfolioAggregationFilteredItems'
import { useToolbarItems } from './ToolbarItems/useToolbarItems'

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

  const searchBox = useMemo<SearchBoxProps>(
    () => ({
      placeholder: !stringIsNullOrEmpty(props.searchBoxPlaceholderText)
        ? props.searchBoxPlaceholderText
        : context.state.currentView &&
          format(strings.SearchBoxPlaceholderText, context.state.currentView?.title?.toLowerCase()),
      onChange: (_, data) => context.dispatch(EXECUTE_SEARCH(data?.value)),
      onClear: () => context.dispatch(EXECUTE_SEARCH(''))
    }),
    [context.state.currentView, props.searchBoxPlaceholderText]
  )

  const onColumnContextMenu = (contextMenu: OnColumnContextMenu) => {
    context.dispatch(TOGGLE_COLUMN_CONTEXT_MENU(contextMenu))
  }

  const editViewColumnsPanelProps = useEditViewColumnsPanel(context)

  const filterPanelProps = useMemo<IFilterPanelProps>(
    () => ({
      isOpen: context.state.isFilterPanelOpen,
      layerHostId: context.layerHostId,
      onDismiss: () => context.dispatch(TOGGLE_FILTER_PANEL()),
      filters: context.state.filters,
      onFilterChange: (column: ProjectContentColumn, selectedItems) => {
        context.dispatch(ON_FILTER_CHANGE({ column, selectedItems }))
      }
    }),
    [context.state.isFilterPanelOpen, context.layerHostId, context.state.filters]
  )

  const menuItems = useToolbarItems(context)

  return {
    context,
    editViewColumnsPanelProps,
    onColumnContextMenu,
    searchBox,
    menuItems,
    filterPanelProps
  } as const
}
