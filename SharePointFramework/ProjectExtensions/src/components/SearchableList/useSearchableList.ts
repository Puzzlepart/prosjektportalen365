import { IDetailsRowProps, Selection } from '@fluentui/react'
import { ListContentConfig } from 'models'
import { useEffect, useState } from 'react'
import { ISearchableListProps } from './types'

/**
 * Component logic hook for `SearchableList`
 *
 * @param props Props
 */
export function useSearchableList(props: ISearchableListProps) {
  const __selection = new Selection<ListContentConfig>({
    onSelectionChanged: () => {
      props.onSelectionChanged(selection.getSelection())
    }
  })
  const [selection, setSelection] = useState<Selection<ListContentConfig>>(__selection)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    __selection.setChangeEvents(false)
    props.selectedKeys.forEach((key) => __selection.setKeySelected(key, true, true))
    __selection.setChangeEvents(true)
    setSelection(__selection)
  }, [searchTerm])

  function onRenderRow(
    props: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) {
    if (props.item.text.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) return null
    return defaultRender(props)
  }

  return { selection, onSearch: setSearchTerm, onRenderRow } as const
}
