import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { IBaseWebPartComponentProps } from 'pp365-shared-library/lib/components/BaseWebPartComponent'
import { createSpfiInstance } from 'pp365-shared-library/lib/data'
import { createElement, FC } from 'react'
import { render } from 'react-dom'
import SPDataAdapter from '../../data'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorBoundaryFallback } from './ErrorBoundary'
import React from 'react'

Logger.subscribe(ConsoleListener())
Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning

export abstract class BaseProjectWebPart<
  T extends IBaseWebPartComponentProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
  public abstract render(): void

  /**
   * Create props for component with default properties and the `props` parameter. Also
   * includes `webPartContext` and `pageContext` from `this.context`, aswell as properties
   * from `pageContext.web`, `pageContext.site` and `pageContext.legacyPageContext`.
   *
   * @param props Partial props of `P` to override the default properties
   */
  protected createPropsForComponent<P>(props: Partial<P>): P {
    const { pageContext } = this.context
    return {
      ...this.properties,
      ...props,
      webPartContext: this.context,
      title: this.properties.title ?? this.title,
      pageContext,
      siteId: pageContext.site.id.toString(),
      webUrl: pageContext.web.absoluteUrl,
      webTitle: pageContext.web.title,
      isSiteAdmin: pageContext.legacyPageContext.isSiteAdmin,
      displayMode: this.displayMode,
      sp: this.sp
    } as unknown as P
  }

  /**
   * Render component with props as a combined object of `this.properties` and
   * the `props` parameter.
   *
   * @param component Function component with props `P`
   * @param props Props (`P`) (default: `{}`)
   */
  public renderComponent<P>(component: FC<P>, props: Partial<P> = {}): void {
    const combinedProps = this.createPropsForComponent(props)
    const element = createElement(component, combinedProps)
    render(
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
   * Setup sp, data adapter, logging etc
   */
  private async _setup() {
    this.sp = createSpfiInstance(this.context)
    await SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    })
  }

  public async onInit(): Promise<void> {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }
}
