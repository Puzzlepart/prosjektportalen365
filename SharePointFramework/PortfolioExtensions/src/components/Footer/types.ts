import { IGitHubRelease, InstallationEntry } from 'extensions/footer/types'
import { PageContext } from '@microsoft/sp-page-context'

export interface IFooterProps {
  installEntries: InstallationEntry[]
  gitHubReleases: IGitHubRelease[]
  pageContext: PageContext
}
