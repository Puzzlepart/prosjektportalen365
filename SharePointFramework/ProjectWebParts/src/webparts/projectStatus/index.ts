import '@fluentui/react/dist/css/fabric.min.css'
import {
  IPropertyPaneConfiguration,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'ProjectWebPartsStrings'
import { ProjectStatus } from 'components/ProjectStatus/ProjectStatus'
import { IProjectStatusProps } from '../../components/ProjectStatus'
import { BaseProjectWebPart } from '../baseProjectWebPart'
import _ from 'lodash'
import SPDataAdapter from '../../data'
import { IProjectStatusWebPartData } from './types'

export default class ProjectStatusWebPart extends BaseProjectWebPart<IProjectStatusProps> {
  private _data: IProjectStatusWebPartData = {}

  public async onInit() {
    await super.onInit()
    const riskMatrixConfigurations = await SPDataAdapter.getConfigurations(
      strings.RiskMatrixConfigurationFolder
    )
    const defaultRiskMatrixConfiguration = _.find(
      riskMatrixConfigurations,
      (config) =>
        config.name === SPDataAdapter.globalSettings.get('RiskMatrixDefaultConfigurationFile')
    )
    this._data = {
      riskMatrixConfigurations,
      defaultRiskMatrixConfiguration
    }
  }

  public render(): void {
    this.renderComponent<IProjectStatusProps>(ProjectStatus, {
      riskMatrix: {
        ...this.properties.riskMatrix,
        manualConfigurationPath:
          this.properties.riskMatrix.manualConfigurationPath ??
          this._data.defaultRiskMatrixConfiguration?.url
      }
    })
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
                !this.properties.riskMatrix?.fullWidth &&
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
                PropertyPaneDropdown('riskMatrix.manualConfigurationPath', {
                  label: strings.ManualConfigurationPathLabel,
                  options: this._data.riskMatrixConfigurations.map(
                    ({ url: key, title: text }) => ({ key, text })
                  ),
                  selectedKey:
                    this.properties.riskMatrix?.manualConfigurationPath ??
                    this._data.defaultRiskMatrixConfiguration?.url
                })
              ].filter(Boolean)
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
