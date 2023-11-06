import { IColumn } from '@fluentui/react/lib/DetailsList'
import { get } from '@microsoft/sp-lodash-subset'
import sortArray from 'array-sort'
import { IFilterProps } from '../FilterPanel/Filter/types'
import { IFilterItemProps } from '../FilterPanel/FilterItem/types'
import strings from 'SharedLibraryStrings'
import { useState } from 'react'
import { ITimelineData } from '../../interfaces'
import { TimelineConfigurationModel } from '../../models'
import { IProjectTimelineProps, IProjectTimelineState } from './types'
import { useProjectTimelineDataFetch } from './useProjectTimelineDataFetch'

/**
 * Component logic hook for `ProjectTimeline`
 *
 * @param props Props
 *
 * @returns `state`, `setState`, `onFilterChange`
 */
export const useProjectTimeline = (props: IProjectTimelineProps) => {
  const [state, $setState] = useState<IProjectTimelineState>({
    loading: true,
    activeFilters: {}
  })

  const setState = (newState: Partial<IProjectTimelineState>) => {
    $setState((_state) => ({ ..._state, ...newState }))
  }

  /**
   * Get filtered data
   *
   * @param data Timeline data
   *
   * @returns `data` filtered by `state.activeFilters`
   */
  const getFilteredData = (data: ITimelineData): ITimelineData => {
    const { activeFilters } = state

    const activeFiltersKeys = Object.keys(activeFilters)
    data.items = sortArray(data.items, 'data.sortOrder')

    const projectId = data.items.find(
      (i) => i.data?.projectUrl === props.pageContext.site.absoluteUrl
    )?.id
    const topGroup = data.groups.find((i) => i.id === projectId)
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
      config.find((item) => item?.title === strings.ProjectLabel).timelineFilter && {
        fieldName: 'project',
        name: strings.SiteTitleLabel,
        isCollapsed: true
      },
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
      const filters = getFilters(state?.timelineConfig, state?.data)
      setState({ filteredData, filters })
    }
  }

  useProjectTimelineDataFetch(props, ($) => {
    if ($.error) setState({ error: $.error, loading: false })
    else {
      const filters = getFilters($.timelineConfig, $.data)
      const filteredData = getFilteredData($.data)
      setState({ ...$, filteredData, filters, loading: false })
    }
  })

  return {
    state,
    setState,
    onFilterChange
  } as const
}
