import {
  BaseApplicationCustomizer,
  PlaceholderContent,
  PlaceholderName
} from '@microsoft/sp-application-base'
import { SPPermission } from '@microsoft/sp-page-context'
import { PnPClientStorage } from '@pnp/core/storage'
import { dateAdd } from '@pnp/core/util'
import '@pnp/sp/items'
import '@pnp/sp/lists'
import '@pnp/sp/webs'
import resource from 'SharedResources'
import { Footer, IFooterProps } from 'components/Footer'
import { PortalDataService } from 'pp365-shared-library/lib/services/PortalDataService'
import { isHubSite, ProjectAdminPermission, renderReact, unmountReact } from 'pp365-shared-library'
import {
  attachTelemetryPortal,
  errorCodeFrom,
  hubLanguageFromLcid,
  registerSiteTypeResolver,
  requestHeartbeat,
  startTelemetry,
  telemetryInitFromContext,
  TelemetryProvider,
  trackError,
  trackPageView
} from 'pp365-shared-library/lib/telemetry'
import SPDataAdapter from '../../data/SPDataAdapter'
import { createElement } from 'react'
import {
  HelpContentModel,
  IFooterApplicationCustomizerProperties,
  IGitHubRelease,
  InstallationEntry
} from './types'
import { PlaceholderTrace, tracePlaceholders } from './placeholderTrace'
import strings from 'PortfolioExtensionsStrings'

/** The footer's alias in its manifest, which usage statistics count it by. */
const TELEMETRY_COMPONENT = 'Footer'

/**
 * Mounts one persistent footer and refreshes page-dependent props on navigation. Starts usage
 * statistics for the page and counts each page view.
 */
export default class FooterApplicationCustomizer extends BaseApplicationCustomizer<IFooterApplicationCustomizerProperties> {
  private _bottomPlaceholder: PlaceholderContent
  private _footerElement: HTMLDivElement
  private _installEntries: InstallationEntry[]
  private _useAssistant: boolean
  private _hasAssistantAccess: boolean
  private _assistantEndpointUrl: string
  private _portalDataService: PortalDataService
  private _showFooter: boolean
  private _minimizeFooter: boolean
  private _globalSettings: Map<string, string>
  /** Writes the placeholder trace when it is on (sp-dev-docs#11070), and nothing otherwise. */
  private _trace: PlaceholderTrace = () => undefined

  /**
   * Initializes the settings and data required for the visible footer. Usage statistics start
   * as soon as the hub's settings are read, whether or not the footer shows; with the hub out of
   * reach nothing starts.
   */
  public async onInit(): Promise<void> {
    // First, so the trace sees what SharePoint does during the set-up below.
    this._trace = tracePlaceholders(this, this.context)
    await super.onInit()
    await SPDataAdapter.configure(this.context, {})
    this._portalDataService = SPDataAdapter.portalDataService
    this._globalSettings = await this._portalDataService.getGlobalSettings()

    if (!this._portalDataService.isAvailable) {
      this._installEntries = []
      this._useAssistant = false
      this._hasAssistantAccess = false
      this._assistantEndpointUrl = ''
      this._showFooter = false
      this._minimizeFooter = false
      return Promise.resolve()
    }

    // Before the footer's own setting is looked at: a hub that hides the footer still counts its
    // pages. The settings were read a moment ago, so the level is decided from them at once.
    this._trackPage(this._globalSettings)
    this.context.application.navigatedEvent.add(this, this._trackNavigation)

    this._useAssistant = this._globalSettings.get('UseAssistant') === '1'
    this._showFooter = this._globalSettings.get('ShowFooter') === '1'
    this._minimizeFooter = this._globalSettings.get('MinimizeFooter') === '1'

    if (!this._showFooter) return Promise.resolve()

    const useBetaChannel = this._globalSettings.get('UseBetaChannel') === '1'
    const betaEndpointUrl = this._globalSettings.get('BetaEndpointUrl')
    const endpointUrl = this._globalSettings.get('EndpointUrl')
    this._assistantEndpointUrl = useBetaChannel && betaEndpointUrl ? betaEndpointUrl : endpointUrl

    const [installEntries, hasAssistantAccess] = await Promise.all([
      this._fetchInstallationLogs(),
      this._useAssistant ? this._checkAssistantAccess() : Promise.resolve(false)
    ])
    this._installEntries = installEntries
    this._hasAssistantAccess = hasAssistantAccess
    this._trace('setUp')
    this.context.application.navigatedEvent.add(this, this._handleNavigatedEvent)
    // On a list page SharePoint may define its placeholders after the footer has started, and
    // the first navigation may have come and gone: the footer showed on few loads there. It
    // renders now, when the placeholders change, and on each navigation.
    this.context.placeholderProvider.changedEvent.add(this, this._render)
    this._render()
    return Promise.resolve()
  }

