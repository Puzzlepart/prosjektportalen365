import { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { useSelectionList } from '../useSelectionList'
import { useRowRenderer } from './useRowRenderer'
import { useColumns } from './useColumns'

/**
 * Component logic hook for `ExtensionsSection`
 */
export function useExtensionsSection() {
  const context = useContext(TemplateSelectDialogContext)
  const selectedKeys = context.state.selectedExtensions.map((lc) => lc.key)
  const { selection, onSearch, searchTerm } = useSelectionList(
    selectedKeys,
    (selectedExtensions) => {
      context.setState({ selectedExtensions })
    }
  )
  const items = context.props.data.extensions.filter((ext) => !ext.hidden)
  const columns = useColumns()
  const onRenderRow = useRowRenderer({ selectedKeys, searchTerm })
  return { selection, items, columns, onSearch, onRenderRow } as const
}
