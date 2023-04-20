import { Link } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import styles from './SiteSettingsLink.module.scss'
import { FooterContext } from '../context'

export const SiteSettingsLink: FC = () => {
    const { props } = useContext(FooterContext)
    const isHidden = props.portalUrl !== props.pageContext.web.absoluteUrl
    return (
        <Link
            hidden={isHidden}
            className={styles.root}
            href={`${props.portalUrl}/_layouts/15/settings.aspx`}
        >
            {strings.SiteSettingsLinkText}
        </Link>
    )
}