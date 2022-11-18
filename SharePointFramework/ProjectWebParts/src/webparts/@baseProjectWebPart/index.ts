import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { LogLevel, PnPLogging } from '@pnp/logging'
import { spfi, SPFI, SPFx } from '@pnp/sp'
import React from 'react'
import { render } from 'react-dom'
import HubSiteService, { IHubSiteContext } from 'sp-hubsite-service'
import { IBaseWebPartComponentProps } from '../../components/BaseWebPartComponent'
import SPDataAdapter from '../../data'

export abstract class BaseProjectWebPart<
  T extends IBaseWebPartComponentProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
  private _hubSiteCtx: IHubSiteContext

  public abstract render(): void

  /**
   * Render component
   *
   * @param component Component
   * @param props Props
   */
  public renderComponent<P>(component: any, props?: Partial<P>): void {
    const combinedProps: T = {
      ...this.properties,
      ...props,
      title: this.properties.title || this.title,
      hubSite: this._hubSiteCtx,
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      webTitle: this.context.pageContext.web.title,
      isSiteAdmin: this.context.pageContext.legacyPageContext.isSiteAdmin,
      displayMode: this.displayMode,
      pageContext: this.context.pageContext
    }
    const element = React.createElement(component, combinedProps)
    render(element, this.domElement)
  }

  /**
   * Setup sp, data adapter, logging etc
   */
  private async _setup() {
    this.sp = spfi(this.context.pageContext.web.absoluteUrl).using(SPFx(this.context)).using(PnPLogging(LogLevel.Warning))
    this._hubSiteCtx = await HubSiteService.GetHubSite(this.context)
    SPDataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      hubSiteUrl: this._hubSiteCtx.url,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    })
  }

  public async onInit(): Promise<void> {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }
}
