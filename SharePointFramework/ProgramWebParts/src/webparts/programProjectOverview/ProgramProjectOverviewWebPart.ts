import * as React from 'react'
import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration, IPropertyPaneDropdownOption, PropertyPaneDropdown, PropertyPaneTextField } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import * as strings from 'ProgramWebPartsStrings'
import {ProgramOverview} from '../../components/ProgramProjectOverview/ProgramProjectOverview';
import {IProjectProgramOverviewProps} from '../../components/ProgramProjectOverview/IProgramProjectOverviewProps';
import {IPortfolioConfiguration} from 'pp365-portfoliowebparts/lib/interfaces';
import {BaseProgramWebPart} from '../baseProgramWebPart/baseProgramWebPart'
import {IBaseWebPartComponentProps} from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import {PortalDataService} from 'pp365-shared/lib/services/PortalDataService';
import {DataAdapter} from '../../data';
import { DataSourceService } from 'pp365-shared/lib/services/DataSourceService'
import HubSiteService from 'sp-hubsite-service'
import {HubSite, sp, Web} from '@pnp/sp'

interface IProgramOverviewProps extends IBaseWebPartComponentProps {
  description: string;
}
export default class programProjectOverview extends BaseProgramWebPart<IProgramOverviewProps> {
  private _configuration: IPortfolioConfiguration

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  public render(): void {
    console.log("HUBSITE", this.hubSite)
    this.renderComponent<IProjectProgramOverviewProps>(ProgramOverview, {
      description: this.description,
      context: this.context,
      configuration: this._configuration,
      dataAdapt: this.dataAdapter
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
          header: {
            description: strings.BenefitOwnerLabel
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: 'test'
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
