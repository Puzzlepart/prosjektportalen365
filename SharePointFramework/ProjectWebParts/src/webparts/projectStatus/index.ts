import '@fluentui/react/dist/css/fabric.min.css'
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import '@pnp/polyfill-ie11'
import { IProjectStatusProps, ProjectStatus } from 'components/ProjectStatus'
import * as strings from 'ProjectWebPartsStrings'
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart'
import { RISK_MATRIX_DEFAULT_COLOR_SCALE_CONFIG } from '../riskMatrix'
import PropertyFieldColorConfiguration from '../../components/PropertyFieldColorConfiguration'

export default class ProjectStatusWebPart extends BaseProjectWebPart<IProjectStatusProps> {
  public async onInit() {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProjectStatusProps>(ProjectStatus)
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
                  label: strings.RiskMatrixFullWidthLabel
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
                  label: strings.RiskMatrixSizeLabel,
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
                  label: strings.RiskMatrixColorScaleConfigLabel,
                  defaultValue: RISK_MATRIX_DEFAULT_COLOR_SCALE_CONFIG,
                  value: this.properties.riskMatrix?.colorScaleConfig
                })
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
