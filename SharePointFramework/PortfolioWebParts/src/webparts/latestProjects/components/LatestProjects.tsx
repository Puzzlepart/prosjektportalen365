import * as React from 'react';
import styles from './LatestProjects.module.scss';
import * as strings from 'LatestProjectsWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { WebPartTitle } from "@pnp/spfx-controls-react/lib/WebPartTitle";
import { ILatestProjectsProps } from './ILatestProjectsProps';
import { ILatestProjectsState } from './ILatestProjectsState';
import { sp, QueryPropertyValueType, SortDirection } from '@pnp/sp';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import formatDate from '../../../../../@Shared/lib/helpers/formatDate';

export default class LatestProjects extends React.Component<ILatestProjectsProps, ILatestProjectsState> {
  constructor(props: ILatestProjectsProps) {
    super(props);
    this.state = { isLoading: true, projects: [], showList: true };
  }

  public async componentDidMount() {
    try {
      const projects = await this.fetchData(this.props.context.pageContext.legacyPageContext.hubSiteId);
      this.setState({ projects, isLoading: false });
    } catch (error) {
      this.setState({ projects: [], isLoading: false });
    }
  }

  /**
   * Renders the <LatestProjects /> component
   */
  public render(): React.ReactElement<ILatestProjectsProps> {
    return (
      <div className={styles.latestProjects}>
        <WebPartTitle
          displayMode={this.props.displayMode}
          title={this.props.title}
          updateProperty={this.props.updateProperty} />
        <div className={styles.linksContainer}>
          {this.state.isLoading
            ? <Spinner label={strings.LoadingProjects} type={SpinnerType.large} />
            : this.renderProjectList()
          }
        </div>
      </div>
    );
  }

  /**
   * Render project list
   */
  private renderProjectList() {
    if (this.state.projects.length > 0) {
      return this.state.projects.map(site => {
        let created = formatDate(site['Created']);
        return (
          <div className={styles.projectItem}>
            <div className={styles.container}>
              <div className={styles.created}>
                {PortfolioWebPartsStrings.CreatedText} {created}
              </div>
              <a href={site.Path}>{site.Title}</a>
            </div>
          </div>
        );
      });
    } else return <MessageBar>{strings.EmptyMessage}</MessageBar>;
  }

  /**
   * Fetch data
   * 
   * @param {string} hubSiteId Hub site ID
   */
  private async fetchData(hubSiteId: string) {
    let result = await sp.search({
      Querytext: `DepartmentId:{${hubSiteId}} contentclass:STS_Site`,
      TrimDuplicates: false,
      RowLimit: 5,
      SelectProperties: ['Title', 'Path', 'DepartmentId', 'SiteId', 'Created'],
      SortList: [{
        Property: "Created",
        Direction: SortDirection.Descending
      }],
      Properties: [{
        Name: "EnableDynamicGroups",
        Value: {
          BoolVal: true,
          QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
        }
      }]
    });
    let projects = result.PrimarySearchResults.filter(site => hubSiteId !== site['SiteId']);
    return projects;
  }
}
