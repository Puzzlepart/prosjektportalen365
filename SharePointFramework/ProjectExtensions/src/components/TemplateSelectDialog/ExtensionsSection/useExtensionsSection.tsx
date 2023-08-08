import { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { ON_EXTENSIONS_CHANGED } from '../reducer'
import { useSelectionList } from '../useSelectionList'
import { useColumns } from './useColumns'
import { useRowRenderer } from './useRowRenderer'

/**
 * Component logic hook for `ExtensionsSection`
 */
export function useExtensionsSection() {
  const context = useContext(TemplateSelectDialogContext)
  const selectedKeys = context.state.selectedExtensions.map((lc) => lc.key)
  const { selection, onSearch, searchTerm } = useSelectionList(selectedKeys, (selection) => {
    context.dispatch(ON_EXTENSIONS_CHANGED(selection))
  })
  const items = context.props.data.extensions.filter((ext) => !ext.hidden)
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
