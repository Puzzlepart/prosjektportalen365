/* eslint-disable quotes */
import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { CalloutTriggers } from '@pnp/spfx-property-controls/lib/PropertyFieldHeader'
import {
  PropertyFieldDropdownWithCallout,
  PropertyFieldMultiSelect,
  PropertyFieldToggleWithCallout
} from '@pnp/spfx-property-controls'
import {
  PropertyFieldCollectionData,
  CustomCollectionFieldType
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'
import { IProjectListProps, ProjectList } from 'components/ProjectList'
import { ProjectListVerticals } from 'components/ProjectList/ProjectListVerticals'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import React from 'react'

export default class ProjectListWebPart extends BasePortfolioWebPart<IProjectListProps> {
  public render(): void {
    this.renderComponent<IProjectListProps>(ProjectList)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
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
                      key: 'ProjectOwner',
                      text: strings.ProjectOwner
                    },
                    {
                      key: 'ProjectManager',
                      text: strings.ProjectManager
                    },
                    {
                      key: 'ProjectServiceArea',
                      text: strings.ProjectServiceArea
                    },
                    {
                      key: 'ProjectType',
                      text: strings.ProjectType
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
