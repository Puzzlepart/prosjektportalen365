import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import * as strings from 'ProgramWebPartsStrings'
import {ProgramBenefits} from 'components/ProgramBenefits/ProgramBenefits';
import {IProjectProgramOverviewProps} from '../../components/ProgramProjectOverview/IProgramProjectOverviewProps';
import {IPortfolioConfiguration} from 'pp365-portfoliowebparts/lib/interfaces';
import {BaseProgramWebPart} from '../baseProgramWebPart/baseProgramWebPart'
import {IBaseWebPartComponentProps} from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import {ChildProject} from 'models/ChildProject'
import { IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-property-pane';

interface IProgramOverviewProps extends IBaseWebPartComponentProps {
  showCommandBar: any
  description: string;
}

export default class programProjectOverview extends BaseProgramWebPart<IProgramOverviewProps> {
  private _configuration: IPortfolioConfiguration

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  public render(): void {
    this.renderComponent<IProjectProgramOverviewProps>(ProgramBenefits, {
      description: this.description,
      context: this.context,
      dataAdapter: this.dataAdapter,
      configuration: this._configuration,
      childProjects: this.siteIds
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
