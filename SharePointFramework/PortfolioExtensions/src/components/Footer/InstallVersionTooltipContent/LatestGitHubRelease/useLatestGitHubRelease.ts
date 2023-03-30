import { Version } from '@microsoft/sp-core-library'
import strings from 'PortfolioExtensionsStrings'
import { useContext } from 'react'
import { FooterContext } from '../../context'
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
        iconName: props.latestGitHubReleaseIsNewerIconName,
        styles: {
          root: {
            color: props.latestGitHubReleaseIsNewerIconColor
          }
        },
        title: strings.LatestGitHubReleaseIsNewerText
      }
    } else if (latestGitHubVersion.lessThan(installedVersion)) {
      return {
        iconName: props.latestGitHubReleaseIsOlderIconName,
        styles: {
          root: {
            color: props.latestGitHubReleaseIsOlderIconColor
          }
        },
        title: strings.LatestGitHubReleaseIsOlderText
      }
    }
    return {
      iconName: props.latestGitHubReleaseIsSameIconName,
      styles: {
        root: {
          color: props.latestGitHubReleaseIsSameIconColor
        }
      },
      title: strings.LatestGitHubReleaseIsSameText
    }
  }

  return {
    latestGitHubRelease,
    latestGitHubVersion,
    installedVersion,
    versionComparisonIconProps: getVersionComparisonIconProps()
  } as const
}
