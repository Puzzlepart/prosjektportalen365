/* eslint-disable no-console */

import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import { IProjectCardProps, PROJECT_CARD_DEFAULT_PROPS, ProjectCard } from 'components/ProjectCard'
// Not the project list's barrel, which would bring the whole list into this bundle.
import { getFieldOptionKey } from 'components/ProjectList/getFieldOptionKey'
import {
  CustomCollectionFieldType,
  PropertyFieldCollectionData
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'
import { PropertyFieldDropdownWithCallout } from '@pnp/spfx-property-controls/lib/PropertyFieldDropdownWithCallout'
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect'
import { PropertyFieldToggleWithCallout } from '@pnp/spfx-property-controls/lib/PropertyFieldToggleWithCallout'
import { CalloutTriggers } from '@pnp/spfx-property-controls/lib/PropertyFieldHeader'
import { createElement } from 'react'
import { isHubSite, PortalDataService, ProjectColumn } from 'pp365-shared-library'
import { IHubContext } from '../../data/types'
import { spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/files'
import '@pnp/sp/hubsites'

/** Resolve a page's project and hub and host its configurable project card. */
export default class ProjectCardWebPart extends BasePortfolioWebPart<IProjectCardProps> {
  private _portalDataService: PortalDataService
  private _columns: ProjectColumn[]
  private _columnFieldOptions: { key: string; text: string }[]
  private _columnUserOptions: { key: string; text: string }[]
  private _projectSiteId: string
  private _hubSiteId: string
  private _hubSiteUrl: string
  private _hubContext: IHubContext

  public async onInit(): Promise<void> {
    await super.onInit()

    this._projectSiteId = await this.getProjectSiteId()

    this._portalDataService = await new PortalDataService().configure({
      spfxContext: this.context
    })
    // After the portal data service, which knows the hub of the site the page is on.
    this._hubContext = this.createHubContext()

    this._columns = await this._portalDataService.getProjectColumns()

    this._columnFieldOptions = this._columns.map((column) => ({
      key: column.internalName,
      text: column.name
    }))

    this._columnUserOptions = this._columns
      .filter((column) => column.dataType === 'user')
      .map((column) => ({
        key: column.internalName,
        text: column.name
      }))
  }

  public render(): void {
    this.renderComponent<IProjectCardProps>(ProjectCard, {
      ...this.properties,
      projectColumns: this._columns,
      projectSiteId:
        this._projectSiteId || this.properties.projectSiteId || this.getOwnProjectSiteId(),
      hubContext: this._hubContext
    })
  }

  /**
   * The hub the project is read from, when that is not the site the page is on: the hub the
   * page's news item names, else the hub of the project site the page is on. `Prosjekter` and
   * `Maloppsett` are lists of the hub, and a card on a project site asked the project site for
   * them and showed «Prosjektet kunne ikke hentes».
   */
  private createHubContext(): IHubContext | undefined {
    if (this._hubSiteId && this._hubSiteUrl) {
      return {
        hubSiteId: this._hubSiteId,
        hubSiteUrl: this._hubSiteUrl,
        spfxContext: this.context
      }
    }
    if (this.isOnProjectSite()) {
      return {
        hubSiteId: this.context.pageContext.legacyPageContext.hubSiteId,
        hubSiteUrl: this._portalDataService.url,
        spfxContext: this.context
      }
    }
    return undefined
  }

  /** Whether the page is on a site of the hub other than the hub itself, with the hub in reach. */
  private isOnProjectSite(): boolean {
    const portal = this._portalDataService
    return !!portal?.url && portal.isAvailable !== false && !isHubSite(this.context.pageContext)
  }

  /**
   * The project a card on a project site shows when neither its page nor its pane names one: the
   * site it is on.
   */
  private getOwnProjectSiteId(): string | undefined {
    return this.isOnProjectSite() ? this.context.pageContext.site.id.toString() : undefined
  }

  /** Read the page's referenced project ID and resolve a different source hub when specified. */
  protected async getProjectSiteId(): Promise<string> {
    if (!this._projectSiteId) {
      try {
        const sp = spfi().using(SPFx(this.context))
        let sitePageData: any = null

        if (this.context.pageContext.listItem && this.context.pageContext.listItem.id) {
          try {
            const listItem = await sp.web.lists
              .getByTitle('Områdesider')
              .items.getById(this.context.pageContext.listItem.id)
              .select('GtSiteId', 'GtHubSiteId')()
            sitePageData = listItem
          } catch (listError) {
            console.warn('Failed to get data from Områdesider list, trying Site Pages:', listError)

            try {
              const sitePageItem = await sp.web.lists
                .getByTitle('Site Pages')
                .items.getById(this.context.pageContext.listItem.id)
                .select('GtSiteId', 'GtHubSiteId')()
              sitePageData = sitePageItem
            } catch (sitePageError) {
              console.warn('Failed to get data from Site Pages list:', sitePageError)
            }
          }
        }

        if (sitePageData) {
          const gtSiteId = sitePageData.GtSiteId
          const gtHubSiteId = sitePageData.GtHubSiteId
          const currentHubSiteId = this.context.pageContext.legacyPageContext.hubSiteId

          if (gtHubSiteId && currentHubSiteId && gtHubSiteId !== currentHubSiteId) {
            try {
              const hubSiteInfo = await sp.hubSites.getById(gtHubSiteId)()

              if (hubSiteInfo && hubSiteInfo.SiteUrl) {
                this._hubSiteUrl = hubSiteInfo.SiteUrl
                this._hubSiteId = gtHubSiteId

                const hubSp = spfi(this._hubSiteUrl).using(SPFx(this.context))
                await hubSp.web.select('Id', 'Title', 'Url')()

                this._projectSiteId = gtSiteId
              } else {
                this._projectSiteId = gtSiteId
              }
            } catch {
              // Keep the referenced project ID even when its source hub cannot be resolved.
              this._projectSiteId = gtSiteId
            }
          } else {
            this._projectSiteId = gtSiteId
          }
        } else {
          this._projectSiteId = null
        }
      } catch (error) {
        console.error('Error getting project site ID:', error)
        this._projectSiteId = null
      }
    }
    return this._projectSiteId
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const quickLaunchMenu = {
      ...PROJECT_CARD_DEFAULT_PROPS.quickLaunchMenu,
      ...this.properties.quickLaunchMenu
    }

    return {
      pages: [
        {
          header: {
            description: strings.ProjectCard.WebPartDescription
          },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('projectSiteId', {
                  label: strings.ProjectCard.ProjectSiteIdFieldLabel,
                  description: strings.ProjectCard.ProjectSiteIdFieldDescription
                })
              ]
            },
            {
              groupName: strings.TileViewGroupName,
              groupFields: [
                PropertyPaneToggle('showProjectLogo', {
                  label: strings.ShowProjectLogoFieldLabel
                }),
                PropertyFieldToggleWithCallout('useDynamicColors', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'useDynamicColorsFieldId',
                  label: strings.UseDynamicColorsLabel,
                  calloutContent: createElement('p', {}, strings.UseDynamicColorsDescription),
                  onText: strings.BooleanOn,
                  offText: strings.BooleanOff,
                  calloutWidth: 430,
                  checked: this.properties.useDynamicColors,
                  disabled: !this.properties.showProjectLogo
                }),
                PropertyFieldMultiSelect('projectMetadata', {
                  key: 'projectMetadataFieldId',
                  label: strings.ProjectMetadataFieldLabel,
                  options: [
                    {
                      key: 'PrimaryField',
                      text: strings.PrimaryFieldLabel
                    },
                    {
                      key: 'SecondaryField',
                      text: strings.SecondaryFieldLabel
                    },
                    {
                      key: 'PrimaryUserField',
                      text: strings.PrimaryUserFieldLabel
                    },
                    {
                      key: 'SecondaryUserField',
                      text: strings.SecondaryUserFieldLabel
                    },
                    {
                      key: 'ProjectPhase',
                      text: strings.PhaseLabel
                    }
                  ],
                  selectedKeys: this.properties.projectMetadata ?? []
                }),
                PropertyFieldDropdownWithCallout('primaryField', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'primaryFieldId',
                  label: strings.PrimaryFieldLabel,
                  options: this._columnFieldOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: getFieldOptionKey(
                    this.properties.primaryField ?? PROJECT_CARD_DEFAULT_PROPS.primaryField,
                    this._columnFieldOptions
                  ),
                  calloutWidth: 430,
                  calloutContent: createElement('p', {}, strings.RefreshRequiredDescription)
                }),
                PropertyFieldDropdownWithCallout('secondaryField', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'secondaryFieldId',
                  label: strings.SecondaryFieldLabel,
                  options: this._columnFieldOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: getFieldOptionKey(
                    this.properties.secondaryField ?? PROJECT_CARD_DEFAULT_PROPS.secondaryField,
                    this._columnFieldOptions
                  ),
                  calloutWidth: 430,
                  calloutContent: createElement('p', {}, strings.RefreshRequiredDescription)
                }),
                PropertyFieldDropdownWithCallout('primaryUserField', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'primaryUserFieldId',
                  label: strings.PrimaryUserFieldLabel,
                  options: this._columnUserOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.primaryUserField ?? 'GtProjectOwner',
                  calloutWidth: 430,
                  calloutContent: createElement('p', {}, strings.RefreshRequiredDescription)
                }),
                PropertyFieldDropdownWithCallout('secondaryUserField', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'secondaryUserFieldId',
                  label: strings.SecondaryUserFieldLabel,
                  options: this._columnUserOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.secondaryUserField ?? 'GtProjectManager',
                  calloutWidth: 430,
                  calloutContent: createElement('p', {}, strings.RefreshRequiredDescription)
                }),
                PropertyFieldCollectionData('quickLaunchMenu', {
                  key: 'quickLaunchFieldId',
                  label: strings.ProjectListQuickLaunch,
                  panelHeader: strings.ProjectListQuickLaunch,
                  manageBtnLabel: strings.EditProjectListQuickLaunch,
                  value: quickLaunchMenu,
                  fields: [
                    {
                      id: 'order',
                      title: strings.SortOrderLabel,
                      type: CustomCollectionFieldType.number,
                      required: true
                    },
                    {
                      id: 'text',
                      title: strings.ColumnRenderOptionText,
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'relativeUrl',
                      title: strings.RelativeUrl,
                      type: CustomCollectionFieldType.string,
                      required: true
                    }
                  ]
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
