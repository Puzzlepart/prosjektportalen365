import { DisplayMode } from '@microsoft/sp-core-library';
import { dateAdd, PnPClientStorage, stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { List, sp, Web } from '@pnp/sp';
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { makeUrlAbsolute } from 'shared/lib/helpers';
import { HubConfigurationService } from 'shared/lib/services';
import { SpEntityPortalService } from 'sp-entityportal-service';
import * as format from 'string-format';
import * as _ from 'underscore';
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
  private _propertiesList: List;


  constructor(props: IProjectInformationProps) {
    super(props);
    this.state = { isLoading: true, data: {} };
    this._hubConfigurationService = new HubConfigurationService(this.props.hubSiteUrl);
    this._spEntityPortalService = new SpEntityPortalService({ webUrl: this.props.hubSiteUrl, ...this.props.entity });
    this._propertiesList = sp.web.lists.getByTitle('Prosjektegenskaper');
  }

  public async componentDidMount() {
    try {
      const data = await this._fetchData();
      this.setState({ data, isLoading: false });
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
        <div className={styles.actions} hidden={this.props.hideActions || !this.props.isSiteAdmin}>
          <div>
            <DefaultButton
              text={strings.ViewVersionHistoryText}
              href={this.state.data.versionHistoryUrl}
              iconProps={{ iconName: 'History' }}
              style={{ width: 300 }} />
          </div>
          <div>
            <DefaultButton
              text={strings.EditPropertiesText}
              href={this.state.data.editFormUrl}
              iconProps={{ iconName: 'Edit' }}
              style={{ width: 300 }} />
          </div>
          <div>
            <DefaultButton
              text={strings.SyncProjectPropertiesText}
              onClick={this._syncPropertyItem.bind(this)}
              iconProps={{ iconName: 'Sync' }}
              style={{ width: 300 }} />
          </div>
          <div>
            <DefaultButton
              text={strings.EditSiteInformationText}
              onClick={() => window['_spLaunchSiteSettings']()}
              disabled={!window['_spLaunchSiteSettings']}
              iconProps={{ iconName: 'Info' }}
              style={{ width: 300 }} />
          </div>
        </div>
      </React.Fragment>
    );
  }

  /**
   * Render properties
   */
  private _renderProperties() {
    if (!this.state.data.properties) return null;
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
  * @param {TypedHash} item Entity item
  * @param {Object} configuration Configuration
  */
  private _transformProperties(item: TypedHash<any>, configuration: { fields: any[], columnConfig: any[] }) {
    const fieldNames = Object.keys(item).filter(fieldName => {
      let [field] = configuration.fields.filter(fld => fld.InternalName === fieldName);
      let [column] = configuration.columnConfig.filter(c => c.GtInternalName === fieldName);
      if (field && column) {
        return this.props.filterField ? column[this.props.filterField] : true;
      }
      return false;
    });
    const properties = fieldNames.map(fieldName => {
      let [field] = configuration.fields.filter(fld => fld.InternalName === fieldName);
      return new ProjectPropertyModel(field, item[fieldName]);
    });
    return properties;
  }

  /**
   * Get property item from site
   * 
   * @param {string} urlSource URL source
   */
  private async _getPropertyItem(urlSource: string = encodeURIComponent(document.location.href)) {
    try {
      let [item] = await this._propertiesList.items.select('Id').top(1).get<{ Id: number }[]>();
      if (!item) return null;
      // tslint:disable-next-line: naming-convention
      let [fieldValues, list] = await Promise.all([
        this._propertiesList.items.getById(item.Id).fieldValuesAsText.get(),
        this._propertiesList
          .select(
            'Id',
            'DefaultEditFormUrl',
            'Fields/InternalName',
            'Fields/TypeAsString',
            'Fields/TextField',
            'Fields/Id',
          )
          .expand('Fields')
          .get<{ Id: string, DefaultEditFormUrl: string, Fields: { InternalName: string, TypeAsString: string, TextField: string, Id: string }[] }>(),
      ]);
      let editFormUrl = makeUrlAbsolute(`${list.DefaultEditFormUrl}?ID=${item.Id}&Source=${urlSource}`);
      let versionHistoryUrl = `${this.props.webUrl}/_layouts/15/versions.aspx?list=${list.Id}&ID=${item.Id}`;
      return { fieldValues, editFormUrl, versionHistoryUrl, fields: list.Fields };
    } catch (error) {
      return null;
    }
  }

  /**
   * Sync property item from site
   * 
   * @param {any} _evt Event
   * @param {string[]} skip Property names to skip
   */
  private async _syncPropertyItem(_evt: any, skipProps: string[] = ['GtSiteId', 'GtGroupId', 'GtSiteUrl']) {
    try {
      const { fields, fieldValues } = this.state.data;
      const gtFields = fields.filter(fld => fld.InternalName.indexOf('Gt') === 0);
      const properties = _.omit(gtFields.reduce((obj, fld) => {
        let fieldValue = fieldValues[fld.InternalName];
        if (stringIsNullOrEmpty(fieldValue)) return obj;
        switch (fld.TypeAsString) {
          case 'TaxonomyFieldType': {
            let [textField] = fields.filter(f => f.Id === fld.TextField);
            if (textField) {
              obj[textField.InternalName] = fieldValues[textField.InternalName];
            }
          }
            break;
          case 'Text': {
            obj[fld.InternalName] = fieldValue;
          }
            break;
        }
        return obj;
      }, {}), skipProps);
      await this._spEntityPortalService.updateEntityItem(this.props.siteId, properties);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  /**
   * Fetch data
   * 
   * @param {IProjectInformationData} data Initial data
   */
  private async _fetchData(data: IProjectInformationData = { statusReports: [] }): Promise<IProjectInformationData> {
    try {
      let [configuration, propertyItem, entity] = await Promise.all([
        this._fetchConfiguration(),
        this._getPropertyItem(),
        this._spEntityPortalService.fetchEntity(this.props.siteId, this.props.webUrl),
      ]);

      if (propertyItem) {
        data.editFormUrl = propertyItem.editFormUrl;
        data.versionHistoryUrl = propertyItem.versionHistoryUrl;
        data.fieldValues = propertyItem.fieldValues;
      } else {
        entity = await this._spEntityPortalService.fetchEntity(this.props.siteId, this.props.webUrl);
        data.editFormUrl = entity.urls.editFormUrl;
        data.versionHistoryUrl = entity.urls.versionHistoryUrl;
        data.fieldValues = entity.fieldValues;
      }

      data.fields = entity.fields;

      data.properties = this._transformProperties(data.fieldValues, configuration);

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

      return data;
    } catch (error) {
      throw error;
    }
  }
}

export { ProjectInformationModal } from '../ProjectInformationModal';
export { IProjectInformationProps, ProjectProperty };

