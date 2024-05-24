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
import { FluentProvider, IdPrefixProvider, useId } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'

export const Footer: FC<IFooterProps> = (props) => {
  const fluentProviderId = useId('fp-footer')
  const footer = useFooter(props)

  return (
    <FooterContext.Provider value={{ ...footer, props }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <div className={styles.footer}>
            <section className={styles.left}>
              {props.pageContext.legacyPageContext.isSiteAdmin && <SiteSettings />}
              <Configuration />
              <PromotedLinks />
            </section>
            <section className={styles.right}>
              <InstallVersion />
              <HelpContent />
            </section>
          </div>
        </FluentProvider>
      </IdPrefixProvider>
    </FooterContext.Provider>
  )
}

export * from './types'
