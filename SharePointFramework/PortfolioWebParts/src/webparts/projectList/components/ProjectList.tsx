import * as React from 'react';
import styles from './ProjectList.module.scss';
import * as strings from 'ProjectListWebPartStrings';
import { IProjectListProps, ProjectListDefaultProps } from './IProjectListProps';
import { IProjectListState } from './IProjectListState';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { DetailsList, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import ProjectCard from './ProjectCard/ProjectCard';
import { sp, Web } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import ProjectInformation from '../../../../../ProjectWebParts/lib/webparts/projectInformation/components/ProjectInformation';
import MSGraph from 'msgraph-helper';
import getObjectValue from '../../../../../@Shared/lib/helpers/getObjectValue';
import { ProjectListModel, ISPUser } from '../models/ProjectListModel';
import getUserPhoto from '../../../../../@Shared/lib/helpers/getUserPhoto';

export default class ProjectList extends React.Component<IProjectListProps, IProjectListState> {
  public static defaultProps = ProjectListDefaultProps;

  constructor(props: IProjectListProps) {
    super(props);
    this.state = {
      projects: [],
      isLoading: true,
      showAsTiles: true,
    };
  }

  public async componentDidMount() {
    try {
      const projects = await this.fetchData();
      this.setState({ projects, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  /**
   * Renders the <ProjectList /> component
   */
  public render(): React.ReactElement<IProjectListProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.projectList}>
          <Spinner label={strings.LoadingText} type={SpinnerType.large} />
        </div >
      );
    }
    if (this.state.error) {
      return (
        <div className={styles.projectList}>
          <MessageBar messageBarType={MessageBarType.error}>{strings.ErrorText}</MessageBar>
        </div >
      );
    }
    return (
      <div className={styles.projectList}>
        <div className={styles.container}>
          <div className={styles.searchBox}>
            <SearchBox placeholder={strings.SearchBoxPlaceholderText} onChanged={this.onSearch} />
          </div>
          <div className={styles.viewToggle}>
            <Toggle
              offText={strings.ShowAsListText}
              onText={strings.ShowAsTilesText}
              defaultChecked={this.state.showAsTiles}
              onChanged={showAsTiles => this.setState({ showAsTiles })} />
          </div>
          <div className={styles.projects}>
            {this.renderProjects()}
          </div>
        </div>
        {this.renderProjectInformation()}
      </div>
    );
  }

  /**
   * Render projects
   */
  private renderProjects() {
    const projects = this.getFilteredProjects();
    if (projects.length === 0) {
      return <MessageBar>{strings.NoSearchResults}</MessageBar>;
    }
    if (this.state.showAsTiles) {
      const cards = projects.map(project => (
        <ProjectCard
          project={project}
          shouldTruncateTitle={true}
          actions={[{
            id: 'ON_SELECT_PROJECT',
            iconProps: { iconName: "OpenInNewWindow" },
            onClick: (event: React.MouseEvent<any>) => this.onCardAction(event, project),
          }]} />
      ));
      return cards;
    } else {
      return (
        <DetailsList
          items={projects}
          columns={this.props.columns}
          onRenderItemColumn={this.onRenderItemColumn} />
      );
    }
  }

  /**
   * On render item column
   * 
   * @param {ProjectListModel} project Project
   * @param {number} _index Index
   * @param {IColumn} column Column
   */
  private onRenderItemColumn(project: ProjectListModel, _index: number, column: IColumn) {
    const colValue = getObjectValue(project, column.fieldName, null);
    if (column.fieldName === 'Title') {
      return <a href={project.Url}>{colValue}</a>;
    }
    return colValue;
  }

  /**
  * Render <ProjectInformation /> in a <Modal />
  */
  private renderProjectInformation() {
    if (this.state.selectedProject) {
      return (
        <Modal
          isOpen={true}
          containerClassName={styles.projectInfoModal}
          onDismiss={() => this.setState({ selectedProject: null })}>
          <ProjectInformation
            title={this.state.selectedProject.Title}
            entity={{ webUrl: this.props.siteAbsoluteUrl, ...this.props.entity }}
            hubSiteUrl={this.props.siteAbsoluteUrl}
            siteId={this.state.selectedProject.Id}
            hideEditPropertiesButton={true}
            filterField='GtShowFieldPortfolio' />
        </Modal>
      );
    }
    return null;
  }

  /**
  * On select project
  *
  * @param {React.MouseEvent} event Event
  * @param {ProjectListModel} project Project
  */
  @autobind
  private onCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault();
    event.stopPropagation();
    switch (event.currentTarget.id) {
      case 'ON_SELECT_PROJECT': {
        this.setState({ selectedProject: project });
      }
        break;
    }
  }

  /**
   * Get filtered projects
   */
  private getFilteredProjects() {
    let { projects, searchTerm } = ({ ...this.state } as IProjectListState);
    if (searchTerm) {
      projects = projects
        .filter(project => {
          const matches = Object.keys(project).filter(key => {
            const value = project[key];
            return value && typeof value === 'string' && value.toLowerCase().indexOf(searchTerm) !== -1;
          }).length;
          return matches > 0;
        })
        .sort((a, b) => a.Title > b.Title ? 1 : -1);
      return projects;
    } else {
      return projects;
    }
  }

  /**
   * On search
   * 
   * @param {string} searchTerm Search term
   */
  @autobind
  private onSearch(searchTerm: string) {
    this.setState({ searchTerm: searchTerm.toLowerCase() });
  }

  /**
   * Fetch data
   * 
   * @param {Web} web Web
   */
  private async fetchData(web: Web = sp.web): Promise<ProjectListModel[]> {
    let [items, groups, users, phaseTerms] = await Promise.all([
      web
        .lists
        .getByTitle(this.props.entity.listName)
        .items
        .select('GtGroupId', 'GtSiteId', 'GtSiteUrl', 'GtProjectOwnerId', 'GtProjectManagerId', 'GtProjectPhase')
        .usingCaching()
        .get<{ GtGroupId: string, GtSiteId: string, GtSiteUrl: string, GtProjectOwnerId: number, GtProjectManagerId: number, GtProjectPhase: { TermGuid: string } }[]>(),
      MSGraph.Get<{ id: string, displayName: string }[]>(`/me/memberOf/$/microsoft.graph.group`, 'v1.0', ['id', 'displayName'], `groupTypes/any(a:a%20eq%20'unified')`),
      web
        .siteUsers
        .select("Id", "Title", "Email")
        .usingCaching()
        .get<ISPUser[]>(),
      taxonomy
        .getDefaultSiteCollectionTermStore()
        .getTermSetById(this.props.phaseTermSetId)
        .terms
        .usingCaching()
        .get(),
    ]);

    let projects = items
      .map(item => {
        let [group] = groups.filter(grp => grp.id === item.GtGroupId);
        if (!group) {
          return null;
        }
        let [owner] = users.filter(user => user.Id === item.GtProjectOwnerId);
        let [manager] = users.filter(user => user.Id === item.GtProjectManagerId);
        let [phase] = phaseTerms.filter(p => p.Id.indexOf(getObjectValue(item, 'GtProjectPhase.TermGuid', '')) !== -1);

        const model: ProjectListModel = { Id: item.GtSiteId, Title: group.displayName, Url: item.GtSiteUrl };

        if (manager) {
          model.Manager = { primaryText: manager.Title, imageUrl: getUserPhoto(manager.Email) };
        }
        if (owner) {
          model.Owner = { primaryText: owner.Title, imageUrl: getUserPhoto(owner.Email) };
        }
        if (phase) {
          model.Phase = phase.Name;
        }

        return model;
      })
      .filter(p => p);

    return projects;
  }
}

