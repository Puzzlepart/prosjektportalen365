import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { LogLevel } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { SPDataAdapter } from 'data/SPDataAdapter'
import { createSpfiInstance, renderReact, unmountReact } from 'pp365-shared-library'
import { IHubSite } from 'pp365-shared-library/lib/interfaces'
import {
  attachTelemetryPortal,
  registerSiteTypeResolver,
  startTelemetry,
  TelemetryEventComponent,
  telemetryInitFromContext,
  TelemetryProvider,
  trackError,
  trackTiming,
  trackUsage
} from 'pp365-shared-library/lib/telemetry'
import { ComponentClass, FC, ReactElement, createElement } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { IBaseProgramWebPartProps } from './types'

/** Configures the program data adapter and owns the React root shared by program web parts. */
export abstract class BaseProgramWebPart<
  T extends IBaseProgramWebPartProps
> extends BaseClientSideWebPart<T> {
  protected _sp: SPFI

  /**
   * The data adapter used to communicate with SharePoint.
   */
  protected _dataAdapter: SPDataAdapter

  /**
   * The hub site associated with the current site.
   */
  public hubSite: IHubSite

  /**
   * An array of child project objects
   */
  public childProjects: Array<Record<string, string>>

  /**
   * An array of site IDs for the child projects.
   */
  public siteIds: string[]

  public abstract render(): void

  /**
   * The web part's alias in its manifest, which usage statistics count it by: one of the web
   * parts the contract lets count `loaded`. An alias the contract does not know is dropped where
   * it is counted.
   */
  protected get _telemetryComponent(): TelemetryEventComponent<'loaded'> {
    return this.context.manifest?.alias as TelemetryEventComponent<'loaded'>
  }

  /**
   * Renders merged web-part/component props, overriding context, adapter, display mode and title
   * with this host's values.
   *
   * What it renders counts usage for the web part's alias (`TelemetryProvider`): the portfolio
   * overview, the aggregation and the timeline are other packages' components, and count for the
   * program web part they are in. A component that fails to render is shown as an error message
   * and counted once, by a code.
   */
  public renderComponent<T = any>(component: ComponentClass<T> | FC<T>, props?: T): void {
    const combinedProps = {
      ...this.properties,
      ...props,
      sp: this._sp,
      spfxContext: this.context,
      pageContext: this.context.pageContext,
      dataAdapter: this._dataAdapter,
      displayMode: this.displayMode,
      title: this.properties.title
    }
    const element: ReactElement<T> = createElement(component, combinedProps)
    renderReact(
      createElement(
        TelemetryProvider,
        { component: this._telemetryComponent },
        createElement(
          ErrorBoundary,
          // Counted by a code: the error's message can hold names and URLs, and stays on the page.
          { onError: () => trackError(this._telemetryComponent, 'render_failed') },
          element
        )
      ),
      this.domElement
    )
  }

  /**
   * Starts usage statistics for the web part, once it is set up: the page it is on, the hub's
   * data service with the settings the data adapter has read, how to tell what kind of site this
   * is, that the web part was loaded, and how long its setup took. Counted here and never in
   * `render`, which runs many times. The web part is set up by now, and usage statistics must not
   * undo that: whatever goes wrong here is dropped.
   *
   * The kind of site is read from the site's row in the hub's project list (`getSiteKind`): the
   * adapter holds no flags of the site itself, and the web parts can be placed on a site that is
   * no program.
   *
   * @param setupTime How long the setup took, in milliseconds
   */
  private _startTelemetry(setupTime: number): void {
    try {
      startTelemetry(telemetryInitFromContext(this.context, { isDebug: DEBUG }))
      const portal = this._dataAdapter.portalDataService
      const siteId = this.context.pageContext.site.id.toString()
      attachTelemetryPortal(portal, this._dataAdapter.globalSettings)
      registerSiteTypeResolver(siteId, () => portal.getSiteKind(siteId))
      trackUsage(this._telemetryComponent, 'loaded')
      trackTiming(this._telemetryComponent, 'init', setupTime)
    } catch {
      // Usage statistics never break the web part.
    }
  }

  /** Initializes SharePoint access, global settings and the program's child-project scope. */
  public async onInit(): Promise<void> {
    const setupStart = Date.now()
    await super.onInit()
    this._sp = createSpfiInstance(this.context)
    this._dataAdapter = new SPDataAdapter()
    await this._dataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      loadGlobalSettings: true,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    })
    await this._dataAdapter.initChildProjects()
    // SharePoint may have disposed the web part while it was set up (the user moved on): it was
    // never shown, and the page telemetry knows by now may be another one.
    if (!this.isDisposed) this._startTelemetry(Date.now() - setupStart)
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }

  /**
   * Unmounts React before the host element is discarded, releasing effects and async subscriptions.
   */
  protected onDispose(): void {
    if (this.domElement) {
      unmountReact(this.domElement)
    }
  }
}

export * from './types'
