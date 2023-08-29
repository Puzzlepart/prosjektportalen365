import { ContextualMenu } from '@fluentui/react'
import React, { FC } from 'react'
import { usePortfolioAggregationContext } from '../context'
import { TOGGLE_COLUMN_CONTEXT_MENU } from '../reducer'
import { useColumnContextMenu } from './useColumnContextMenu'

export const ColumnContextMenu: FC = () => {
  const context = usePortfolioAggregationContext()
  const { target, items } = useColumnContextMenu()
  if (!context.state.columnContextMenu) return null
  return (
    <ContextualMenu
      target={target}
      items={items}
      onDismiss={() => context.dispatch(TOGGLE_COLUMN_CONTEXT_MENU(null))}
    />
  )
}
