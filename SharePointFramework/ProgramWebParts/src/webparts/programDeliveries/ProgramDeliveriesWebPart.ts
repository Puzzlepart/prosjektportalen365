import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import * as strings from 'ProgramWebPartsStrings'
import {ProgramDeliveries} from 'components/ProgramDeliveries/ProgramDeliveries';
import {IProjectProgramOverviewProps} from '../../components/ProgramProjectOverview/IProgramProjectOverviewProps';
import {IPortfolioConfiguration} from 'pp365-portfoliowebparts/lib/interfaces';
import {BaseProgramWebPart} from '../baseProgramWebPart/baseProgramWebPart'
import {IBaseWebPartComponentProps} from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import {ChildProject} from 'models/ChildProject'
import { IPropertyPaneConfiguration, PropertyPaneButton, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane';
import { IProgramDeliveriesProps } from 'components/ProgramDeliveries/ProgramDeliveriesProps';

interface IProgramDeliveriesWebPartProps extends IBaseWebPartComponentProps {
  webPartTitle: string
  dataSource: string
  showExcelExportButton: boolean
  showSearchBox: boolean
  showCommandBar: boolean
}

export default class programProjectDeliveries extends BaseProgramWebPart<IProgramDeliveriesWebPartProps> {
  public async onInit(): Promise<void> {
    await super.onInit()

  }

  public render(): void {
    this.renderComponent<IProgramDeliveriesProps>(ProgramDeliveries, {
      title: this.properties.webPartTitle,
      context: this.context,
      dataAdapter: this.dataAdapter,
      properties: {
        dataSource: this.properties.dataSource,
        showCommandBar: this.properties.showCommandBar,
        showSearchBox: this.properties.showSearchBox,
        showExcelExportButton: this.properties.showExcelExportButton
      }
    })
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
