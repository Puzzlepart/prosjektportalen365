import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import { SPFI } from '@pnp/sp/presets/all'
import { IBaseComponentProps } from 'components/types'
import { createSpfiInstance } from 'pp365-shared-library'
import React, { ComponentClass, createElement, FC } from 'react'
import { render } from 'react-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { DataAdapter } from '../../data'
import { ErrorBoundaryFallback } from './ErrorBoundary'

type ComponentType<P> = FC<P> | ComponentClass<P>

export abstract class BasePortfolioWebPart<
  T extends IBaseComponentProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
  public dataAdapter: DataAdapter
  private _pageTitle: string

  public abstract render(): void

  /**
   * Create props for component with default properties and the `props` parameter. Also
   * includes `webPartContext` and `pageContext` from `this.context`, aswell as properties
   * from `pageContext.web`, `pageContext.site` and `pageContext.legacyPageContext`.
   *
   * @param props Partial props of `P` to override the default properties
   */
  protected createPropsForComponent<P>(props: Partial<P>): P {
    return {
      title: this._pageTitle,
      ...this.properties,
      ...props,
      webPartContext: this.context,
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode,
      sp: this.sp
    } as unknown as P
  }

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
   * @param props Props to pass to the component
   */
  public renderComponent<P = any>(component: ComponentType<P>, props?: Partial<P>): void {
    const combinedProps = this.createPropsForComponent(props)
    const element = createElement(component, combinedProps)
    render(
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <ErrorBoundaryFallback title={combinedProps['title']} error={error} />
        )}
      >
        <FluentProvider theme={webLightTheme}>{element}</FluentProvider>
      </ErrorBoundary>,
      this.domElement
    )
  }

  /**
   * Setup the web part initializing the SPFI instance and the data adapter,
   * aswell as the logger.
   */
  private async _setup() {
    this.sp = createSpfiInstance(this.context)
    Logger.subscribe(ConsoleListener())
    Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    const sitePagesLibrary = this.sp.web.lists.getById(this.context.pageContext.list.id.toString())
    try {
      this._pageTitle = (
        await sitePagesLibrary.items.getById(this.context.pageContext.listItem.id).select('Title')<{
          Title: string
        }>()
      ).Title
    } catch (error) {}
  }

  public async onInit(): Promise<void> {
    await this._setup()
    this.dataAdapter = await new DataAdapter(this.context, this.sp).configure()
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
  }

  /**
   * Get the property pane configuration. This method is overridden by
   * the web part class extending this class. If not overridden, it will
   * return an empty configuration with no pages.
   *
   * @returns Empty property pane configuration
   */
  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}