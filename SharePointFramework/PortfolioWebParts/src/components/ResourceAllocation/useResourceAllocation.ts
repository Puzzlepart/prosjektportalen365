import { IColumn } from '@fluentui/react'
import { get } from '@microsoft/sp-lodash-subset'
import moment from 'moment'
import * as strings from 'PortfolioWebPartsStrings'
import { useState } from 'react'
import { IResourceAllocationProps, IResourceAllocationState } from './types'
import { useFilteredData } from './useFilteredData'
import { useResourceAllocationDataFetch } from './useResourceAllocationDataFetch'
import { IFilterItemProps, TimelineTimeframe } from 'pp365-shared-library'

/**
 * Component logic hook for `ResourceAllocation`. Handles
 * state, command bar, filters and data fetching using the
 * `useResourceAllocationDataFetch` and `useFilteredData` hooks.
 *
 * @param props Props for the `ResourceAllocation` component
 *
 * @returns `state`, `setState`, `filters`, `onFilterChange`, `items`, `groups` and `defaultTimeframe`
 */
export const useResourceAllocation = (props: IResourceAllocationProps) => {
  const [state, setState] = useState<IResourceAllocationState>({
    activeFilters: {},
    loading: true,
    data: { items: [], groups: [] }
  })

  const filters = [
    { fieldName: 'data.project', name: strings.SiteTitleLabel },
    { fieldName: 'data.resource', name: strings.ResourceLabel },
    { fieldName: 'data.role', name: strings.RoleLabel }
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
  const onFilterChange = (column: IColumn, selectedItems: IFilterItemProps[]) => {
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
    setState({ ...state, data, loading: false })
  })

  const [sAmount, sDuration] = props.defaultTimeframeStart.split(',')
  const [eAmount, eDuration] = props.defaultTimeframeEnd.split(',')
  const defaultTimeframe: TimelineTimeframe = [
    [-parseInt(sAmount), sDuration as moment.unitOfTime.DurationConstructor],
    [parseInt(eAmount), eDuration as moment.unitOfTime.DurationConstructor]
  ]

  return {
    state,
    setState,
    filters,
    onFilterChange,
    items,
    groups,
    defaultTimeframe
  }
}
