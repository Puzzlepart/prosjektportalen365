import { Icon } from '@fluentui/react/lib/Icon'
import { formatDate, tryParseCurrency } from 'pp365-shared/lib/helpers'
import { ProjectColumn } from 'pp365-shared/lib/models'
import React from 'react'
import { IPortfolioOverviewProps } from '../types'
import { TitleColumn } from './TitleColumn'
import { IRenderItemColumnProps } from './IRenderItemColumnProps'
import { TagsColumn } from './TagsColumn'
import { UserColumn } from './UserColumn'
import * as strings from 'PortfolioWebPartsStrings'
import { IFetchDataForViewItemResult } from 'data/types'

/**
 * Mapping for rendering of the different data types
 */
const renderDataTypeMap = {
  user: (props: IRenderItemColumnProps) => <UserColumn {...props} />,
  date: ({ columnValue: colValue }: IRenderItemColumnProps) => <span>{formatDate(colValue)}</span>,
  currency: ({ columnValue: colValue }: IRenderItemColumnProps) => (
    <span>{tryParseCurrency(colValue)}</span>
  ),
  tags: (props: IRenderItemColumnProps) => <TagsColumn {...props} />,
  boolean: ({ columnValue: colValue }: IRenderItemColumnProps) => (
    <span>{parseInt(colValue) === 1 ? strings.BooleanYes : strings.BooleanNo}</span>
  )
}

/**
 * On render item activeFilters
 *
 * @param item Item
 * @param column Column
 * @param props Props
 */
export function renderItemColumn(
  item: IFetchDataForViewItemResult,
  column: ProjectColumn,
  props: IPortfolioOverviewProps
) {
  const columnValue = item[column.fieldName]
  if (!columnValue) return null

  switch (column.fieldName) {
    case 'Title': {
      return <TitleColumn props={props} item={item} />
    }
  }

  if (renderDataTypeMap[column.dataType]) {
    return renderDataTypeMap[column.dataType]({ column, columnValue })
  }

  const config = column.config ? column.config[columnValue] : null
  if (config) {
    return (
      <span>
        <Icon iconName={config.iconName} style={{ color: config.color, marginRight: 4 }} />
        <span>{columnValue}</span>
      </span>
    )
  }
  return <span>{columnValue}</span>
}
