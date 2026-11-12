import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from 'pp365-shared-library'
import { IHubColumnProps } from './types'

/**
 * Show the source hub title from a merged portfolio row, or an empty span.
 */
export const HubColumn: ColumnRenderComponent<IHubColumnProps> = (props) => {
  const hubTitle = props.item?._hubTitle || ''
  return <span>{hubTitle}</span>
}

HubColumn.key = 'hub'
HubColumn.id = 'Hub'
HubColumn.displayName = strings.ColumnRenderOptionHub
HubColumn.iconName = 'CityNext2'
