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
import HubSiteService, { IHubSite } from 'sp-hubsite-service'
import { ChildProject } from 'models/ChildProject'

export abstract class BaseProgramWebPart<
  T extends IBaseComponentProps
> extends BaseClientSideWebPart<T> {
  public dataAdapter: DataAdapter
  public pageTitle: string
  public hubSite: IHubSite
  public siteIds: string[]

  public abstract render(): void

  public renderComponent<T = any>(
    component: React.ComponentClass<T> | React.FunctionComponent<T>,
    props?: T
  ): void {
    const combinedProps = assign({ title: this.pageTitle }, this.properties, props, {
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode
    })
    const element: React.ReactElement<T> = React.createElement(component, combinedProps)
    ReactDom.render(element, this.domElement)
  }

  private async getChildProjectSiteIds(): Promise<void> {
    try {
    const projectProperties = await sp.web.lists.getByTitle("Prosjektegenskaper").items.getById(1).get()
    console.log(projectProperties);
    const childProjects: ChildProject[] = JSON.parse(projectProperties.GtChildProjects)
    this.siteIds = childProjects.map(project => {return project.SiteID})
    } catch (error) {
      Logger.write(error, LogLevel.Error)
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
          .get<{ Title: string }>()
      ).Title
    } catch (error) {}
  }

  public async onInit(): Promise<void> {
    this.hubSite = await HubSiteService.GetHubSite(sp, this.context.pageContext)
    sp.setup({sp: {baseUrl: this.context.pageContext.web.absoluteUrl}})
    await this.getChildProjectSiteIds()
    this.dataAdapter = new DataAdapter(this.context, this.hubSite, this.siteIds)
    this.context.statusRenderer.clearLoadingIndicator(this.domElement)
    await this._setup()
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return { pages: [] }
  }

}