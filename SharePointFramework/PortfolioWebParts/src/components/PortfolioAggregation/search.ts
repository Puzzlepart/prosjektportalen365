import { IColumn } from '@fluentui/react/lib/DetailsList'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'

/**
 * Search item
 *
 * @param item Item
 * @param searchTerm Search term
 * @param columns Columns
 */
export const searchItem = (item: any, searchTerm: string, columns: IColumn[]) => {
  searchTerm = searchTerm.toLowerCase()
  const searchObj = columns.reduce((obj, col) => {
    return { ...obj, [col.fieldName]: get(item, col.fieldName, null) }
  }, {})
  return JSON.stringify(searchObj).toLowerCase().indexOf(searchTerm) !== -1
}
