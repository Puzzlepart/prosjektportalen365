import * as React from 'react';
import styles from './ProjectInformation.module.scss';
import { DisplayMode } from '@microsoft/sp-core-library';
import { IProjectInformationProps } from './IProjectInformationProps';
import { IProjectInformationState } from './IProjectInformationState';
import { IProjectInformationData } from './IProjectInformationData';
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import ProjectPropertyModel from '../models/ProjectPropertyModel';
import ProjectProperty from './ProjectProperty';
import HubSiteService from 'sp-hubsite-service';
import SpEntityPortalService from 'sp-entityportal-service';
import * as strings from 'ProjectInformationWebPartStrings';
import { HubConfigurationService } from '../../../common/services/HubConfigurationService';

export default class ProjectInformation extends React.Component<IProjectInformationProps, IProjectInformationState> {
  public static defaultProps: Partial<IProjectInformationProps> = { updateTitle: () => { } };

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
            updateProperty={this.props.updateTitle} />
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
      return <Spinner label={strings.LoadingText} />;
    }
    if (this.state.error) {
      return <MessageBar messageBarType={MessageBarType.error}>{strings.ErrorText}</MessageBar>;
    }
    return (
      <div>
        {this.renderProperties()}
        <div className={styles.editPropertiesButton} hidden={this.props.hideEditPropertiesButton || !this.props.context.pageContext.legacyPageContext.isSiteAdmin}>
          <DefaultButton
            text={strings.EditPropertiesText}
            href={this.state.data.editFormUrl}
            iconProps={{ iconName: 'Edit' }} />
        </div>
      </div>
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

  private async fetchData(): Promise<IProjectInformationData> {
    try {
      const { pageContext } = this.props.context;
      const hubSite = await HubSiteService.GetHubSiteById(pageContext.web.absoluteUrl, pageContext.legacyPageContext.hubSiteId);
      const spEntityPortalService = new SpEntityPortalService({ webUrl: hubSite.url, ...this.props.entity });
      const [columnConfig, entityItem, entityFields, editFormUrl] = await Promise.all([
        new HubConfigurationService(hubSite).getProjectColumns(),
        spEntityPortalService.getEntityItemFieldValues(pageContext.site.id.toString()),
        spEntityPortalService.getEntityFields(),
        spEntityPortalService.getEntityEditFormUrl(pageContext.site.id.toString(), pageContext.web.absoluteUrl),
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
