import { TooltipHost, Link } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { FooterContext } from './context'
import styles from './Footer.module.scss'
import { InstallVersionTooltipContent } from './InstallVersionTooltipContent'
import { IFooterProps } from './types'
import { useFooter } from './useFooter'

export const Footer: FC<IFooterProps> = (props) => {
  const { latestEntry, installedVersion } = useFooter(props)
  return (
    <FooterContext.Provider value={{ latestEntry, props }}>
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
            <TooltipHost
              hostClassName={styles.installVersion}
              calloutProps={{ gapSpace: 0, calloutMaxWidth: 450 }}
              hidden={false}
              content={<InstallVersionTooltipContent />}
            >
              {installedVersion}
            </TooltipHost>
          </section>
        </div>
      </div>
    </FooterContext.Provider>
  )
}

export * from './types'
