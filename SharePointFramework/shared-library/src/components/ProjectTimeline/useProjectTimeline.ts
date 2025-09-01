import { IColumn } from '@fluentui/react/lib/DetailsList'
import { get, uniq } from '@microsoft/sp-lodash-subset'
import sortArray from 'array-sort'
import { IFilterProps } from '../FilterPanel/Filter/types'
import { IFilterItemProps } from '../FilterPanel/FilterItem/types'
import strings from 'SharedLibraryStrings'
import { useState } from 'react'
import { ITimelineData } from '../../interfaces'
import { ProjectColumn, TimelineConfigurationModel } from '../../models'
import { IProjectTimelineProps, IProjectTimelineState } from './types'
import { useProjectTimelineDataFetch } from './useProjectTimelineDataFetch'
import { stringIsNullOrEmpty } from '@pnp/core'

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

    if (projectId) {
      const topGroup = data.groups.find((i) => i.id === projectId)
      data.groups = [topGroup, ...data.groups.filter((grp) => grp?.id !== projectId)].filter(
        (grp) => grp
      )
    }

    if (activeFiltersKeys.length > 0) {
      const items = activeFiltersKeys.reduce(
        (newItems, key) =>
          newItems.filter((i) => {
            const values = get(i, key)?.includes(';') ? get(i, key)?.split(';') : [get(i, key)]
            return values.some((value) => activeFilters[key].includes(value))
          }),
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
    data: ITimelineData,
    refiners: ProjectColumn[]
  ): IFilterProps[] => {
    const columns = [
      { fieldName: 'data.category', name: strings.CategoryFieldLabel },
      { fieldName: 'data.type', name: strings.TypeLabel },
      {
        fieldName: 'data.tag',
        name: strings.TagFieldLabel,
        isCollapsed: true
      },
      config.find((item) => item?.title === strings.ProjectLabel)?.timelineFilter && {
        fieldName: 'data.project',
        name: strings.SiteTitleLabel,
        isCollapsed: true
      },
      ...refiners.map((refiner) => ({
        fieldName: `data.properties.${refiner.internalName}`,
        name: refiner.name,
        isCollapsed: true
      }))
    ].filter(Boolean) as {
      fieldName: string
      name: string
      isCollapsed?: boolean
    }[]

    const hiddenItems = config.filter((item) => !item?.timelineFilter).map((item) => item.title)
    return columns.map((col) => {
      const uniqueValues = uniq(
        // eslint-disable-next-line prefer-spread
        [].concat.apply(
          [],
          data.items
            .filter((item) => !hiddenItems.includes(item.data?.type))
            .map((i) => get(i, col.fieldName, '')?.split(';'))
        )
      )

      let items: IFilterItemProps[] = uniqueValues
        .filter((value: string) => !stringIsNullOrEmpty(value))
        .map((value: string) => {
          const filter = state.activeFilters[col.fieldName]
          const selected = filter ? filter.indexOf(value) !== -1 : false

          const name =
            col.fieldName.includes('GtIsProgram') || col.fieldName.includes('GtIsParentProject')
              ? value === '1'
                ? strings.BooleanYes
                : value === '0'
                ? strings.BooleanNo
                : value
              : value
          return { name: name, value, selected }
        })

      items = items.sort((a, b) => (a.value > b.value ? 1 : -1))

      return {
        column: { key: col.fieldName, minWidth: 0, ...col },
        items: items,
        defaultCollapsed: col.isCollapsed
      }
    })
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
      const filters = getFilters(state?.timelineConfig, state?.data, state?.columns)
      setState({ filteredData, filters })
    }
  }

  useProjectTimelineDataFetch(props, ($) => {
    if ($.error) setState({ error: $.error, loading: false })
    else {
      const filters = getFilters($.timelineConfig, $.data, $.columns)
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
