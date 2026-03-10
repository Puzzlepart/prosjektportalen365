import { Version } from '@microsoft/sp-core-library'
import strings from 'PortfolioExtensionsStrings'
import { useContext } from 'react'
import { FooterContext } from '../../../context'
import { ILatestGitHubReleaseProps } from './types'

/**
 * Component logic hook for the `LatestGitHubRelease` component.
 * Returns the latest GitHub release, latest GitHub version, installed
 * version and version comparison icon props.
 *
 * @param props Props for the `LatestGitHubRelease` component
 */
export function useLatestGitHubRelease(props: ILatestGitHubReleaseProps) {
  const context = useContext(FooterContext)
  const latestGitHubRelease = context.props.gitHubReleases[0]
  const latestGitHubVersion = Version.parse(latestGitHubRelease.tag_name.substring(1))
  const installedVersion = context.props.installEntries[0].installVersion

  /**
   * Get icon props based on the comparison between the latest GitHub version and the installed version.
   *
   * @returns Icon props based on the comparison between the latest GitHub version and the installed version
   */
  const getVersionComparisonIconProps = () => {
    if (latestGitHubVersion.greaterThan(installedVersion)) {
      return {
        name: props.latestGitHubReleaseIsNewerIconName,
        options: {
          color: props.latestGitHubReleaseIsNewerIconColor,
          title: strings.LatestGitHubReleaseIsNewerText
        }
      }
    } else if (latestGitHubVersion.lessThan(installedVersion)) {
      return {
        name: props.latestGitHubReleaseIsOlderIconName,
        options: {
          color: props.latestGitHubReleaseIsOlderIconColor,
          title: strings.LatestGitHubReleaseIsOlderText
        }
      }
    }
    return {
      name: props.latestGitHubReleaseIsSameIconName,
      options: {
        color: props.latestGitHubReleaseIsSameIconColor,
        title: strings.LatestGitHubReleaseIsSameText
      }
    }
  }

  const releaseNotesUrl = `https://github.com/Puzzlepart/prosjektportalen365/blob/main/releasenotes/${latestGitHubVersion.major}.${latestGitHubVersion.minor}.0.md`

  return {
    latestGitHubRelease,
    latestGitHubVersion,
    installedVersion,
    releaseNotesUrl,
    versionComparisonIconProps: getVersionComparisonIconProps()
  } as const
}
