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
import {
  IProjectProvisionProps,
  IProvisionField,
  ProjectProvision
} from 'components/ProjectProvision'
import { PropertyFieldMessage } from '@pnp/spfx-property-controls/lib/PropertyFieldMessage'
import { PropertyPanePropertyEditor } from '@pnp/spfx-property-controls/lib/PropertyPanePropertyEditor'
import {
  PropertyFieldCollectionData,
  CustomCollectionFieldType
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'
import { getDefaultFields } from 'components/ProjectProvision/getDefaultFields'

export default class ProjectProvisionWebPart extends BasePortfolioWebPart<IProjectProvisionProps> {
  private _defaultFields = getDefaultFields()

  public render(): void {
    this.renderComponent<IProjectProvisionProps>(ProjectProvision)
  }

  private mergeFields(
    userFields: IProvisionField[],
    defaultFields: IProvisionField[]
  ): IProvisionField[] {
    const userFieldNames = userFields.map((field) => field.fieldName)
    return [
      ...userFields,
      ...defaultFields.filter((defaultField) => !userFieldNames.includes(defaultField.fieldName))
    ]
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this.properties.fields = this.mergeFields(this.properties.fields || [], this._defaultFields)
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const propertiesWithDefaults = { ...ProjectProvision.defaultProps, ...this.properties }

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
                PropertyPaneTextField('buttonLabel', {
                  label: 'Tekst på knapp',
                  description: 'Tekst som vises på knappen for å åpne bestillingsskjemaet.',
                  placeholder: strings.Provision.ProvisionButtonLabel
                })
              ]
            },
            {
              groupName: 'Utseende',
              groupFields: [
                PropertyPaneDropdown('siteTypeRenderMode', {
                  label: 'Visning av områdetype',
                  options: [
                    { key: 'cardNormal', text: 'Kort (med bilde)' },
                    { key: 'cardMinimal', text: 'Kort (uten bilde)' },
                    { key: 'dropdown', text: 'Nedtrekksliste' }
                  ],
                  selectedKey: propertiesWithDefaults.siteTypeRenderMode ?? 'cardNormal'
                })
              ]
            },
            {
              groupName: 'Titler og beskrivelser',
              isCollapsed: true,
              groupFields: [
                PropertyPaneTextField('level0Header', {
                  label: 'Nivå 0 Tittel',
                  description: 'Tittel som vises i første nivå.',
                  placeholder: strings.Provision.DrawerLevel0HeaderText,
                }),
                PropertyPaneTextField('level0Description', {
                  label: 'Beskrivelse',
                  description: 'Beskrivelse av nivå 0. Vises under tittel.',
                  multiline: true,
                  placeholder: strings.Provision.DrawerLevel0DescriptionText,
                  rows: 4
                }),
                PropertyPaneTextField('level1Header', {
                  label: 'Nivå 1 Tittel',
                  description: 'Tittel som vises i andre nivå.',
                  placeholder: strings.Provision.DrawerLevel1HeaderText,
                }),
                PropertyPaneTextField('level1Description', {
                  label: 'Beskrivelse',
                  description: 'Beskrivelse av nivå 1. Vises under tittel.',
                  multiline: true,
                  placeholder: strings.Provision.DrawerLevel1DescriptionText,
                  rows: 4
                }),
                PropertyPaneTextField('level2Header', {
                  label: 'Nivå 2 Tittel',
                  description: 'Tittel som vises i tredje nivå.',
                  placeholder: strings.Provision.DrawerLevel2HeaderText,
                }),
                PropertyPaneTextField('level2Description', {
                  label: 'Beskrivelse',
                  description: 'Beskrivelse av nivå 2. Vises under tittel.',
                  placeholder: strings.Provision.DrawerLevel2DescriptionText,
                  multiline: true,
                  rows: 4
                }),
                PropertyPaneTextField('footerDescription', {
                  label: 'Bunntekst',
                  description: 'Bunntekst som vises i bunnen av bestillingsskjemaet på siste nivå.',
                  placeholder: strings.Provision.DrawerFooterDescriptionText,
                  multiline: true,
                  rows: 4
                })
              ]
            },
            {
              groupName: 'Skjul/vis',
              isCollapsed: true,
              groupFields: [
                PropertyPaneToggle('hideStatusMenu', {
                  label: 'Skjul "Mine bestillinger" meny',
                  checked: propertiesWithDefaults.hideStatusMenu,
                  onText: 'På',
                  offText: 'Av'
                }),
                PropertyPaneToggle('hideSettingsMenu', {
                  label: 'Skjul "Innstillinger" meny',
                  checked: propertiesWithDefaults.hideSettingsMenu,
                  onText: 'På',
                  offText: 'Av'
                })
              ]
            },
            {
              groupName: 'Avansert',
              isCollapsed: false,
              groupFields: [
                PropertyPaneTextField('provisionUrl', {
                  label: 'Provisjoneringsområde',
                  description: 'URL til området som håndterer bestillinger'
                }),
                PropertyFieldCollectionData('fields', {
                  key: 'fields',
                  label: 'Felt konfigurasjon',
                  panelProps: {
                    type: 6
                  },
                  panelHeader: 'Konfigurasjon av felter',
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
                        { key: 'userMulti', text: 'Flere brukere' },
                        { key: 'guest', text: 'Gjestebrukere' },
                        { key: 'date', text: 'Dato' },
                        { key: 'tags', text: 'Taksonomi' },
                        { key: 'boolean', text: 'Ja/nei' },
                        { key: 'percentage', text: 'Prosent' },
                        { key: 'site', text: 'Område' },
                        { key: 'image', text: 'Bilde' }
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
                      id: 'hidden',
                      title: 'Skjul felt',
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
