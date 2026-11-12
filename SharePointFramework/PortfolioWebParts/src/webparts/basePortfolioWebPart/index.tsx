import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, LogLevel, Logger } from '@pnp/logging'
import { SPFI } from '@pnp/sp/presets/all'
import { IBaseComponentProps } from 'components/types'
import { SiteContext, createSpfiInstance, renderReact, unmountReact } from 'pp365-shared-library'
import React, { ComponentClass, FC, createElement } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { DataAdapter, PortfolioInstance } from '../../data'
import { ErrorBoundaryFallback } from './ErrorBoundary'

type ComponentType<P> = FC<P> | ComponentClass<P>

/** Share portfolio web-part services, context props, React mounting and error handling. */
export abstract class BasePortfolioWebPart<
  T extends IBaseComponentProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
  public dataAdapter: DataAdapter
  private _pageTitle: string

  public abstract render(): void

  /**
   * Create props for component with default properties and the `props` parameter.
   *
   * @param props Partial props of `P` to override the default properties
   */
  protected createPropsForComponent<P>(props: Partial<P>): P {
    return {
      manifestId: this.manifest.id,
      title: this._pageTitle,
      ...this.properties,
      ...props,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode,
      sp: this.sp,
      ...SiteContext.create(this.context)
    } as unknown as P
  }

  /**
   * Mount a component inside the shared error boundary with web-part, service and site-context props.
   */
  public renderComponent<P = any>(component: ComponentType<P>, props?: Partial<P>): void {
    const combinedProps = this.createPropsForComponent(props)
    const element = createElement(component, combinedProps)

    renderReact(
      <ErrorBoundary
        fallbackRender={(p) => {
          return <ErrorBoundaryFallback {...p} title={combinedProps['title']} />
        }}
      >
        {element}
      </ErrorBoundary>,
      this.domElement
    )
  }

  /**
   * Initialize the SPFI client and logging, and read the hosting page's title when available.
   */
  private async _setup() {
    this.sp = createSpfiInstance(this.context)
    Logger.subscribe(ConsoleListener())
    Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning

    // Hosts such as Teams may not provide a page list item from which to read the title.
    if (this.context.pageContext.list?.id && this.context.pageContext.listItem?.id) {
      const sitePagesLibrary = this.sp.web.lists.getById(
        this.context.pageContext.list.id.toString()
      )
      try {
        this._pageTitle = (
          await sitePagesLibrary.items
            .getById(this.context.pageContext.listItem.id)
            .select('Title')<{
            Title: string
          }>()
        ).Title
      } catch (error) {}
    }
  }

  /**
   * Initialize the web part with the specified portfolio instance.
   *
   * @param portfolio Optional portfolio instance to initialize the data adapter with
   */
  public async onInit(portfolio?: PortfolioInstance): Promise<void> {
    await this._setup()
    this.dataAdapter = await new DataAdapter(this.context, this.sp).configure(
      this.context,
      null,
      portfolio
    )
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
  }

  /**
   * Get the property pane configuration. This method is overridden by
   * the web part class extending this class. If not overridden, it will
   * return an empty configuration with no pages.
   */
  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
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
