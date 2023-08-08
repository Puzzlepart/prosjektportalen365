import React, { FC } from 'react'
import { ConfigurationLink } from './ConfigurationLink'
import styles from './Footer.module.scss'
import { InstallVersion } from './InstallVersion'
import { PromotedLinks } from './PromotedLinks'
import { FooterContext } from './context'
import { IFooterProps } from './types'
import { useFooter } from './useFooter'
import { SiteSettingsLink } from './SiteSettingsLink'
import { HelpContent } from './HelpContent'

export const Footer: FC<IFooterProps> = (props) => {
  const footer = useFooter(props)
  return (
    <FooterContext.Provider value={{ ...footer, props }}>
      <div className={styles.root}>
        <div className={styles.content}>
          <section className={styles.left}>
            <SiteSettingsLink />
            <ConfigurationLink />
            <PromotedLinks />
          </section>
          <section className={styles.right}>
            <InstallVersion />
            <HelpContent />
          </section>
        </div>
      </div>
    </FooterContext.Provider>
  )
}

export * from './types'
