import { Web } from '@pnp/sp'
import { IFetchDataForViewItemResult } from 'data/IFetchDataForViewItemResult'
import { Icon } from 'office-ui-fabric-react/lib/Icon'
import { Link } from 'office-ui-fabric-react/lib/Link'
import { ProjectInformationTooltip } from 'pp365-projectwebparts/lib/components/ProjectInformationTooltip'
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
  date: ({ columnValue: colValue }: IRenderItemColumnProps) => <span>{formatDate(colValue)}</span>,
  currency: ({ columnValue: colValue }: IRenderItemColumnProps) => (
    <span>{tryParseCurrency(colValue, '')}</span>
  ),
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
  const columnValue = item[column.fieldName]
  if (!columnValue) return null

  switch (column.fieldName) {
    case 'Title': {
      if (item.Path) {
        return (
          <ProjectInformationTooltip
            key={item.SiteId}
            title={item.Title}
            siteId={item.SiteId}
            webUrl={item.Path}
            hubSite={{
              web: new Web(props.pageContext.site.absoluteUrl),
              url: props.pageContext.site.absoluteUrl
            }}
            page='Portfolio'>
            <Link href={item.Path} rel='noopener noreferrer' target='_blank'>
              {columnValue}
            </Link>
          </ProjectInformationTooltip>
        )
      }
      return columnValue
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
