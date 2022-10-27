import { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { useSelectionList } from '../useSelectionList'
import { useColumns } from './useColumns'

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
  return { selection, selectedKeys, items, columns, onSearch, searchTerm } as const
}
