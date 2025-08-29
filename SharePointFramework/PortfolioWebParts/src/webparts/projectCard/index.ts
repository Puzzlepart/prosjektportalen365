/* eslint-disable quotes */
/* eslint-disable no-console */

import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import { IProjectCardProps, ProjectCard } from 'components/ProjectCard'
import {
  CustomCollectionFieldType,
  PropertyFieldCollectionData,
  PropertyFieldMultiSelect,
  PropertyFieldToggleWithCallout
} from '@pnp/spfx-property-controls'
import { CalloutTriggers } from '@pnp/spfx-property-controls/lib/PropertyFieldHeader'
import { createElement } from 'react'
import { PortalDataService, ProjectColumn } from 'pp365-shared-library'
import { IHubContext } from '../../data/types'
import { spfi, SPFx } from '@pnp/sp'
import '@pnp/sp/webs'
import '@pnp/sp/lists'
import '@pnp/sp/items'
import '@pnp/sp/files'
import '@pnp/sp/hubsites'

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
    this._hubContext = this.createHubContext()

    this._portalDataService = await new PortalDataService().configure({
      spfxContext: this.context
    })

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
      projectSiteId: this._projectSiteId || this.properties.projectSiteId,
      hubContext: this._hubContext
    })
  }

  private createHubContext(): IHubContext | undefined {
    if (this._hubSiteId && this._hubSiteUrl) {
      return {
        hubSiteId: this._hubSiteId,
        hubSiteUrl: this._hubSiteUrl,
        spfxContext: this.context
      }
    }
    return undefined
  }

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
            } catch (hubError) {
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
      ...ProjectCard.defaultProps.quickLaunchMenu,
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
                PropertyPaneDropdown('primaryField', {
                  label: strings.PrimaryFieldLabel,
                  options: this._columnFieldOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.primaryField ?? 'GtProjectServiceArea'
                }),
                PropertyPaneDropdown('secondaryField', {
                  label: strings.SecondaryFieldLabel,
                  options: this._columnFieldOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.secondaryField ?? 'GtProjectType'
                }),
                PropertyPaneDropdown('primaryUserField', {
                  label: strings.PrimaryUserFieldLabel,
                  options: this._columnUserOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.primaryUserField ?? 'GtProjectOwner'
                }),
                PropertyPaneDropdown('secondaryUserField', {
                  label: strings.SecondaryUserFieldLabel,
                  options: this._columnUserOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.secondaryUserField ?? 'GtProjectManager'
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
