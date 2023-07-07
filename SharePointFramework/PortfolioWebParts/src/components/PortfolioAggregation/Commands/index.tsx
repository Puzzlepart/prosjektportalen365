import { CommandBar } from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { PortfolioAggregationContext } from '../context'
import { useCommands } from './useCommands'

export const Commands: FC = () => {
  const context = useContext(PortfolioAggregationContext)
  const commandBarProps = useCommands()

  return (
    <div hidden={!context.props.showCommandBar}>
      <CommandBar {...commandBarProps} />
    </div>
  )
}
