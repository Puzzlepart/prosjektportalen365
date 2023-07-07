import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { LogLevel } from '@pnp/logging'
import '@pnp/polyfill-ie11'
import { sp } from '@pnp/sp'
import { IHubSite } from 'pp365-shared-library/lib/interfaces'
import { ComponentClass, FC, ReactElement, createElement } from 'react'
import { render } from 'react-dom'
import { SPDataAdapter } from '../../data'
import { IBaseProgramWebPartProps } from './types'

export abstract class BaseProgramWebPart<
  T extends IBaseProgramWebPartProps
> extends BaseClientSideWebPart<T> {
  protected _dataAdapter: SPDataAdapter
  public hubSite: IHubSite
  public childProjects: Array<Record<string, string>>
  public siteIds: string[]

  public abstract render(): void

  /**
   * Renders a React component with the combined properties of the web part and the provided props.
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
      ...{
        pageContext: this.context.pageContext,
        dataAdapter: this._dataAdapter,
        displayMode: this.displayMode,
        title: this.properties.title
      }
    }
    const element: ReactElement<T> = createElement(component, combinedProps)
    render(element, this.domElement)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    sp.setup({ spfxContext: this.context })
    this._dataAdapter = new SPDataAdapter()
    await this._dataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    })
    this._dataAdapter.initChildProjects()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}

export * from './types'
