import { IFilterProps } from 'pp365-shared-library'
import { IDynamicListData } from '../types'
import { get } from '@microsoft/sp-lodash-subset'
import _ from 'lodash'

/**
 * Generates filters from list data by extracting unique values from each column
 *
 * @param data - The list data containing items and columns
 * @returns Array of filter configurations
 */
export function generateFilters(data: IDynamicListData): IFilterProps[] {
  if (!data?.listItems?.length || !data?.listColumns?.length) {
    return []
  }

  const filters: IFilterProps[] = []

  // Generate filters for columns that would benefit from filtering
  // Skip certain column types that don't make sense to filter
  const filterableColumns = data.listColumns.filter((column) => {
    const fieldName = column.fieldName || column.key

    // Skip ID, Modified, Created, and other metadata columns
    if (['ID', 'Modified', 'Created', 'Author', 'Editor'].includes(fieldName)) {
      return false
    }

    // Skip very long text fields
    if (fieldName.includes('Description') || fieldName.includes('Notes')) {
      return false
    }

    return true
  })

  filterableColumns.forEach((column) => {
    const fieldName = column.fieldName || column.key

    // Extract all values for this column (handle multi-value fields with semicolons)
    const allValues = _.flatten(
      data.listItems.map((item) => {
        const value = get(item, fieldName, '')
        // Handle multi-value fields (Person, Choice with multiple selections)
        if (typeof value === 'string' && value.includes(';')) {
          return value.split(';')
        }
        return value
      })
    )

    // Get unique non-empty values
    const uniqueValues = _.uniq(allValues).filter((value) => {
      if (value == null || value === '') return false
      if (typeof value === 'string' && value.trim() === '') return false
      return true
    })

    // Only create filter if there are multiple unique values (no point filtering with 1 value)
    if (uniqueValues.length > 1 && uniqueValues.length < 100) {
      // Sort values
      const sortedValues = uniqueValues.sort((a, b) => {
        const aStr = String(a)
        const bStr = String(b)
        return aStr.localeCompare(bStr, 'nb-NO')
      })

      const filterItems = sortedValues.map((value) => {
        let displayValue = String(value)

        // Handle user fields (format: ID;#Name or Name|email|ID)
        if (fieldName.includes('OWSUSER') || displayValue.includes('|')) {
          const match = displayValue.match(/\|([^|]+)\|/)
          displayValue = match ? match[1].trim() : displayValue
        }

        // Handle lookup values (format: ID;#Value)
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
        column: {
          key: column.key,
          fieldName: fieldName,
          name: column.name,
          minWidth: column.minWidth
        },
        items: filterItems
      })
    }
  })

  return filters
}
