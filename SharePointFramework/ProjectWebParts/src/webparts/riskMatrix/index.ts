import { IPropertyPaneConfiguration, PropertyPaneSlider, PropertyPaneTextField } from '@microsoft/sp-property-pane';
import { sp } from '@pnp/sp';
import { IRiskMatrixProps, RiskMatrix } from 'components/RiskMatrix';
import { RiskElementModel } from 'components/RiskMatrix/RiskElementModel';
import * as getValue from 'get-value';
import * as ReactDom from 'react-dom';
import { BaseProjectWebPart } from 'webparts/@baseProjectWebPart';

export default class RiskMatrixWebPart extends BaseProjectWebPart<IRiskMatrixProps> {
  private _items: RiskElementModel[] = [];
  private _error: Error;

  public async onInit() {
    await super.onInit();
    try {
      let items: any[] = await sp.web.lists.getByTitle(this.properties.listName).getItemsByCAMLQuery({ ViewXml: this.properties.viewXml });
      items = items.map(i => new RiskElementModel(
        i,
        getValue(i, this.properties.probabilityFieldName, { default: '' }),
        getValue(i, this.properties.consequenceFieldName, { default: '' }),
        getValue(i, this.properties.probabilityPostActionFieldName, { default: '' }),
        getValue(i, this.properties.consequencePostActionFieldName, { default: '' }),
      ));
      this._items = items;
    } catch (error) {
      this._error = error;
    }
  }

  public render(): void {
    if (this._error) {
      this.renderError(this._error);
    } else {
      this.renderComponent(RiskMatrix, { ...this.properties, items: this._items });
    }
  }

  // tslint:disable-next-line: naming-convention
  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }


  // tslint:disable-next-line: naming-convention
  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: 'Data',
              groupFields: [
                PropertyPaneTextField('listName', {
                  label: 'List name',
                }),
                PropertyPaneTextField('viewXml', {
                  label: 'Spørring',
                  multiline: true,
                }),
                PropertyPaneTextField('probabilityFieldName', {
                  label: 'Sannsynlighet',
                }),
                PropertyPaneTextField('consequenceFieldName', {
                  label: 'Konsekvens',
                }),
                PropertyPaneTextField('probabilityPostActionFieldName', {
                  label: 'Sannsynlighet (etter tiltak)',
                }),
                PropertyPaneTextField('consequencePostActionFieldName', {
                  label: 'Konsekvens (etter tiltak)',
                })
              ]
            },
            {
              groupName: 'Utseende og funksjonalitet',
              groupFields: [
                PropertyPaneSlider('width', {
                  label: 'Bredde',
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true,
                }),
                PropertyPaneSlider('height', {
                  label: 'Høyde',
                  min: 400,
                  max: 1000,
                  value: 400,
                  showValue: true,
                }),
                PropertyPaneTextField('calloutTemplate', {
                  label: 'Mal for Callout',
                  multiline: true,
                  resizable: true,
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
