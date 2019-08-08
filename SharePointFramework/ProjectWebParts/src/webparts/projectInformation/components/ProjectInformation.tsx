import { DisplayMode } from '@microsoft/sp-core-library';
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { HubConfigurationService } from '@Shared/services';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as ProjectInformationWebPartStrings from 'ProjectInformationWebPartStrings';
import * as React from 'react';
import SpEntityPortalService from 'sp-entityportal-service';
import ProjectPropertyModel from '../models/ProjectPropertyModel';
import { IProjectInformationData } from './IProjectInformationData';
import { IProjectInformationProps } from './IProjectInformationProps';
import { IProjectInformationState } from './IProjectInformationState';
import styles from './ProjectInformation.module.scss';
import ProjectProperty from './ProjectProperty';

export default class ProjectInformation extends React.Component<IProjectInformationProps, IProjectInformationState> {
  public static defaultProps: Partial<IProjectInformationProps> = { title: 'Prosjektinformasjon' };

  constructor(props: IProjectInformationProps) {
    super(props);
    this.state = { isLoading: true, data: {} };
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
        <div className={styles.container}>
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
      return <Spinner label={ProjectInformationWebPartStrings.LoadingText} />;
    }
    if (this.state.error) {
      return <MessageBar messageBarType={MessageBarType.error}>{ProjectInformationWebPartStrings.ErrorText}</MessageBar>;
    }
    return (
      <div>
        {this.renderProperties()}
        <div className={styles.actions} hidden={this.props.hideActions || !this.props.isSiteAdmin}>
          <div>
            <DefaultButton
              text={ProjectInformationWebPartStrings.EditPropertiesText}
              href={this.state.data.editFormUrl}
              iconProps={{ iconName: 'Edit' }} />
          </div>
          <div>
            <DefaultButton
              text={ProjectInformationWebPartStrings.EditSiteInformationText}
              onClick={_ => window['_spLaunchSiteSettings']()}
              disabled={!window['_spLaunchSiteSettings']}
              iconProps={{ iconName: 'Info' }} />
          </div>
        </div>
      </div >
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
        return <MessageBar messageBarType={MessageBarType.error}>{ProjectInformationWebPartStrings.MissingPropertiesMessage}</MessageBar>;
      }
      if (propertiesToRender.length === 0) {
        return <MessageBar>{ProjectInformationWebPartStrings.NoPropertiesMessage}</MessageBar>;
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

  private async fetchData(): Promise<IProjectInformationData> {
    try {
      let { hubSiteUrl, siteId, webUrl } = this.props;
      const spEntityPortalService = new SpEntityPortalService({ webUrl: hubSiteUrl, ...this.props.entity });
      const [columnConfig, entityItem, entityFields, editFormUrl] = await Promise.all([
        new HubConfigurationService(hubSiteUrl).getProjectColumns(),
        spEntityPortalService.getEntityItemFieldValues(siteId),
        spEntityPortalService.getEntityFields(),
        spEntityPortalService.getEntityEditFormUrl(siteId, webUrl),
      ]);
      let properties = Object.keys(entityItem)
        .map(fieldName => ({
          field: entityFields.filter(fld => fld.InternalName === fieldName)[0],
          value: entityItem[fieldName],
        }))
        .filter(prop => {
          if (prop.field) {
            const [column] = columnConfig.filter(c => c.GtInternalName === prop.field.InternalName);
            if (column) {
              return column[this.props.filterField];
            }
          }
          return false;
        })
        .map(({ field, value }) => new ProjectPropertyModel(field, value));
      const data = { properties, editFormUrl, itemId: entityItem.Id };
      return data;
    } catch (error) {
      throw error;
    }
  }
}
