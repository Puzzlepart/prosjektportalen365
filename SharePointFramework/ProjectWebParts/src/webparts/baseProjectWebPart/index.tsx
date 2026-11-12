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

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning

/** Shares project context, data-adapter setup and React lifecycle across project web parts. */
export abstract class BaseProjectWebPart<
  T extends IBaseWebPartComponentProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
  public abstract render(): void

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
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <ErrorBoundaryFallback title={combinedProps['title']} error={error} />
        )}
      >
        {element}
      </ErrorBoundary>,
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

  public async onInit(): Promise<void> {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
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
