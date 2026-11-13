import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, LogLevel, Logger } from '@pnp/logging'
import { SPFI } from '@pnp/sp/presets/all'
import { IBaseComponentProps } from 'components/types'
import { SiteContext, createSpfiInstance, renderReact, unmountReact } from 'pp365-shared-library'
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
import React, { ComponentClass, FC, createElement } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { DataAdapter, PortfolioInstance } from '../../data'
import { ErrorBoundaryFallback } from './ErrorBoundary'

type ComponentType<P> = FC<P> | ComponentClass<P>

/** Share portfolio web-part services, context props, React mounting and error handling. */
export abstract class BasePortfolioWebPart<
  T extends IBaseComponentProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
  public dataAdapter: DataAdapter
  private _pageTitle: string

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
   * Create props for component with default properties and the `props` parameter.
   *
   * @param props Partial props of `P` to override the default properties
   */
  protected createPropsForComponent<P>(props: Partial<P>): P {
    return {
      manifestId: this.manifest.id,
      title: this._pageTitle,
      ...this.properties,
      ...props,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode,
      sp: this.sp,
      ...SiteContext.create(this.context)
    } as unknown as P
  }

  /**
   * Mount a component inside the shared error boundary with web-part, service and site-context props.
   * What it renders counts usage for the web part's alias (`TelemetryProvider`), and a component
   * that fails to render is counted once, by a code.
   */
  public renderComponent<P = any>(component: ComponentType<P>, props?: Partial<P>): void {
    const combinedProps = this.createPropsForComponent(props)
    const element = createElement(component, combinedProps)

    renderReact(
      <TelemetryProvider component={this._telemetryComponent}>
        <ErrorBoundary
          fallbackRender={(p) => {
            return <ErrorBoundaryFallback {...p} title={combinedProps['title']} />
          }}
          // Counted by a code: the error's message can hold names and URLs, and stays on the page.
          onError={() => trackError(this._telemetryComponent, 'render_failed')}
        >
          {element}
        </ErrorBoundary>
      </TelemetryProvider>,
      this.domElement
    )
  }

  /**
   * Initialize the SPFI client and logging, and read the hosting page's title when available.
   */
  private async _setup() {
    this.sp = createSpfiInstance(this.context)
    Logger.subscribe(ConsoleListener())
    Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning

    // Hosts such as Teams may not provide a page list item from which to read the title.
    if (this.context.pageContext.list?.id && this.context.pageContext.listItem?.id) {
      const sitePagesLibrary = this.sp.web.lists.getById(
        this.context.pageContext.list.id.toString()
      )
      try {
        this._pageTitle = (
          await sitePagesLibrary.items
            .getById(this.context.pageContext.listItem.id)
            .select('Title')<{
            Title: string
          }>()
        ).Title
      } catch (error) {}
    }
  }

  /**
   * Starts usage statistics for the web part, once it is set up: the page it is on, the hub's
   * data service, how to tell what kind of site this is, that the web part was loaded, and how
   * long its setup took. Counted here and never in `render`, which runs many times. The web part
   * is set up by now, and usage statistics must not undo that: whatever goes wrong here is
   * dropped.
   *
   * A web part set up with a portfolio hands over no data service: the portfolio's URL points the
   * adapter at a site that need not be the page's hub, and neither the level nor the kind of site
   * is read from another site. Another bundle on the page (the footer) hands over the hub's own.
   *
   * @param setupTime How long the setup took, in milliseconds
   * @param hasPortfolio Whether the data adapter was configured with a portfolio
   */
  private _startTelemetry(setupTime: number, hasPortfolio: boolean): void {
    try {
      startTelemetry(telemetryInitFromContext(this.context, { isDebug: DEBUG }))
      if (!hasPortfolio) {
        const portal = this.dataAdapter.portalDataService
        const siteId = this.context.pageContext.site.id.toString()
        // The adapter holds no global settings: the level comes from the portal's own cached read.
        attachTelemetryPortal(portal)
        registerSiteTypeResolver(siteId, () => portal.getSiteKind(siteId))
      }
      trackUsage(this._telemetryComponent, 'loaded')
      trackTiming(this._telemetryComponent, 'init', setupTime)
    } catch {
      // Usage statistics never break the web part.
    }
  }

  /**
   * Initialize the web part with the specified portfolio instance.
   *
   * @param portfolio Optional portfolio instance to initialize the data adapter with
   */
  public async onInit(portfolio?: PortfolioInstance): Promise<void> {
    const setupStart = Date.now()
    await this._setup()
    this.dataAdapter = await new DataAdapter(this.context, this.sp).configure(
      this.context,
      null,
      portfolio
    )
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    // SharePoint may have disposed the web part while it was set up (the user moved on): it was
    // never shown, and the page telemetry knows by now may be another one.
    if (!this.isDisposed) this._startTelemetry(Date.now() - setupStart, !!portfolio)
  }

  /**
   * Get the property pane configuration. This method is overridden by
   * the web part class extending this class. If not overridden, it will
   * return an empty configuration with no pages.
   */
  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }

  /**
   * Unmount the React tree when the webpart is disposed (e.g. on SPA
   * navigation). Without this, React keeps the fiber tree alive after
   * SharePoint has detached the DOM, which lets stale async callbacks
   * fire on a half-mounted tree and surface as `Cannot read properties
   * of null (reading 'props')`.
   */
  protected onDispose(): void {
    if (this.domElement) {
      unmountReact(this.domElement)
    }
  }
}
