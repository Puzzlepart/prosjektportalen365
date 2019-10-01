import { DisplayMode } from '@microsoft/sp-core-library';
import { dateAdd, PnPClientStorage, PnPClientStore, TypedHash } from '@pnp/common';
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { HubConfigurationService } from 'shared/lib/services';
import parseUrlHash from 'shared/lib/util/parseUrlHash';
import * as formatString from 'string-format';
import SPDataAdapter from '../../data';
import { UserMessage } from '../UserMessage';
import { Actions } from './Actions';
import { IProjectInformationData } from './IProjectInformationData';
import { IProjectInformationProps } from './IProjectInformationProps';
import { IProjectInformationState } from './IProjectInformationState';
import { IProjectInformationUrlHash } from './IProjectInformationUrlHash';
import { ProgressDialog } from '../ProgressDialog/index';
import styles from './ProjectInformation.module.scss';
import { ProjectProperties } from './ProjectProperties';
import { ProjectProperty, ProjectPropertyModel } from './ProjectProperties/ProjectProperty/index';
import { StatusReports } from './StatusReports';

export class ProjectInformation extends React.Component<IProjectInformationProps, IProjectInformationState> {
  public static defaultProps: Partial<IProjectInformationProps> = { statusReportsCount: 0 };
  private _hubConfigurationService: HubConfigurationService;
  private _storage: PnPClientStore;

  /**
   * Constructor
   * 
   * @param {IProjectInformationProps} props Props
   */
  constructor(props: IProjectInformationProps) {
    super(props);
    this.state = { isLoading: true, data: {} };
    this._storage = new PnPClientStorage().session;
    this._hubConfigurationService = new HubConfigurationService(props.hubSite.web, props.siteId);
  }

  public async componentDidMount() {
    try {
      const data = await this._fetchData();
      this.setState({ ...data, isLoading: false });
      if (parseUrlHash<IProjectInformationUrlHash>(true).syncproperties === '1') {
        this._onSyncProperties();
      }
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public render(): React.ReactElement<IProjectInformationProps> {
    if (this.state.hidden) {
      return null;
    }
    return (
      <div className={styles.projectInformation} >
        <div className={styles.container}>
          <div hidden={this.props.displayMode === DisplayMode.Edit}>
            <WebPartTitle
              displayMode={DisplayMode.Read}
              title={this.props.title}
              updateProperty={() => { }} />
          </div>
          {this._contents}
        </div>
      </div>
    );
  }

  /**
   * Contents
   */
  private get _contents() {
    if (this.state.isLoading) {
      return <Spinner label={formatString(strings.LoadingText, this.props.title.toLowerCase())} />;
    }
    if (this.state.error) {
      return (
        <UserMessage
          messageBarType={MessageBarType.severeWarning}
          onDismiss={() => this.setState({ hidden: true })}
          text={strings.WebPartNoAccessMessage} />
      );
    }

    const { statusReports, editFormUrl, versionHistoryUrl } = this.state.data;

    return (
      <>
        <ProjectProperties
          title={this.props.title}
          properties={this.state.properties}
          displayMode={this.props.displayMode}
          isSiteAdmin={this.props.isSiteAdmin}
          onFieldExternalChanged={this.props.onFieldExternalChanged}
          showFieldExternal={this.props.showFieldExternal}
          localList={this.state.data.localList} />
        <StatusReports
          title={this.props.statusReportsHeader}
          statusReports={statusReports}
          urlSourceParam={document.location.href}
          hidden={this.props.statusReportsCount === 0} />
        <UserMessage {...this.state.message} />
        <Actions
          hidden={this.props.hideActions || !this.props.isSiteAdmin || this.props.displayMode === DisplayMode.Edit}
          versionHistoryUrl={versionHistoryUrl}
          editFormUrl={editFormUrl}
          onSyncProperties={!this.state.data.localList && this._onSyncProperties.bind(this)} />
        <ProgressDialog {...this.state.progress} />
      </>
    );
  }

  /**
   * Add message
   * 
   * @param {string} text Text
   * @param {MessageBarType} messageBarType Message type
   * @param {number} duration Duration in seconds (defaults to 5)
   */
  private _addMessage(text: string, messageBarType: MessageBarType, duration: number = 5): Promise<void> {
    return new Promise(resolve => {
      this.setState({ message: { text: formatString(text, duration.toString()), messageBarType, onDismiss: () => this.setState({ message: null }) } });
      window.setTimeout(() => {
        this.setState({ message: null });
        resolve();
      }, (duration * 1000));
    });
  }

  /**
   * On sync properties
   */
  private async _onSyncProperties() {
    this.setState({ progress: { title: strings.SyncProjectPropertiesProgressLabel, progress: {} } });
    const progressFunc = (progress: IProgressIndicatorProps) => this.setState({ progress: { title: strings.SyncProjectPropertiesProgressLabel, progress } });
    try {
      progressFunc({ description: strings.SyncProjectPropertiesListProgressDescription });
      await this._hubConfigurationService.syncList(this.props.webUrl, strings.ProjectPropertiesListName, '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C', { Title: this.props.webTitle });
      await SPDataAdapter.syncPropertyItemToHub(this.state.data.fieldValues, this.state.data.fieldValuesText, progressFunc);
      await this._addMessage(strings.SyncProjectPropertiesSuccessText, MessageBarType.success);
    } catch (error) {
      this._addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning);
    } finally {
      this.setState({ progress: null });
      document.location.href = this.props.webUrl;
    }
  }

  /**
  * Get column config
  */
  private async _getColumnConfig() {
    return this._storage.getOrPut('projectinformation_columnconfig', async () => {
      try {
        let columns = await this._hubConfigurationService.getProjectColumns();
        return columns;
      } catch (error) {
        return [];
      }
    }, dateAdd(new Date(), 'minute', 30));
  }

  /**
  * Transform properties from entity item and configuration
  *
  * @param {TypedHash} fieldValuesText Field values as text
  * @param {IProjectInformationData} data Data
  */
  private _transformProperties(fieldValuesText: TypedHash<any>, data: IProjectInformationData) {
    const fieldNames: string[] = Object.keys(fieldValuesText).filter(fieldName => {
      let [field] = data.fields.filter(fld => fld.InternalName === fieldName);
      if (field && data.columnConfig.length === 0 && this.props.showFieldExternal[fieldName]) return true;
      let [column] = data.columnConfig.filter(c => c.GtInternalName === fieldName);
      if (field && column) {
        return this.props.filterField ? column[this.props.filterField] : true;
      }
      return false;
    });
    const properties = fieldNames.map(fieldName => {
      let [field] = data.fields.filter(fld => fld.InternalName === fieldName);
      return new ProjectPropertyModel(field, fieldValuesText[fieldName]);
    });
    return properties;
  }

  /**
   * Fetch data
   */
  private async _fetchData(): Promise<Partial<IProjectInformationState>> {
    try {
      const [columnConfig, propertiesData] = await Promise.all([
        this._getColumnConfig(),
        SPDataAdapter.project.getPropertiesData(),
      ]);

      let data: IProjectInformationData = {
        statusReports: [],
        columnConfig,
        ...propertiesData,
      };

      if (this.props.statusReportsCount > 0) {
        data.statusReports = await this._hubConfigurationService.getStatusReports(this.props.statusReportsCount);
      }

      const properties = this._transformProperties(data.fieldValuesText, data);

      return { data, properties };
    } catch (error) {
      throw error;
    }
  }
}

export { ProjectInformationModal } from '../ProjectInformationModal';
export { IProjectInformationProps, ProjectProperty };

