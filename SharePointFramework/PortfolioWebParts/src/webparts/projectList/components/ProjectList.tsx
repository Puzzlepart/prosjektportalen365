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
import { sp, Web, QueryPropertyValueType } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import { sortAlphabetically, getObjectValue } from '../../../../../@Shared/lib/helpers';
import ProjectInformation from '../../../../../ProjectWebParts/lib/webparts/projectInformation/components/ProjectInformation';
import MSGraph from 'msgraph-helper';
import { ProjectListModel, ISPProjectItem, ISPUser } from '../models';

export default class ProjectList extends React.Component<IProjectListProps, IProjectListState> {
  public static defaultProps = ProjectListDefaultProps;

  constructor(props: IProjectListProps) {
    super(props);
    this.state = { isLoading: true, searchTerm: '', showAsTiles: props.showAsTiles };
  }

  public async componentDidMount() {
    try {
      const projects = await this.fetchData();
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
    const projects = this.filterProjets(this.state.projects);
    if (projects.length === 0) {
      return <MessageBar>{strings.NoSearchResults}</MessageBar>;
    }
    if (this.state.showAsTiles) {
      const cards = projects.map(project => (
        <ProjectCard
          project={project}
          shouldTruncateTitle={true}
          showProjectLogo={this.props.showProjectLogo}
          showProjectOwner={this.props.showProjectOwner}
          showProjectManager={this.props.showProjectManager}
          actions={[{
            id: 'ON_SELECT_PROJECT',
            iconProps: { iconName: 'OpenInNewWindow' },
            onClick: (event: React.MouseEvent<any>) => this.onCardAction(event, project),
          }]} />
      ));
      return cards;
    } else {
      return (
        <DetailsList
          items={this.filterProjets(this.state.listView.projects)}
          columns={this.state.listView.columns}
          onRenderItemColumn={this.onRenderItemColumn}
          onColumnHeaderClick={this.onListSort} />
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
   * Sorting on column header click
   *
* @param {React.MouseEvent} _event Event
* @param {IColumn} column Column
    */
  @autobind
  private onListSort(_event: React.MouseEvent<any>, column: IColumn): any {
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
            webUrl={this.props.siteAbsoluteUrl}
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
  @autobind
  private onSearch(searchTerm: string) {
    this.setState({ searchTerm: searchTerm.toLowerCase() });
  }

  /**
   * Map data
   * 
   * @param {ISPProjectItem[]} items Items
   * @param {any[]} groups Groups
   * @param {any[]} siteLogos Site logos
   * @param {any[]} users Users
   * @param {any[]} phaseTerms Phase terms
   */
  private mapData(items: ISPProjectItem[], groups: any[], siteLogos: any[], users: any[], phaseTerms: any[]): ProjectListModel[] {
    console.log(siteLogos);
    let projects = items
      .map(item => {
        let [group] = groups.filter(grp => grp.id === item.GtGroupId);
        if (!group) {
          return null;
        }
        let [owner] = users.filter(user => user.Id === item.GtProjectOwnerId);
        let [manager] = users.filter(user => user.Id === item.GtProjectManagerId);
        let [phase] = phaseTerms.filter(p => p.Id.indexOf(getObjectValue(item, 'GtProjectPhase.TermGuid', '')) !== -1);
        const model = new ProjectListModel(item.GtSiteId, group.displayName, item.GtSiteUrl, manager, owner, phase);
        return model;
      })
      .filter(p => p)
      .sort((a, b) => sortAlphabetically(a, b, true, this.props.sortBy));
    return projects;
  }

  /**
   * Fetch site logos using search
   */
  private async fetchSiteLogos() {
    return (await sp.search({
      Querytext: `DepartmentId:{${this.props.hubSiteId}} contentclass:STS_Site`,
      TrimDuplicates: false,
      RowLimit: 500,
      SelectProperties: ['SiteLogo', 'SiteId'],
      Properties: [{
        Name: "EnableDynamicGroups",
        Value: {
          BoolVal: true,
          QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
        }
      }]
    })).PrimarySearchResults;
  }

  /**
   * Fetch data
   * 
   * @param {Web} web Web
   */
  private async fetchData(web: Web = sp.web): Promise<ProjectListModel[]> {
    let batch = sp.createBatch();
    let [items, groups, siteLogos, users, phaseTerms] = await Promise.all([
      web
        .lists
        .getByTitle(this.props.entity.listName)
        .items
        .select('GtGroupId', 'GtSiteId', 'GtSiteUrl', 'GtProjectOwnerId', 'GtProjectManagerId', 'GtProjectPhase')
        .orderBy('Title')
        .usingCaching()
        .inBatch(batch)
        .get<ISPProjectItem[]>(),
      MSGraph.Get<{ id: string, displayName: string }[]>(`/me/memberOf/$/microsoft.graph.group`, 'v1.0', ['id', 'displayName'], `groupTypes/any(a:a%20eq%20'unified')`),
      this.fetchSiteLogos(),
      web
        .siteUsers
        .select('Id', 'Title', 'Email')
        .usingCaching()
        .inBatch(batch)
        .get<ISPUser[]>(),
      taxonomy
        .getDefaultSiteCollectionTermStore()
        .getTermSetById(this.props.phaseTermSetId)
        .terms
        .usingCaching()
        .inBatch(batch)
        .get(),
      batch.execute(),
    ]);
    return this.mapData(items, groups, siteLogos, users, phaseTerms);
  }
}

