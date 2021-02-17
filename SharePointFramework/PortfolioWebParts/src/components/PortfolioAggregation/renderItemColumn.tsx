import { stringIsNullOrEmpty } from '@pnp/common'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { formatDate } from 'pp365-shared/lib/helpers/formatDate'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'

/**
 * Render item column
 * 
 * @param {any} item Item
 * @param {number} index Index
 * @param {IColumn} column Column
 */
export const renderItemColumn = (item: any, index: number, column: IColumn) => {
    if (column.onRender) return column.onRender(item, index, column)
    if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
        return get(item, column['fieldNameDisplay'], null)
    }
    const value = get(item, column.fieldName, null)
    switch (column?.data?.renderAs) {
      case 'date': return formatDate(value, false)
      case 'datetime': return formatDate(value, true)
      default: return value
    }
}