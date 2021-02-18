import { IFetchDataForViewItemResult } from 'data/IFetchDataForViewItemResult'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { Link } from 'office-ui-fabric-react/lib/Link'
import { formatDate, tryParseCurrency } from 'pp365-shared/lib/helpers'
import { ProjectColumn } from 'pp365-shared/lib/models'
import React from 'react'
import { IPortfolioOverviewProps } from '../types'
import { IRenderItemColumnProps } from './IRenderItemColumnProps'
import { TagsColumn } from './TagsColumn'
import { UserColumn } from './UserColumn'

/**
 * Mapping for rendering of the different data types
 */
const renderDataTypeMap = {
  user: (props: IRenderItemColumnProps) => <UserColumn {...props} />,
  date: ({ colValue }: IRenderItemColumnProps) => <span>{formatDate(colValue)}</span>,
  currency: ({ colValue }: IRenderItemColumnProps) => <span>{tryParseCurrency(colValue, '')}</span>,
  tags: (props: IRenderItemColumnProps) => <TagsColumn {...props} />
}

/**
 * On render item activeFilters
 *
 * @param {IFetchDataForViewItemResult} item Item
 * @param {ProjectColumn} column Column
 * @param {IPortfolioOverviewProps} props Props
 */
export function renderItemColumn(
  item: IFetchDataForViewItemResult,
  column: ProjectColumn,
  props: IPortfolioOverviewProps
) {
  const colValue = item[column.fieldName]

  if (!colValue) return null

  // eslint-disable-next-line no-console
  console.log({ siteId: props.columnsListName })
  

  // eslint-disable-next-line default-case
  switch (column.fieldName) {
    case 'Title': {
      return (
        <Link href={item.Path} rel='noopener noreferrer' target='_blank'>
          {colValue}
        </Link>
      )
    }
  }

  if (renderDataTypeMap[column.dataType]) {
    return renderDataTypeMap[column.dataType]({ column, colValue })
  }

  const config = column.config ? column.config[colValue] : null
  if (config) {
    return (
      <span>
        <Icon iconName={config.iconName} style={{ color: config.color, marginRight: 4 }} />
        <span>{colValue}</span>
      </span>
    )
  }
  return <span>{colValue}</span>
}
