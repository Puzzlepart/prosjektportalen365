import { Icon } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { ILatestGitHubReleaseProps } from './types'
import styles from './LatestGitHubRelease.module.scss'
import { useLatestGitHubRelease } from './useLatestGitHubRelease'
import { Button, Label, Link, Tooltip } from '@fluentui/react-components'
import { getFluentIcon } from 'pp365-shared-library'

/**
 * Component for displaying the latest GitHub release and a
 * comparison between the latest GitHub release and the installed version.
 */
export const LatestGitHubRelease: FC<ILatestGitHubReleaseProps> = (props) => {
  const { latestGitHubRelease, latestGitHubVersion, installedVersion, versionComparisonIconProps } =
    useLatestGitHubRelease(props)

  return (
    <div className={styles.latestRelease}>
      <div className={styles.content}>
        <span>
          <Label weight='semibold'>{strings.LatestGitHubReleaseLabel}</Label>:
        </span>
        <div className={styles.version}>
          <span
            className={styles.latestGitHubReleaseLink}
            title={strings.LatestGitHubReleaseLinkTitle}
          >
            <Link href={latestGitHubRelease.html_url} target='_blank' rel='noopener noreferrer'>
              <b>{latestGitHubVersion.toString()}</b>
            </Link>
          </span>
          <Tooltip relationship='description' withArrow content={versionComparisonIconProps.title}>
            <span className={styles.versionComparisonIcon}>
              <Icon {...versionComparisonIconProps} />
            </span>
          </Tooltip>
        </div>
      </div>
      <div hidden={!latestGitHubVersion.greaterThan(installedVersion)}>
        <Button
          className={styles.button}
          size='medium'
          appearance='primary'
          onClick={() => window.open(latestGitHubRelease.assets[0].browser_download_url, '_blank')}
          icon={getFluentIcon('ArrowDownload')}
        >
          <span className={styles.label}>{strings.LatestGitHubReleaseDownloadButtonText}</span>
        </Button>
      </div>
    </div>
  )
}

LatestGitHubRelease.defaultProps = {
  latestGitHubReleaseIsNewerIconName: 'ChevronUp',
  latestGitHubReleaseIsNewerIconColor: 'green',
  latestGitHubReleaseIsOlderIconName: 'ChevronDown',
  latestGitHubReleaseIsOlderIconColor: 'red',
  latestGitHubReleaseIsSameIconName: 'ChevronRight',
  latestGitHubReleaseIsSameIconColor: 'black'
}
