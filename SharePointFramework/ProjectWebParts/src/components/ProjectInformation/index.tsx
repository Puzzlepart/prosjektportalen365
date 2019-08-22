import { DisplayMode } from '@microsoft/sp-core-library';
import { dateAdd, PnPClientStorage } from '@pnp/common';
import { Web } from '@pnp/sp';
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { HubConfigurationService } from 'shared/lib/services';
import SpEntityPortalService from 'sp-entityportal-service';
import * as format from 'string-format';
import { IProjectInformationData } from './IProjectInformationData';
import { IProjectInformationProps, ProjectInformationDefaultProps } from './IProjectInformationProps';
import { IProjectInformationState } from './IProjectInformationState';
import styles from './ProjectInformation.module.scss';
import { ProjectProperty, ProjectPropertyModel } from './ProjectProperty';
import { StatusReports } from './StatusReports';


export class ProjectInformation extends React.Component<IProjectInformationProps, IProjectInformationState> {
  public static defaultProps = ProjectInformationDefaultProps;
  private _hubConfigurationService: HubConfigurationService;
  private _spEntityPortalService: SpEntityPortalService;


  constructor(props: IProjectInformationProps) {
    super(props);
    this.state = { isLoading: true, data: {} };
    this._hubConfigurationService = new HubConfigurationService(this.props.hubSiteUrl);
    this._spEntityPortalService = new SpEntityPortalService({ webUrl: this.props.hubSiteUrl, ...this.props.entity });
  }

