import { useState } from 'react'
import {
  IProjectTimelineProps,
  IProjectTimelineState,
  ITimelineData,
  ITimelineGroup
} from './types'
import { useProjectTimelineDataFetch } from './data/useProjectTimelineDataFetch'
import sortArray from 'array-sort'
import { get } from '@microsoft/sp-lodash-subset'
import { IColumn } from '@fluentui/react/lib/DetailsList'
import { TimelineConfigurationModel } from 'pp365-shared-library/lib/models'
import {
  IFilterItemProps,
  IFilterProps,
  TimelineTimeframe
} from 'pp365-shared-library/lib/components'
import strings from 'ProjectWebPartsStrings'
import moment from 'moment'
import { ITimelineItem } from 'pp365-shared-library/lib/interfaces'

/**
 * Component logic hook for `ProjectTimeline`
 *
 * @param props Props
 *
 * @returns `state`, `setState`, `onFilterChange`
 */
export const useProjectTimeline = (props: IProjectTimelineProps) => {
  const [state, $setState] = useState<IProjectTimelineState>({
    isDataLoaded: false,
    activeFilters: {},
    refetch: new Date().getTime()
  })

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
   *
   * @param config Timeline configuration
   * @param data Timeline data
   *
   * @returns `filters` for `FilterPanel`
   */
  const getFilters = (
    config: TimelineConfigurationModel[],
    data: ITimelineData
  ): IFilterProps[] => {
    const columns = [
      { fieldName: 'data.category', name: strings.CategoryFieldLabel },
      { fieldName: 'data.type', name: strings.TypeLabel },
      { fieldName: 'data.tag', name: strings.TagFieldLabel }
    ]
    const hiddenItems = config.filter((item) => !item?.timelineFilter).map((item) => item.title)

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
        })
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
      const filters = getFilters(state?.timelineConfig, state?.data)
      setState({ filteredData, filters })
    }
  }

  /**
   * On group by change
   *
   * @param groupBy Group by
   */
  const onGroupByChange = (groupBy: string) => {
    let selectedGroup: ITimelineGroup[] = []
    let updatedItems: ITimelineItem[] = []

    if (state?.data?.items) {
      switch (groupBy) {
        case strings.CategoryFieldLabel:
          {
            selectedGroup = state.groups.categoryGroups
            updatedItems = state.data.items.map((item) => ({
              ...item,
              group: selectedGroup.find((g) => g.title === item.data.category)?.id
            }))
          }
          break
        case strings.TypeLabel:
          {
            selectedGroup = state.groups.typeGroups
            updatedItems = state.data.items.map((item) => ({
              ...item,
              group: selectedGroup.find((g) => g.title === item.data.type)?.id
            }))
          }
          break
        default:
          {
            selectedGroup = state.groups.projectGroups
            updatedItems = state.data.items.map((item) => ({
              ...item,
              group: selectedGroup.find((g) => g.title === item.data?.project)?.id
            }))
          }
          break
      }
    }

    const filteredData = getFilteredData({ items: updatedItems, groups: selectedGroup })

    setState({
      data: { ...state.data, items: updatedItems, groups: selectedGroup },
      filteredData
    })
  }

  useProjectTimelineDataFetch(props, state.refetch, ($) => {
    if ($.error) setState({ error: $.error, isDataLoaded: true })
    else {
      const filters = getFilters($.timelineConfig, $.data)
      const filteredData = getFilteredData($.data)
      setState({ ...$, filteredData, filters, isDataLoaded: true })
    }
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
    onFilterChange,
    onGroupByChange,
    defaultTimeframe
  } as const
}
