import { Icon } from '@fluentui/react'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { ILatestGitHubReleaseProps } from './types'
import styles from './LatestGitHubRelease.module.scss'
import { useLatestGitHubRelease } from './useLatestGitHubRelease'
import { Button, Label, Link, Tooltip, Divider } from '@fluentui/react-components'
import { FluentIconName, getFluentIcon } from 'pp365-shared-library'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

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
        <Tooltip relationship='description' withArrow content={versionComparisonIconProps.options.title}>
          <Button
            className={styles.button}
            size='medium'
            appearance='subtle'
            onClick={() =>
              window.open(latestGitHubRelease.html_url, '_blank')
            }
            icon={getFluentIcon(versionComparisonIconProps.name as FluentIconName, versionComparisonIconProps.options)}
            iconPosition='after'
          >
            <span className={styles.label}>{latestGitHubVersion.toString()}</span>
          </Button>
        </Tooltip>
      </div>
      {latestGitHubRelease.body && (
        <>
          <Divider className={styles.divider} />
          <div className={styles.releaseHighlights}>
            <Label weight='semibold'>{strings.LatestGitHubReleaseHighlightsLabel}</Label>
            <div className={styles.releaseBody} tabIndex={0}>
              <ReactMarkdown
                linkTarget='_blank'
                rehypePlugins={[rehypeRaw]}
                components={{
                  a: ({ node, ...props }) => <a {...props} rel='noopener noreferrer' />
                }}
              >
                {latestGitHubRelease.body}
              </ReactMarkdown>
            </div>
          </div>
        </>
      )}
      <div hidden={!latestGitHubVersion.greaterThan(installedVersion)}>
        <Button
          className={styles.button}
          size='medium'
          appearance='primary'
          onClick={() =>
            window.open('https://github.com/Puzzlepart/prosjektportalen365/releases', '_blank')
          }
          icon={getFluentIcon('ArrowDownload')}
        >
          <span className={styles.label}>{strings.LatestGitHubReleaseDownloadButtonText}</span>
        </Button>
      </div>
    </div>
  )
}

LatestGitHubRelease.defaultProps = {
  latestGitHubReleaseIsNewerIconName: 'ArrowCircleUpSparkle',
  latestGitHubReleaseIsNewerIconColor: 'green',
  latestGitHubReleaseIsOlderIconName: 'ArrowCircleDown',
  latestGitHubReleaseIsOlderIconColor: 'orange',
  latestGitHubReleaseIsSameIconName: 'CheckmarkCircle',
  latestGitHubReleaseIsSameIconColor: 'black'
}
