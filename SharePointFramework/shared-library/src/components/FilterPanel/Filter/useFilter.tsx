import React, { useState } from 'react'
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
    setState((prevState) => {
      const items = prevState.items.map((i) => {
        if (i.value === item.value) {
          return { ...i, selected: checked }
        }
        return i
      })
      return { ...prevState, items }
    })
    const selectedItems = state.items.filter(({ selected }) => selected)
    props.onFilterChange(props.column, selectedItems)
  }

  /**
   * On toggle section content
   */
  const onToggleSectionContent = () => {
    setState((prevState) => ({ ...prevState, isCollapsed: !prevState.isCollapsed }))
  }

  /**
   * Render filter items
   */
  const renderItems = () => {
    return state.items.map((props, idx) => (
      <FilterItem
        key={idx}
        {...props}
        onChange={(_event, { checked }) => onChange(props, checked as boolean)}
      />
    ))
  }

  return { state, onToggleSectionContent, renderItems }
}