  public async componentDidMount() {
    try {
      const data = await this.fetchData();
      this.setState({ data, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public render(): React.ReactElement<IProjectInformationProps> {
    return (
      <div className={styles.projectInformation}>
        <div className={styles.container} style={this.generateStyle(this.props)}>
          <WebPartTitle
            displayMode={DisplayMode.Read}
            title={this.props.title}
            updateProperty={_ => { }} />
          {this.renderInner()}
        </div>
      </div>
    );
  }

  /**
   * Render component inner
   */
  private renderInner() {
    if (this.state.isLoading) {
      return <Spinner label={format(strings.LoadingText, 'prosjektinformasjon')} />;
    }
    if (this.state.error) {
      return <MessageBar messageBarType={MessageBarType.error}>{format(strings.ErrorText, 'prosjektinformasjon')}</MessageBar>;
    }
    return (
      <React.Fragment>
        {this.renderProperties()}
        <StatusReports
          title={this.props.statusReportsHeader}
          statusReports={this.state.data.statusReports}
          urlTemplate={`${this.state.data.itemSiteUrl}/${this.props.statusReportsLinkUrlTemplate}`}
          urlSourceParam={document.location.href}
          hidden={this.props.statusReportsCount === 0} />
        <div className={styles.actions} hidden={this.props.hideActions || !this.props.isSiteAdmin}>
          <div>
            <DefaultButton
              text={strings.ViewVersionHistoryText}
              href={this.state.data.versionHistoryUrl}
              iconProps={{ iconName: 'History' }}
              style={{ width: 250 }} />
          </div>
          <div>
            <DefaultButton
              text={strings.EditPropertiesText}
              href={this.state.data.editFormUrl}
              iconProps={{ iconName: 'Edit' }}
              style={{ width: 250 }} />
          </div>
          <div>
            <DefaultButton
              text={strings.EditSiteInformationText}
              onClick={_ => window['_spLaunchSiteSettings']()}
              disabled={!window['_spLaunchSiteSettings']}
              iconProps={{ iconName: 'Info' }}
              style={{ width: 250 }} />
          </div>
        </div>
      </React.Fragment>
    );
  }

  /**
   * Render properties
   */
  private renderProperties() {
    if (this.state.data.properties) {
      const propertiesToRender = this.state.data.properties.filter(p => !p.empty && p.showInDisplayForm);
      const hasMissingProps = this.state.data.properties.filter(p => p.required && p.empty).length > 0;
      if (hasMissingProps) {
        return <MessageBar messageBarType={MessageBarType.error}>{strings.MissingPropertiesMessage}</MessageBar>;
      }
      if (propertiesToRender.length === 0) {
        return <MessageBar>{strings.NoPropertiesMessage}</MessageBar>;
      }
      return (
        <div>
          {propertiesToRender.map((model, key) => {
            return <ProjectProperty key={key} model={model} />;
          })}
        </div>
      );
    } else {
      return null;
    }
  }

  /**
  * Generate styles based on props
  *
  * @param {IProjectInformationProps} param0 Props
  */
  private generateStyle({ boxLayout, boxType, boxBackgroundColor }: IProjectInformationProps) {
    let style: React.CSSProperties = {};
    if (boxLayout && boxType) {
      style.padding = 20;
      style.backgroundColor = boxBackgroundColor || '#FFF';
      switch (boxType) {
        case '1': {
          style.boxShadow = '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)';
        }
          break;
        case '2': {
          style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)';
        }
          break;
        case '3': {
          style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)';
        }
          break;
        case '4': {
          style.boxShadow = '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)';
        }
          break;
        case '5': {
          style.boxShadow = '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)';
        }
          break;
      }
    }
    return style;
  }

  /**
   * Fetch configuration
   *
   * @param {string} key Key for cache
   * @param {Date} expire Expire for cache
        */
  private async fetchConfiguration(key: string = 'projectinformation_fetchconfiguration', expire: Date = dateAdd(new Date(), 'minute', 15)) {
    return new PnPClientStorage().session.getOrPut(key, async () => {
      const [columnConfig, fields] = await Promise.all([
        this._hubConfigurationService.getProjectColumns(),
        this._spEntityPortalService.getEntityFields(),
      ]);
      return { columnConfig, fields };
    }, expire);
  }

  /**
   * Map properties from entity item and configuration
   *
 * @param {Object} item Entity item
 * @param {Object} configuration Configuration
      */
  private mapProperties(item: Object, configuration: { fields: any[], columnConfig: any[] }) {
    return Object.keys(item)
      .filter(fieldName => {
        let [field] = configuration.fields.filter(fld => fld.InternalName === fieldName);
        let [column] = configuration.columnConfig.filter(c => c.GtInternalName === fieldName);
        if (field && column) {
          return this.props.filterField ? column[this.props.filterField] : true;
        }
        return false;
      })
      .map(fieldName => new ProjectPropertyModel(configuration.fields.filter(fld => fld.InternalName === fieldName)[0], item[fieldName]));
  }

  private async fetchData(): Promise<IProjectInformationData> {
    try {
      const [configuration, editFormUrl, versionHistoryUrl, item] = await Promise.all([
        this.fetchConfiguration(),
        this._spEntityPortalService.getEntityEditFormUrl(this.props.siteId, this.props.webUrl),
        this._spEntityPortalService.getEntityVersionHistoryUrl(this.props.siteId, this.props.webUrl),
        this._spEntityPortalService.getEntityItemFieldValues(this.props.siteId),
      ]);

      let properties = this.mapProperties(item, configuration);

      let statusReports: { Id: number, Created: string }[] = [];

      if (this.props.statusReportsListName && this.props.statusReportsCount > 0) {
        const statusReportsList = new Web(this.props.hubSiteUrl).lists.getByTitle(this.props.statusReportsListName);
        statusReports = await statusReportsList
          .items
          .filter(`GtSiteId eq '${this.props.siteId}'`)
          .select('Id', 'Created')
          .orderBy('Id', false)
          .top(this.props.statusReportsCount)
          .get<{ Id: number, Created: string }[]>();
      }

      return {
        properties,
        editFormUrl,
        versionHistoryUrl,
        itemId: item.ID,
        itemSiteUrl: item.GtSiteUrl,
        statusReports,
      };
    } catch (error) {
      throw error;
    }
  }
}

export { ProjectInformationModal } from '../ProjectInformationModal';
export { IProjectInformationProps, ProjectProperty };

