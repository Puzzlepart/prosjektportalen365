import { CommandBar, Shimmer } from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { ProjectStatusContext } from '../context'
import { useCommands } from './useCommands'

export const Commands: FC = () => {
  const context = useContext(ProjectStatusContext)
  const { props } = useCommands()
  return (
    <Shimmer isDataLoaded={context.state.isDataLoaded}>
      <CommandBar {...props} />
    </Shimmer>
  )
}
