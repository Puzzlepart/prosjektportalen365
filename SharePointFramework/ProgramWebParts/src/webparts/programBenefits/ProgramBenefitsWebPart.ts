import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import * as strings from 'ProgramWebPartsStrings'
import {ProgramBenefits} from 'components/ProgramBenefits/ProgramBenefits';
import {BaseProgramWebPart} from '../baseProgramWebPart/baseProgramWebPart'
import {IBaseWebPartComponentProps} from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import { IPropertyPaneConfiguration, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import { IAggregatedPortfolioProps } from 'models/AggregatedPortfolioProps';

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
    this.renderComponent<IAggregatedPortfolioProps>(ProgramBenefits, {
      title: this.properties.webPartTitle,
      context: this.context,
      dataAdapter: this.dataAdapter,
      properties: {
        dataSource: this.properties.dataSource,
        showExcelExportButton: this.properties.showExcelExportButton,
        showSearchBox: this.properties.showSearchBox,
        showCommandBar: this.properties.showCommandBar
      }
      
    });
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
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
