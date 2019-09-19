import { DisplayMode } from '@microsoft/sp-core-library';
import { dateAdd, PnPClientStorage, TypedHash } from '@pnp/common';
import { List, sp, Web } from '@pnp/sp';
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { HubConfigurationService } from 'shared/lib/services';
import { SpEntityPortalService } from 'sp-entityportal-service';
import * as format from 'string-format';
import SPDataAdapter from '../../data';
import { Actions } from './Actions';
import { IProjectInformationData } from './IProjectInformationData';
import { IProjectInformationProps } from './IProjectInformationProps';
import { IProjectInformationState } from './IProjectInformationState';
import styles from './ProjectInformation.module.scss';
import { ProjectProperty, ProjectPropertyModel } from './ProjectProperty';
import { StatusReports } from './StatusReports';

export class ProjectInformation extends React.Component<IProjectInformationProps, IProjectInformationState> {
  public static defaultProps: Partial<IProjectInformationProps> = {
    statusReportsLinkUrlTemplate: '',
    statusReportsCount: 0,
  };
  private _hubConfigurationService: HubConfigurationService;
  private _spEntityPortalService: SpEntityPortalService;


  constructor(props: IProjectInformationProps) {
    super(props);
    this.state = { isLoading: true, data: {} };
    this._hubConfigurationService = new HubConfigurationService(this.props.hubSiteUrl);
    this._spEntityPortalService = new SpEntityPortalService({
      webUrl: this.props.hubSiteUrl,
      listName: this.props.entity.listName,
      identityFieldName: this.props.entity.identityFieldName,
      contentTypeId: this.props.entity.contentTypeId,
      urlFieldName: this.props.entity.urlFieldName,
      fieldPrefix: 'Gt',
    });
    SPDataAdapter.configure({
      spEntityPortalService: this._spEntityPortalService,
      siteId: this.props.siteId,
      webUrl: this.props.webUrl,
    });
  }

  public async componentDidMount() {
    try {
      const updatedState = await this._fetchData();
      this.setState({ ...updatedState, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public render(): React.ReactElement<IProjectInformationProps> {
    return (
      <div className={styles.projectInformation}>
        <div className={styles.container} style={this._generateStyle(this.props)}>
          <WebPartTitle
            displayMode={DisplayMode.Read}
            title={this.props.title}
            updateProperty={() => { }} />
          {this._renderInner()}
        </div>
      </div>
    );
  }

  /**
   * Render component inner
   */
  private _renderInner() {
    if (this.state.isLoading) {
      return <Spinner label={format(strings.LoadingText, 'prosjektinformasjon')} />;
    }
    if (this.state.error) {
      return <MessageBar messageBarType={MessageBarType.error}>{format(strings.ErrorText, 'prosjektinformasjon')}</MessageBar>;
    }
    return (
      <React.Fragment>
        {this._renderProperties()}
        <StatusReports
          title={this.props.statusReportsHeader}
          statusReports={this.state.data.statusReports}
          urlTemplate={`${this.props.webUrl}/${this.props.statusReportsLinkUrlTemplate}`}
          urlSourceParam={document.location.href}
          hidden={this.props.statusReportsCount === 0} />
        <Actions
          className={styles.actions}
          hidden={this.props.hideActions || !this.props.isSiteAdmin}
          versionHistoryUrl={this.state.data.versionHistoryUrl}
          editFormUrl={this.state.data.editFormUrl}
          onSyncPropertiesEnabled={this.state.onSyncPropertiesEnabled}
          onSyncProperties={() => SPDataAdapter.syncPropertyItemToHub(this.state.data)} />
      </React.Fragment>
    );
  }

  /**
   * Render properties
   */
  private _renderProperties() {
    if (!this.state.properties) return null;
    const propertiesToRender = this.state.properties.filter(p => !p.empty && p.showInDisplayForm);
    const hasMissingProps = this.state.properties.filter(p => p.required && p.empty).length > 0;
    if (hasMissingProps) {
      return <MessageBar messageBarType={MessageBarType.error}>{strings.MissingPropertiesMessage}</MessageBar>;
    }
    if (propertiesToRender.length === 0) {
      return <MessageBar>{strings.NoPropertiesMessage}</MessageBar>;
    }
    return (
      <div>
        {propertiesToRender.map((model, key) => <ProjectProperty {...{ key, model }} />)}
      </div>
    );
  }

  /**
  * Generate styles based on props
  *
  * @param {IProjectInformationProps} param0 Props
  */
  private _generateStyle({ boxLayout, boxType, boxBackgroundColor }: IProjectInformationProps) {
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
  private async _fetchConfiguration(key: string = 'projectinformation_fetchconfiguration', expire: Date = dateAdd(new Date(), 'minute', 15)) {
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
  * @param {TypedHash} fieldValuesText Field values as text
  * @param {Object} configuration Configuration
  */
  private _transformProperties(fieldValuesText: TypedHash<any>, configuration: { fields: any[], columnConfig: any[] }) {
    const fieldNames = Object.keys(fieldValuesText).filter(fieldName => {
      let [field] = configuration.fields.filter(fld => fld.InternalName === fieldName);
      let [column] = configuration.columnConfig.filter(c => c.GtInternalName === fieldName);
      if (field && column) {
        return this.props.filterField ? column[this.props.filterField] : true;
      }
      return false;
    });
    const properties = fieldNames.map(fieldName => {
      let [field] = configuration.fields.filter(fld => fld.InternalName === fieldName);
      return new ProjectPropertyModel(field, fieldValuesText[fieldName]);
    });
    return properties;
  }

  /**
   * Fetch data
   * 
   * @param {IProjectInformationData} data Initial data
   */
  private async _fetchData(data: IProjectInformationData = { statusReports: [] }): Promise<Partial<IProjectInformationState>> {
    try {
      let [configuration, propertyItem, entity] = await Promise.all([
        this._fetchConfiguration(),
        SPDataAdapter.getPropertyItem('Prosjektegenskpaer'),
        this._spEntityPortalService.fetchEntity(this.props.siteId, this.props.webUrl),
      ]);

      if (propertyItem) {
        data = { ...data, ...propertyItem };
      } else {
        entity = await this._spEntityPortalService.fetchEntity(this.props.siteId, this.props.webUrl);
        data = {
          ...data,
          editFormUrl: entity.urls.editFormUrl,
          versionHistoryUrl: entity.urls.versionHistoryUrl,
          fieldValues: entity.fieldValues,
        };
      }

      data.fields = entity.fields;

      let properties = this._transformProperties(data.fieldValuesText, configuration);

      if (this.props.statusReportsListName && this.props.statusReportsCount > 0) {
        const statusReportsList = new Web(this.props.hubSiteUrl).lists.getByTitle(this.props.statusReportsListName);
        data.statusReports = await statusReportsList
          .items
          .filter(`GtSiteId eq '${this.props.siteId}'`)
          .select('Id', 'Created')
          .orderBy('Id', false)
          .top(this.props.statusReportsCount)
          .get<{ Id: number, Created: string }[]>();
      }

      return { data, properties, onSyncPropertiesEnabled: !!propertyItem };
    } catch (error) {
      throw error;
    }
  }
}

export { ProjectInformationModal } from '../ProjectInformationModal';
export { IProjectInformationProps, ProjectProperty };

