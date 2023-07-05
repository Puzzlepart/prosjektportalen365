import { ContextualMenu } from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { PortfolioAggregationContext } from '../context'
import { COLUMN_HEADER_CONTEXT_MENU } from '../reducer'
import { useColumnContextMenu } from './useColumnContextMenu'

export const ColumnContextMenu: FC = () => {
  const context = useContext(PortfolioAggregationContext)
  const { target, items } = useColumnContextMenu()
  if (!context.state.columnContextMenu) return null
  return (
    <ContextualMenu
      target={target}
      items={items}
      onDismiss={() => context.dispatch(COLUMN_HEADER_CONTEXT_MENU(null))}
    />
  )
}
