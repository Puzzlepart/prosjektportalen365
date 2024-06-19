import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import { Button, Tooltip } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'

export const SiteSettings: FC = () => {
  const context = useContext(FooterContext)
  const isHidden = context.props.portalUrl !== context.props.pageContext.web.absoluteUrl
  if (!context.props.pageContext.legacyPageContext.isSiteAdmin) return null
  return (
    <div style={{ display: isHidden ? 'none' : 'inline-block' }}>
      <Tooltip relationship='description' withArrow content={strings.SiteSettingsDescription}>
        <Button
          size='small'
          appearance='subtle'
          onClick={() =>
            window.open(`${context.props.portalUrl}/_layouts/15/settings.aspx`, '_blank')
          }
          icon={getFluentIcon('Settings')}
        >
          {strings.SiteSettingsLabel}
        </Button>
      </Tooltip>
    </div>
  )
}
