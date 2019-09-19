import { DisplayMode } from '@microsoft/sp-core-library';
import { dateAdd, PnPClientStorage, stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { Web } from '@pnp/sp';
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
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
import { UserMessage } from './UserMessage';
import { ProgressBar } from './ProgressBar';

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
    this._spEntityPortalService = new SpEntityPortalService({ webUrl: this.props.hubSiteUrl, ...this.props.entity });
    SPDataAdapter.configure({
      spEntityPortalService: this._spEntityPortalService,
      siteId: this.props.siteId,
      webUrl: this.props.webUrl,
      hubSiteUrl: this.props.hubSiteUrl,
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
        <div className={styles.container}>
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

  private async _onSyncProperties() {
    this.setState({ progress: { label: 'Synkroniserer prosjektegenskaper til porteføljeområdet', description: '' } });
    const { fields, fieldValues, fieldValuesText } = this.state.data;
    try {
      await SPDataAdapter.syncPropertyItemToHub(fields, fieldValues, fieldValuesText, description => {
        this.setState({ progress: { label: 'Synkroniserer prosjektegenskaper til porteføljeområdet', description } });
      });
      this._addMessage('Prosjektegenskaper ble synkronisert til porteføljeområdet', MessageBarType.success);
    } catch (error) {
      this._addMessage('Det skjedde feil under synkronisering', MessageBarType.severeWarning);
    } finally {
      this.setState({ progress: null });
    }
  }

  /**
  * Fetch configuration
  */
  private async _fetchConfiguration() {
    return new PnPClientStorage().session.getOrPut('projectinformation_fetchconfiguration', async () => {
      const [columnConfig, fields] = await Promise.all([
        this._hubConfigurationService.getProjectColumns(),
        this._spEntityPortalService.getEntityFields(),
      ]);
      return { columnConfig, fields };
    }, dateAdd(new Date(), 'minute', 30));
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
      const [configuration, propertiesData, fields] = await Promise.all([
        this._fetchConfiguration(),
        SPDataAdapter.getPropertiesData(),
        this._spEntityPortalService.getEntityFields(),
      ]);

      data.fields = fields;
      data = {
        ...data,
        ...propertiesData,
      };

      let properties = this._transformProperties(data.fieldValuesText, configuration);

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

      return { data, properties };
    } catch (error) {
      throw error;
    }
  }
}

export { ProjectInformationModal } from '../ProjectInformationModal';
export { IProjectInformationProps, ProjectProperty };

