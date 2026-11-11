import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { ILatestGitHubReleaseProps } from './types'
import styles from './LatestGitHubRelease.module.scss'
import { useLatestGitHubRelease } from './useLatestGitHubRelease'
import { Button, Label, Link, Tooltip, Divider } from '@fluentui/react-components'
import { FluentIconName, getFluentIcon, withDefaults } from 'pp365-shared-library'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

/**
 * The comparison's icons stand out from the popover by at least 3:1 (WCAG 1.4.11): Fluent's green
 * (5.4:1), its warning orange (5.1:1, where CSS orange was 2:1) and its foreground.
 */
export const LATEST_GIT_HUB_RELEASE_DEFAULT_PROPS: Partial<ILatestGitHubReleaseProps> = {
  latestGitHubReleaseIsNewerIconName: 'ArrowCircleUpSparkle',
  latestGitHubReleaseIsNewerIconColor: '#107c10',
  latestGitHubReleaseIsOlderIconName: 'ArrowCircleDown',
  latestGitHubReleaseIsOlderIconColor: '#bc4b09',
  latestGitHubReleaseIsSameIconName: 'CheckmarkCircle',
  latestGitHubReleaseIsSameIconColor: '#242424'
}

/**
 * Component for displaying the latest GitHub release and a
 * comparison between the latest GitHub release and the installed version.
 */
export const LatestGitHubRelease: FC<ILatestGitHubReleaseProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, LATEST_GIT_HUB_RELEASE_DEFAULT_PROPS)
  const {
    latestGitHubRelease,
    latestGitHubVersion,
    installedVersion,
    releaseNotesUrl,
    versionComparisonIconProps
  } = useLatestGitHubRelease(props)

  return (
    <div className={styles.latestRelease}>
      <div className={styles.content}>
        <span>
          <Label weight='semibold'>{strings.LatestGitHubReleaseLabel}</Label>:
        </span>
        <Tooltip
          relationship='description'
          withArrow
          content={versionComparisonIconProps.options.title}
        >
          <Button
            as='a'
            className={styles.button}
            size='medium'
            appearance='subtle'
            href={latestGitHubRelease.html_url}
            target='_blank'
            icon={getFluentIcon(
              versionComparisonIconProps.name as FluentIconName,
              versionComparisonIconProps.options
            )}
            iconPosition='after'
          >
            <span className={styles.label}>{latestGitHubVersion.toString()}</span>
          </Button>
        </Tooltip>
      </div>
      <span className={styles.latestGitHubReleaseLink} title={strings.LatestGitHubReleaseLinkTitle}>
        {/* It had no address, so it was a button, and could not be opened where the user wanted. */}
        <Link href={releaseNotesUrl} target='_blank' rel='noopener noreferrer'>
          <b>{strings.LatestGitHubReleaseLinkTitle}</b>
        </Link>
      </span>
      {latestGitHubRelease.body && (
        <>
          <Divider className={styles.divider} />
          <div className={styles.releaseHighlights}>
            <Label weight='semibold'>{strings.LatestGitHubReleaseHighlightsLabel}</Label>
            {/* It scrolls: a stop for the keyboard, named as a region. */}
            <div
              className={styles.releaseBody}
              tabIndex={0}
              role='region'
              aria-label={strings.LatestGitHubReleaseHighlightsLabel}
            >
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
          as='a'
          className={styles.button}
          size='medium'
          appearance='primary'
          href='https://github.com/Puzzlepart/prosjektportalen365/releases'
          target='_blank'
          icon={getFluentIcon('ArrowDownload')}
        >
          <span className={styles.label}>{strings.LatestGitHubReleaseDownloadButtonText}</span>
        </Button>
      </div>
    </div>
  )
}
