import { IObjectWithKey, Selection } from '@fluentui/react'
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
  const $selection = new Selection<IObjectWithKey>({
    onSelectionChanged: () => {
      onSelectionChanged(selection.getSelection())
    }
  })
  const [selection, setSelection] = useState<Selection<IObjectWithKey>>($selection)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    $selection.setChangeEvents(false)
    selectedKeys.forEach((key) => $selection.setKeySelected(key as any, true, true))
    $selection.setChangeEvents(true)
    setSelection($selection)
  }, [searchTerm])

  return { selection, onSearch: setSearchTerm, searchTerm } as const
}
