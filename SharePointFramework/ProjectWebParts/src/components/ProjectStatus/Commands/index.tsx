import { CommandBar } from '@fluentui/react'
import React, { FC } from 'react'
import { useCommands } from './useCommandBar'

export const Commands: FC = () => {
    const { props } = useCommands()
    return (
        <CommandBar {...props} />
    )
}