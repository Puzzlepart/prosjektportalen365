import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import '@pnp/polyfill-ie11'
import { sp } from '@pnp/sp'
import React from 'react'
import ReactDom from 'react-dom'
import { IBaseWebPartComponentProps } from '../../components/BaseWebPartComponent'
import SPDataAdapter from '../../data'

export abstract class BaseProjectWebPart<
  T extends IBaseWebPartComponentProps
> extends BaseClientSideWebPart<T> {
  public abstract render(): void

  /**
   * Render component with props as a combined object of `this.properties` and
   * the `props` parameter.
   *
   * @param component Component
   * @param props Props
   */
  public renderComponent<P>(component: any, props?: Partial<P>): void {
    const combinedProps: T = {
      ...this.properties,
      ...props,
      title: this.properties.title || this.title,
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      webTitle: this.context.pageContext.web.title,
      isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
      displayMode: this.displayMode,
      pageContext: this.context.pageContext,
      webPartContext: this.context
    }

    const element = React.createElement(component, combinedProps)
    ReactDom.render(element, this.domElement)
  }

  /**
   * Setup sp, data adapter, logging etc
   */
  private async _setup() {
    sp.setup({ spfxContext: this.context })
    await SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    })
    Logger.subscribe(new ConsoleListener())
    Logger.activeLogLevel =
      sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
  }

  public async onInit(): Promise<void> {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }
}
