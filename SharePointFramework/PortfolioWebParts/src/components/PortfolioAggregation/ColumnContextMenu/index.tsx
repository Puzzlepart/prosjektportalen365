import {
  ContextualMenu
} from '@fluentui/react'
import * as strings from 'PortfolioWebPartsStrings'
import React, { FC } from 'react'
import {
  COLUMN_HEADER_CONTEXT_MENU
} from '../reducer'
import { useColumnContextMenu } from './useColumnContextMenu'

export const ColumnContextMenu: FC = () => {
  const { target, column, addColumnItems, items, dispatch } = useColumnContextMenu()
  return (
    <ContextualMenu
      target={target}
      items={column.name === strings.AddColumnText ? addColumnItems : items}
      onDismiss={() => dispatch(COLUMN_HEADER_CONTEXT_MENU(null))}
    />
  )
}
