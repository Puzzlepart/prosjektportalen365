import React, { FC } from 'react'
import { Configuration } from './Configuration'
import styles from './Footer.module.scss'
import { InstallVersion } from './InstallVersion'
import { PromotedLinks } from './PromotedLinks'
import { FooterContext } from './context'
import { IFooterProps } from './types'
import { useFooter } from './useFooter'
import { SiteSettings } from './SiteSettings'
import { HelpContent } from './HelpContent'
import { Fluent } from 'pp365-shared-library'

export const Footer: FC<IFooterProps> = (props) => {
  const footer = useFooter(props)

  return (
    <FooterContext.Provider value={{ ...footer, props }}>
      <Fluent>
        <div className={styles.footer}>
          <section className={styles.left}>
            {props.pageContext.legacyPageContext.isSiteAdmin && <SiteSettings />}
            {props.pageContext.legacyPageContext.isSiteAdmin && <Configuration />}
            <PromotedLinks />
          </section>
          <section className={styles.right}>
            <InstallVersion />
            <HelpContent />
          </section>
        </div>
      </Fluent>
    </FooterContext.Provider>
  )
}

export * from './types'
