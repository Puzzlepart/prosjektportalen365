import { ActionButton, Icon, Link } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { ILatestGitHubReleaseProps } from './types'
import styles from './LatestGitHubRelease.module.scss'
import { useLatestGitHubRelease } from './useLatestGitHubRelease'

/**
 * Component for displaying the latest GitHub release and a
 * comparison between the latest GitHub release and the installed version.
 */
export const LatestGitHubRelease: FC<ILatestGitHubReleaseProps> = (props) => {
  const { latestGitHubRelease, latestGitHubVersion, installedVersion, versionComparisonIconProps } =
    useLatestGitHubRelease(props)

  return (
    <div className={styles.root}>
      <div>
        <span className={styles.label}>{strings.LatestGitHubReleaseLabel}</span>
        <span
          className={styles.latestGitHubReleaseLink}
          title={strings.LatestGitHubReleaseLinkTitle}
        >
          <Link href={latestGitHubRelease.html_url} target='_blank' rel='noopener noreferrer'>
            {latestGitHubVersion.toString()}
          </Link>
        </span>
        <span className={styles.versionComparisonIcon}>
          <Icon {...versionComparisonIconProps} />
        </span>
      </div>
      <div hidden={!latestGitHubVersion.greaterThan(installedVersion)}>
        <ActionButton
          text={strings.LatestGitHubReleaseDownloadButtonText}
          iconProps={{ iconName: 'Download', styles: { root: { fontSize: 12 } } }}
          styles={{ root: { fontSize: 12 } }}
          href={latestGitHubRelease.assets[0].browser_download_url}
          target='_blank'
          rel='noopener noreferrer'
        />
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