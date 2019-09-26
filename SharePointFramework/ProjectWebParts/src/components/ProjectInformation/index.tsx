import { DisplayMode } from '@microsoft/sp-core-library';
import { dateAdd, PnPClientStorage, PnPClientStore, stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { Web } from '@pnp/sp';
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { HubConfigurationService } from 'shared/lib/services';
import * as format from 'string-format';
import SPDataAdapter from '../../data';
import { Actions } from './Actions';
import { IProjectInformationData } from './IProjectInformationData';
import { IProjectInformationProps } from './IProjectInformationProps';
import { IProjectInformationState } from './IProjectInformationState';
import { ProgressBar } from './ProgressBar';
import styles from './ProjectInformation.module.scss';
import { ProjectProperty, ProjectPropertyModel } from './ProjectProperty';
import { StatusReports } from './StatusReports';
import { UserMessage } from './UserMessage';

export class ProjectInformation extends React.Component<IProjectInformationProps, IProjectInformationState> {
  public static defaultProps: Partial<IProjectInformationProps> = {
    statusReportsLinkUrlTemplate: '',
    statusReportsCount: 0,
  };
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
    this._hubConfigurationService = new HubConfigurationService(props.hubSiteUrl);
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
      <div className={styles.projectInformation} >
        <div className={styles.container}>
          <WebPartTitle
            displayMode={DisplayMode.Read}
            title={this.props.title}
            updateProperty={() => { }} />
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
      return <Spinner label={format(strings.LoadingText, this.props.title.toLowerCase())} />;
    }
    if (this.state.error) {
      return <MessageBar messageBarType={MessageBarType.error}>{format(strings.ErrorText, this.props.title.toLowerCase())}</MessageBar>;
    }

    const { statusReports, editFormUrl, versionHistoryUrl } = this.state.data;

    return (
      <>
        {this._renderProperties()}
        <StatusReports
          title={this.props.statusReportsHeader}
          statusReports={statusReports}
          urlTemplate={`${this.props.webUrl}/${this.props.statusReportsLinkUrlTemplate}`}
          urlSourceParam={document.location.href}
          hidden={this.props.statusReportsCount === 0} />
        <ProgressBar className={styles.progress} {...this.state.progress} />
        <UserMessage className={styles.message} {...this.state.message} />
        <Actions
          className={styles.actions}
          hidden={this.props.hideActions || !this.props.isSiteAdmin}
          versionHistoryUrl={versionHistoryUrl}
          editFormUrl={editFormUrl}
          onSyncProperties={this._onSyncProperties.bind(this)} />
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
  private _addMessage(text: string, messageBarType: MessageBarType, duration: number = 5) {
    this.setState({ message: { text, messageBarType } });
    window.setTimeout(() => {
      this.setState({ message: null });
    }, (duration * 1000));
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
   * On sync properties
   */
  private async _onSyncProperties() {
    this.setState({ progress: { label: strings.SyncProjectPropertiesProgressLabel, description: '' } });
    const { fields, fieldValues, fieldValuesText } = this.state.data;
    const progressFunc = (props: IProgressIndicatorProps) => this.setState({ progress: { label: strings.SyncProjectPropertiesProgressLabel, ...props } });
    try {
      progressFunc({ description: strings.SyncProjectPropertiesListProgressDescription });
      await this._hubConfigurationService.syncList(this.props.webUrl, strings.ProjectPropertiesListName, '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C');
      await SPDataAdapter.syncPropertyItemToHub(fields, fieldValues, fieldValuesText, progressFunc);
      this._addMessage(strings.SyncProjectPropertiesSuccessText, MessageBarType.success);
    } catch (error) {
      this._addMessage(strings.SyncProjectPropertiesErrorText, MessageBarType.severeWarning);
    } finally {
      this.setState({ progress: null });
    }
  }

  /**
  * Get column config
  */
  private async _getColumnConfig() {
    return this._storage.getOrPut('projectinformation_getcolumnconfig', async () => {
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
      if (field && ['GtSiteId', 'GtGroupId', 'GtSiteUrl'].indexOf(fieldName) === -1 && data.columnConfig.length === 0) return true;
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

      if (!stringIsNullOrEmpty(this.props.statusReportsListName) && this.props.statusReportsCount > 0) {
        const statusReportsList = new Web(this.props.hubSiteUrl).lists.getByTitle(this.props.statusReportsListName);
        data.statusReports = await statusReportsList
          .items
          .filter(`GtSiteId eq '${this.props.siteId}'`)
          .select('Id', 'Created')
          .orderBy('Id', false)
          .top(this.props.statusReportsCount)
          .get<{ Id: number, Created: string }[]>();
      }

      let properties = this._transformProperties(data.fieldValuesText, data);

      return { data, properties };
    } catch (error) {
      throw error;
    }
  }
}

export { ProjectInformationModal } from '../ProjectInformationModal';
export { IProjectInformationProps, ProjectProperty };

