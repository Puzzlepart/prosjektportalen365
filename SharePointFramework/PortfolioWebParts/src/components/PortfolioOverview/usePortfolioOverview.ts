import { Selection, format } from '@fluentui/react'
import { useId } from '@fluentui/react-hooks'
import { SearchBoxProps } from '@fluentui/react-search-preview'
import strings from 'PortfolioWebPartsStrings'
import { IFilterItemProps, IFilterPanelProps, ProjectColumn } from 'pp365-shared-library'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { useMemo, useReducer } from 'react'
import { OnColumnContextMenu } from '../List'
import { IPortfolioOverviewContext } from './context'
import createReducer, {
  EXECUTE_SEARCH,
  ON_FILTER_CHANGED,
  SELECTION_CHANGED,
  TOGGLE_COLUMN_CONTEXT_MENU,
  TOGGLE_FILTER_PANEL,
  getInitialState
} from './reducer'
import { IPortfolioOverviewProps } from './types'
import { useCommandBar } from './useCommandBar'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { useFetchData } from './useFetchData'
import { useFilteredData } from './useFilteredData'
import { usePersistedColumns } from './usePersistedColumns'

/**
 * Component logic hook for `PortfolioOverview` component.
 *
 * - Handles state using `useReducer` and our custom `reducer` function
 * - Handles selection changes using `Selection` from `@fluentui/react`
 * - Fetches initial data using `useFetchInitialData`
 * - Configures the `ExcelExportService` from `pp365-shared`
 * - Handles column header click using `useColumnHeaderClick`
 * - Handles column header context menu using `useColumnHeaderContextMenu`
 * - Handles column persistence using `usePersistedColumns`
 */
export function usePortfolioOverview(props: IPortfolioOverviewProps) {
  const [placeholderColumns] = usePersistedColumns(props)
  const reducer = useMemo(() => createReducer({ props, placeholderColumns }), [])
  const [state, dispatch] = useReducer(reducer, getInitialState({ props, placeholderColumns }))

  const layerHostId = useId('layerHost')

  const context: IPortfolioOverviewContext = {
    props,
    state,
    dispatch,
    layerHostId
  }

  const onSelectionChanged = () => {
    dispatch(SELECTION_CHANGED(selection))
  }

  const selection = new Selection({ onSelectionChanged })

  const onColumnContextMenu = (contextMenu: OnColumnContextMenu) => {
    context.dispatch(TOGGLE_COLUMN_CONTEXT_MENU(contextMenu))
  }

  useFetchData(context)

  ExcelExportService.configure({ name: props.title })

  const { items, groups } = useFilteredData(context)

  const editViewColumnsPanelProps = useEditViewColumnsPanel(context)

  const searchBoxProps: SearchBoxProps = {
    placeholder: !!context.state.currentView
      ? format(strings.SearchBoxPlaceholderText, context.state.currentView.title.toLowerCase())
      : strings.SearchBoxPlaceholderFallbackText,
    onChange: (_, data) => {
      context.dispatch(EXECUTE_SEARCH(data?.value))
    },
    // onClear: () => context.dispatch(EXECUTE_SEARCH('')),
    hidden: !props.showSearchBox
  }

  const { commandBarProps, filters } = useCommandBar()

  const filterPanelProps: IFilterPanelProps = useMemo(() => ({
    isOpen: context.state.isFilterPanelOpen,
    layerHostId: context.layerHostId,
    onDismiss:() => context.dispatch(TOGGLE_FILTER_PANEL()),
    filters: filters,
    onFilterChange: (column: ProjectColumn, selectedItems: IFilterItemProps[]) => {
      context.dispatch(ON_FILTER_CHANGED({ column, selectedItems }))
    }
  }), [context.state.isFilterPanelOpen, context.layerHostId, filters])

  return {
    context: {
      ...context,
      items,
      groups
    } as IPortfolioOverviewContext,
    selection,
    onColumnContextMenu,
    editViewColumnsPanelProps,
    searchBoxProps,
    commandBarProps,
    filterPanelProps
  } as const
}
