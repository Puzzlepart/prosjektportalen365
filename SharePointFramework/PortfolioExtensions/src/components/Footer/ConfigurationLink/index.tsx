import { Link } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import styles from './ConfigurationLink.module.scss'
import { FooterContext } from '../context'

export const ConfigurationLink: FC = () => {
  const context = useContext(FooterContext)
  return (
    <Link className={styles.root} href={`${context.props.portalUrl}/SitePages/Konfigurasjon.aspx`}>
      {strings.ConfigurationLinkText}
    </Link>
  )
}
