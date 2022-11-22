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
  private _hubSiteContext: IHubSiteContext

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
      hubSiteContext: this._hubSiteContext,
      displayMode: this.displayMode,
      spfxContext: this.context,
      sp: this.sp
    }
    const element = React.createElement(component, combinedProps)
    render(element, this.domElement)
  }

  /**
   * Setup sp, data adapter, logging etc
   */
  private async _setup() {
    this.sp = spfi(this.context.pageContext.web.absoluteUrl).using(SPFx(this.context)).using(PnPLogging(LogLevel.Warning))
    this._hubSiteContext = await HubSiteService.GetHubSite(this.context)
    SPDataAdapter.configure(this.context, { hubSiteContext: this._hubSiteContext })
  }

  public async onInit(): Promise<void> {
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }
}