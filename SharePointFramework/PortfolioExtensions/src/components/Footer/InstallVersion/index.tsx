import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import { InstallVersionTooltipContent } from './InstallVersionTooltipContent'
import { Button, Popover, PopoverSurface, PopoverTrigger } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'

export const InstallVersion: FC = () => {
  const context = useContext(FooterContext)
  return (
    <Popover withArrow positioning='above-start'>
      <PopoverTrigger disableButtonEnhancement>
        <Button size='small' appearance='subtle' icon={getFluentIcon('BoxToolbox')}>
          {context.installedVersion}
        </Button>
      </PopoverTrigger>
      <PopoverSurface>
        <InstallVersionTooltipContent />
      </PopoverSurface>
    </Popover>
  )
}
