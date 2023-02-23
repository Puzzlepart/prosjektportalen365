import { format } from '@fluentui/react'
import '@fluentui/react/dist/css/fabric.min.css'
import { get } from '@microsoft/sp-lodash-subset'
import {
  IPropertyPaneConfiguration,
  IPropertyPaneField,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import '@pnp/polyfill-ie11'
import * as strings from 'ProjectWebPartsStrings'
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart'
import {
  OPPORTUNITY_MATRIX_CONSEQUENCE_HEADERS,
  OPPORTUNITY_MATRIX_PROBABILITY_HEADERS
} from '../../components/OpportunityMatrix/types'
import { IProjectStatusProps, ProjectStatus } from '../../components/ProjectStatus'
import PropertyFieldColorConfiguration from '../../components/PropertyFieldColorConfiguration'
import {
  RISK_MATRIX_CONSEQUENCE_HEADERS,
  RISK_MATRIX_PROBABILITY_HEADERS
} from '../../components/RiskMatrix'

export default class ProjectStatusWebPart extends BaseProjectWebPart<IProjectStatusProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectStatusProps>(ProjectStatus)
  }

  /**
   * Get matrix header label property fields.
   * 
   * @param matrixKey Matrix key
   * @param defaultProbabilityHeaders Default header labels for probability
   * @param defaultConsequenceHeaders Default header labels for consequence
   */
  protected getMatrixHeaderLabelPropertyFields(
    matrixKey: string,
    defaultProbabilityHeaders: string[],
    defaultConsequenceHeaders: string[]
  ): IPropertyPaneField<any>[] {
    const size = parseInt(get(this.properties, `${matrixKey}.size`, '5'))
    const overrideHeaderLabels = PropertyPaneToggle(`${matrixKey}.overrideHeaderLabels.${size}`, {
      label: format(strings.OverrideHeadersLabel, size)
    })
    if (!get(this.properties, `${matrixKey}.overrideHeaderLabels.${size}`, false)) {
      return [overrideHeaderLabels]
    }
    const headerLabelFields: IPropertyPaneField<any>[] = []
    for (let i = 0; i < size; i++) {
      const probabilityHeaderFieldName = `${matrixKey}.headerLabels.${size}.p${i}`
      headerLabelFields.push(
        PropertyPaneTextField(probabilityHeaderFieldName, {
          label: format(strings.ProbabilityHeaderFieldLabel, i + 1),
          placeholder: defaultProbabilityHeaders[i]
        })
      )
    }
    for (let i = 0; i < size; i++) {
      const consequenceHeaderFieldName = `${matrixKey}.headerLabels.${size}.c${i}`
      headerLabelFields.push(
        PropertyPaneTextField(consequenceHeaderFieldName, {
          label: format(strings.ConsequenceHeaderFieldLabel, i + 1),
          placeholder: defaultConsequenceHeaders[i]
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
              groupName: strings.RiskMatrixGroupName,
              groupFields: [
                PropertyPaneToggle('riskMatrix.fullWidth', {
                  label: strings.MatrixFullWidthLabel
                }),
                PropertyPaneSlider('riskMatrix.width', {
                  label: strings.WidthFieldLabel,
                  min: 400,
                  max: 1300,
                  value: 400,
                  showValue: true,
                  disabled: this.properties.riskMatrix?.fullWidth
                }),
                PropertyPaneTextField('riskMatrix.calloutTemplate', {
                  label: strings.CalloutTemplateFieldLabel,
                  multiline: true,
                  resizable: true,
                  rows: 8
                }),
                PropertyPaneDropdown('riskMatrix.size', {
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
                  selectedKey: this.properties.riskMatrix?.size ?? '5'
                }),
                PropertyFieldColorConfiguration('riskMatrix.colorScaleConfig', {
                  key: 'riskMatrixColorScaleConfig',
                  label: strings.MatrixColorScaleConfigLabel,
                  defaultValue: [
                    { p: 10, r: 44, g: 186, b: 0 },
                    { p: 30, r: 163, g: 255, b: 0 },
                    { p: 50, r: 255, g: 244, b: 0 },
                    { p: 70, r: 255, g: 167, b: 0 },
                    { p: 90, r: 255, g: 0, b: 0 }
                  ],
                  value: this.properties.riskMatrix?.colorScaleConfig
                }),
                ...this.getMatrixHeaderLabelPropertyFields(
                  'riskMatrix',
                  RISK_MATRIX_PROBABILITY_HEADERS,
                  RISK_MATRIX_CONSEQUENCE_HEADERS
                )
              ]
            },
            {
              groupName: strings.OpportunityMatrixGroupName,
              groupFields: [
                PropertyPaneToggle('opportunityMatrix.fullWidth', {
                  label: strings.MatrixFullWidthLabel
                }),
                PropertyPaneSlider('opportunityMatrix.width', {
                  label: strings.WidthFieldLabel,
                  min: 400,
                  max: 1300,
                  value: 400,
                  showValue: true,
                  disabled: this.properties.opportunityMatrix?.fullWidth
                }),
                PropertyPaneTextField('opportunityMatrix.calloutTemplate', {
                  label: strings.CalloutTemplateFieldLabel,
                  multiline: true,
                  resizable: true,
                  rows: 8
                }),
                PropertyPaneDropdown('opportunityMatrix.size', {
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
                  selectedKey: this.properties.opportunityMatrix?.size ?? '5'
                }),
                PropertyFieldColorConfiguration('opportunityMatrix.colorScaleConfig', {
                  key: 'opportunityMatrixColorScaleConfig',
                  label: strings.MatrixColorScaleConfigLabel,
                  defaultValue: [
                    {
                      p: 10,
                      r: 255,
                      g: 167,
                      b: 0
                    },
                    {
                      p: 30,
                      r: 255,
                      g: 214,
                      b: 10
                    },
                    {
                      p: 50,
                      r: 255,
                      g: 244,
                      b: 0
                    },
                    {
                      p: 70,
                      r: 163,
                      g: 255,
                      b: 0
                    },
                    {
                      p: 90,
                      r: 44,
                      g: 186,
                      b: 0
                    }
                  ],
                  value: this.properties.opportunityMatrix?.colorScaleConfig
                }),
                ...this.getMatrixHeaderLabelPropertyFields(
                  'opportunityMatrix',
                  OPPORTUNITY_MATRIX_PROBABILITY_HEADERS,
                  OPPORTUNITY_MATRIX_CONSEQUENCE_HEADERS
                )
              ]
            },
            {
              groupName: strings.ProjectStatusProjectPropertiesGroupName,
              groupFields: [
                PropertyPaneSlider('fieldWidth', {
                  label: strings.WidthFieldLabel,
                  min: 150,
                  max: 350,
                  step: 10,
                  value: 250
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
