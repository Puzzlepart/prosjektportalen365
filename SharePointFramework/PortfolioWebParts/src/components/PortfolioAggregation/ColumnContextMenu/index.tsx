import { ContextualMenu } from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC, useContext } from 'react'
import { PortfolioAggregationContext } from '../context'
import { COLUMN_HEADER_CONTEXT_MENU } from '../reducer'
import { useColumnContextMenu } from './useColumnContextMenu'

export const ColumnContextMenu: FC = () => {
  const { state, dispatch } = useContext(PortfolioAggregationContext)
  const { target, column, addColumnItems, items } = useColumnContextMenu()
  if (!state.columnContextMenu) return null
  return (
    <ContextualMenu
      target={target}
      items={column.name === strings.AddColumnText ? addColumnItems : items}
      onDismiss={() => dispatch(COLUMN_HEADER_CONTEXT_MENU(null))}
    />
  )
}
