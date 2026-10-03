import strings from 'PortfolioWebPartsStrings'
import { ProjectContentColumn } from 'pp365-shared-library/lib/models/ProjectContentColumn'
import { parseTaxonomyValue } from 'pp365-shared-library/lib/util'
import { getObjectValue as get } from 'pp365-shared-library/lib/util/getObjectValue'
import { IListGroup } from '../List'

/**
 * Parses a raw SharePoint field value into a display-friendly string.
 * Handles user fields (pipe-separated), lookup fields (`;#`-separated),
 * calculated/number fields (e.g. `#10.0000000000000` or `2.00000000000000`),
 * and returns the value as-is for other types.
 *
 * @param value Raw field value
 */
export function parseDisplayValue(value: string): string {
  if (!value) return value
  if (value.includes(' | ')) {
    const match = value.match(/\|([^|]+)\|/)
    if (match) return match[1].trim()
    return value.split(' | ')[1]?.trim() || value
  }
  if (value.includes('L0|#')) {
    return parseTaxonomyValue(value)
  }
  if (value.includes(';#')) {
    const tail = value.split(';#')[1] || value
    return tail.includes('|') ? tail.split('|')[0] : tail
  }
  const numericMatch = value.match(/^#?(-?\d+(?:\.\d+)?)$/)
  if (numericMatch) {
    const num = parseFloat(numericMatch[1])
    if (!isNaN(num))
      return Number.isInteger(num) ? num.toString() : parseFloat(num.toFixed(2)).toString()
  }
  return value
}

/**
 * Groups the items the list shows by the group column: one group per run of equal values, which
 * is one group per value, since the reducer sorts the items by the column when it groups by it.
 * Made from the items after search and filters, so a group's rows are the rows shown; groups made
 * from all items put the rows under the wrong groups as soon as a search or a filter left some out.
 *
 * @param items The items the list shows, in order
 * @param groupBy The column to group by; without one, the list is not grouped
 */
export function createGroups(
  items: Record<string, any>[],
  groupBy?: ProjectContentColumn
): IListGroup[] | undefined {
  if (!groupBy) return undefined
  const groups: IListGroup[] = []
  let previousValue: string
  items.forEach((item, index) => {
    const value = get<string>(item, groupBy.fieldName, strings.NotSet)
    if (groups.length > 0 && value === previousValue) {
      groups[groups.length - 1].count++
      return
    }
    groups.push({
      key: `Group_${groups.length}`,
      name: `${groupBy.name}: ${parseDisplayValue(value)}`,
      startIndex: index,
      count: 1
    })
    previousValue = value
  })
  return groups
}
