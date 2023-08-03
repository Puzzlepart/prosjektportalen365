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
import { IProjectListProps, ProjectList } from 'components/ProjectList'
import { ProjectListVerticals } from 'components/ProjectList/ProjectListVerticals'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../@basePortfolioWebPart'
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
                  calloutTrigger: CalloutTriggers.Click,
                  key: 'showSearchBoxFieldId',
                  label: strings.ShowSearchBoxLabel,
                  calloutContent: React.createElement(
                    'p',
                    {},
                    'Her kan du velge om søkeboksen skal vises eller ikke.'
                  ),
                  onText: strings.BooleanOn,
                  offText: strings.BooleanOff,
                  checked: this.properties.showSearchBox
                }),
                PropertyFieldToggleWithCallout('showRenderModeSelector', {
                  calloutTrigger: CalloutTriggers.Click,
                  key: 'showRenderModeSelectorFieldId',
                  label: strings.ShowRenderModeSelectorLabel,
                  calloutContent: React.createElement(
                    'p',
                    {},
                    'Her kan du velge om visningsvelgeren skal vises eller ikke.'
                  ),
                  onText: strings.BooleanOn,
                  offText: strings.BooleanOff,
                  checked: this.properties.showRenderModeSelector
                }),
                PropertyFieldDropdownWithCallout('defaultRenderMode', {
                  calloutTrigger: CalloutTriggers.Hover,
                  key: 'defaultVerticalFieldId',
                  label: strings.DefaultRenderModeLabel,
                  options: [
                    {
                      key: 'list',
                      text: strings.RenderModeListText
                    },
                    {
                      key: 'tiles',
                      text: strings.RenderModeTilesText
                    }
                  ],
                  selectedKey: this.properties.defaultRenderMode,
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
                  calloutContent: React.createElement(
                    'p',
                    {},
                    "Her kan du velge hvilken vertikal som skal være standard. Merk! dersom vertikalen 'Alle prosjekter' er valgt som standard og brukere ikke har tilgang til 'Alle prosjekter' vertikalen, vil standard bli 'Mine prosjekter'."
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
                PropertyPaneToggle('showProjectOwner', {
                  label: strings.ShowProjectOwnerFieldLabel
                }),
                PropertyPaneToggle('showProjectManager', {
                  label: strings.ShowProjectManagerFieldLabel
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