  private async _handleNavigatedEvent(): Promise<void> {
    if (!this._portalDataService?.isAvailable) return
    this._hasAssistantAccess = this._useAssistant ? await this._checkAssistantAccess() : false
    this._render()
  }

  /**
   * Tells usage statistics which page this is, and counts it: the page (its site and hub ids),
   * the hub's data service, how to tell what kind of site a project page is on, the page view,
   * and the hub's heartbeat. The core counts a page once however many footers report it, and
   * takes the heartbeat only on a hub page from a user who may manage the hub, once per page
   * load. The footer must work without usage statistics: whatever goes wrong here is dropped.
   *
   * @param settings The hub's global settings, only when they were read just now. On a
   * navigation they are left out: the map from `onInit` may be hours old by then, and an old map
   * would lower a level the hub has raised since.
   */
  private _trackPage(settings?: Map<string, string>): void {
    try {
      const { pageContext } = this.context
      const siteId = pageContext.site.id.toString()
      startTelemetry(
        telemetryInitFromContext(this.context, {
          isDebug: DEBUG,
          canManageHub: pageContext.web.permissions.hasPermission(SPPermission.manageWeb)
        })
      )
      attachTelemetryPortal(this._portalDataService, settings)
      registerSiteTypeResolver(siteId, () => this._portalDataService.getSiteKind(siteId))
      trackPageView(TELEMETRY_COMPONENT)
      requestHeartbeat(hubLanguageFromLcid(pageContext.web.language))
    } catch {
      // Usage statistics never break the footer.
    }
  }

  /**
   * Counts the page SharePoint has navigated to without loading it anew. Subscribed once, in
   * `onInit`, apart from the footer's own navigation handler, which runs only when the footer
   * shows.
   */
  private _trackNavigation(): void {
    this._trackPage()
  }

  /**
   * Stops counting page views when SharePoint disposes the customizer. SharePoint removes a
   * disposed observer's subscriptions itself; removing it here does not depend on that.
   */
  protected onDispose(): void {
    this.context.application.navigatedEvent.remove(this, this._trackNavigation)
  }

  /** Renders the footer with what the customizer knows now. */
  private _render(): void {
    if (!this._portalDataService?.isAvailable) return
    this._renderFooter(PlaceholderName.Bottom, {
      installEntries: this._installEntries,
      loadGitHubReleases: () => this._fetchGitHubReleases(),
      loadHelpContent: () => this._fetchHelpContent(),
      loadLinks: () => this._fetchLinks(),
      loadFavoriteProjects: () => this._fetchFavoriteProjects(),
      pageContext: this.context.pageContext,
      pagePath: window.location.pathname,
      portalUrl: this._portalDataService.url,
      useAssistant: this._useAssistant,
      hasAssistantAccess: this._hasAssistantAccess,
      assistantEndpointUrl: this._assistantEndpointUrl,
      showFooter: this._showFooter,
      minimizeFooter: this._minimizeFooter
    })
  }

  private async _isUserInGroup(groupName: string): Promise<boolean> {
    if (!this._portalDataService?.isAvailable) return false

    try {
      const [siteGroup] = await this._portalDataService.web.siteGroups
        .select('CanCurrentUserViewMembership', 'Title')
        .filter(`Title eq '${groupName}'`)()
      return siteGroup && siteGroup['CanCurrentUserViewMembership']
    } catch (error) {
      return false
    }
  }

