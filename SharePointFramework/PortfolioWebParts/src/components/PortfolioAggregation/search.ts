import { IColumn } from '@fluentui/react/lib/DetailsList'
import { getObjectValue as get } from 'pp365-shared-library/lib/util/getObjectValue'

/**
 * Search item by search term. Search term is matched against all columns,
 * as well as the SiteTitle property (name of the project). Uses `JSON.stringify`
 * to create a string representation of the item, which is then matched against
 * the search term.
 *
 * @param item Item
 * @param searchTerm Search term
 * @param columns Columns
 */
export const searchItem = (item: any, searchTerm: string, columns: IColumn[]) => {
  try {
    const searchObj = columns.reduce(
      (obj, col, index) => {
        return { ...obj, [index]: get(item, col.fieldName, null) }
      },
      {
        [columns.length]: item['SiteTitle']
      } as Record<string, any>
    )
    return JSON.stringify(searchObj).toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
  } catch (error) {
    return false
  }
}
