import { ChartData, ChartDataItem } from 'models'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar'
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner'
import * as strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import * as format from 'string-format'
import Chart from './Chart'
import { IPortfolioInsightsProps } from './IPortfolioInsightsProps'
import { IPortfolioInsightsState } from './IPortfolioInsightsState'
import styles from './PortfolioInsights.module.scss'
import PortfolioInsightsCommandBar from './PortfolioInsightsCommandBar'
import { PortfolioOverviewView } from 'shared/lib/models'

/**
 * @component PortfolioInsights
 * @extends React.Component
 */
export class PortfolioInsights extends React.Component<IPortfolioInsightsProps, IPortfolioInsightsState> {
  public static defaultProps: Partial<IPortfolioInsightsProps> = {};

  /**
   * Constructor
   * 
   * @param {IPortfolioInsightsProps} props Props
   */
  constructor(props: IPortfolioInsightsProps) {
    super(props)
    this.state = { isLoading: true }
  }

  public async componentDidMount() {
    try {
      const configuration = await this.props.dataAdapter.getPortfolioConfig()
      const currentView = configuration.views[0]
      const { charts, chartData, contentTypes } = await this.props.dataAdapter.fetchChartData(
        currentView,
        configuration,
        this.props.chartConfigurationListName,
        this.props.pageContext.site.id.toString(),
      )
      this.setState({
        charts,
        contentTypes,
        chartData,
        configuration,
        currentView,
        isLoading: false,
      })
    } catch (error) {
      this.setState({ error, isLoading: false })
    }
  }

  public render(): React.ReactElement<IPortfolioInsightsProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.portfolioInsights}>
          <div className={styles.container}>
            <Spinner label={format(strings.LoadingText, this.props.title)} size={SpinnerSize.large} />
          </div>
        </div>
      )
    }

    return (
      <div className={styles.portfolioInsights}>
        <div className={styles.container}>
          <PortfolioInsightsCommandBar
            newFormUrl={`${this.props.pageContext.web.absoluteUrl}/Lists/Grafkonfigurasjon/NewForm.aspx`}
            contentTypes={this.state.contentTypes}
            currentView={this.state.currentView}
            configuration={this.state.configuration}
            onViewChanged={this._onViewChanged.bind(this)} />
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
          <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
        </div>
      )
    }
    if (this.state.chartData.isEmpty()) {
      return (
        <div className={styles.inner}>
          <MessageBar messageBarType={MessageBarType.info}>Ingen prosjekter funnet.</MessageBar>
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
  * @param {PortfolioOverviewView} view View
  */
  private async _onViewChanged(view: PortfolioOverviewView) {
    const items = await this.props.dataAdapter.fetchDataForView(view, this.state.configuration, this.props.pageContext.site.id.toString())
    const chartData = new ChartData(items.map(item => new ChartDataItem(item.Title, item)))
    this.setState({ currentView: view, chartData })
  }
}

export { IPortfolioInsightsProps }
