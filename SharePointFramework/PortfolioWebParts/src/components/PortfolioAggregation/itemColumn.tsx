import { stringIsNullOrEmpty } from '@pnp/common'
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { Link } from 'office-ui-fabric-react/lib/Link'
import strings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared/lib/helpers/formatDate'
import { getObjectValue as get } from 'pp365-shared/lib/helpers/getObjectValue'
import React from 'react'

/**
 * Render item column
 *
 * @param {any} item Item
 * @param {number} index Index
 * @param {IColumn} column Column
 */
export const renderItemColumn = (item: any, index: number, column: IColumn) => {
  if (!column.fieldName) return null
  if (column.onRender) return column.onRender(item, index, column)
  if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
    return get(item, column['fieldNameDisplay'], null)
  }
  const value = get(item, column.fieldName, null)
  switch (column?.data?.renderAs) {
    case 'int':
      return value ? parseInt(value) : null
    case 'date':
      return formatDate(value, false)
    case 'datetime':
      return formatDate(value, true)
    default:
      return value
  }
}

export const siteTitleColumn: IColumn = {
  key: 'SiteTitle',
  fieldName: 'SiteTitle',
  name: strings.SiteTitleLabel,
  minWidth: 100,
  maxWidth: 150,
  isResizable: true,
  onRender: (item: any) => {
    return (
      <Link href={item.SPWebURL} rel='noopener noreferrer' target='_blank'>
        {item.SiteTitle}
      </Link>
    )
  },
  data: { isGroupable: true }
}
