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

    const quickLaunchMenu = { ...ProjectList.defaultProps.quickLaunchMenu, ...this.properties.quickLaunchMenu }

    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('sortBy', {
                  label: strings.SortByFieldLabel,
                  description: 'Internt feltnavn som brukes til sortinerg av prosjektene',
                  disabled: true
                }),
                PropertyFieldToggleWithCallout('showSearchBox', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'showSearchBoxFieldId',
                  label: strings.ShowSearchBoxLabel,
                  calloutContent: React.createElement(
                    'p',
                    {},
                    'Her kan du velge om søkeboksen skal vises eller ikke.'
                  ),
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
                    'Her kan du velge om visningsvelgeren skal vises eller ikke.'
                  ),
                  onText: strings.BooleanOn,
                  offText: strings.BooleanOff,
                  calloutWidth: 430,
                  checked: this.properties.showRenderModeSelector
                }),
                PropertyFieldToggleWithCallout('showSortBy', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'showSortByFieldId',
                  label: 'Vis sorteringsknapp',
                  calloutContent: React.createElement(
                    'p',
                    {},
                    'Her kan du velge om sorteringsknappen skal vises eller ikke.'
                  ),
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
                  calloutContent: React.createElement(
                    'p',
                    {},
                    'Her kan du velge hvilken visning som skal være standard.'
                  )
                }),
                PropertyFieldDropdownWithCallout('defaultVertical', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'defaultVerticalFieldId',
                  label: strings.DefaultVerticalLabel,
                  options: verticalOptions,
                  selectedKey: this.properties.defaultVertical,
                  calloutWidth: 430,
                  calloutContent: React.createElement(
                    'p',
                    {},
                    'Her kan du velge hvilken vertikal som skal være standard. Merk! dersom vertikalen "Alle prosjekter" er valgt som standard og brukere ikke har tilgang til "Alle prosjekter" vertikalen, vil standard bli "Mine prosjekter".'
                  )
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
                  label: 'Bruk dynamiske farger',
                  calloutContent: React.createElement(
                    'p',
                    {},
                    'Her kan du velge om kortvisningen skal ta i bruk dynamiske farger for logodelen, dette kan medføre lengre innlastningstid og anbefales for mindre porteføljer (krever at "Vis logo" er på).'
                  ),
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
                      title: 'Rekkefølge',
                      type: CustomCollectionFieldType.number,
                      required: true
                    },
                    {
                      id: 'text',
                      title: 'Tekst',
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'relativeUrl',
                      title: 'Relativ url',
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
