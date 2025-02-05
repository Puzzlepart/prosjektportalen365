import { FluentProvider, IdPrefixProvider, mergeClasses, useId } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { Configuration } from './Configuration'
import styles from './Footer.module.scss'
import { HelpContent } from './HelpContent'
import { InstallVersion } from './InstallVersion'
import { PromotedLinks } from './PromotedLinks'
import { SiteSettings } from './SiteSettings'
import { FooterContext } from './context'
import { IFooterProps } from './types'
import { useFooter } from './useFooter'
import { Assistant } from './Assistant'

export const Footer: FC<IFooterProps> = (props) => {
  const fluentProviderId = useId('fp-footer')
  const footer = useFooter(props)

  if (!props.showFooter) {
    return null
  }

  return (
    <FooterContext.Provider value={{ ...footer, props }}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <div className={mergeClasses(styles.footer, props.minimizeFooter && styles.minimize)}>
            <section className={styles.left}>
              <SiteSettings />
              <Configuration />
              <PromotedLinks />
            </section>
            <section className={styles.right}>
              {props.useAssistant && <Assistant />}
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
