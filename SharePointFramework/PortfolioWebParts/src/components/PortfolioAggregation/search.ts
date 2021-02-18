import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { getObjectValue as get } from 'pp365-shared/lib/helpers'

/**
 * Filter item
 *
 * @param {any} item Item
 * @param {string} searchTerm Search term
 * @param {IColumn[]} columns Columns
 */
export const filterItem = (item: any, searchTerm: string, columns: IColumn[]) => {
  searchTerm = searchTerm.toLowerCase()
  const searchObj = columns.reduce((obj, col) => {
    return { ...obj, [col.fieldName]: get(item, col.fieldName, null) }
  }, {})
  return JSON.stringify(searchObj).toLowerCase().indexOf(searchTerm) !== -1
}
