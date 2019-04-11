import * as React from 'react';
import styles from './LatestProjects.module.scss';
import * as strings from 'LatestProjectsWebPartStrings';
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
    this.state = { isLoading: true, sites: [], showList: true };
  }

  public async componentDidMount() {
    try {
      const sites = await this.fetchData();
      this.setState({ sites, isLoading: false });
    } catch (error) {
      this.setState({ sites: [], isLoading: false });
    }
  }

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

  private renderProjectList() {
    if (this.state.sites.length > 0) {
      return this.state.sites.map(site => {
        let created = formatDate(site['Created']);
        return (
          <div className={styles.linkItem}>
            <a className={styles.projectLink} href={site.Path}>{site.Title}</a>
            <p className={styles.subTitle}>Opprettet {created}</p>
          </div>
        );
      });
    } else return <MessageBar>Fant ingen nye prosjekter</MessageBar>;
  }

  private async fetchData() {
    const { hubSiteId } = this.props.context.pageContext.legacyPageContext;
    let result = await sp.search({
      Querytext: `DepartmentId:{${hubSiteId}} contentclass:STS_Site`,
      TrimDuplicates: false,
      RowLimit: 5,
      SelectProperties: ['Title', 'Path', 'DepartmentId', 'SiteId', 'Created'],
      SortList:
        [
          {
            Property: "Created",
            Direction: SortDirection.Descending
          }
        ],
      Properties: [{
        Name: "EnableDynamicGroups",
        Value: {
          BoolVal: true,
          QueryPropertyValueTypeIndex: QueryPropertyValueType.BooleanType
        }
      }
      ]
    });
    let sites = result.PrimarySearchResults.filter(site => hubSiteId !== site['SiteId']);
    return sites;
  }
}
