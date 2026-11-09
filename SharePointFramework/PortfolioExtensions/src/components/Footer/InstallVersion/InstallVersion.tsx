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
        {/* It holds links: the trap keeps Tab in it until Escape (WCAG 2.4.3). */}
        <Popover
          withArrow
          trapFocus
          positioning='above-start'
          onOpenChange={(_, { open }) => open && context.loadGitHubReleases()}
        >
          <PopoverTrigger disableButtonEnhancement>
            <Tooltip relationship='description' withArrow content={strings.LastInstallDescription}>
              <Button size='small' appearance='subtle' icon={getFluentIcon('BoxToolbox')}>
                {context.installedVersion}
              </Button>
            </Tooltip>
          </PopoverTrigger>
          <PopoverSurface aria-label={strings.LastInstallHeaderText}>
            <InstallVersionTooltipContent />
          </PopoverSurface>
        </Popover>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
