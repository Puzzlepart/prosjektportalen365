import { ChartData, ChartDataItem } from 'models'
import { PortfolioOverviewView } from 'pp365-shared-library/lib/models'
import React, { Component } from 'react'
import Chart from './Chart'
import { Commands } from './Commands'
import styles from './PortfolioInsights.module.scss'
import { IPortfolioInsightsProps, IPortfolioInsightsState } from './types'
import * as strings from 'PortfolioWebPartsStrings'
import { UserMessage } from 'pp365-shared-library'

/**
 * @component PortfolioInsights
 * @extends Component
 */
export class PortfolioInsights extends Component<IPortfolioInsightsProps, IPortfolioInsightsState> {
  public static defaultProps: Partial<IPortfolioInsightsProps> = {}

  /**
   * Constructor
   *
   * @param props Props
   */
  constructor(props: IPortfolioInsightsProps) {
    super(props)
    this.state = { loading: true }
  }

  public async componentDidMount() {
    try {
      const configuration = await this.props.dataAdapter.getPortfolioConfig()
      const currentView = configuration.views[0]
      const { charts, chartData, contentTypes } = await this.props.dataAdapter.fetchChartData(
        currentView,
        configuration,
        this.props.chartConfigurationListName,
        this.props.pageContext.site.id.toString()
      )
      this.setState({
        charts,
        contentTypes,
        chartData,
        configuration,
        currentView,
        loading: false
      })
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  public render(): React.ReactElement<IPortfolioInsightsProps> {
    if (this.state.loading) return null

    return (
      <div className={styles.portfolioInsights}>
        <div className={styles.container}>
          <Commands
            newFormUrl={`${this.props.pageContext.web.absoluteUrl}/Lists/Grafkonfigurasjon/NewForm.aspx`}
            contentTypes={this.state.contentTypes}
            currentView={this.state.currentView}
            configuration={this.state.configuration}
            onViewChanged={this._onViewChanged.bind(this)}
          />
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={`${styles.inner} ms-Grid`} dir='ltr'>
            {this._charts}
          </div>
        </div>
      </div>
    )
  }

  private get _charts() {
    if (this.state.error) {
      return (
        <div className={styles.inner}>
          <UserMessage
            title={strings.ErrorFetchingProjectsTitle}
            text={this.state.error}
            intent='error'
          />
        </div>
      )
    }
    if (this.state.chartData.isEmpty()) {
      return (
        <div className={styles.inner}>
          <UserMessage
            title={strings.NoProjectsFoundTitle}
            text={strings.NoProjectsFoundDescription}
          />
        </div>
      )
    }
    return (
      <div className={`${styles.charts} ms-Grid-row`}>
        {this.state.charts.map((chart, idx) => (
          <Chart key={idx} chart={chart} data={this.state.chartData} />
        ))}
      </div>
    )
  }

  /**
   * On view changed
   *
   * @param view View
   */
  private async _onViewChanged(view: PortfolioOverviewView) {
    const { items } = await this.props.dataAdapter.fetchDataForView(
      view,
      this.state.configuration,
      this.props.pageContext.site.id.toString()
    )
    const chartData = new ChartData(items.map((item) => new ChartDataItem(item.Title, item)))
    this.setState({ currentView: view, chartData })
  }
}

export { IPortfolioInsightsProps }
