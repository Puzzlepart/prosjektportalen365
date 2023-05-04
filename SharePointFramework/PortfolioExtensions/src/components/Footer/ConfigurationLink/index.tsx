import { ActionButton } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'

export const ConfigurationLink: FC = () => {
  const context = useContext(FooterContext)
  return (
    <ActionButton
      text={strings.ConfigurationLinkText}
      href={`${context.props.portalUrl}/SitePages/Konfigurasjon.aspx`}
      iconProps={{ iconName: 'ConfigurationSolid' }}
      styles={{ root: { fontSize: 12, height: 25 }, icon: { fontSize: 12 } }}
    />
  )
}
