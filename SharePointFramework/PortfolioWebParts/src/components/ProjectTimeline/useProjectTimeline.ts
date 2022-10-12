import { useState } from 'react'
import { IProjectTimelineProps, IProjectTimelineState } from './types'
import { useProjectTimelineDataFetch } from './useProjectTimelineDataFetch'
import { ITimelineData, ITimelineGroup, ITimelineItem } from 'interfaces'
import sortArray from 'array-sort'
import { get } from '@microsoft/sp-lodash-subset'
import { IFilterProps } from 'components/FilterPanel/Filter/types'
import strings from 'PortfolioWebPartsStrings'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { IFilterItemProps } from 'components/FilterPanel/FilterItem/types'
import { TimelineConfigurationListModel } from 'models'

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

    const projectId = data.items.find((i) => i?.projectUrl === props.pageContext.site.absoluteUrl)
      ?.id
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
  const getFilters = (
    config: TimelineConfigurationListModel[],
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
      const filters = getFilters(state?.timelineConfiguration, state?.data)
      setState({ filteredData, filters })
    }
  }

  const onGroupChange = (group) => {
    let selectedGroup: ITimelineGroup[] = []
    let updatedItems: ITimelineItem[] = []

    if (state?.data?.items) {
      switch (group) {
        case strings.CategoryFieldLabel:
          {
            selectedGroup = state.groups.categoryGroup
            updatedItems = state.data.items.map((item) => {
              return {
                ...item,
                group: selectedGroup.find((g) => g.title === item.data.category).id
              }
            })
          }
          break
        case strings.TypeLabel:
          {
            selectedGroup = state.groups.typeGroup
            updatedItems = state.data.items.map((item) => {
              return {
                ...item,
                group: selectedGroup.find((g) => g.title === item.data.type).id
              }
            })
          }
          break
        default:
          {
            selectedGroup = state.groups.projectGroup
            updatedItems = state.data.items.map((item) => {
              return {
                ...item,
                group: selectedGroup.find((g) => g.title === item.project).id
              }
            })
          }
          break
      }
    }

    const filteredData = getFilteredData({ items: updatedItems, groups: selectedGroup })

    setState({
      data: { items: updatedItems, groups: selectedGroup },
      filteredData
    })
  }

  useProjectTimelineDataFetch(props, (data) => {
    if (data.error) setState({ error: data.error, loading: false })
    else {
      const filters = getFilters(data.timelineConfiguration, data.data)
      const filteredData = getFilteredData(data.data)
      setState({ ...data, filteredData, filters, loading: false })
    }
  })

  return {
    state,
    setState,
    onFilterChange,
    onGroupChange
  }
}
