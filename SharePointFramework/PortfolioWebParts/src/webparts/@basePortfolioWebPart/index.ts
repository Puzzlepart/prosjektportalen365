import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import '@pnp/polyfill-ie11'
import { sp } from '@pnp/sp'
import { IBaseComponentProps } from 'components/types'
import assign from 'object-assign'
import React, { ComponentClass, createElement, FC } from 'react'
import * as ReactDom from 'react-dom'
import { DataAdapter } from '../../data'

export abstract class BasePortfolioWebPart<
  T extends IBaseComponentProps
> extends BaseClientSideWebPart<T> {
  public dataAdapter: DataAdapter
  private _pageTitle: string

  public abstract render(): void

  /**
   * Render component specified in `component` parameter, with the props
   * specified in `props` parameter. The props will be merged with the
   * web part properties and the following props:
   *
   * - `webPartContext` (from `this.context`)
   * - `pageContext` (from `this.context.pageContext`)
   * - `dataAdapter` (configured in `onInit`)
   * - `displayMode` (from `this.displayMode`)
   *
   * @param component Component to render
   * @param props Props
   */
  public renderComponent<T = any>(component: ComponentClass<T> | FC<T>, props?: T): void {
    const combinedProps = assign({ title: this._pageTitle }, this.properties, props, {
      webPartContext: this.context,
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode
    })
    const element: React.ReactElement<T> = createElement(component, combinedProps)
    ReactDom.render(element, this.domElement)
  }

  /**
   * Setup
   */
  private async _setup() {
    sp.setup({ spfxContext: this.context })
    Logger.subscribe(new ConsoleListener())
    Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    try {
      this._pageTitle = (
        await sp.web.lists
          .getById(this.context.pageContext.list.id.toString())
          .items.getById(this.context.pageContext.listItem.id)
          .select('Title')
          .get<{ Title: string }>()
      ).Title
    } catch (error) {}
  }

  public async onInit(): Promise<void> {
    this.dataAdapter = await new DataAdapter(
      this.context.pageContext,
      this.context.msGraphClientFactory
    ).configure()
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}
