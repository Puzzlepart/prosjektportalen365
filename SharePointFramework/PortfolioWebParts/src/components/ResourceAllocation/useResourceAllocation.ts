import { ContextualMenuItemType, getId, IColumn, ICommandBarProps } from '@fluentui/react'
import { get } from '@microsoft/sp-lodash-subset'
import moment from 'moment'
import * as strings from 'PortfolioWebPartsStrings'
import { useState } from 'react'
import { IResourceAllocationProps, IResourceAllocationState } from './types'
import { useFilteredData } from './useFilteredData'
import { useResourceAllocationDataFetch } from './useResourceAllocationDataFetch'
import { IFilterItemProps } from 'pp365-shared-library/lib/components/FilterPanel'

/**
 * Component logic hook for `<ResourceAllocation />`. Handles
 * state, command bar, filters and data fetching using the
 * `useResourceAllocationDataFetch` and `useFilteredData` hooks.
 *
 * @param props Props for the `<ResourceAllocation />` component
 * @returns
 */
export function useResourceAllocation(props: IResourceAllocationProps) {
  moment.locale('nb')
  const [state, setState] = useState<IResourceAllocationState>({
    activeFilters: {},
    data: { items: [], groups: [] }
  })
  const commandBar: ICommandBarProps = { items: [], farItems: [] }
  commandBar.farItems.push({
    key: getId('Filter'),
    name: strings.FilterText,
    iconProps: { iconName: 'Filter' },
    itemType: ContextualMenuItemType.Header,
    iconOnly: true,
    onClick: (ev) => {
      ev.preventDefault()
      setState({ ...state, showFilterPanel: true })
    }
  })

  const filters = [
    { fieldName: 'project', name: strings.SiteTitleLabel },
    { fieldName: 'resource', name: strings.ResourceLabel },
    { fieldName: 'role', name: strings.RoleLabel }
  ].map((col) => ({
    column: { key: col.fieldName, minWidth: 0, ...col },
    items: state.data.items
      .map<string>((i) => get(i, col.fieldName))
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => {
        const filter = state.activeFilters[col.fieldName]
        const selected = filter ? filter.indexOf(name) !== -1 : false
        return { name, value: name, selected }
      })
  }))

  /**
   * On filter change
   *
   * @param column Column
   * @param selectedItems Selected items
   */
  function onFilterChange(column: IColumn, selectedItems: IFilterItemProps[]) {
    const { activeFilters } = { ...state } as IResourceAllocationState
    if (selectedItems.length > 0) {
      activeFilters[column.fieldName] = selectedItems.map((i) => i.value)
    } else {
      delete activeFilters[column.fieldName]
    }
    setState({ ...state, activeFilters })
  }

  const { items, groups } = useFilteredData(state)

  useResourceAllocationDataFetch(props, (data) => {
    setState({ ...state, data, isDataLoaded: true })
  })

  return {
    state,
    setState,
    commandBar,
    filters,
    onFilterChange,
    items,
    groups
  } as const
}
