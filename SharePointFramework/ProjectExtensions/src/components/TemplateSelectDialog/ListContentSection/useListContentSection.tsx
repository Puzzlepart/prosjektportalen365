import { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { useSelectionList } from '../useSelectionList'
import { useColumns } from './useColumns'

export function useListContentSection() {
  const context = useContext(TemplateSelectDialogContext)
  const selectedKeys = context.state.selectedListContentConfig.map((lc) => lc.key)
  const { selection, onSearch, searchTerm } = useSelectionList(
    selectedKeys,
    (selectedListContentConfig) => {
      context.setState({ selectedListContentConfig })
    }
  )
  const items = context.props.data.listContentConfig.filter((lcc) => !lcc.hidden)
  const columns = useColumns()
  return { selection, selectedKeys, items, columns, onSearch, searchTerm } as const
}
