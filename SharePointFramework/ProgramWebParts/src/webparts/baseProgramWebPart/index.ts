import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { LogLevel } from '@pnp/logging'
import '@pnp/polyfill-ie11'
import { sp } from '@pnp/sp'
import assign from 'object-assign'
import { IHubSite } from 'pp365-shared/lib/interfaces'
import React, { ComponentClass, FC } from 'react'
import * as ReactDom from 'react-dom'
import { SPDataAdapter } from '../../data'
import { IBaseProgramWebPartProps } from './types'

export abstract class BaseProgramWebPart<
  T extends IBaseProgramWebPartProps
> extends BaseClientSideWebPart<T> {
  public dataAdapter: SPDataAdapter
  public hubSite: IHubSite
  public childProjects: Array<Record<string, string>>
  public siteIds: string[]

  public abstract render(): void

  public renderComponent<T = any>(component: ComponentClass<T> | FC<T>, props?: T): void {
    const combinedProps = assign(this.properties, props, {
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode,
      title: this.properties.title
    })
    const element: React.ReactElement<T> = React.createElement(component, combinedProps)
    ReactDom.render(element, this.domElement)
  }

  public async getChildProjects(): Promise<Array<Record<string, string>>> {
    try {
      const projectProperties = await sp.web.lists
        .getByTitle('Prosjektegenskaper')
        .items.getById(1)
        .get()
      const childProjects = JSON.parse(projectProperties.GtChildProjects)
      return childProjects.length > 0
        ? childProjects
        : [{ SiteId: '00000000-0000-0000-0000-000000000000', Title: '' }]
    } catch (error) {
      return []
    }
  }

  private async _setup() {
    await this.dataAdapter.configure(this.context, {
      siteId: this.context.pageContext.site.id.toString(),
      webUrl: this.context.pageContext.web.absoluteUrl,
      logLevel: sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    })
  }

  public async onInit(): Promise<void> {
    sp.setup({ spfxContext: this.context })
    this.dataAdapter = new SPDataAdapter()
    this.dataAdapter.childProjects = await this.getChildProjects()
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}

export * from './types'
