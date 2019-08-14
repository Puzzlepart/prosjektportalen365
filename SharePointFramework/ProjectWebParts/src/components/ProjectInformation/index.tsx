import { DisplayMode } from '@microsoft/sp-core-library';
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { HubConfigurationService } from '@Shared/services';
import SpEntityPortalService from 'sp-entityportal-service';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import * as ProjectInformationWebPartStrings from 'ProjectInformationWebPartStrings';
import * as React from 'react';
import { IProjectInformationData } from './IProjectInformationData';
import { IProjectInformationProps, ProjectInformationDefaultProps } from './IProjectInformationProps';
import { IProjectInformationState } from './IProjectInformationState';
import styles from './ProjectInformation.module.scss';
import ProjectProperty from './ProjectProperty';
import { ProjectPropertyModel } from 'models';


export class ProjectInformation extends React.Component<IProjectInformationProps, IProjectInformationState> {
  public static defaultProps = ProjectInformationDefaultProps;

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
              text={ProjectInformationWebPartStrings.ViewVersionHistoryText}
              href={this.state.data.versionHistoryUrl}
              iconProps={{ iconName: 'History' }}
              style={{ width: 250 }} />
          </div>
          <div>
            <DefaultButton
              text={ProjectInformationWebPartStrings.EditPropertiesText}
              href={this.state.data.editFormUrl}
              iconProps={{ iconName: 'Edit' }}
              style={{ width: 250 }} />
          </div>
          <div>
            <DefaultButton
              text={ProjectInformationWebPartStrings.EditSiteInformationText}
              onClick={_ => window['_spLaunchSiteSettings']()}
              disabled={!window['_spLaunchSiteSettings']}
              iconProps={{ iconName: 'Info' }}
              style={{ width: 250 }} />
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
      const hubConfigurationService = new HubConfigurationService(this.props.hubSiteUrl);
      const spEntityPortalService = new SpEntityPortalService({ webUrl: this.props.hubSiteUrl, ...this.props.entity });

      const [
        columnConfig,
        fields,
        editFormUrl,
        versionHistoryUrl,
        entityItem,
      ] = await Promise.all([
        hubConfigurationService.getProjectColumns(),
        spEntityPortalService.getEntityFields(),
        spEntityPortalService.getEntityEditFormUrl(this.props.siteId, this.props.webUrl),
        spEntityPortalService.getEntityVersionHistoryUrl(this.props.siteId, this.props.webUrl),
        spEntityPortalService.getEntityItemFieldValues(this.props.siteId)
      ]);
      let properties = Object.keys(entityItem)
        .map(fieldName => ({
          field: fields.filter(fld => fld.InternalName === fieldName)[0],
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
      return {
        properties,
        editFormUrl,
        versionHistoryUrl,
        itemId: entityItem.ID,
      };
    } catch (error) {
      throw error;
    }
  }
}

export { IProjectInformationProps, ProjectProperty };

