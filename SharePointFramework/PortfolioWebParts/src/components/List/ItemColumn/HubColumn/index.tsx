import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import { IHubColumnProps } from './types'

/**
 * HubColumn - Displays the hub title for items in merged view.
 * Shows the source hub title from the _hubTitle metadata field added during merged view data fetching.
 *
 * @param props - Column render props containing the item data
 * @returns The hub title as a span element, or empty string if not available
 */
export const HubColumn: ColumnRenderComponent<IHubColumnProps> = (props) => {
  const hubTitle = props.item?._hubTitle || ''
  return <span>{hubTitle}</span>
}

HubColumn.key = 'hub'
HubColumn.id = 'Hub'
HubColumn.displayName = strings.ColumnRenderOptionHub
HubColumn.iconName = 'CityNext2'
