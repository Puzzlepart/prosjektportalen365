import {
  IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import * as strings from 'ProjectWebPartsStrings'
import { IOpportunityMatrixProps, OpportunityMatrix } from 'components/OpportunityMatrix'
import * as getValue from 'get-value'
import _ from 'lodash'
import ReactDom from 'react-dom'
import SPDataAdapter from '../../data'
import { UncertaintyElementModel } from '../../models'
import { BaseProjectWebPart } from '../baseProjectWebPart'
import { IOpportunityMatrixWebPartData, IOpportunityMatrixWebPartProps } from './types'

export default class OpportunityMatrixWebPart extends BaseProjectWebPart<IOpportunityMatrixWebPartProps> {
  private _data: IOpportunityMatrixWebPartData = {}
  private _error: Error

  public async onInit() {
    await super.onInit()
    try {
      const [items, configurations] = await Promise.all([
        this._getItems(),
        SPDataAdapter.getConfigurations(strings.RiskMatrixConfigurationFolder)
      ])
      const defaultConfiguration = _.find(
        configurations,
        (config) =>
          config.name === SPDataAdapter.globalSettings.get('RiskMatrixDefaultConfigurationFile')
      )
      this._data = { items, configurations, defaultConfiguration }
    } catch (error) {
      this._error = error
    }
  }

  public render(): void {
    if (this._error) {
      this.renderError(this._error)
    } else {
      const { items, defaultConfiguration } = this._data
      this.renderComponent<IOpportunityMatrixProps>(OpportunityMatrix, {
        ...this.properties,
        width: this.properties.fullWidth ? '100%' : this.properties.width,
        items: items,
        manualConfigurationPath:
          this.properties.manualConfigurationPath ?? defaultConfiguration?.url
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
          getValue(i, probabilityFieldName, { default: '' }),
          getValue(i, consequenceFieldName, { default: '' }),
          getValue(i, probabilityPostActionFieldName, { default: '' }),
          getValue(i, consequencePostActionFieldName, { default: '' })
        )
    )
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
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
                !this.properties.fullWidth &&
                PropertyPaneSlider('width', {
                  label: strings.WidthFieldLabel,
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true
                }),
                PropertyPaneTextField('calloutTemplate', {
                  label: strings.CalloutTemplateFieldLabel,
                  multiline: true,
                  resizable: true,
                  rows: 8
                })
              ].filter(Boolean)
            }
          ]
        }
      ]
    }
  }
}

export * from './types'
