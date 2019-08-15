import { dateAdd } from '@pnp/common';
import { sp } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import { getObjectValue, sortAlphabetically } from '@Shared/helpers';
import { IGraphGroup, ISPProjectItem, ISPUser } from 'interfaces';
import { ProjectListModel } from 'models';
import MSGraph from 'msgraph-helper';
import { IButtonProps } from 'office-ui-fabric-react/lib/Button';
import { DetailsList, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { SearchBox } from 'office-ui-fabric-react/lib/SearchBox';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'PortfolioWebPartsStrings';
import { ProjectInformationModal } from 'ProjectWebParts/lib/components/ProjectInformation';
import * as React from 'react';
import * as format from 'string-format';
import { IProjectListProps, ProjectListDefaultProps } from './IProjectListProps';
import { IProjectListState } from './IProjectListState';
import { ProjectCard } from './ProjectCard';
import styles from './ProjectList.module.scss';

export default class ProjectList extends React.Component<IProjectListProps, IProjectListState> {
  public static defaultProps = ProjectListDefaultProps;

  /**
   * Constructor
   * 
   * @param {IProjectListProps} props Props
   */
  constructor(props: IProjectListProps) {
    super(props);
    this.state = { isLoading: true, searchTerm: '', showAsTiles: props.showAsTiles };
  }

  public async componentDidMount() {
    try {
      let projects = await this.fetchProjects();
      let columns = this.props.columns.map(col => {
        if (col.fieldName === this.props.sortBy) {
          col.isSorted = true;
          col.isSortedDescending = true;
        }
        return col;
      });
      this.setState({
        projects,
        listView: { projects, columns },
        isLoading: false,
      });
      if (this.props.showProjectLogo) {
        this.getProjectLogos(20);
      }
    } catch (error) {
      console.log(error);
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
          <Spinner label={format(strings.LoadingText, 'prosjekter du er medlem av')} type={SpinnerType.large} />
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
            <SearchBox placeholder={strings.SearchBoxPlaceholderText} onChanged={this.onSearch.bind(this)} />
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
    const projects = this.filterProjets(this.state.projects);
    if (projects.length === 0) {
      return <MessageBar>{strings.NoSearchResults}</MessageBar>;
    }
    if (this.state.showAsTiles) {
      return projects.map(project => (
        <ProjectCard
          project={project}
          shouldTruncateTitle={true}
          showProjectLogo={this.props.showProjectLogo}
          showProjectOwner={this.props.showProjectOwner}
          showProjectManager={this.props.showProjectManager}
          actions={this.getCardActions(project)} />
      ));
    } else {
      return (
        <DetailsList
          items={this.filterProjets(this.state.listView.projects)}
          columns={this.state.listView.columns}
          onRenderItemColumn={this.onRenderItemColumn.bind(this)}
          onColumnHeaderClick={this.onListSort.bind(this)}
          selectionMode={SelectionMode.none} />
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
    if (column.fieldName === 'title') {
      return <a href={project.url}>{colValue}</a>;
    }
    return colValue;
  }

  /**
   * Sorting on column header click
   *
  * @param {React.MouseEvent} _evt Event
  * @param {IColumn} column Column
  */
  private onListSort(_evt: React.MouseEvent<any>, column: IColumn): void {
    let { listView } = ({ ...this.state } as IProjectListState);
    let isSortedDescending = column.isSortedDescending;
    if (column.isSorted) {
      isSortedDescending = !isSortedDescending;
    }
    listView.projects = listView.projects.concat([]).sort((a, b) => sortAlphabetically<ProjectListModel>(a, b, isSortedDescending, column.fieldName));
    listView.columns = listView.columns.map(_column => {
      _column.isSorted = (_column.key === column.key);
      if (_column.isSorted) {
        _column.isSortedDescending = isSortedDescending;
      }
      return _column;
    });
    this.setState({ listView });
  }

  /**
  * Render <ProjectInformationModal />
  */
  private renderProjectInformation() {
    if (this.state.showProjectInfo) {
      return (
        <ProjectInformationModal
          modalProps={{ isOpen: true, onDismiss: () => this.setState({ showProjectInfo: null }) }}
          title={this.state.showProjectInfo.title}
          entity={{ webUrl: this.props.siteAbsoluteUrl, ...this.props.entity }}
          webUrl={this.props.siteAbsoluteUrl}
          hubSiteUrl={this.props.siteAbsoluteUrl}
          siteId={this.state.showProjectInfo.siteId}
          hideActions={true}
          filterField='GtShowFieldPortfolio' />
      );
    }
    return null;
  }

  /**
   * Get card ations
   * 
   * @param {ProjectListModel} project Project
   */
  private getCardActions(project: ProjectListModel): IButtonProps[] {
    return [{
      id: 'ON_SELECT_PROJECT',
      iconProps: { iconName: 'OpenInNewWindow' },
      onClick: (event: React.MouseEvent<any>) => this.onCardAction(event, project),
    }];
  }

  /**
  * On select project
  *
  * @param {React.MouseEvent} event Event
  * @param {ProjectListModel} project Project
  */
  private onCardAction(event: React.MouseEvent<any>, project: ProjectListModel) {
    event.preventDefault();
    event.stopPropagation();
    switch (event.currentTarget.id) {
      case 'ON_SELECT_PROJECT': {
        this.setState({ showProjectInfo: project });
      }
        break;
    }
  }

  /**
   * Filter projects
   * 
   * @param {ProjectListModel[]} projects Projects
   */
  private filterProjets(projects: ProjectListModel[]) {
    return projects.filter(p => {
      const matches = Object.keys(p).filter(key => {
        const value = p[key];
        return value && typeof value === 'string' && value.toLowerCase().indexOf(this.state.searchTerm) !== -1;
      }).length;
      return matches > 0;
    });
  }

  /**
   * On search
   * 
   * @param {string} searchTerm Search term
   */
  private onSearch(searchTerm: string) {
    this.setState({ searchTerm: searchTerm.toLowerCase() });
  }

  /**
   * Map projects
   * 
   * @param {ISPProjectItem[]} items Items
   * @param {IGraphGroup[]} groups Groups
   * @param {Object} photos Photos
   * @param {ISPUser[]} users Users
   * @param {any[]} phaseTerms Phase terms
   */
  private mapProjects(items: ISPProjectItem[], groups: IGraphGroup[], users: ISPUser[], phaseTerms: any[]): ProjectListModel[] {
    let projects = items
      .map(item => {
        let [group] = groups.filter(grp => grp.id === item.GtGroupId);
        if (!group) {
          return null;
        }
        let [owner] = users.filter(user => user.Id === item.GtProjectOwnerId);
        let [manager] = users.filter(user => user.Id === item.GtProjectManagerId);
        let [phase] = phaseTerms.filter(p => p.Id.indexOf(getObjectValue<string>(item, 'GtProjectPhase.TermGuid', '')) !== -1);
        const model = new ProjectListModel(item.GtSiteId, group.id, group.displayName, item.GtSiteUrl, manager, owner, phase);
        return model;
      })
      .filter(p => p)
      .sort((a, b) => sortAlphabetically(a, b, true, this.props.sortBy));
    return projects;
  }

  /**
   * Get project logos (group photos)
   * 
   * @param {number} batchSize Batch size (defaults to 20)
   */
  private async getProjectLogos(batchSize: number = 20) {
    let requests = this.state.projects.map(p => ({
      id: p.groupId,
      method: 'GET',
      url: `groups/${p.groupId}/photo/$value`,
    }));
    while (requests.length > 0) {
      const { responses } = await MSGraph.Batch(requests.splice(0, batchSize));
      this.setState((prevState: IProjectListState) => {
        const projects = prevState.projects.map(p => {
          let [response] = responses.filter(r => r.id === p.groupId && r.status === 200);
          if (response) {
            p.logo = `data:image/png;base64, ${response.body}`;
          }
          return p;
        });
        return { projects };
      });
    }
  }

  /**
   * Fetch projects
   */
  private async fetchProjects(): Promise<ProjectListModel[]> {
    let [items, groups, users, phaseTerms] = await Promise.all([
      sp.web
        .lists
        .getByTitle(this.props.entity.listName)
        .items
        .select('GtGroupId', 'GtSiteId', 'GtSiteUrl', 'GtProjectOwnerId', 'GtProjectManagerId', 'GtProjectPhase')
        .orderBy('Title')
        .usingCaching()
        .get<ISPProjectItem[]>(),
      MSGraph.Get<IGraphGroup[]>(`/me/memberOf/$/microsoft.graph.group`, ['id', 'displayName'], `groupTypes/any(a:a%20eq%20'unified')`),
      sp.web
        .siteUsers
        .select('Id', 'Title', 'Email')
        .usingCaching({
          key: 'projectlist_fetchprojects_siteusers',
          storeName: 'session',
          expiration: dateAdd(new Date(), 'minute', 15),
        })
        .get<ISPUser[]>(),
      taxonomy
        .getDefaultSiteCollectionTermStore()
        .getTermSetById(this.props.phaseTermSetId)
        .terms
        .usingCaching({
          key: 'projectlist_fetchprojects_terms',
          storeName: 'session',
          expiration: dateAdd(new Date(), 'minute', 15),
        })
        .get(),
    ]);
    let projects = this.mapProjects(items, groups, users, phaseTerms);
    return projects;
  }
}

export { IProjectListProps };

