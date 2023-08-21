import { useProjectSetupDialogContext } from '../context'
import { ON_LIST_CONTENT_CONFIG_CHANGED } from '../reducer'
import { useSelectionList } from '../useSelectionList'
import { useColumns } from './useColumns'
import { useRowRenderer } from './useRowRenderer'

/**
 * Component logic hook for `ContentConfigSection`
 */
export function useContentConfigSection() {
  const context = useProjectSetupDialogContext()
  const selectedKeys = context.state.selectedContentConfig.map((lc) => lc.key)
  const { selection, onSearch, searchTerm } = useSelectionList(selectedKeys, (selection) => {
    context.dispatch(ON_LIST_CONTENT_CONFIG_CHANGED(selection))
  })
  const items = context.props.data.contentConfig.filter((contentConfig) => !contentConfig.hidden)
  const columns = useColumns()
  const onRenderRow = useRowRenderer({ selectedKeys, searchTerm })
  return {
    selection,
    items,
    columns,
    onSearch,
    onRenderRow
  } as const
}
