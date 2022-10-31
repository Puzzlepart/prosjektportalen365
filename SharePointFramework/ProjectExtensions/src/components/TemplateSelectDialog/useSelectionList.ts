import { Selection } from '@fluentui/react'
import { ContentConfig } from 'models'
import { useEffect, useState } from 'react'

/**
 * Component logic hook for selection list
 *
 * @param selectedKeys Selected keys
 * @param onSelectionChanged On selection changed
 */
export function useSelectionList(
  selectedKeys: (string | number)[],
  onSelectionChanged: (items: any[]) => void
) {
  const __selection = new Selection<any>({
    onSelectionChanged: () => {
      onSelectionChanged(selection.getSelection())
    }
  })
  const [selection, setSelection] = useState<Selection<ContentConfig>>(__selection)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    __selection.setChangeEvents(false)
    selectedKeys.forEach((key) => __selection.setKeySelected(key as any, true, true))
    __selection.setChangeEvents(true)
    setSelection(__selection)
  }, [searchTerm])

  return { selection, onSearch: setSearchTerm, searchTerm } as const
}
