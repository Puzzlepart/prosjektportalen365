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
import { FluentProvider, useId, webLightTheme } from '@fluentui/react-components'

export const Footer: FC<IFooterProps> = (props) => {
  const fluentProviderId = useId('fp-footer')
  const footer = useFooter(props)

  return (
    <FooterContext.Provider value={{ ...footer, props }}>
      <FluentProvider id={fluentProviderId} theme={webLightTheme}>
        <div className={styles.footer}>
          <section className={styles.left}>
            <SiteSettings />
            <Configuration />
            <PromotedLinks />
          </section>
          <section className={styles.right}>
            <InstallVersion />
            <HelpContent />
          </section>
        </div>
      </FluentProvider>
    </FooterContext.Provider>
  )
}

export * from './types'
