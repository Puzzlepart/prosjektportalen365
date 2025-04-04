import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import { Button, Tooltip } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'
import resx from 'ResxStrings'

export const Configuration: FC = () => {
  const context = useContext(FooterContext)

  if (!context.props.pageContext.legacyPageContext.isSiteAdmin) return null

  return (
    <Tooltip relationship='description' withArrow content={strings.ConfigurationDescription}>
      <Button
        size='small'
        appearance='subtle'
        onClick={() =>
          window.open(`${context.props.portalUrl}/SitePages/${resx.ClientSidePages_Configuration_PageName}`, '_blank')
        }
        icon={getFluentIcon('ContentSettings')}
      >
        {strings.ConfigurationLabel}
      </Button>
    </Tooltip>
  )
}