  /**
   * Check if the current user has access to the assistant based on the
   * configured access mode (`AssistantAccessMode` global setting).
   *
   * Modes:
   * - `group` (default): Check visibility of the assistant group's membership on the hub
   * - `role`: Check project admin roles on project sites, group check on hub
   * - `both`: User must pass both group AND role check on project sites
   */
  private async _checkAssistantAccess(): Promise<boolean> {
    const requireAccess = this._globalSettings.get('RequireAssistantAccess') === '1'
    if (!requireAccess) return true

    const accessMode = this._globalSettings.get('AssistantAccessMode') || 'group'
    const onProjectSite = !isHubSite(this.context.pageContext)
    const checkGroup = accessMode === 'group' || accessMode === 'both' || !onProjectSite
    const checkRole = (accessMode === 'role' || accessMode === 'both') && onProjectSite

    const groupResult = checkGroup ? await this._isUserInGroup(strings.AssistantGroupName) : true

    const roleResult = checkRole
      ? await SPDataAdapter.checkProjectAdminPermissions(ProjectAdminPermission.AssistantAccess)
      : true

    return groupResult && roleResult
  }

  /**
   * Reads at most one installation entry, newest by start time unless ordering is overridden.
   */
  private async _fetchInstallationLogs(
    orderBy = 'InstallStartTime',
    orderAscending = false
  ): Promise<InstallationEntry[]> {
    if (!this._portalDataService?.isAvailable) return []

    try {
      const installationLogList = this._portalDataService.web.lists.getByTitle(
        resource.Lists_InstallationLog_Title
      )
      const installationLogItems = await installationLogList.items
        .orderBy(orderBy, orderAscending)
        .top(1)()
      return installationLogItems.map((item) => new InstallationEntry(item))
    } catch (error) {
      // Counted by the error's code for usage statistics, as each failed read below is.
      trackError(TELEMETRY_COMPONENT, error)
      return []
    }
  }

  /**
   * Fetch help content from the specified list filtered on level.
   *
   * The content is stored in `sessionStorage` for 4 hours.
   */
  private async _fetchHelpContent(): Promise<HelpContentModel[]> {
    if (!this._portalDataService?.isAvailable) return []

    try {
      return await new PnPClientStorage().session.getOrPut(
        `pp365_help_content_${window.location.pathname}`,
        async () => {
          const project = await this._portalDataService.getProjectDetails()
          // A member of «Minimum lesetilganger på hub» may not read `Prosjekter`: a site of the hub
          // other than the hub is then a project, not the portfolio.
          const isUnreadProject =
            !project &&
            !this._portalDataService.isListAvailable('PROJECTS') &&
            !isHubSite(this.context.pageContext)
          const level = project
            ? project.isParentProject
              ? resource.Lists_HelpContent_Level_ParentProgram
              : resource.Lists_HelpContent_Level_Project
            : isUnreadProject
              ? resource.Lists_HelpContent_Level_Project
              : resource.Lists_HelpContent_Level_Portfolio
          let items = await this._portalDataService.getItems(
            resource.Lists_HelpContent_Title,
            HelpContentModel,
            {
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
            }
          )
          const pagePath = this._getHelpPagePath(level)
          items = items.filter((i) => i.matchPattern(pagePath)).splice(0, 3)
          for (let i = 0; i < items.length; i++) {
            if (items[i].externalUrl) {
              await items[i].fetchExternalContent(this.properties.publicMediaBasePath)
            }
          }
          return items
        },
        dateAdd(new Date(), 'hour', 4)
      )
    } catch (error) {
      trackError(TELEMETRY_COMPONENT, error)
      return []
    }
  }

  /**
   * The address the help rows are matched against: the page's own, or on the site's address the
   * front page's. Client-side navigation to a site, by the hub's title for one, leaves the address
   * without the front page the help rows name (`SitePages/Home.aspx` on the hub,
   * `SitePages/ProjectHome.aspx` on a project), and the help was unavailable there.
   *
   * @param level Help content level of the site
   */
  private _getHelpPagePath(level: string): string {
    const path = window.location.pathname
    const sitePath = new URL(this.context.pageContext.web.absoluteUrl).pathname.replace(/\/$/, '')
    if (decodeURIComponent(path).replace(/\/$/, '') !== decodeURIComponent(sitePath)) return path
    const frontPage =
      level === resource.Lists_HelpContent_Level_Portfolio
        ? 'SitePages/Home.aspx'
        : 'SitePages/ProjectHome.aspx'
    return `${sitePath}/${frontPage}`
  }

