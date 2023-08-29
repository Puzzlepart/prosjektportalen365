import { CommandBar, Shimmer } from '@fluentui/react'
import React, { FC } from 'react'
import { useProjectStatusContext } from '../context'
import { useCommands } from './useCommands'

export const Commands: FC = () => {
  const context = useProjectStatusContext()
  const { props } = useCommands()
  return (
    <Shimmer isDataLoaded={context.state.isDataLoaded}>
      <CommandBar {...props} />
    </Shimmer>
  )
}
