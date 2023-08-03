import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { IBaseComponentProps } from 'components/types'
import assign from 'object-assign'
import { ComponentClass, createElement, FC, ReactElement } from 'react'
import { render } from 'react-dom'
import { DataAdapter } from '../../data'
import { SPFI } from '@pnp/sp'
import { createSpfiInstance } from 'pp365-shared-library'

export abstract class BasePortfolioWebPart<
  T extends IBaseComponentProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
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
   * - `sp` (from `this.sp`)
   *
   * @param component Component to render
   * @param props Props
   */
  public renderComponent<T = any>(component: ComponentClass<T> | FC<T>, props?: T): void {
    const combinedProps = assign({ title: this._pageTitle }, this.properties, props, {
      webPartContext: this.context,
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode,
      sp: this.sp
    })
    const element: ReactElement<T> = createElement(component, combinedProps)
    render(element, this.domElement)
  }

  /**
   * Setup
   */
  private async _setup() {
    this.sp = createSpfiInstance(this.context)
    Logger.subscribe(ConsoleListener())
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
    this.dataAdapter = await new DataAdapter(this.context, this.sp).configure()
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}
