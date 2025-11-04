import { HelpContentModel, IGitHubRelease, InstallationEntry } from 'extensions/footer/types'
import { PageContext } from '@microsoft/sp-page-context'

export interface IFooterProps {
  /**
   * Installation entries from the installation log list
   */
  installEntries: InstallationEntry[]

  /**
   * Releases from GitHub
   */
  gitHubReleases: IGitHubRelease[]

  /**
   * Help content to display in the footer
   */
  helpContent: HelpContentModel[]

  /**
   * Links to display in the footer
   */
  links: { Url: string; Description: string; Level?: string }[]

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
}
