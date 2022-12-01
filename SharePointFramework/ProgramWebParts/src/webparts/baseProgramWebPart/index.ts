import { IPropertyPaneConfiguration } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import { SPFI, spfi, SPFx } from '@pnp/sp'
import assign from 'object-assign'
import React, { ComponentClass, FC } from 'react'
import * as ReactDom from 'react-dom'
import HubSiteService, { IHubSiteContext } from 'sp-hubsite-service'
import { SPDataAdapter } from '../../data'
import { IBaseProgramWebPartProps } from './types'

export abstract class BaseProgramWebPart<
  T extends IBaseProgramWebPartProps
> extends BaseClientSideWebPart<T> {
  public sp: SPFI
  public dataAdapter: SPDataAdapter
  public hubSite: IHubSiteContext
  public childProjects: Array<Record<string, string>>
  public siteIds: string[]

  public abstract render(): void

  public renderComponent<T = any>(component: ComponentClass<T> | FC<T>, props?: T): void {
    const combinedProps = assign(this.properties, props, {
      sp: this.sp,
      spfxContext: this.context,
      pageContext: this.context.pageContext,
      dataAdapter: this.dataAdapter,
      displayMode: this.displayMode,
      title: this.properties.title
    } as IBaseProgramWebPartProps)
    const element: React.ReactElement<T> = React.createElement(component, combinedProps)
    ReactDom.render(element, this.domElement)
  }

  public async getChildProjects(): Promise<Array<Record<string, string>>> {
    try {
      const projectProperties = await this.sp.web.lists
        .getByTitle('Prosjektegenskaper')
        .items.getById(1)()
      const childProjects = JSON.parse(projectProperties.GtChildProjects)
      return childProjects.length > 0
        ? childProjects
        : [{ SiteId: '00000000-0000-0000-0000-000000000000', Title: '' }]
    } catch (error) {
      return []
    }
  }

  private async _setup() {
    await this.dataAdapter.configure(this.context, { hubSiteContext: this.hubSite })
  }

  public async onInit(): Promise<void> {
    this.sp = spfi().using(SPFx(this.context))
    this.hubSite = await HubSiteService.GetHubSite(this.context)
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
