import { Selection } from '@fluentui/react'
import { ListContentConfig } from 'models'
import { useContext, useEffect, useState } from 'react'
import { TemplateSelectDialogContext } from '../context'

/**
 * Component logic hook for `ListContentSection`
 */
export function useListContentSection() {
  const context = useContext(TemplateSelectDialogContext)
  const selectedKeys = context.state.selectedListContentConfig.map((lc) => lc.key)
  const [selection, setSelection] = useState<Selection<ListContentConfig>>(
    new Selection({
      onSelectionChanged
    })
  )
  let onSelectionChangedTimeout = null
  function onSelectionChanged() {
    window.clearTimeout(onSelectionChangedTimeout)
    onSelectionChangedTimeout = window.setTimeout(() => {
      const selectedListContentConfig = selection.getSelection()
      if (selectedListContentConfig.map((lc) => lc.key) !== selectedKeys) {
        context.setState({ selectedListContentConfig })
      }
    }, 1000)
  }
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    for (const key in selectedKeys) selection.setKeySelected(key, true, true)
    setSelection(selection)
  }, [context.state.selectedListContentConfig, searchTerm])

  const items = context.props.data.listContentConfig.filter(
    (lcc) => !lcc.hidden && lcc.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
  )

  return { selection, items, onSearch: setSearchTerm } as const
}
