import { useContext } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { useSelectionList } from '../useSelectionList'
import { useColumns } from './useColumns'
import { useRowRenderer } from './useRowRenderer'

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
  const onRenderRow = useRowRenderer({ selectedKeys, searchTerm })
  return { selection, items, columns, onSearch, onRenderRow } as const
}
