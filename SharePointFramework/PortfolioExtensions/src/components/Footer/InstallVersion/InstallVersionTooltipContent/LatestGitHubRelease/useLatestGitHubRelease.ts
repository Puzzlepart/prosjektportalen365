import { Version } from '@microsoft/sp-core-library'
import strings from 'PortfolioExtensionsStrings'
import { useContext } from 'react'
import { FooterContext } from '../../../context'
import { ILatestGitHubReleaseProps } from './types'

/**
 * GitHub's alert markers (`> [!NOTE]`, `> [!WARNING]` …), which open a quote in a release's notes:
 * outside GitHub they are plain text, and showed as «[!NOTE]» in the notes.
 */
const GITHUB_ALERT_MARKER = /^([ \t]*>[ \t]*)\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*$/gim

/**
 * A release's notes without GitHub's alert markers; the quote they open stays a quote.
 *
 * @param body The release's notes, in markdown
 */
export function stripGitHubAlertMarkers(body: string): string {
  return (body ?? '').replace(GITHUB_ALERT_MARKER, '$1')
}

/**
 * Compares the first GitHub release with the installed version and builds its release links.
 */
export function useLatestGitHubRelease(props: ILatestGitHubReleaseProps) {
  const context = useContext(FooterContext)
  const latestGitHubRelease = context.gitHubReleases[0]
  const latestGitHubVersion = Version.parse(latestGitHubRelease.tag_name.substring(1))
  const installedVersion = context.props.installEntries[0].installVersion

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
    releaseBody: stripGitHubAlertMarkers(latestGitHubRelease.body),
    latestGitHubVersion,
    installedVersion,
    releaseNotesUrl,
    versionComparisonIconProps: getVersionComparisonIconProps()
  } as const
}
