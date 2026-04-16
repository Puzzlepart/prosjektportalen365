import React, { useMemo, useState } from 'react'
import { FilterItem } from '../FilterItem/FilterItem'
import { IFilterItemProps } from '../FilterItem/types'
import { IFilterProps, IFilterState } from './types'

export function useFilter(props: IFilterProps) {
  const [state, setState] = useState<IFilterState>({
    isCollapsed: props.defaultCollapsed,
    items: props.items
  })

  /**
   * On change filter item
   *
   * @param item Item that was changed
   * @param checked Item checked
   */
  const onChange = (item: IFilterItemProps, checked: boolean) => {
    const items = state.items.map((i) => {
      if (i.value === item.value) {
        return { ...i, selected: checked }
      }
      return i
    })

    setState((prevState) => ({ ...prevState, items }))
    const selectedItems = items.filter(({ selected }) => selected)
    props.onFilterChange(props.column, selectedItems)
  }

  /**
   * On toggle section content
   */
  const onToggleSectionContent = () => {
    setState((prevState) => ({ ...prevState, isCollapsed: !prevState.isCollapsed }))
  }

  /**
   * Items filtered by search term
   */
  const visibleItems = useMemo(() => {
    if (!props.searchTerm) return state.items
    const term = props.searchTerm.toLowerCase()
    return state.items.filter((item) => item.name.toLowerCase().includes(term))
  }, [state.items, props.searchTerm])

  /**
   * Render filter items
   */
  const renderItems = () => {
    return visibleItems.map((item, idx) => (
      <FilterItem
        key={idx}
        {...item}
        column={props.column}
        onChange={(_event, { checked }) => onChange(item, checked as boolean)}
      />
    ))
  }

  return { state, visibleItems, onToggleSectionContent, renderItems }
}
