import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base'
import '@pnp/sp/items'
import '@pnp/sp/lists'
import '@pnp/sp/webs'
import strings from 'PortfolioExtensionsStrings'
import { Footer, IFooterProps } from 'components/Footer'
import { PortalDataService } from 'pp365-shared-library/lib/services/PortalDataService'
import { createElement } from 'react'
import { render } from 'react-dom'
import {
  HelpContentModel,
  IFooterApplicationCustomizerProperties,
  IGitHubRelease,
  InstallationEntry
} from './types'
import { PnPClientStorage } from '@pnp/core/storage'
import { dateAdd } from '@pnp/core/util'
import resx from 'ResxStrings'

export default class FooterApplicationCustomizer extends BaseApplicationCustomizer<IFooterApplicationCustomizerProperties> {
  private _bottomPlaceholder: PlaceholderContent
  private _installEntries: InstallationEntry[]
  private _gitHubReleases: IGitHubRelease[]
  private _links: { Url: string; Description: string; Level?: string }[]
  private _useAssistant: boolean
  private _helpContent: HelpContentModel[]
  private _portalDataService: PortalDataService
  private _showFooter: boolean
  private _minimizeFooter: boolean
  private _globalSettings: Map<string, string>

  /**
   * On init, fetch the installation logs, GitHub releases and links.
   */
  public async onInit(): Promise<void> {
    await super.onInit()
    this._portalDataService = await new PortalDataService().configure({
      spfxContext: this.context
    })
    this._globalSettings = await this._portalDataService.getGlobalSettings()

    const [installEntries, gitHubReleases, helpContent, links] = await Promise.all([
      this._fetchInstallationLogs(),
      this._fetchGitHubReleases(),
      this._fetchHelpContent(),
      this._fetchLinks()
    ])
    this._installEntries = installEntries
    this._gitHubReleases = gitHubReleases
    this._helpContent = helpContent
    this._links = links
    this._useAssistant = this._globalSettings.get('UseAssistant') === '1'
    this._showFooter = this._globalSettings.get('ShowFooter') === '1'
    this._minimizeFooter = this._globalSettings.get('MinimizeFooter') === '1'
    this.context.application.navigatedEvent.add(this, this._handleNavigatedEvent)
    return Promise.resolve()
  }

  private async _handleNavigatedEvent(): Promise<void> {
    const helpContent = await this._fetchHelpContent()
    this._helpContent = helpContent

    this._renderFooter(PlaceholderName.Bottom, {
      installEntries: this._installEntries,
      gitHubReleases: this._gitHubReleases,
      helpContent: this._helpContent,
      links: this._links,
      pageContext: this.context.pageContext,
      portalUrl: this._portalDataService.url,
      useAssistant: this._useAssistant,
      showFooter: this._showFooter,
      minimizeFooter: this._minimizeFooter
    })
  }

  /**
   * Fetch the installation logs from the installation log list. Converts
   * the item properties to match the `IInstallationEntry` interface.
   *
   * @param orderBy Property to order by
   * @param orderAscending Order ascending or descending
   */
  private async _fetchInstallationLogs(
    orderBy = 'InstallStartTime',
    orderAscending = false
  ): Promise<InstallationEntry[]> {
    try {
      const installationLogList = this._portalDataService.web.lists.getByTitle(
        resx.Lists_InstallationLog_Title
      )
      const installationLogItems = await installationLogList.items.orderBy(
        orderBy,
        orderAscending
      )()
      return installationLogItems.map((item) => new InstallationEntry(item))
    } catch (error) {
      return []
    }
  }

  /**
   * Fetch help content from the specified list filtered on level.
   *
   * The content is stored in `sessionStorage` for 4 hours.
   */
  private async _fetchHelpContent(): Promise<HelpContentModel[]> {
    try {
      return await new PnPClientStorage().session.getOrPut(
        `pp365_help_content_${window.location.pathname}`,
        async () => {
          const project = await this._portalDataService.getProjectDetails()
          const level = project
            ? project.isParentProject
              ? 'Overordnet/Program'
              : 'Prosjekt'
            : 'Portefølje'
          let items = await this._portalDataService.getItems(resx.Lists_HelpContent_Title, HelpContentModel, {
            ViewXml: `<View>
            <Query>
                <Where>
                    <Eq>
                        <FieldRef Name="GtHelpContentLevel" />
                        <Value Type="MultiChoice">${level}</Value>
                    </Eq>
                </Where>
                <OrderBy>
                    <FieldRef Name="GtSortOrder" />
                </OrderBy>
            </Query>
        </View>`
          })
          items = items.filter((i) => i.matchPattern(window.location.pathname)).splice(0, 3)
          for (let i = 0; i < items.length; i++) {
            if (items[i].externalUrl) {
              await items[i].fetchExternalContent(this.properties.publicMediaBasePath)
            }
          }
          return items
        },
        dateAdd(new Date(), 'hour', 4)
      )
    } catch (e) {
      return []
    }
  }

  /**
   * Fetch the links from the links list on the hub site.
   */
  private async _fetchLinks(): Promise<{ Url: string; Description: string; Level?: string }[]> {
    try {
      const linksList = this._portalDataService.web.lists.getByTitle(resx.Lists_Links_Title)
      const linksItems = await linksList.items()
      return linksItems.map((item) => {
        return {
          Url: item.GtLinkUrl.Url,
          Description: item.GtLinkUrl.Description,
          Level: item.GtLinkLevel
        }
      })
    } catch (error) {
      return []
    }
  }

  /**
   * Fetch the latest GitHub releases from the `puzzlepart/prosjektportalen365` repository.
   *
   * @param repoName Repository name in the format `owner/repo`
   */
  private async _fetchGitHubReleases(
    repoName = 'puzzlepart/prosjektportalen365'
  ): Promise<IGitHubRelease[]> {
    const response = await fetch(`https://api.github.com/repos/${repoName}/releases`)
    const releases = await response.json()
    return releases
  }

  /**
   * Render the footer in the specified placeholder. Creates a
   * placeholder if it doesn't exist and adds a new div element
   * to the placeholder where the footer will be rendered.
   *
   * @param name Placeholder name
   * @param footerProps Props for the `Footer` component
   */
  private _renderFooter(name: PlaceholderName, footerProps: IFooterProps): void {
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(name, {
        onDispose: this._onDispose
      })
    }
    const footerElement: HTMLDivElement = document.createElement('div')
    render(createElement(Footer, footerProps), footerElement)

    if (this._bottomPlaceholder.domElement.hasChildNodes()) {
      this._bottomPlaceholder.domElement.removeChild(this._bottomPlaceholder.domElement.firstChild)
    }

    this._bottomPlaceholder.domElement.append(footerElement)
  }

  /**
   * Dispose the bottom placeholder when the footer is disposed.
   */
  protected _onDispose(): void {
    this._bottomPlaceholder.dispose()
  }
}
