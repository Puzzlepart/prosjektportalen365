import { Selection } from '@fluentui/react'
import { ListContentConfig } from 'models'
import { useContext, useEffect, useMemo, useState } from 'react'
import { TemplateSelectDialogContext } from '../context'

/**
 * Component logic hook for `ListContentSection`
 */
export function useListContentSection() {
  const context = useContext(TemplateSelectDialogContext)
  const selectedKeys = useMemo(() => context.state.selectedListContentConfig.map((lc) => lc.key), [
    context.state.selectedListContentConfig
  ])
  const [selection, setSelection] = useState<Selection<ListContentConfig>>(new Selection())
  const [searchTerm, setSearchTerm] = useState('')
  const [setKey, setSetKey] = useState(new Date().getTime().toString())

  function onSelectionChanged() {
    if (selectedKeys !== selection.getSelection().map((lc) => lc.key)) {
      context.setState({ selectedListContentConfig: selection.getSelection() })
    }
  }

  useEffect(() => {
    const _selection = new Selection<ListContentConfig>({ onSelectionChanged })
    selectedKeys.forEach((key) => _selection.setKeySelected(key, true, true))
    setSelection(_selection)
    setSetKey(new Date().getTime().toString())
  }, [context.state.selectedListContentConfig, searchTerm])

  const items = context.props.data.listContentConfig.filter(
    (lcc) => !lcc.hidden && lcc.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
  )

  return { selection, items, onSearch: setSearchTerm, setKey } as const
}
