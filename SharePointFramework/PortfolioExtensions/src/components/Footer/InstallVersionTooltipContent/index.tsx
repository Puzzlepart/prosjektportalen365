import strings from 'PortfolioExtensionsStrings'
import React, { FC,useContext } from 'react'
import styles from './InstallVersionTooltipContent.module.scss'
import { Link } from '@fluentui/react'
import { FooterContext } from '../types'

export const InstallVersionTooltipContent: FC = () => {
  const { latestEntry, props } = useContext(FooterContext)
  const dateTimeFormatOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }
  return (
    <div className={styles.root}>
      <h3>{strings.LastInstallHeaderText}</h3>
      <div>
        <b>{strings.InstallStartTimeLabel}</b>:{' '}
        {latestEntry.installStartTime.toLocaleDateString('no', dateTimeFormatOptions)}
      </div>
      <div>
        <b>{strings.InstallEndTimeLabel}</b>:{' '}
        {latestEntry.installEndTime.toLocaleDateString('no', dateTimeFormatOptions)}
      </div>
      <div>
        <b>{strings.InstallVersionLabel}</b>: {latestEntry.installVersion}
      </div>
      <div>
        <b>{strings.InstallCommandLabel}</b>: {latestEntry.installCommand}
      </div>
      {latestEntry.installChannel && (
        <div>
          <b>{strings.InstallChannelLabel}</b>: {latestEntry.installChannel}
        </div>
      )}
      <div className={styles.seeAllInstallationsLink}>
        <Link href={`${props.pageContext.web.absoluteUrl}/Lists/Installasjonslogg/AllItems.aspx`}>{strings.SeeAllInstallationsLinkText}</Link>
      </div>
    </div>
  )
}