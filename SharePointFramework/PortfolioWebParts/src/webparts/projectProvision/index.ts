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
  ITypeFieldConfiguration,
  ProjectProvision
} from 'components/ProjectProvision'
import { PropertyFieldMessage } from '@pnp/spfx-property-controls/lib/PropertyFieldMessage'
import { PropertyPanePropertyEditor } from '@pnp/spfx-property-controls/lib/PropertyPanePropertyEditor'
import {
  PropertyFieldCollectionData,
  CustomCollectionFieldType
} from '@pnp/spfx-property-controls/lib/PropertyFieldCollectionData'
import { getDefaultFields } from 'components/ProjectProvision/getDefaultFields'
import { getDefaultTypeFieldConfigurations } from 'components/ProjectProvision/getFieldsForType'
import * as React from 'react'
import { Dropdown, Option, FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import { customLightTheme } from 'pp365-shared-library'

export default class ProjectProvisionWebPart extends BasePortfolioWebPart<IProjectProvisionProps> {
  private _defaultFields = getDefaultFields()
  private _defaultTypeFieldConfigurations = getDefaultTypeFieldConfigurations()

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

  private mergeTypeConfigurations(
    userConfigurations: ITypeFieldConfiguration[],
    defaultConfigurations: ITypeFieldConfiguration[]
  ): ITypeFieldConfiguration[] {
    const userTypeNames = userConfigurations.map((config) => config.typeName)
    return [
      ...userConfigurations,
      ...defaultConfigurations.filter(
        (defaultConfig) => !userTypeNames.includes(defaultConfig.typeName)
      )
    ]
  }

  public async onInit(): Promise<void> {
    await super.onInit()
    this.properties.fields = this.mergeFields(this.properties.fields || [], this._defaultFields)
    this.properties.typeFieldConfigurations = this.mergeTypeConfigurations(
      this.properties.typeFieldConfigurations || [],
      this._defaultTypeFieldConfigurations
    )
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    const propertiesWithDefaults = { ...ProjectProvision.defaultProps, ...this.properties }

    const fieldsValue = [...(this.properties.fields || [])]
    const typeFieldConfigurationsValue = [...(this.properties.typeFieldConfigurations || [])]

    return {
      pages: [
        {
          header: {
            description: strings.Provision.WebPartDescription
          },
          displayGroupsAsAccordion: true,
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneTextField('buttonLabel', {
                  label: strings.Provision.ButtonLabelFieldLabel,
                  description: strings.Provision.ButtonLabelFieldDescription,
                  placeholder: strings.Provision.ProvisionButtonLabel
                }),
                PropertyPaneToggle('autoOwner', {
                  label: strings.Provision.AutoOwnerFieldLabel,
                  checked: propertiesWithDefaults.autoOwner,
                  onText: strings.Provision.AutoOwnerOnText,
                  offText: strings.Provision.AutoOwnerOffText
                }),
                PropertyPaneLabel('propertyEditorLabel', {
                  text: strings.Provision.AutoOwnerFieldDescription
                })
              ]
            },
            {
              groupName: strings.Provision.AppearanceGroupName,
              groupFields: [
                PropertyPaneDropdown('siteTypeRenderMode', {
                  label: strings.Provision.SiteTypeRenderModeFieldLabel,
                  options: [
                    { key: 'cardNormal', text: strings.Provision.SiteTypeRenderModeCardNormal },
                    { key: 'cardMinimal', text: strings.Provision.SiteTypeRenderModeCardMinimal },
                    { key: 'dropdown', text: strings.Provision.SiteTypeRenderModeDropdown }
                  ],
                  selectedKey: propertiesWithDefaults.siteTypeRenderMode ?? 'cardNormal'
                }),
                PropertyPaneDropdown('expirationDateMode', {
                  label: strings.Provision.ExpirationDateModeFieldLabel,
                  options: [
                    { key: 'date', text: strings.Provision.ExpirationDateModeDate },
                    { key: 'monthDropdown', text: strings.Provision.ExpirationDateModeMonthDropdown }
                  ],
                  selectedKey: propertiesWithDefaults.expirationDateMode ?? 'date'
                })
              ]
            },
            {
              groupName: strings.Provision.TitlesAndDescriptionsGroupName,
              isCollapsed: true,
              groupFields: [
                PropertyPaneTextField('level0Header', {
                  label: strings.Provision.Level0HeaderFieldLabel,
                  description: strings.Provision.Level0HeaderFieldDescription,
                  placeholder: strings.Provision.DrawerLevel0HeaderText
                }),
                PropertyPaneTextField('level0Description', {
                  label: strings.Provision.Level0DescriptionFieldLabel,
                  description: strings.Provision.Level0DescriptionFieldDescription,
                  multiline: true,
                  placeholder: strings.Provision.DrawerLevel0DescriptionText,
                  rows: 4
                }),
                PropertyPaneTextField('level1Header', {
                  label: strings.Provision.Level1HeaderFieldLabel,
                  description: strings.Provision.Level1HeaderFieldDescription,
                  placeholder: strings.Provision.DrawerLevel1HeaderText
                }),
                PropertyPaneTextField('level1Description', {
                  label: strings.Provision.Level1DescriptionFieldLabel,
                  description: strings.Provision.Level1DescriptionFieldDescription,
                  multiline: true,
                  placeholder: strings.Provision.DrawerLevel1DescriptionText,
                  rows: 4
                }),
                PropertyPaneTextField('level2Header', {
                  label: strings.Provision.Level2HeaderFieldLabel,
                  description: strings.Provision.Level2HeaderFieldDescription,
                  placeholder: strings.Provision.DrawerLevel2HeaderText
                }),
                PropertyPaneTextField('level2Description', {
                  label: strings.Provision.Level2DescriptionFieldLabel,
                  description: strings.Provision.Level2DescriptionFieldDescription,
                  placeholder: strings.Provision.DrawerLevel2DescriptionText,
                  multiline: true,
                  rows: 4
                }),
                PropertyPaneTextField('footerDescription', {
                  label: strings.Provision.FooterDescriptionFieldLabel,
                  description: strings.Provision.FooterDescriptionFieldDescription,
                  placeholder: strings.Provision.DrawerFooterDescriptionText,
                  multiline: true,
                  rows: 4
                })
              ]
            },
            {
              groupName: strings.Provision.ShowHideGroupName,
              isCollapsed: true,
              groupFields: [
                PropertyPaneToggle('hideStatusMenu', {
                  label: strings.Provision.HideStatusMenuFieldLabel,
                  checked: propertiesWithDefaults.hideStatusMenu,
                  onText: strings.Provision.AutoOwnerOnText,
                  offText: strings.Provision.AutoOwnerOffText
                }),
                PropertyPaneToggle('hideSettingsMenu', {
                  label: strings.Provision.HideSettingsMenuFieldLabel,
                  checked: propertiesWithDefaults.hideSettingsMenu,
                  onText: strings.Provision.AutoOwnerOnText,
                  offText: strings.Provision.AutoOwnerOffText
                })
              ]
            },
            {
              groupName: strings.Provision.AdvancedGroupName,
              isCollapsed: false,
              groupFields: [
                PropertyPaneTextField('provisionUrl', {
                  label: strings.Provision.ProvisionUrlFieldLabel,
                  description: strings.Provision.ProvisionUrlFieldDescription
                }),
                PropertyFieldCollectionData('fields', {
                  key: 'fieldsCollection',
                  label: strings.Provision.FieldsConfigurationLabel,
                  panelProps: {
                    type: 6
                  },
                  panelHeader: strings.Provision.FieldsConfigurationPanelHeader,
                  manageBtnLabel: strings.Provision.FieldsConfigurationManageBtnLabel,
                  value: fieldsValue,
                  disableItemCreation: true,
                  disableItemDeletion: true,
                  fields: [
                    {
                      id: 'order',
                      title: strings.Provision.FieldOrderLabel,
                      type: CustomCollectionFieldType.number,
                      disableEdit: true
                    },
                    {
                      id: 'fieldName',
                      title: strings.Provision.FieldNameLabel,
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'displayName',
                      title: strings.Provision.FieldDisplayNameLabel,
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'description',
                      title: strings.Provision.FieldDescriptionLabel,
                      type: CustomCollectionFieldType.string,
                      required: true
                    },
                    {
                      id: 'placeholder',
                      title: strings.Provision.FieldPlaceholderLabel,
                      type: CustomCollectionFieldType.string
                    },
                    {
                      id: 'dataType',
                      title: strings.Provision.FieldDataTypeLabel,
                      type: CustomCollectionFieldType.dropdown,
                      disableEdit: true,
                      options: [
                        { key: 'text', text: strings.Provision.FieldDataTypeText },
                        { key: 'note', text: strings.Provision.FieldDataTypeNote },
                        { key: 'number', text: strings.Provision.FieldDataTypeNumber },
                        { key: 'choice', text: strings.Provision.FieldDataTypeChoice },
                        { key: 'userMulti', text: strings.Provision.FieldDataTypeUserMulti },
                        { key: 'guest', text: strings.Provision.FieldDataTypeGuest },
                        { key: 'date', text: strings.Provision.FieldDataTypeDate },
                        { key: 'tags', text: strings.Provision.FieldDataTypeTags },
                        { key: 'boolean', text: strings.Provision.FieldDataTypeBoolean },
                        { key: 'percentage', text: strings.Provision.FieldDataTypePercentage },
                        { key: 'site', text: strings.Provision.FieldDataTypeSite },
                        { key: 'image', text: strings.Provision.FieldDataTypeImage }
                      ],
                      defaultValue: 'text'
                    },
                    {
                      id: 'required',
                      title: strings.Provision.FieldRequiredLabel,
                      type: CustomCollectionFieldType.boolean,
                      defaultValue: false
                    },
                    {
                      id: 'hidden',
                      title: strings.Provision.FieldHiddenLabel,
                      type: CustomCollectionFieldType.boolean,
                      defaultValue: false
                    },
                    {
                      id: 'level',
                      title: strings.Provision.FieldLevelLabel,
                      type: CustomCollectionFieldType.number,
                      disableEdit: true,
                      defaultValue: 1
                    }
                  ]
                }),
                PropertyFieldCollectionData('typeFieldConfigurations', {
                  key: 'typeFieldConfigurations',
                  label: strings.Provision.TypeConfigurationLabel,
                  panelProps: {
                    type: 6
                  },
                  panelHeader: strings.Provision.TypeConfigurationPanelHeader,
                  manageBtnLabel: strings.Provision.TypeConfigurationManageBtnLabel,
                  value: typeFieldConfigurationsValue,
                  fields: [
                    {
                      id: 'typeName',
                      title: strings.Provision.TypeNameLabel,
                      type: CustomCollectionFieldType.dropdown,
                      required: true,
                      options: [
                        { key: 'Viva Engage Community', text: 'Viva Engage Community' },
                        { key: 'Microsoft Teams Team', text: 'Microsoft Teams Team' }
                      ]
                    },
                    {
                      id: 'hiddenFields',
                      title: strings.Provision.HiddenFieldsForTypeLabel,
                      type: CustomCollectionFieldType.custom,

                      defaultValue: '',
                      onCustomRender: (field, value, onUpdate, item) => {
                        const availableFields = fieldsValue
                          .filter((f) => !f.hidden)
                          .map((f) => ({
                            key: f.fieldName,
                            text: f.displayName || f.fieldName,
                            disabled: f.required
                          }))

                        let currentHiddenFields: string[] = []
                        if (value) {
                          if (typeof value === 'string') {
                            currentHiddenFields = value
                              .split(',')
                              .map((f) => f.trim())
                              .filter((f) => f)
                          } else if (Array.isArray(value)) {
                            currentHiddenFields = value
                          } else if (typeof value === 'object' && value !== null) {
                            if (value.toString() !== '[object Object]') {
                              currentHiddenFields = value
                                .toString()
                                .split(',')
                                .map((f) => f.trim())
                                .filter((f) => f)
                            }
                          }
                        }

                        const selectedFieldNames = currentHiddenFields
                          .map((fieldName) => {
                            const field = availableFields.find((f) => f.key === fieldName)
                            return field ? field.text : fieldName
                          })
                          .filter((name) => name)

                        const displayValue =
                          selectedFieldNames.length > 0
                            ? selectedFieldNames.join(', ')
                            : strings.Provision.HiddenFieldsForTypePlaceholder

                        return React.createElement(
                          IdPrefixProvider,
                          {
                            value: `hiddenFields-${field.id}-${item?.id || 'new'}`
                          },
                          React.createElement(
                            FluentProvider,
                            {
                              theme: customLightTheme,
                              style: { background: 'transparent' }
                            },
                            React.createElement(
                              Dropdown,
                              {
                                multiselect: true,
                                placeholder: strings.Provision.HiddenFieldsForTypePlaceholder,
                                value: displayValue,
                                selectedOptions: currentHiddenFields,
                                onOptionSelect: (event, data) => {
                                  const newSelectedOptions = data.selectedOptions || []
                                  onUpdate(field.id, newSelectedOptions.join(','))
                                }
                              },
                              availableFields.map((availableField) =>
                                React.createElement(
                                  Option,
                                  {
                                    key: availableField.key,
                                    value: availableField.key,
                                    text: availableField.text,
                                    disabled: availableField.disabled
                                  },
                                  availableField.text
                                )
                              )
                            )
                          )
                        )
                      }
                    },
                    {
                      id: 'fieldConfigurations',
                      title: strings.Provision.FieldConfigurationJsonLabel,
                      type: CustomCollectionFieldType.custom,
                      defaultValue: '',
                      onCustomRender: (field, value, onUpdate) => {
                        let formattedValue = ''
                        if (value) {
                          if (typeof value === 'string') {
                            try {
                              const parsed = JSON.parse(value)
                              formattedValue = JSON.stringify(parsed, null, 2)
                            } catch {
                              formattedValue = value
                            }
                          } else if (typeof value === 'object' && value !== null) {
                            formattedValue = JSON.stringify(value, null, 2)
                          } else {
                            formattedValue = String(value)
                          }
                        }

                        return React.createElement('textarea', {
                          style: {
                            width: '100%',
                            minWidth: '680px',
                            minHeight: '120px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '8px',
                            resize: 'vertical'
                          },
                          placeholder: strings.Provision.FieldConfigurationJsonPlaceholder,
                          defaultValue: formattedValue,
                          onBlur: (event: React.FocusEvent<HTMLTextAreaElement>) => {
                            onUpdate(field.id, event.target.value)
                          },
                          onChange: (() => {
                            let timeout: NodeJS.Timeout
                            return (event: React.ChangeEvent<HTMLTextAreaElement>) => {
                              clearTimeout(timeout)
                              timeout = setTimeout(() => {
                                onUpdate(field.id, event.target.value)
                              }, 500)
                            }
                          })()
                        })
                      }
                    }
                  ]
                }),
                PropertyPaneLabel('propertyEditorLabel', {
                  text: strings.Provision.PropertyEditorLabel
                }),
                PropertyPanePropertyEditor({
                  key: 'propertyEditor',
                  webpart: this
                }),
                PropertyFieldMessage('propertyEditorDescription', {
                  key: 'propertyEditorDescription',
                  messageType: 0,
                  text: strings.Provision.PropertyEditorDescription,
                  isVisible: true
                }),
                PropertyPaneToggle('debugMode', {
                  label: strings.Provision.DebugModeLabel,
                  onText: strings.Provision.DebugModeOnText,
                  offText: strings.Provision.DebugModeOffText
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