  /**
   * Fetch the links from the links list on the hub site.
   */
  private async _fetchLinks(): Promise<{ Url: string; Description: string; Level?: string }[]> {
    if (!this._portalDataService?.isAvailable) return []

    try {
      const linksList = this._portalDataService.web.lists.getByTitle(resource.Lists_Links_Title)
      const linksItems = await linksList.items()
      return linksItems.map((item) => {
        return {
          Url: item.GtLinkUrl.Url,
          Description: item.GtLinkUrl.Description,
          Level: item.GtLinkLevel
        }
      })
    } catch (error) {
      trackError(TELEMETRY_COMPONENT, error)
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
    try {
      return await new PnPClientStorage().session.getOrPut(
        `pp365_github_releases_${repoName}`,
        async () => {
          const response = await fetch(`https://api.github.com/repos/${repoName}/releases`)
          if (!response.ok) return []

          const releases = await response.json()
          return Array.isArray(releases) ? releases : []
        },
        dateAdd(new Date(), 'hour', 4)
      )
    } catch (error) {
      return []
    }
  }

  /**
   * Fetch the favorite/followed projects for the current user using SharePoint Social Following REST API.
   * Filters the results to only include projects that exist in the current hub's projects list.
   */
  private async _fetchFavoriteProjects(): Promise<{ name: string; url: string }[]> {
    if (!this._portalDataService?.isAvailable) return []

    try {
      const webAbsoluteUrl = this.context.pageContext.web.absoluteUrl

      const [followedResponse, hubProjects] = await Promise.all([
        fetch(`${webAbsoluteUrl}/_api/social.following/my/followed(types=4)`, {
          headers: { Accept: 'application/json;odata=verbose' }
        }),
        this._portalDataService.web.lists
          .getByTitle(resource.Lists_Projects_Title)
          .items.select('GtSiteUrl')
          .top(5000)()
      ])

      if (!followedResponse.ok) {
        return []
      }

      const data = await followedResponse.json()
      const followedSites = data.d?.Followed?.results || []

      const hubProjectUrls = new Set(
        hubProjects.map((p: { GtSiteUrl: string }) => p.GtSiteUrl?.toLowerCase()).filter(Boolean)
      )

      const projects = followedSites
        .filter((site: any) => {
          const url = (site.Uri || site.Url || '').toLowerCase()
          return url && site.Name && hubProjectUrls.has(url)
        })
        .map((site: any) => ({
          name: site.Name,
          url: site.Uri || site.Url
        }))

      return projects
    } catch (error) {
      console.warn('Could not fetch favorite projects:', error)
      // A member of «Minimum lesetilganger på hub» may not read `Prosjekter`, by design: that
      // refusal is no failure, and counted it would fill the error figures each time the
      // favourites open. Any other failure is counted.
      if (errorCodeFrom(error) !== 'permission_denied') trackError(TELEMETRY_COMPONENT, error)
      return []
    }
  }

  /**
   * Render the footer in the specified placeholder. Creates the placeholder, and the div element
   * in it where the footer is rendered, if they don't exist; every navigation after that renders
   * the same footer again with its new props, so one footer is mounted.
   *
   * @param name Placeholder name
   * @param footerProps Props for the `Footer` component
   */
  private _renderFooter(name: PlaceholderName, footerProps: IFooterProps): void {
    if (!this._bottomPlaceholder) {
      this._bottomPlaceholder = this.context.placeholderProvider.tryCreateContent(name, {
        onDispose: () => this._onDispose()
      })
      // On a list page whose placeholders SharePoint never defined, the content it hands out is
      // not in the page, and the footer rendered there is never seen (sp-dev-docs#11070).
      this._trace('tryCreateContent', {
        acquired: !!this._bottomPlaceholder,
        connected: this._bottomPlaceholder?.domElement.isConnected
      })
    }
    // SharePoint has no placeholder for it yet: its changed event renders it.
    if (!this._bottomPlaceholder) return
    if (!this._footerElement) {
      this._footerElement = document.createElement('div')
      this._bottomPlaceholder.domElement.replaceChildren(this._footerElement)
    }
    // The footer's own React root: its components count for the footer through this provider.
    renderReact(
      createElement(
        TelemetryProvider,
        { component: TELEMETRY_COMPONENT },
        createElement(Footer, footerProps)
      ),
      this._footerElement
    )
  }

  /**
   * Unmounts the disposed footer so the next render can acquire a fresh placeholder.
   */
  protected _onDispose(): void {
    if (this._footerElement) unmountReact(this._footerElement)
    this._footerElement = undefined
    this._bottomPlaceholder = undefined
  }
}
