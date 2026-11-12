import { IFilterProps, IListColumn } from 'pp365-shared-library'
import { IDynamicListData } from '../types'
import { get } from '@microsoft/sp-lodash-subset'
import _ from 'lodash'

/**
 * Exclusive distinct-value limit, keeping generated filters small enough to use.
 */
const MAX_FILTER_VALUES = 100

/** Builds Norwegian-sorted filters for eligible columns with 2–99 distinct non-empty values. */
export function generateFilters(
  data: IDynamicListData,
  nonFilterableColumns?: string[]
): IFilterProps[] {
  if (!data?.listItems?.length || !data?.listColumns?.length) {
    return []
  }

  const filters: IFilterProps[] = []

  const filterableColumns = data.listColumns.filter((column) => {
    const fieldName = column.fieldName || column.key

    if (nonFilterableColumns && nonFilterableColumns.includes(fieldName)) {
      return false
    }

    if (['ID', 'Modified', 'Created', 'Author', 'Editor'].includes(fieldName)) {
      return false
    }

    if (fieldName.includes('Description') || fieldName.includes('Notes')) {
      return false
    }

    return true
  })

  filterableColumns.forEach((column) => {
    const fieldName = column.fieldName || column.key

    const allValues = _.flatten(
      data.listItems.map((item) => {
        const value = get(item, fieldName, '')
        if (typeof value === 'string' && value.includes(';#')) {
          // A lookup holds "id;#name" pairs (several for a multi-lookup); each pair is kept whole so
          // the name can be read below.
          const parts = value.split(';#')
          const pairs: string[] = []
          for (let i = 0; i + 1 < parts.length; i += 2) pairs.push(`${parts[i]};#${parts[i + 1]}`)
          return pairs
        }
        if (typeof value === 'string' && value.includes(';')) {
          return value.split(';')
        }
        return value
      })
    )

    const uniqueValues = _.uniq(allValues).filter((value) => {
      if (value === null || value === undefined || value === '') return false
      if (typeof value === 'string' && value.trim() === '') return false
      return true
    })

    if (uniqueValues.length > 1 && uniqueValues.length < MAX_FILTER_VALUES) {
      const sortedValues = uniqueValues.sort((a, b) => {
        const aStr = String(a)
        const bStr = String(b)
        return aStr.localeCompare(bStr, 'nb-NO')
      })

      const filterItems = sortedValues.map((value) => {
        let displayValue = String(value)

        if (fieldName.includes('OWSUSER') || displayValue.includes('|')) {
          const match = displayValue.match(/\|([^|]+)\|/)
          displayValue = match ? match[1].trim() : displayValue
        }

        if (displayValue.includes(';#')) {
          displayValue = displayValue.split(';#')[1] || displayValue
        }

        return {
          name: displayValue,
          value: String(value),
          selected: false
        }
      })

      filters.push({
        // Forward only `dataType` (e.g. data type `Tags`) to the FilterPanel so
        // taxonomy/Tags fields can render as a hierarchy. We intentionally do
        // NOT forward the full `data` object: `renderAs` is only set for
        // columns that have a match in the column configuration, so forwarding
        // it would label those boolean filters `Ja`/`Nei` while the ones
        // derived from the SharePoint field alone keep their raw value. It also
        // carries `termSetId`, which decides hierarchy rendering.
        column: {
          key: column.key,
          fieldName,
          name: column.name,
          minWidth: column.minWidth,
          dataType: (column as any).dataType
        } as IListColumn,
        items: filterItems
      })
    }
  })

  return filters
}
