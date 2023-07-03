import { ContextualMenu } from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import { TOGGLE_COLUMN_CONTEXT_MENU } from '../reducer'
import { useColumnContextMenu } from './useColumnContextMenu'

export const ColumnContextMenu: FC = () => {
  const { state, dispatch } = useContext(PortfolioOverviewContext)
  const contextMenu = useColumnContextMenu()
  if (!state.columnContextMenu) return null
  return (
    <ContextualMenu {...contextMenu} onDismiss={() => dispatch(TOGGLE_COLUMN_CONTEXT_MENU(null))} />
  )
}
