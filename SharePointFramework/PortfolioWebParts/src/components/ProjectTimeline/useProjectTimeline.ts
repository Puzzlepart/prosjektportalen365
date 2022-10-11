import { useState } from 'react'
import {
  IProjectTimelineProps,
  IProjectTimelineState
} from './types'
import { useProjectTimelineDataFetch } from './useProjectTimelineDataFetch'
import { ITimelineData } from 'interfaces'
import sortArray from 'array-sort'
import { get } from '@microsoft/sp-lodash-subset'
import { IFilterProps } from 'components/FilterPanel/Filter/types'
import strings from 'PortfolioWebPartsStrings'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { IFilterItemProps } from 'components/FilterPanel/FilterItem/types'

/**
 * Component logic hook for `ProjectTimeline`
 *
 * @param props Props
 * @returns `state`, `setState`, `onFilterChange`
 */
export const useProjectTimeline = (props: IProjectTimelineProps) => {
  const [state, $setState] = useState<IProjectTimelineState>({ loading: true, activeFilters: {} })

  const setState = (newState: Partial<IProjectTimelineState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }

  /**
   * Get filtered data
   * @param data Timeline data
   * @returns `data` filtered by `state.activeFilters`
   */
  const getFilteredData = (data: ITimelineData): ITimelineData => {
    const { activeFilters } = state

    const activeFiltersKeys = Object.keys(activeFilters)
    data.items = sortArray(data.items, 'data.sortOrder')

    const projectId = data.items.find(
      (i) => i?.projectUrl === props.pageContext.site.absoluteUrl
    )?.id
    const topGroup = data.groups.find((i) => i?.id === projectId)
    projectId &&
      (data.groups = [topGroup, ...data.groups.filter((grp) => grp?.id !== projectId)].filter(
        (grp) => grp
      ))

    if (activeFiltersKeys.length > 0) {
      const items = activeFiltersKeys.reduce(
        (newItems, key) => newItems.filter((i) => activeFilters[key].indexOf(get(i, key)) !== -1),
        data.items
      )
      const groups = data.groups.filter((grp) => items.filter((i) => i.group === grp.id).length > 0)
      return { items, groups }
    } else {
      return data
    }
  }

  /**
   * Get filters
   * @param config Timeline configuration
   * @param data Timeline data
   * @returns `filters` for `FilterPanel`
   */
  const getFilters = (config: any, data: ITimelineData): IFilterProps[] => {
    const columns = [
      config.find((item: { Title: string }) => item?.Title === strings.ProjectLabel).GtTimelineFilter && {
        fieldName: 'project',
        name: strings.SiteTitleLabel,
        isCollapsed: true
      },
      { fieldName: 'data.type', name: strings.TypeLabel },
      { fieldName: 'data.tag', name: strings.TagFieldLabel }
    ]
    const hiddenItems = config.filter((item: { GtTimelineFilter: any }) => !item?.GtTimelineFilter).map((item: { Title: any }) => item.Title)

    return columns.map((col) => ({
      column: { key: col.fieldName, minWidth: 0, ...col },
      items: data.items
        .filter((item) => !hiddenItems.includes(item.data?.type))
        .map((i) => get(i, col.fieldName))
        .filter((value, index, self) => value && self.indexOf(value) === index)
        .map((name) => {
          const filter = state.activeFilters[col.fieldName]
          const selected = filter ? filter.indexOf(name) !== -1 : false
          return { name, value: name, selected }
        }),
      defaultCollapsed: col.isCollapsed
    }))
  }

  /**
   * On filter change
   *
   * @param column Column
   * @param selectedItems Selected items
   */
  const onFilterChange = (column: IColumn, selectedItems: IFilterItemProps[]) => {
    const { activeFilters } = state

    if (selectedItems.length > 0) {
      activeFilters[column.fieldName] = selectedItems.map((i) => i.value)
    } else {
      delete activeFilters[column.fieldName]
    }

    setState({ activeFilters })
    if (state?.data?.items) {
      const filteredData = getFilteredData(state?.data)
      const filters = getFilters(state?.timelineConfiguration, state?.data)
      setState({ filteredData, filters })
    }
  }

  useProjectTimelineDataFetch(props, (data) => {
    if (data.error)
      setState({ error: data.error, loading: false })
    else {
      const filters = getFilters(data.timelineConfiguration, data.data)
      const filteredData = getFilteredData(data.data)
      setState({ ...data, filteredData, filters, loading: false })
    }
  })

  return {
    state,
    setState,
    onFilterChange
  }
}
