import { Selection } from '@fluentui/react'
import { ListContentConfig } from 'models'
import { useContext, useEffect, useState } from 'react'
import { TemplateSelectDialogContext } from './context'

/**
 * Component logic hook for selection list
 *
 * @param selectedKeys Selected keys
 */
export function useSelectionList(selectedKeys: string[]) {
  const context = useContext(TemplateSelectDialogContext)
  const __selection = new Selection<ListContentConfig>({
    onSelectionChanged: () => {
      context.setState({ selectedListContentConfig: [...selection.getSelection()] })
    }
  })
  const [selection, setSelection] = useState<Selection<ListContentConfig>>(__selection)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    __selection.setChangeEvents(false)
    selectedKeys.forEach((key) => __selection.setKeySelected(key, true, true))
    __selection.setChangeEvents(true)
    setSelection(__selection)
  }, [searchTerm])

  return { selection, onSearch: setSearchTerm, searchTerm } as const
}
