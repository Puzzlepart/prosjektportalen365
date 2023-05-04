import { ActionButton } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'

export const SiteSettingsLink: FC = () => {
  const context = useContext(FooterContext)
  const isHidden = context.props.portalUrl !== context.props.pageContext.web.absoluteUrl
  return (
    <div style={{ display: isHidden ? 'none' : 'inline-block' }}>
      <ActionButton
        text={strings.SiteSettingsLinkText}
        href={`${context.props.portalUrl}/_layouts/15/settings.aspx`}
        iconProps={{ iconName: 'Settings' }}
        styles={{ root: { fontSize: 12, height: 25 }, icon: { fontSize: 12 } }}
      />
    </div>
  )
}
