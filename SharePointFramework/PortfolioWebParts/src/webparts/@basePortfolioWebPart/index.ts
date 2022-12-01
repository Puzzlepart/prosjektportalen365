import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { Logger, LogLevel } from '@pnp/logging'
import { spfi, SPFI, SPFx } from '@pnp/sp'
import { IBaseComponentProps } from 'components/types'
import assign from 'object-assign'
import React, { FC } from 'react'
import * as ReactDom from 'react-dom'
import { DataAdapter } from '../../data'

export abstract class BasePortfolioWebPart<
  T extends IBaseComponentProps
> extends BaseClientSideWebPart<T> {
  public dataAdapter: DataAdapter
  public sp: SPFI
  private _pageTitle: string

  public abstract render(): void

  /**
   * Render component
   *
   * @param component Component
   * @param props Props
   */
  public renderComponent<T = any>(component: React.ComponentClass<T> | FC<T>, props?: T): void {
    this.sp = spfi().using(SPFx(this.context))
    const combinedProps: T = assign({ title: this._pageTitle }, this.properties, props, {
      spfxContext: this.context,
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode,
      sp: this.sp
    })
    const element: React.ReactElement<T> = React.createElement(component, combinedProps)
    ReactDom.render(element, this.domElement)
  }

  /**
   * Setup
   */
  private async _setup() {
    Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    try {
      this._pageTitle = (
        await this.sp.web.lists
          .getById(this.context.pageContext.list.id.toString())
          .items.getById(this.context.pageContext.listItem.id)
          .select('Title')<{ Title: string }>()
      ).Title
    } catch (error) {}
  }

  public async onInit(): Promise<void> {
    this.dataAdapter = new DataAdapter(this.context)
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}
