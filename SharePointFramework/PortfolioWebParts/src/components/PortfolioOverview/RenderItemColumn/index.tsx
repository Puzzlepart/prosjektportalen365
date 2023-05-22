import { Link } from '@fluentui/react'
import { Icon } from '@fluentui/react/lib/Icon'
import * as strings from 'PortfolioWebPartsStrings'
import { IFetchDataForViewItemResult } from 'data/types'
import { formatDate, tryParseCurrency } from 'pp365-shared/lib/helpers'
import { ProjectColumn } from 'pp365-shared/lib/models'
import React from 'react'
import { IPortfolioOverviewProps } from '../types'
import { IRenderItemColumnProps } from './IRenderItemColumnProps'
import { TagsColumn } from './TagsColumn'
import { TitleColumn } from './TitleColumn'
import { UserColumn } from './UserColumn'

type RenderDataType = 'user' | 'date' | 'currency' | 'tags' | 'boolean' | 'url'
type RenderFunction = (props: IRenderItemColumnProps) => JSX.Element

/**
 * Mapping for rendering of the different data types.
 */
const renderDataTypeMap: Record<RenderDataType, RenderFunction> = {
  user: (props: IRenderItemColumnProps) => <UserColumn {...props} />,
  date: ({ columnValue: colValue }: IRenderItemColumnProps) => <span>{formatDate(colValue)}</span>,
  currency: ({ columnValue: colValue }: IRenderItemColumnProps) => (
    <span>{tryParseCurrency(colValue)}</span>
  ),
  tags: (props: IRenderItemColumnProps) => <TagsColumn {...props} />,
  boolean: ({ columnValue: colValue }: IRenderItemColumnProps) => (
    <span>{parseInt(colValue) === 1 ? strings.BooleanYes : strings.BooleanNo}</span>
  ),
  url: ({ columnValue: colValue }: IRenderItemColumnProps) => {
    const [url, description] = colValue.split(', ')
    return (
      <Link href={url} target='_blank'>
        {description}
      </Link>
    )
  }
}

/**
 * On render item column function. First checks if the column has a custom render function,
 * if not it will use the default render function. Also the `Title` column has a custom render
 * function by default and can not be overridden.
 *
 * @param item Item to render the value for
 * @param column Column to render the value for
 * @param props Props for the component
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
