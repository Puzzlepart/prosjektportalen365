import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import { Button, Tooltip } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'

export const Configuration: FC = () => {
  const context = useContext(FooterContext)

  return (
    <Tooltip relationship='description' withArrow content={strings.ConfigurationDescription}>
      <Button
        size='small'
        appearance='subtle'
        onClick={() =>
          window.open(`${context.props.portalUrl}/SitePages/Konfigurasjon.aspx`, '_blank')
        }
        icon={getFluentIcon('ContentSettings')}
      >
        {strings.ConfigurationLabel}
      </Button>
    </Tooltip>
  )
}
