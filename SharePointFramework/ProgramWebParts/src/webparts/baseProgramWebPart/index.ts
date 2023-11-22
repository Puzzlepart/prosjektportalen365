import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { LogLevel } from '@pnp/logging'
import { SPFI } from '@pnp/sp'
import { SPDataAdapter } from 'data/SPDataAdapter'
import { createSpfiInstance } from 'pp365-shared-library'
import { IHubSite } from 'pp365-shared-library/lib/interfaces'
import { ComponentClass, FC, ReactElement, createElement } from 'react'
import { render } from 'react-dom'
import { IBaseProgramWebPartProps } from './types'

export abstract class BaseProgramWebPart<
  T extends IBaseProgramWebPartProps
> extends BaseClientSideWebPart<T> {
  protected _sp: SPFI

  /**
   * The data adapter used to communicate with SharePoint.
   */
  protected _dataAdapter: SPDataAdapter

  /**
   * The hub site associated with the current site.
   */
  public hubSite: IHubSite

  /**
   * An array of child project objects
   */
  public childProjects: Array<Record<string, string>>

  /**
   * An array of site IDs for the child projects.
   */
  public siteIds: string[]

  /**
   * Abstract method to render the web part.É
   */
  public abstract render(): void

  /**
   * Renders a React component with the combined properties of the web part and the provided props.
   *
   * Includes `this.properties`, the provided `props`, and the following additional props:
   * - `sp`: The SPFI instance.
   * - `spfxContext`: The SPFx context.
   * - `pageContext`: The SPFx page context.
   * - `dataAdapter`: The SPDataAdapter instance.
   * - `displayMode`: The current display mode.
   * - `title`: The web part title.
   *
   * @param component The React component to render.
   * @param props Optional props to merge with the web part properties.
   *
   * @returns void
   */
  public renderComponent<T = any>(component: ComponentClass<T> | FC<T>, props?: T): void {
    const combinedProps = {
      ...this.properties,
      ...props,
      sp: this._sp,
      spfxContext: this.context,
      pageContext: this.context.pageContext,
      dataAdapter: this._dataAdapter,
      displayMode: this.displayMode,
      title: this.properties.title
    }
    const element: ReactElement<T> = createElement(component, combinedProps)
    render(element, this.domElement)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this._sp = createSpfiInstance(this.context)
    this._dataAdapter = new SPDataAdapter()
    await this._dataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    })
    await this._dataAdapter.initChildProjects()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}

export * from './types'
