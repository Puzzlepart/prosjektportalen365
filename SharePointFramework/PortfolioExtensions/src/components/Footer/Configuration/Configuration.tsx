import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import {
  Button,
  Tooltip,
  FluentProvider,
  IdPrefixProvider,
  useId
} from '@fluentui/react-components'
import { getFluentIcon, customLightTheme } from 'pp365-shared-library'
import resource from 'SharedResources'

export const Configuration: FC = () => {
  const context = useContext(FooterContext)
  const fluentProviderId = useId('fp-footer-configuration')

  if (!context.props.pageContext.legacyPageContext.isSiteAdmin) return null

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider theme={customLightTheme}>
        <Tooltip relationship='description' withArrow content={strings.ConfigurationDescription}>
          {/* A page, so a link, which can be opened where the user wants it (WCAG 4.1.2). */}
          <Button
            as='a'
            size='small'
            appearance='subtle'
            href={`${context.props.portalUrl}/SitePages/${resource.ClientSidePages_Configuration_PageName}`}
            target='_blank'
            icon={getFluentIcon('ContentSettings')}
          >
            {strings.ConfigurationLabel}
          </Button>
        </Tooltip>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
