/* eslint-disable quotes */
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneLabel,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'PortfolioWebPartsStrings'
import { BasePortfolioWebPart } from '../basePortfolioWebPart'
import { IProjectProvisionProps, ProjectProvision } from 'components/ProjectProvision'
import { PropertyFieldMessage } from '@pnp/spfx-property-controls/lib/PropertyFieldMessage'
import { PropertyPanePropertyEditor } from '@pnp/spfx-property-controls/lib/PropertyPanePropertyEditor'
import {
  PropertyFieldCollectionData,
  CustomCollectionFieldType
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'

export default class ProjectProvisionWebPart extends BasePortfolioWebPart<IProjectProvisionProps> {
  public render(): void {
    this.renderComponent<IProjectProvisionProps>(ProjectProvision)
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    // this.properties.fields = this.properties.fields || ProjectProvision.defaultProps.fields
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: 'Områdebestilling'
          },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('provisionUrl', {
                  label: 'Provisjoneringsområde',
                  description: 'URL til området som håndterer bestillinger'
                })
              ]
            },
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneDropdown('siteTypeRenderMode', {
                  label: 'Visning av områdetype',
                  options: [
                    { key: 'cardNormal', text: 'Kort (med bilde)' },
                    { key: 'cardMinimal', text: 'Kort (uten bilde og beskrivelse)' },
                    { key: 'dropdown', text: 'Nedtrekksliste' }
                  ],
                  selectedKey: this.properties.siteTypeRenderMode ?? 'cardNormal'
                })
              ]
            },
            {
              groupName: 'Avansert',
              isCollapsed: true,
              groupFields: [
                PropertyFieldCollectionData('fields', {
                  key: 'fields',
                  label: 'Felt konfigurasjon',
                  panelProps: {
                    type: 6
                  },
                  panelHeader: 'Konfigurasjon av felter i bestillingsskjema',
                  manageBtnLabel: 'Konfigurer felter',
                  value: this.properties.fields,
                  disableItemCreation: true,
                  disableItemDeletion: true,
                  fields: [
                    {
                      id: 'order',
                      title: 'Standard rekkefølge',
                      type: CustomCollectionFieldType.number,
                      disableEdit: true
                    },
                    {
                      id: 'fieldName',
                      title: 'Feltnavn (internt)',
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'displayName',
                      title: 'Visningsnavn',
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'description',
                      title: 'Beskrivelse',
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'placeholder',
                      title: 'Plassholder',
                      type: CustomCollectionFieldType.string
                    },
                    {
                      id: 'dataType',
                      title: 'Felttype',
                      type: CustomCollectionFieldType.dropdown,
                      disableEdit: true,
                      options: [
                        { key: 'text', text: 'Tekst' },
                        { key: 'note', text: 'Notat' },
                        { key: 'number', text: 'Tall' },
                        { key: 'choice', text: 'Valg' },
                        { key: 'user', text: 'Enkeltbruker' },
                        { key: 'userMulti', text: 'Flere brukere' },
                        { key: 'guest', text: 'Gjestebrukere' },
                        { key: 'date', text: 'Dato' },
                        { key: 'tags', text: 'Taksonomi' },
                        { key: 'boolean', text: 'Ja/nei' },
                        { key: 'percentage', text: 'Prosent' },
                        { key: 'site', text: 'Område' }
                      ],
                      defaultValue: 'text'
                    },
                    {
                      id: 'required',
                      title: 'Påkrevd felt',
                      type: CustomCollectionFieldType.boolean,
                      defaultValue: false
                    },
                    {
                      id: 'level',
                      title: 'Side i skjema',
                      type: CustomCollectionFieldType.number,
                      disableEdit: true,
                      defaultValue: 1
                    }
                  ]
                }),
                PropertyPaneLabel('propertyEditorLabel', {
                  text: 'Rediger webdelens egenskaper (JSON)'
                }),
                PropertyPanePropertyEditor({
                  key: 'propertyEditor',
                  webpart: this
                }),
                PropertyFieldMessage('propertyEditorDescription', {
                  key: 'propertyEditorDescription',
                  messageType: 0,
                  text: 'Her kan du redigere webdelens egenskaper i JSON-format. Eksport og import av egenskaper er også mulig slik at oppsett kan gjenbrukes og importeres i andre ansattsøk webdeler.',
                  isVisible: true
                }),
                PropertyPaneToggle('debugMode', {
                  label: 'DebugMode',
                  onText: 'På',
                  offText: 'Av'
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
