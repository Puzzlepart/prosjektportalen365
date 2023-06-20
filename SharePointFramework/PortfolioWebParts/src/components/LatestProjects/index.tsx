import { Spinner, SpinnerType, MessageBar } from '@fluentui/react'
import { DisplayMode } from '@microsoft/sp-core-library'
import { SortDirection } from '@pnp/sp'
import { WebPartTitle } from '@pnp/spfx-controls-react/lib/WebPartTitle'
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings'
import { formatDate } from 'pp365-shared-library/lib/helpers'
import React, { Component } from 'react'
import styles from './LatestProjects.module.scss'
import { ILatestProjectsProps, ILatestProjectsState } from './types'

/**
 * @component LatestProjects
 * @extends Component
 */
export class LatestProjects extends Component<ILatestProjectsProps, ILatestProjectsState> {
  constructor(props: ILatestProjectsProps) {
    super(props)
    this.state = { loading: true, projects: [] }
  }

  public async componentDidMount() {
    try {
      const projects = await this.props.dataAdapter.fetchProjectSites(
        15,
        'Created',
        SortDirection.Descending
      )
      this.setState({ projects, loading: false })
    } catch (error) {
      this.setState({ projects: [], loading: false })
    }
  }

  /**
   * Renders the <LatestProjects /> component
   */
  public render(): React.ReactElement<ILatestProjectsProps> {
    return (
      <div className={styles.root}>
        <WebPartTitle
          displayMode={DisplayMode.Read}
          title={this.props.title}
          updateProperty={undefined}
        />
        <div className={styles.container}>
          {this.state.loading ? (
            <Spinner label={this.props.loadingText} type={SpinnerType.large} />
          ) : (
            this._renderProjectList()
          )}
        </div>
      </div>
    )
  }

  /**
   * Render project list
   */
  private _renderProjectList() {
    const { projects } = this.state
    if (projects.length === 0) return <MessageBar>{this.props.emptyMessage}</MessageBar>
    return projects.splice(0, this.props.rowLimit).map((site, idx) => {
      const created = formatDate(site.Created, true)
      return (
        <div key={idx} className={styles.projectItem}>
          <div className={styles.itemContainer}>
            <div className={styles.created}>
              {PortfolioWebPartsStrings.CreatedText} {created}
            </div>
            <a href={site.Path}>{site.Title}</a>
          </div>
        </div>
      )
    })
  }
}

export { ILatestProjectsProps }
