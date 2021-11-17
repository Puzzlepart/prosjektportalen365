import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import * as strings from 'ProgramWebPartsStrings'
import {ProgramDeliveries} from 'components/ProgramDeliveries/ProgramDeliveries';
import {BaseProgramWebPart} from '../baseProgramWebPart/baseProgramWebPart'
import {IBaseWebPartComponentProps} from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import { IProgramDeliveriesProps } from 'components/ProgramDeliveries/ProgramDeliveriesProps';

interface IProgramDeliveriesWebPartProps extends IBaseWebPartComponentProps {
  webPartTitle: string
  dataSource: string
  showExcelExportButton: boolean
  showSearchBox: boolean
  showCommandBar: boolean
  columns: Array<{key: string, fieldName: string, name: string, minWidth:number,maxWidth:number, isMultiline:boolean, isResizable:boolean}>
}

export default class programProjectDeliveries extends BaseProgramWebPart<IProgramDeliveriesWebPartProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    console.log(this.properties)
    console.log(this)
    this.renderComponent<IProgramDeliveriesProps>(ProgramDeliveries, {
      title: this.properties.webPartTitle,
      context: this.context,
      dataAdapter: this.dataAdapter,
      properties: {
        dataSource: this.properties.dataSource,
        showCommandBar: this.properties.showCommandBar,
        showSearchBox: this.properties.showSearchBox,
        showExcelExportButton: this.properties.showExcelExportButton,
        columns: this.properties.columns,
        displayMode: this.displayMode
      },
      onUpdateProperty: this._onUpdateProperty.bind(this)
    })
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0')
  }

  private _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    this.context.propertyPane.refresh()
  }
  

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupFields: [
                PropertyPaneTextField('webPartTitle', {
                  label: strings.WebPartTitleLabel,
                  value: strings.DeliveriesTitle
                }),
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel,
                  value: strings.DeliveriesDatasource
                }),
                PropertyPaneToggle('showCommandBar', {
                  label: strings.ShowCommandBarLabel,
                  checked: true
                }),
                PropertyPaneToggle('showSearchBox', {
                  label: strings.ShowSearchBoxLabel,
                  checked: true
                }),
                PropertyPaneToggle('showExcelExportButton', {
                  label: strings.ShowExcelExportButtonLabel,
                  checked: true
                })
              ]
            }
          ]
        }
      ]
    }
  }

}
