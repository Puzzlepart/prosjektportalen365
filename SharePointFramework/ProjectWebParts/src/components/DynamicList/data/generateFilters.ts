import { IFilterProps } from 'pp365-shared-library'
import { IDynamicListData } from '../types'
import { get } from '@microsoft/sp-lodash-subset'
import _ from 'lodash'

/**
 * Maximum number of unique values allowed for a filter to be generated.
 * Prevents overwhelming the UI with too many filter options.
 */
const MAX_FILTER_VALUES = 100

/**
 * Generates filters from list data by extracting unique values from each column.
 *
 * This function creates filter configurations for columns that would benefit from filtering,
 * while skipping certain column types that don't make sense to filter (like ID, Modified,
 * Created, Author, Editor, and long text fields like Description or Notes).
 *
 * The process includes:
 * 1. Filtering to only include filterable columns (excluding metadata and long text)
 * 2. Extracting all values for each column, handling multi-value fields (Person, Choice with
 *    multiple selections) by splitting on semicolons
 * 3. Getting unique non-empty values and filtering to only those with multiple unique values
 *    (no point filtering with only 1 value) and less than 100 values (to avoid overwhelming UI)
 * 4. Sorting values alphabetically using Norwegian locale
 * 5. Formatting display values by parsing special SharePoint formats:
 *    - User fields: ID;#Name or Name|email|ID format
 *    - Lookup values: ID;#Value format
 *
 * @param data - The list data containing items and columns
 * @param nonFilterableColumns - Array of column internal names that should not be filterable
 * @returns Array of filter configurations with parsed and formatted values
 */
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
        if (typeof value === 'string' && value.includes(';')) {
          return value.split(';')
        }
        return value
      })
    )

    const uniqueValues = _.uniq(allValues).filter((value) => {
      if (value == null || value === '') return false
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
