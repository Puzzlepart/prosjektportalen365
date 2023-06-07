import { CommandBar } from '@fluentui/react'
import * as strings from 'SharedLibraryStrings'
import React, { FC } from 'react'
import { ICommandsProps } from './types'
import { useCommands } from './useCommands'

export const Commands: FC<ICommandsProps> = (props) => {
  const commandBarProps = useCommands(props)
  return (
    <div>
      <CommandBar {...commandBarProps} />
    </div>
  )
}

Commands.defaultProps = {
  defaultGroupBy: strings.ProjectLabel
}
