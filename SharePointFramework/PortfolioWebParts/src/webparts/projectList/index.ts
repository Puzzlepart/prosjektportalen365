/* eslint-disable quotes */
import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import {
  PropertyFieldDropdownWithCallout,
  PropertyFieldMultiSelect,
  PropertyFieldToggleWithCallout
} from '@pnp/spfx-property-controls'
import {
  CustomCollectionFieldType,
  PropertyFieldCollectionData
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'
import { CalloutTriggers } from '@pnp/spfx-property-controls/lib/PropertyFieldHeader'
import * as strings from 'PortfolioWebPartsStrings'
import { IProjectListProps, ProjectList, ProjectListVerticals } from 'components/ProjectList'
import React from 'react'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import { PortalDataService, ProjectColumn } from 'pp365-shared-library'

export default class ProjectListWebPart extends BasePortfolioWebPart<IProjectListProps> {
  private _portalDataService: PortalDataService
  private _columns: ProjectColumn[]
  private _columnFieldOptions: { key: string; text: string }[]
  private _columnUserOptions: { key: string; text: string }[]

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
    this.renderComponent<IProjectListProps>(ProjectList, {
      ...this.properties,
      projectColumns: this._columns
    })
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const verticalOptions = ProjectListVerticals.map<IPropertyPaneDropdownOption>((vertical) => ({
      key: vertical.key,
      text: vertical.text
    }))

    const quickLaunchMenu = {
      ...ProjectList.defaultProps.quickLaunchMenu,
      ...this.properties.quickLaunchMenu
    }

    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('sortBy', {
                  label: strings.SortByFieldLabel,
                  description: strings.SortByFieldDescription,
                  disabled: true
                }),
                PropertyFieldToggleWithCallout('showSearchBox', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'showSearchBoxFieldId',
                  label: strings.ShowSearchBoxLabel,
                  calloutContent: React.createElement('p', {}, strings.ShowSearchBoxDescription),
                  onText: strings.BooleanOn,
                  offText: strings.BooleanOff,
                  calloutWidth: 430,
                  checked: this.properties.showSearchBox
                }),
                PropertyFieldToggleWithCallout('showRenderModeSelector', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'showRenderModeSelectorFieldId',
                  label: strings.ShowRenderModeSelectorLabel,
                  calloutContent: React.createElement(
                    'p',
                    {},
                    strings.ShowRenderModeSelectorDescription
                  ),
                  onText: strings.BooleanOn,
                  offText: strings.BooleanOff,
                  calloutWidth: 430,
                  checked: this.properties.showRenderModeSelector
                }),
                PropertyFieldToggleWithCallout('showSortBy', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'showSortByFieldId',
                  label: strings.ShowSortByLabel,
                  calloutContent: React.createElement('p', {}, strings.ShowSortByDescription),
                  onText: strings.BooleanOn,
                  offText: strings.BooleanOff,
                  calloutWidth: 430,
                  checked: this.properties.showSortBy
                }),
                PropertyFieldDropdownWithCallout('defaultRenderMode', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'defaultVerticalFieldId',
                  label: strings.DefaultRenderModeLabel,
                  options: [
                    {
                      key: 'tiles',
                      text: strings.RenderModeTilesText
                    },
                    {
                      key: 'list',
                      text: strings.RenderModeListText
                    },
                    {
                      key: 'compactList',
                      text: strings.RenderModeCompactListText
                    }
                  ],
                  selectedKey: this.properties.defaultRenderMode,
                  calloutWidth: 430,
                  calloutContent: React.createElement('p', {}, strings.DefaultRenderModeDescription)
                }),
                PropertyFieldDropdownWithCallout('defaultVertical', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'defaultVerticalFieldId',
                  label: strings.DefaultVerticalLabel,
                  options: verticalOptions,
                  selectedKey: this.properties.defaultVertical,
                  calloutWidth: 430,
                  calloutContent: React.createElement('p', {}, strings.DefaultVerticalDescription)
                }),
                PropertyFieldMultiSelect('hideVerticals', {
                  key: 'hideVerticalsFieldId',
                  label: strings.HideVerticalsLabel,
                  options: verticalOptions,
                  selectedKeys: this.properties.hideVerticals ?? []
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
                  calloutContent: React.createElement('p', {}, strings.UseDynamicColorsDescription),
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
                  selectedKey: this.properties.primaryField ?? 'GtProjectServiceArea',
                  calloutWidth: 430,
                  calloutContent: React.createElement('p', {}, strings.RefreshRequiredDescription)
                }),
                PropertyFieldDropdownWithCallout('secondaryField', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'secondaryFieldId',
                  label: strings.SecondaryFieldLabel,
                  options: this._columnFieldOptions.map((option) => ({
                    key: option.key,
                    text: option.text
                  })),
                  selectedKey: this.properties.secondaryField ?? 'GtProjectType',
                  calloutWidth: 430,
                  calloutContent: React.createElement('p', {}, strings.RefreshRequiredDescription)
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
                  calloutContent: React.createElement('p', {}, strings.RefreshRequiredDescription)
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
                  calloutContent: React.createElement('p', {}, strings.RefreshRequiredDescription)
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
