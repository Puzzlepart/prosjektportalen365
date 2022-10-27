import { SelectionMode } from '@fluentui/react'
import { uniqBy } from '@microsoft/sp-lodash-subset'
import { useEffect, useState, ChangeEvent } from 'react'
import { IListField, IProjectTableProps } from './types'

/**
 * Component logic hook for `ProjectTable`
 * 
 * @param props Props
 */
export function useProjectTable(props: IProjectTableProps) {
  const [items, setItems] = useState<any[]>([])
  const [selection, setSelection] = useState<any[]>([])

  useEffect(() => setItems(props.items), [props.items])
  useEffect(() => props.onSelectionChanged(selection), [selection])

  const handleItemClicked = (item: any, selecting: boolean) => {
    if (props.selectionMode === SelectionMode.none) return
    let newSelection: any[] = null
    if (selecting) {
      switch (props.selectionMode) {
        case SelectionMode.single: {
          newSelection = [item]
          break
        }
        case SelectionMode.multiple: {
          newSelection = [...selection, item]
          break
        }
      }
    } else {
      newSelection = [...selection.filter((selectedItem: any): boolean => selectedItem !== item)]
    }
    if (newSelection) {
      setSelection(newSelection)
    }
  }

  const handleHeaderCheckboxClicked = (selecting: boolean) => {
    if (props.selectionMode === SelectionMode.none) return
    let newSelection: any[] = null
    if (selecting) {
      switch (props.selectionMode) {
        case SelectionMode.multiple: {
          newSelection = [...props.items]
          break
        }
      }
    } else {
      newSelection = []
    }
    if (newSelection) {
      setSelection(newSelection)
    }
  }

  const handleFilterChanged = (_: ChangeEvent<HTMLInputElement>, filter: string) => {
    const filtered: any[] = props.items.filter((item: any): boolean =>
      props.fields
        .map((field: IListField): string => field.fieldName)
        .some(
          (key: string): boolean =>
            key in item && (item[key] + '').toLowerCase().indexOf(filter) >= 0
        )
    )
    setItems(uniqBy([...(selection ?? []), ...filtered], (item) => item.SiteId))
  }

  return {
    items,
    handleItemClicked,
    handleHeaderCheckboxClicked,
    handleFilterChanged,
    selection
  } as const
}
