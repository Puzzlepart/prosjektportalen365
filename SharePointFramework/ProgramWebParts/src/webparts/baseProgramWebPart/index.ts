import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { ConsoleListener, Logger, LogLevel } from '@pnp/logging'
import '@pnp/polyfill-ie11'
import { sp } from '@pnp/sp'
import { DataAdapter } from 'data'
import assign from 'object-assign'
import React from 'react'
import * as ReactDom from 'react-dom'
import HubSiteService, { IHubSite } from 'sp-hubsite-service'
import { IChildProject } from 'types/IChildProject'
import { IBaseProgramWebPartProps } from './types'

export abstract class BaseProgramWebPart<
  T extends IBaseProgramWebPartProps
> extends BaseClientSideWebPart<T> {
  public dataAdapter: DataAdapter
  public pageTitle: string
  public webPartTitle: string
  public hubSite: IHubSite
  public childProjects: IChildProject[]
  public siteIds: string[]

  public abstract render(): void

  public renderComponent<T = any>(
    component: React.ComponentClass<T> | React.FunctionComponent<T>,
    props?: T
  ): void {
    const combinedProps = assign({ title: this.pageTitle }, this.properties, props, {
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode,
      title: this.properties.title
    })
    const element: React.ReactElement<T> = React.createElement(component, combinedProps)
    ReactDom.render(element, this.domElement)
  }

  public async getChildProjects(): Promise< IChildProject[]> {
    try {
      const projectProperties = await sp.web.lists
        .getByTitle('Prosjektegenskaper')
        .items.getById(1)
        .get()
      const childProjects: IChildProject[] = JSON.parse(projectProperties.GtChildProjects)
     return  childProjects.length > 0
          ? childProjects
          : [{ SiteId: '00000000-0000-0000-0000-000000000000', Title: '' }]
    } catch (error) {
     return []
    }
  }

  private async _setup() {
    sp.setup({ spfxContext: this.context })
    Logger.subscribe(new ConsoleListener())
    Logger.activeLogLevel = sessionStorage.DEBUG || DEBUG ? LogLevel.Info : LogLevel.Warning
    try {
      this.pageTitle = (
        await sp.web.lists
          .getById(this.context.pageContext.list.id.toString())
          .items.getById(this.context.pageContext.listItem.id)
          .select('Title')
          .usingCaching()
          .get<{ Title: string }>()
      ).Title
    } catch (error) { }
  }

  public async onInit(): Promise<void> {
    sp.setup({ sp: { baseUrl: this.context.pageContext.web.absoluteUrl } })
    this.hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext)
    this.childProjects = await this.getChildProjects()
    this.dataAdapter = new DataAdapter(this.context, this.hubSite, this.childProjects)
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }
}

export * from './types'
