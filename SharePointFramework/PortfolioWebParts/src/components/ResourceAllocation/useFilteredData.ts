import _ from 'lodash'
import { IResourceAllocationState } from './types'
import { ITimelineData } from 'pp365-shared-library/lib/interfaces'

/**
 * Get filtered data
 */
export const useFilteredData = (state: IResourceAllocationState): ITimelineData => {
  const { activeFilters, data } = { ...state } as IResourceAllocationState
  const activeFiltersKeys = Object.keys(activeFilters)
  if (!_.isEmpty(activeFiltersKeys)) {
    const items = activeFiltersKeys.reduce(
      (newItems, key) => newItems.filter((i) => activeFilters[key].indexOf(_.get(i, key)) !== -1),
      data.items
    )
    const groups = data.groups.filter((grp) => items.filter((i) => i.group === grp.id).length > 0)
    return { items, groups }
  } else {
    return data
  }
}
