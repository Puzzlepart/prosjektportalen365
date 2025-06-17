/* eslint-disable quotes */
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
import { SPHttpClient } from '@microsoft/sp-http'

export default class ProjectCardWebPart extends BasePortfolioWebPart<IProjectCardProps> {
  private _portalDataService: PortalDataService
  private _columns: ProjectColumn[]
  private _columnFieldOptions: { key: string; text: string }[]
  private _columnUserOptions: { key: string; text: string }[]
  private _projectSiteId: string

  public async onInit(): Promise<void> {
    await super.onInit()

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
    })
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
            description: 'Prosjektkort'
          },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('projectSiteId', {
                  label: 'Område ID',
                  description: 'ID for SharePoint-området (Prosjektet)'
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
                PropertyPaneDropdown('primaryField', {
                  label: 'strings.PrimaryFieldLabel',
                  options: this._columnFieldOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.primaryField ?? 'GtProjectServiceArea'
                }),
                PropertyPaneDropdown('secondaryField', {
                  label: 'strings.SecondaryFieldLabel',
                  options: this._columnFieldOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.secondaryField ?? 'GtProjectType'
                }),
                PropertyPaneDropdown('primaryUserField', {
                  label: 'strings.PrimaryUserFieldLabel',
                  options: this._columnUserOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.primaryUserField ?? 'GtProjectOwner'
                }),
                PropertyPaneDropdown('secondaryUserField', {
                  label: 'strings.SecondaryUserFieldLabel',
                  options: this._columnUserOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.secondaryUserField ?? 'GtProjectManager'
                }),
                PropertyFieldMultiSelect('projectMetadata', {
                  key: 'projectMetadataFieldId',
                  label: strings.ProjectMetadataFieldLabel,
                  options: [
                    {
                      key: 'PrimaryUserField',
                      text: 'Primær bruker'
                    },
                    {
                      key: 'SecondaryUserField',
                      text: 'Sekundær bruker'
                    },
                    {
                      key: 'PrimaryField',
                      text: 'Primær felt'
                    },
                    {
                      key: 'SecondaryField',
                      text: 'Sekundær felt'
                    },
                    {
                      key: 'ProjectPhase',
                      text: strings.PhaseLabel
                    }
                  ],
                  selectedKeys: this.properties.projectMetadata ?? []
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
