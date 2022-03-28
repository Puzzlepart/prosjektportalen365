import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import * as strings from 'ProgramWebPartsStrings'
import { ProgramRiskOverview } from 'components/ProgramRiskOverview/index'
import { BaseProgramWebPart } from '../baseProgramWebPart'
import { IBaseWebPartComponentProps } from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle
} from '@microsoft/sp-property-pane'
import { IProgramRiskOverview } from 'components/ProgramRiskOverview/types'
import { AggreationColumn } from 'models'

interface IProgramRiskProps extends IBaseWebPartComponentProps {
  webPartTitle: string
  dataSource: string
  showExcelExportButton: boolean
  showSearchBox: boolean
  columns: AggreationColumn[]
  showCommandBar: boolean
}

export default class ProgramRiskOverviewWebPart extends BaseProgramWebPart<IProgramRiskProps> {
  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProgramRiskOverview>(ProgramRiskOverview, {
      context: this.context,
      dataAdapter: this.dataAdapter,
      properties: {
        dataSource: this.properties.dataSource,
        showExcelExportButton: this.properties.showExcelExportButton,
        showSearchBox: this.properties.showSearchBox,
        showCommandBar: this.properties.showCommandBar,
        columns: this.properties.columns,
        displayMode: this.displayMode
      },
      webPartTitle: this.properties.webPartTitle,
      onUpdateProperty: this._onUpdateProperty.bind(this)
    })
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  public _onUpdateProperty(key: string, value: any) {
    this.properties[key] = value
    this.context.propertyPane.refresh()
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0')
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
                  value: strings.RiskWebPartTitle
                }),
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel,
                  value: strings.RiskDataSource
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
