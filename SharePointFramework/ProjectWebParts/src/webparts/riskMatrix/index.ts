import { format } from '@fluentui/react'
import { get } from '@microsoft/sp-lodash-subset'
import {
  IPropertyPaneConfiguration,
  IPropertyPaneField,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import PropertyFieldColorConfiguration from 'components/PropertyFieldColorConfiguration'
import { IRiskMatrixProps, RiskMatrix } from 'components/RiskMatrix'
import * as strings from 'ProjectWebPartsStrings'
import ReactDom from 'react-dom'
import { UncertaintyElementModel } from '../../models'
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart'
import { IRiskMatrixWebPartProps } from './types'

export default class RiskMatrixWebPart extends BaseProjectWebPart<IRiskMatrixWebPartProps> {
  private _items: UncertaintyElementModel[] = []
  private _error: Error

  public async onInit() {
    await super.onInit()
    try {
      this._items = await this._getItems()
    } catch (error) {
      this._error = error
    }
  }

  public render(): void {
    if (this._error) {
      this.renderError(this._error)
    } else {
      this.renderComponent<IRiskMatrixProps>(RiskMatrix, {
        ...this.properties,
        width: this.properties.fullWidth ? '100%' : this.properties.width,
        items: this._items
      })
    }
  }

  protected async _getItems(): Promise<UncertaintyElementModel[]> {
    const {
      probabilityFieldName,
      consequenceFieldName,
      probabilityPostActionFieldName,
      consequencePostActionFieldName
    } = this.properties
    const items: any[] = await this.sp.web.lists
      .getByTitle(this.properties.listName)
      .getItemsByCAMLQuery({ ViewXml: this.properties.viewXml })
    return items.map(
      (i) =>
        new UncertaintyElementModel(
          i,
          get(i, probabilityFieldName, ''),
          get(i, consequenceFieldName, ''),
          get(i, probabilityPostActionFieldName, ''),
          get(i, consequencePostActionFieldName, '')
        )
    )
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected get headerLabelFields(): IPropertyPaneField<any>[] {
    const size = parseInt(this.properties.size ?? '5', 10)
    const overrideHeaderLabels = PropertyPaneToggle(`overrideHeaderLabels.${size}`, {
      label: format(strings.OverrideHeadersLabel, size)
    })
    if (!get(this.properties, `overrideHeaderLabels.${size}`, false)) {
      return [overrideHeaderLabels]
    }
    const headerLabelFields: IPropertyPaneField<any>[] = []
    const probabilityHeaders: string[] = [
      strings.MatrixHeader_VeryHigh,
      strings.MatrixHeader_High,
      strings.MatrixHeader_Medium,
      strings.MatrixHeader_Low,
      strings.MatrixHeader_VeryLow,
      strings.MatrixHeader_ExtremelyLow
    ]
    const consequenceHeaders: string[] = [
      strings.MatrixHeader_Insignificant,
      strings.MatrixHeader_Small,
      strings.MatrixHeader_Moderate,
      strings.MatrixHeader_Serious,
      strings.MatrixHeader_Critical,
      strings.MatrixHeader_VeryCritical
    ]
    for (let i = 0; i < size; i++) {
      const probabilityHeaderFieldName = `headerLabels.${size}.p${i}`
      headerLabelFields.push(
        PropertyPaneTextField(probabilityHeaderFieldName, {
          label: format(strings.ProbabilityHeaderFieldLabel, i + 1),
          placeholder: probabilityHeaders[i]
        })
      )
    }
    for (let i = 0; i < size; i++) {
      const consequenceHeaderFieldName = `headerLabels.${size}.c${i}`
      headerLabelFields.push(
        PropertyPaneTextField(consequenceHeaderFieldName, {
          label: format(strings.ConsequenceHeaderFieldLabel, i + 1),
          placeholder: consequenceHeaders[i]
        })
      )
    }
    return [overrideHeaderLabels, ...headerLabelFields]
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.DataGroupName,
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: strings.ListNameFieldLabel
                }),
                PropertyPaneTextField('viewXml', {
                  label: strings.ViewXmlFieldLabel,
                  multiline: true
                }),
                PropertyPaneTextField('probabilityFieldName', {
                  label: strings.ProbabilityFieldNameFieldLabel
                }),
                PropertyPaneTextField('consequenceFieldName', {
                  label: strings.ConsequenceFieldNameFieldLabel
                }),
                PropertyPaneTextField('probabilityPostActionFieldName', {
                  label: strings.ProbabilityPostActionFieldNameFieldLabel
                }),
                PropertyPaneTextField('consequencePostActionFieldName', {
                  label: strings.ConsequencePostActionFieldNameFieldLabel
                })
              ]
            },
            {
              groupName: strings.LookAndFeelGroupName,
              groupFields: [
                PropertyPaneToggle('fullWidth', {
                  label: strings.MatrixFullWidthLabel
                }),
                PropertyPaneSlider('width', {
                  label: strings.WidthFieldLabel,
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true,
                  disabled: this.properties.fullWidth
                }),
                PropertyPaneTextField('calloutTemplate', {
                  label: strings.CalloutTemplateFieldLabel,
                  multiline: true,
                  resizable: true,
                  rows: 8
                }),
                PropertyPaneDropdown('size', {
                  label: strings.MatrixSizeLabel,
                  options: [
                    {
                      key: '4',
                      text: '4x4'
                    },
                    {
                      key: '5',
                      text: '5x5'
                    },
                    {
                      key: '6',
                      text: '6x6'
                    }
                  ],
                  selectedKey: this.properties.size ?? '5'
                }),
                PropertyFieldColorConfiguration('colorScaleConfig', {
                  key: 'colorScaleConfig',
                  label: strings.MatrixColorScaleConfigLabel,
                  defaultValue: [
                    { p: 10, r: 44, g: 186, b: 0 },
                    { p: 30, r: 163, g: 255, b: 0 },
                    { p: 50, r: 255, g: 244, b: 0 },
                    { p: 70, r: 255, g: 167, b: 0 },
                    { p: 90, r: 255, g: 0, b: 0 }
                  ],
                  value: this.properties.colorScaleConfig
                }),
                ...this.headerLabelFields
              ]
            }
          ]
        }
      ]
    }
  }
}

export * from './types'
