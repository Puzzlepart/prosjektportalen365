import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import { InstallVersionTooltipContent } from './InstallVersionTooltipContent'
import {
  Button,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Tooltip,
  FluentProvider,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
import { getFluentIcon, customLightTheme } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'

export const InstallVersion: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-install-version')
  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Popover withArrow positioning='above-start'>
          <PopoverTrigger disableButtonEnhancement>
            <Tooltip relationship='description' withArrow content={strings.LastInstallDescription}>
              <Button size='small' appearance='subtle' icon={getFluentIcon('BoxToolbox')}>
                {context.installedVersion}
              </Button>
            </Tooltip>
          </PopoverTrigger>
          <PopoverSurface>
            <InstallVersionTooltipContent />
          </PopoverSurface>
        </Popover>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
