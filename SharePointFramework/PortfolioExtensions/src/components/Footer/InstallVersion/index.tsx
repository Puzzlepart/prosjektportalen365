import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import { InstallVersionTooltipContent } from './InstallVersionTooltipContent'
import { Button, Tooltip } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'

export const InstallVersion: FC = () => {
  const context = useContext(FooterContext)
  return (
    <Tooltip relationship='description' withArrow content={<InstallVersionTooltipContent />}>
      <Button size='small' appearance='subtle' icon={getFluentIcon('BoxToolbox')}>
        {context.installedVersion}
      </Button>
    </Tooltip>
  )
}
