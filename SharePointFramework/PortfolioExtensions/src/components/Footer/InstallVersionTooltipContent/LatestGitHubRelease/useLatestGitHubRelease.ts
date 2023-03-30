import { Version } from '@microsoft/sp-core-library'
import strings from 'PortfolioExtensionsStrings'
import { useContext } from 'react'
import { FooterContext } from '../../context'

export function useLatestGitHubRelease() {
  const { props } = useContext(FooterContext)
  const latestGitHubRelease = props.gitHubReleases[0]
  const latestGitHubVersion = Version.parse(latestGitHubRelease.tag_name.substring(1))
  const installedVersion = props.installEntries[0].installVersion

  /**
   * Get icon props based on the comparison between the latest GitHub version and the installed version.
   *
   * @returns Icon props based on the comparison between the latest GitHub version and the installed version
   */
  const getVersionComparisonIconProps = () => {
    if (latestGitHubVersion.greaterThan(installedVersion)) {
      return {
        iconName: 'ChevronUp',
        styles: {
          root: {
            color: 'green'
          }
        },
        title: strings.LatestGitHubReleaseIsNewerText
      }
    } else if (latestGitHubVersion.lessThan(installedVersion)) {
      return {
        iconName: 'ChevronDown',
        styles: {
          root: {
            color: 'red'
          }
        },
        title: strings.LatestGitHubReleaseIsOlderText
      }
    }
    return {
      iconName: 'CircleRing',
      styles: {
        root: {
          color: 'orange'
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
