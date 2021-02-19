import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import '@pnp/polyfill-ie11'
import { sp } from '@pnp/sp'
import { IBaseComponentProps } from 'components/types'
import { DataAdapter } from 'data'
import assign from 'object-assign'
import React from 'react'
import * as ReactDom from 'react-dom'

// tslint:disable-next-line: naming-convention
export abstract class BasePortfolioWebPart<
  T extends IBaseComponentProps
> extends BaseClientSideWebPart<T> {
  public dataAdapter: DataAdapter
  private _pageTitle: string

  public abstract render(): void

  /**
   * Render component
   *
   * @param {any} component Component
   * @param {T} props Props
   */
  public renderComponent<T = any>(
    component: React.ComponentClass<T> | React.FunctionComponent<T>,
    props?: T
  ): void {
    const combinedProps = assign({ title: this._pageTitle }, this.properties, props, {
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode
    })
    const element: React.ReactElement<T> = React.createElement(component, combinedProps)
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
    this.dataAdapter = new DataAdapter(this.context)
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}
