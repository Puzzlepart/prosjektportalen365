import * as ReactDom from 'react-dom'
import { Version } from '@microsoft/sp-core-library'
import { IPropertyPaneConfiguration, IPropertyPaneDropdownOption, PropertyPaneDropdown, PropertyPaneTextField, PropertyPaneToggle } from '@microsoft/sp-property-pane'
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base'
import * as strings from 'ProgramWebPartsStrings'
import {ProgramOverview} from '../../components/ProgramProjectOverview/ProgramProjectOverview';
import {IProjectProgramOverviewProps} from '../../components/ProgramProjectOverview/IProgramProjectOverviewProps';
import {IPortfolioConfiguration} from 'pp365-portfoliowebparts/lib/interfaces';
import {BaseProgramWebPart} from '../baseProgramWebPart/baseProgramWebPart'
import {IBaseWebPartComponentProps} from 'pp365-projectwebparts/lib/components/BaseWebPartComponent/types'
import {PortalDataService} from 'pp365-shared/lib/services/PortalDataService';
import { DataSourceService } from 'pp365-shared/lib/services/DataSourceService'
import HubSiteService from 'sp-hubsite-service'
import {sp} from '@pnp/sp'
import {ChildProject} from 'models/ChildProject'
import { ProgramTimeline } from 'components/ProgramTimeline/ProgramTimeline'
import { DataAdapter } from 'data'

export interface IProgramTimelineProps extends IBaseWebPartComponentProps {
  description: string
  context: any
  dataAdapter: DataAdapter
  childProjects: string[]
}

export const PROPERTYPANE_CONFIGURATION_PROPS = {
  COLUMN_CONFIG_LISTNAME: 'columnConfigListName',
  COLUMNS_LISTNAME: 'columnsListName',
  DEFAULT_VIEW_ID: 'defaultViewId',
  SHOW_COMMANDBAR: 'showCommandBar',
  SHOW_EXCELEXPORT_BUTTON: 'showExcelExportButton',
  SHOW_FILTERS: 'showFilters',
  SHOW_GROUPBY: 'showGroupBy',
  SHOW_SEARCH_BOX: 'showSearchBox',
  SHOW_VIEWSELECTOR: 'showViewSelector',
  VIEWS_LISTNAME: 'viewsListName'
}

export default class programTimelineWebPart extends BaseProgramWebPart<IProgramTimelineProps> {
  private _configuration: IPortfolioConfiguration
  protected childProjects: ChildProject[]

  public async onInit(): Promise<void> {
    await super.onInit()
    this._configuration = await this.dataAdapter.getPortfolioConfig()
  }

  public render(): void {
    this.renderComponent<IProgramTimelineProps>(ProgramTimeline, {
      description: this.description,
      context: this.context,
      dataAdapter: this.dataAdapter,
      childProjects: this.siteIds
    });
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement)
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0')
  }

  protected _getOptions(targetProperty: string): IPropertyPaneDropdownOption[] {
    // eslint-disable-next-line default-case
    switch (targetProperty) {
      case PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID:
        {
          if (this._configuration) {
            return [
              { key: null, text: '' },
              ...this._configuration.views.map((view) => ({ key: view.id, text: view.title }))
            ]
          }
        }
        break
    }
    return []
  }

  public getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          groups: [
            {
              groupName: strings.GeneralGroupName,
              groupFields: [
                PropertyPaneToggle(PROPERTYPANE_CONFIGURATION_PROPS.SHOW_SEARCH_BOX, {
                  label: strings.ShowSearchBoxLabel
                }),
                PropertyPaneDropdown(PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID, {
                  label: strings.DefaultViewLabel,
                  options: this._getOptions(PROPERTYPANE_CONFIGURATION_PROPS.DEFAULT_VIEW_ID)
                })
              ]
            },
          ]
        },
        {
          groups: [
            {
              groupName: strings.ConfigurationGroupName,
              groupFields: [
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.COLUMN_CONFIG_LISTNAME, {
                  label: strings.ColumnConfigListNameLabel,
                  disabled: true
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.COLUMNS_LISTNAME, {
                  label: strings.ColumnsListNameLabel,
                  disabled: true
                }),
                PropertyPaneTextField(PROPERTYPANE_CONFIGURATION_PROPS.VIEWS_LISTNAME, {
                  label: strings.ViewsListNameLabel,
                  disabled: true
                })
              ]
            }
          ]
        }
      ]
    }
  }
}
