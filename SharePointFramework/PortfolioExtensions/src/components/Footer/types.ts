import { HelpContentModel, IGitHubRelease, InstallationEntry } from 'extensions/footer/types'
import { PageContext } from '@microsoft/sp-page-context'

export interface IFooterProps {
  /**
   * Installation entries from the installation log list
   */
  installEntries: InstallationEntry[]

  /**
   * Loads releases from GitHub
   */
  loadGitHubReleases: () => Promise<IGitHubRelease[]>

  /**
   * Loads help content to display in the footer
   */
  loadHelpContent: () => Promise<HelpContentModel[]>

  /**
   * Loads links to display in the footer
   */
  loadLinks: () => Promise<{ Url: string; Description: string; Level?: string }[]>

  /**
   * Page context object
   */
  pageContext: PageContext

  /**
   * The URL to the portal root
   */
  portalUrl: string

  /**
   * Use the assistant
   */
  useAssistant: boolean

  /**
   * Whether the current user has access to the assistant
   */
  hasAssistantAccess: boolean

  /**
   * The assistant endpoint URL
   */
  assistantEndpointUrl: string

  /**
   * Whether or not to show the footer
   */
  showFooter: boolean

  /**
   * Whether or not to minimize the footer automtically
   */
  minimizeFooter: boolean

  /**
   * Loads favorite projects (followed sites) for the current user
   */
  loadFavoriteProjects: () => Promise<{ name: string; url: string }[]>
}
