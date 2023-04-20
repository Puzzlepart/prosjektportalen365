import { Link } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import styles from './SiteSettingsLink.module.scss'
import { FooterContext } from '../context'

export const SiteSettingsLink: FC = () => {
  const context = useContext(FooterContext)
  const isHidden = context.props.portalUrl !== context.props.pageContext.web.absoluteUrl
  return (
    <Link
      hidden={isHidden}
      className={styles.root}
      href={`${context.props.portalUrl}/_layouts/15/settings.aspx`}
    >
      {strings.SiteSettingsLinkText}
    </Link>
  )
}
