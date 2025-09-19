import { IColumn } from '@fluentui/react'
import { get } from '@microsoft/sp-lodash-subset'
import moment from 'moment'
import * as strings from 'PortfolioWebPartsStrings'
import { useState } from 'react'
import { IResourceAllocationProps, IResourceAllocationState } from './types'
import { useFilteredData } from './useFilteredData'
import { useResourceAllocationDataFetch } from './useResourceAllocationDataFetch'
import { IFilterItemProps, TimelineTimeframe } from 'pp365-shared-library'
import { useId } from '@fluentui/react-components'

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

  let resourceNameToUPNs: Record<string, Set<string>> = {};
  if (state.data.items && state.data.items.length > 0) {
    state.data.items.forEach((i) => {
      const resourceDisplay = get(i, 'data.resource');
      if (!resourceDisplay) return;
      const match = resourceDisplay.match(/^(.*?) \(/); // Navn før evt. department
      const displayName = match ? match[1] : resourceDisplay;
      const upn = i.props?.GtResourceUserOWSUSER?.split('|')[0]?.trim();
      if (!resourceNameToUPNs[displayName]) resourceNameToUPNs[displayName] = new Set();
      if (upn) resourceNameToUPNs[displayName].add(upn);
    });
  }

  const filters = [
    { fieldName: 'data.role', name: strings.RoleLabel },
    { fieldName: 'data.department', name: strings.DepartmentLabel },
    { fieldName: 'data.resource', name: strings.ResourceLabel },
    { fieldName: 'data.project', name: strings.SiteTitleLabel }
  ].map((col) => ({
    column: { key: col.fieldName, minWidth: 0, ...col },
    items: state.data.items
      .map<string>((i) => get(i, col.fieldName))
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => {
        const filter = state.activeFilters[col.fieldName]
        const selected = filter ? filter.indexOf(name) !== -1 : false
        let displayName = name
        if (col.fieldName === 'data.resource' && name) {
          const match = name.match(/^(.*?) \(/); // Navn før evt. department
          const baseName = match ? match[1] : name
          const upns = resourceNameToUPNs[baseName]
          if (upns && upns.size > 1) {
            const item = state.data.items.find((i) => get(i, 'data.resource') === name);
            const upn = item?.props?.GtResourceUserOWSUSER?.split('|')[0]?.trim();
            displayName = upn ? `${baseName} (${upn})` : baseName;
          } else {
            displayName = baseName
          }
        }
        return { name: displayName, value: name, selected }
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

  const fluentProviderId = useId('fp-resource-allocation')

  return {
    state,
    setState,
    filters,
    onFilterChange,
    items,
    groups,
    defaultTimeframe,
    fluentProviderId
  }
}
