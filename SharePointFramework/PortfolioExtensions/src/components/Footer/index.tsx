import { Link } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { FooterContext } from './context'
import styles from './Footer.module.scss'
import { InstallVersion } from './InstallVersion'
import { IFooterProps } from './types'
import { useFooter } from './useFooter'

export const Footer: FC<IFooterProps> = (props) => {
  const footer = useFooter(props)
  return (
    <FooterContext.Provider value={{ ...footer, props }}>
      <div className={styles.root}>
        <div className={styles.content}>
          <section className={styles.left}>
            <Link
              className={styles.configurationLink}
              href={`${props.pageContext.web.absoluteUrl}/SitePages/Konfigurasjon.aspx`}
            >
              {strings.ConfigurationLinkText}
            </Link>
          </section>
          <section className={styles.right}>
            <InstallVersion />
          </section>
        </div>
      </div>
    </FooterContext.Provider>
  )
}

export * from './types'
