import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import { InstallVersionTooltipContent } from './InstallVersionTooltipContent'
import { Button, Popover, PopoverSurface, PopoverTrigger, Tooltip } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'

export const InstallVersion: FC = () => {
  const context = useContext(FooterContext)
  return (
    <Popover withArrow positioning='above-start'>
      <PopoverTrigger disableButtonEnhancement>
        <Tooltip
          relationship='description'
          withArrow
          content={strings.LastInstallDescription}
        >
          <Button size='small' appearance='subtle' icon={getFluentIcon('BoxToolbox')}>
            {context.installedVersion}
          </Button>
        </Tooltip>
      </PopoverTrigger>
      <PopoverSurface>
        <InstallVersionTooltipContent />
      </PopoverSurface>
    </Popover>
  )
}
