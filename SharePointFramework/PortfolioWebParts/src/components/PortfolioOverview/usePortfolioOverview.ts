import { ISearchBoxProps, Selection, format } from '@fluentui/react'
import { useId } from '@fluentui/react-hooks'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import { useMemo, useReducer } from 'react'
import { IPortfolioOverviewContext } from './context'
import createReducer, {
  EXECUTE_SEARCH,
  SELECTION_CHANGED,
  TOGGLE_COLUMN_CONTEXT_MENU,
  getInitialState
} from './reducer'
import { IPortfolioOverviewProps } from './types'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'
import { useFetchData } from './useFetchData'
import { useFilteredData } from './useFilteredData'
import { usePersistedColumns } from './usePersistedColumns'
import strings from 'PortfolioWebPartsStrings'
import { OnColumnContextMenu } from '../List'

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

  const searchBoxProps: ISearchBoxProps = {
    placeholder: !!context.state.currentView
      ? format(strings.SearchBoxPlaceholderText, context.state.currentView.title.toLowerCase())
      : strings.SearchBoxPlaceholderFallbackText,
    onChange: (_, searchTerm) => context.dispatch(EXECUTE_SEARCH(searchTerm)),
    onClear: () => context.dispatch(EXECUTE_SEARCH('')),
    hidden: !props.showSearchBox
  }

  return {
    context: {
      ...context,
      items,
      groups
    },
    selection,
    onColumnContextMenu,
    editViewColumnsPanelProps,
    searchBoxProps
  } as const
}
