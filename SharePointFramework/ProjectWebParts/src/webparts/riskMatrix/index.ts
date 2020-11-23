import {
  IPropertyPaneConfiguration,
  PropertyPaneSlider,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane'
import { sp } from '@pnp/sp'
import { IRiskMatrixProps, RiskMatrix, RiskElementModel } from 'components/RiskMatrix'
import * as getValue from 'get-value'
import * as ReactDom from 'react-dom'
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart'
import { IRiskMatrixWebPartProps } from './IRiskMatrixWebPartProps'
import * as strings from 'ProjectWebPartsStrings'

export default class RiskMatrixWebPart extends BaseProjectWebPart<IRiskMatrixWebPartProps> {
  private _items: RiskElementModel[] = []
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
        width: this.properties.width,
        height: this.properties.height,
        calloutTemplate: this.properties.calloutTemplate,
        items: this._items
      })
    }
  }

  protected async _getItems(): Promise<RiskElementModel[]> {
    let items: any[] = await sp.web.lists
      .getByTitle(this.properties.listName)
      .getItemsByCAMLQuery({ ViewXml: this.properties.viewXml })
    items = items.map(
      (i) =>
        new RiskElementModel(
          i,
          getValue(i, this.properties.probabilityFieldName, { default: '' }),
          getValue(i, this.properties.consequenceFieldName, { default: '' }),
          getValue(i, this.properties.probabilityPostActionFieldName, { default: '' }),
          getValue(i, this.properties.consequencePostActionFieldName, { default: '' })
        )
    )
    return items
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
                PropertyPaneSlider('width', {
                  label: strings.WidthFieldLabel,
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true
                }),
                PropertyPaneSlider('height', {
                  label: strings.HeightFieldLabel,
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true
                }),
                PropertyPaneTextField('calloutTemplate', {
                  label: strings.CalloutTemplateFieldLabel,
                  multiline: true,
                  resizable: true
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
