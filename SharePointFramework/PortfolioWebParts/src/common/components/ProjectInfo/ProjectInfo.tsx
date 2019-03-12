import * as React from 'react';
import styles from './ProjectInfo.module.scss';
import * as strings from 'CommonStrings';
import { Modal } from "office-ui-fabric-react/lib/Modal";
import { IProjectInfoProps } from './IProjectInfoProps';
import { IProjectInfoState } from './IProjectInfoState';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import HubSiteService from 'sp-hubsite-service';
import SpEntityPortalService from 'sp-entityportal-service';
import ProjectPropertyModel from '../../models/ProjectPropertyModel';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Button } from 'office-ui-fabric-react/lib/Button';

export default class ProjectInfo extends React.Component<IProjectInfoProps, IProjectInfoState> {
  constructor(props: IProjectInfoProps) {
    super(props);
    this.state = { isLoading: true, data: null };
  }

  public async componentDidMount() {
    await this.fetchData();
  }

  public render() {
    return (
      <Modal
        className={styles.modal}
        isOpen={true}
        onDismiss={this.props.onDismiss}>
        <div className={styles.propertiesModalInner}>
          <span className={styles.propertiesModalHeader}>{this.props.project.Title}</span>
          {(this.state.isLoading) ? <Spinner className={styles.spinner} label={strings.Loading} size={SpinnerSize.medium} /> :
            <div className={styles.headerButtons}>
              <Button
                iconProps={{ iconName: 'Home' }}
                text={strings.ProjectLinkText}
                onClick={() => location.replace(this.props.project.Url)} />
              <Button
                iconProps={{ iconName: "BarChart4" }}
                text={strings.ProjectStatusLinkText}
                onClick={() => location.replace(`${this.props.project.Url}/SitePages/Prosjektstatus.aspx`)} />
              {this.renderProperties(this.state.data.properties.slice())}
            </div>}
        </div>
      </Modal>
    );
  }

  private renderProperties(properties) {
    const propertiesToRender = properties.filter(p => !p.empty && p.showInDisplayForm);
    const hasMissingProps = properties.filter(p => p.required && p.empty).length > 0;
    if (hasMissingProps) return <MessageBar messageBarType={MessageBarType.error}>{strings.MissingProperties}</MessageBar>;
    if (propertiesToRender.length === 0) return <MessageBar>{strings.NoProperties}</MessageBar>;
    return (
      <div className={styles.propertiesContainer}>
        {propertiesToRender.map(p => {
          return (
            <div className={styles.property}>
              <p className={styles.propertyHeader}>{p.displayName}</p>
              <p className={styles.propertyValue}>{p.value}</p>
            </div>
          );
        })}
      </div>
    );
  }

  private async fetchData() {
    try {
      const { pageContext, project } = this.props;
      const hubSite = await HubSiteService.GetHubSiteById(pageContext.web.absoluteUrl, pageContext.legacyPageContext.hubSiteId);
      const spEntityPortalService = new SpEntityPortalService({ webUrl: hubSite.url, ...this.props.entity });
      const [entityItem, entityFields, editFormUrl] = await Promise.all([
        spEntityPortalService.getEntityItemFieldValues(project.Id),
        spEntityPortalService.getEntityFields(),
        spEntityPortalService.getEntityEditFormUrl(project.Id, pageContext.web.absoluteUrl),
      ]);
      let properties = Object.keys(entityItem)
        .map(n => ({
          field: entityFields.filter(fld => fld.InternalName === n)[0],
          value: entityItem[n],
        }))
        .filter(prop => prop.field)
        .map(({ field, value }) => new ProjectPropertyModel(field, value));

      const data = { properties, editFormUrl, itemId: entityItem.Id };

      this.setState({ data, isLoading: false });
    } catch (error) {
      throw error;
    }
  }

}
