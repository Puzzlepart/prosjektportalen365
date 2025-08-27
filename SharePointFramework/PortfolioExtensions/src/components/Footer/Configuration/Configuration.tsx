import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import { Button, Tooltip, FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
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
      <Button
        size='small'
        appearance='subtle'
        onClick={() =>
          window.open(`${context.props.portalUrl}/SitePages/${resource.ClientSidePages_Configuration_PageName}`, '_blank')
        }
        icon={getFluentIcon('ContentSettings')}
      >
        {strings.ConfigurationLabel}
      </Button>
    </Tooltip>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
