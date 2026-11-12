import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib/components/BaseWebPartComponent'
import { createSpfiInstance } from 'pp365-shared-library/lib/data'
import { createElement, FC } from 'react'
import SPDataAdapter from '../../data'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorBoundaryFallback } from './ErrorBoundary'
import React from 'react'
import { SiteContext, renderReact, unmountReact } from 'pp365-shared-library'
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

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning

/** Shares project context, data-adapter setup and React lifecycle across project web parts. */
export abstract class BaseProjectWebPart<
  T extends IBaseWebPartComponentProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
  public abstract render(): void

  /**
   * The web part's alias in its manifest, which usage statistics count it by: one of the web
   * parts the contract lets count `loaded`. An alias the contract does not know is dropped where
   * it is counted.
   */
  protected get _telemetryComponent(): TelemetryEventComponent<'loaded'> {
    return this.context.manifest.alias as TelemetryEventComponent<'loaded'>
  }

  /**
   * Combines saved and supplied component properties with the host's live site context.
   */
  protected createPropsForComponent<P>(props: Partial<P>): P {
    return {
      ...this.properties,
      ...props,
      title: this.properties.title ?? this.title,
      displayMode: this.displayMode,
      sp: this.sp,
      ...SiteContext.create(this.context)
    } as unknown as P
  }

  /**
   * Renders a project component with site context and a web-part-level error boundary.
   */
  public renderComponent<P>(component: FC<P>, props: Partial<P> = {}): void {
    const combinedProps = this.createPropsForComponent(props)
    const element = createElement(component, combinedProps)
    renderReact(
      <TelemetryProvider component={this._telemetryComponent}>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <ErrorBoundaryFallback title={combinedProps['title']} error={error} />
          )}
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
   * Configures PnPjs and the project data adapter with hub settings and logging.
   */
  private async _setup() {
    this.sp = createSpfiInstance(this.context)
    await SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning,
      loadGlobalSettings: true
    })
  }

  /**
   * Starts usage statistics for the web part, once it is set up: the page it is on, the hub's
   * settings the data adapter has read, how to tell what kind of site this is, that the web part
   * was loaded, and how long its setup took. Counted here and never in `render`, which runs many
   * times. The web part is set up by now, and usage statistics must not undo that: whatever goes
   * wrong here is dropped.
   *
   * @param setupTime How long `_setup` took, in milliseconds
   */
  private _startTelemetry(setupTime: number): void {
    try {
      startTelemetry(telemetryInitFromContext(this.context, { isDebug: DEBUG }))
      attachTelemetryPortal(SPDataAdapter.portalDataService, SPDataAdapter.globalSettings)
      registerSiteTypeResolver(this.context.pageContext.site.id.toString(), () =>
        SPDataAdapter.getSiteType()
      )
      trackUsage(this._telemetryComponent, 'loaded')
      trackTiming(this._telemetryComponent, 'init', setupTime)
    } catch {
      // Usage statistics never break the web part.
    }
  }

  public async onInit(): Promise<void> {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    const setupStart = Date.now()
    await this._setup()
    // SharePoint may have disposed the web part while it was set up (the user moved on): it was
    // never shown, and the page telemetry knows by now may be another one.
    if (!this.isDisposed) this._startTelemetry(Date.now() - setupStart)
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
