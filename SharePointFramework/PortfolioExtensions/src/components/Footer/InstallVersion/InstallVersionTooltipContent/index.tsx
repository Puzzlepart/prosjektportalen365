import strings from 'PortfolioExtensionsStrings'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../../context'
import styles from './InstallVersionTooltipContent.module.scss'
import { LatestGitHubRelease } from './LatestGitHubRelease'
import { WebPartTitle, formatDate, getFluentIcon } from 'pp365-shared-library'
import { Button, Divider, Label } from '@fluentui/react-components'

/**
 * Component for displaying information about the latest installation
 * of Prosjektportalen 365.
 */
export const InstallVersionTooltipContent: FC = () => {
  const context = useContext(FooterContext)
  const latestEntry = context.latestEntry

  return (
    <div className={styles.lastInstall}>
      <WebPartTitle
        title={strings.LastInstallHeaderText}
        description={strings.LastInstallDescription}
      />
      <div className={styles.content}>
        <span>
          <Label weight='semibold'>{strings.InstalledDateLabel}</Label>:
        </span>
        {formatDate(latestEntry.installedDate)}
      </div>
      <div className={styles.content}>
        <span>
          <Label weight='semibold'>{strings.InstallVersionLabel}</Label>:
        </span>
        {latestEntry.fullInstallVersion}
      </div>
      {latestEntry.installChannel && (
        <div className={styles.content}>
          <span>
            <Label weight='semibold'>{strings.InstallChannelLabel}</Label>:
          </span>
          {latestEntry.installChannel}
        </div>
      )}
      <Divider className={styles.divider} />
      <div className={styles.footer}>
        <Button
          className={styles.button}
          size='medium'
          appearance='subtle'
          onClick={() =>
            window.open(
              `${context.props.portalUrl}/Lists/Installasjonslogg/AllItems.aspx`,
              '_blank'
            )
          }
          icon={getFluentIcon('History')}
        >
          <span className={styles.label}>{strings.SeeAllInstallationsLinkText}</span>
        </Button>
        <LatestGitHubRelease />
      </div>
    </div>
  )
}
