import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import * as strings from 'ProgramWebPartsStrings'
import {ProgramBenefits} from 'components/ProgramBenefits/ProgramBenefits'
import {BaseProgramWebPart} from '../baseProgramWebPart/baseProgramWebPart'
import {IBaseWebPartComponentProps} from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane'
import { IProgramBenefitsProps } from 'components/ProgramBenefits/ProgramBenefitsProps'

interface IProgramBenefitsPropertyPaneProps extends IBaseWebPartComponentProps {
  webPartTitle: string
  dataSource: string
  showExcelExportButton: boolean
  showSearchBox: boolean
  showCommandBar: boolean
}

export default class programBenefits extends BaseProgramWebPart<IProgramBenefitsPropertyPaneProps> {

  public async onInit(): Promise<void> {
    await super.onInit()
  }

  public render(): void {
    this.renderComponent<IProgramBenefitsProps>(ProgramBenefits, {
      webPartTitle: this.properties.webPartTitle,
      context: this.context,
      dataAdapter: this.dataAdapter,
      properties: {
        dataSource: this.properties.dataSource,
        showExcelExportButton: this.properties.showExcelExportButton,
        showSearchBox: this.properties.showSearchBox,
        showCommandBar: this.properties.showCommandBar,
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
                  value: strings.BenefitsTitle
                }),
                PropertyPaneTextField('dataSource', {
                  label: strings.DataSourceLabel,
                  value: strings.BenefitDataSource
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
