import { fetchChartData, fetchDataForView, getPortfolioConfig } from 'data';
import { ChartData, ChartDataItem, PortfolioOverviewView } from 'models';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import * as strings from 'PortfolioWebPartsStrings';
import * as React from 'react';
import * as format from 'string-format';
import Chart from './Chart';
import { IPortfolioInsightsProps, PortfolioInsightsDefaultProps } from './IPortfolioInsightsProps';
import { IPortfolioInsightsState } from './IPortfolioInsightsState';
import styles from './PortfolioInsights.module.scss';
import PortfolioInsightsCommandBar from './PortfolioInsightsCommandBar';

export default class PortfolioInsights extends React.Component<IPortfolioInsightsProps, IPortfolioInsightsState> {
  public static defaultProps = PortfolioInsightsDefaultProps;

  /**
   * Constructor
   * 
   * @param {IPortfolioInsightsProps} props Props
   */
  public constructor(props: IPortfolioInsightsProps) {
    super(props);
    this.state = { isLoading: true };
  }

  public async componentDidMount() {
    try {
      const configuration = await getPortfolioConfig();
      const currentView = configuration.views[0];
      const { charts, chartData, contentTypes } = await fetchChartData(currentView, configuration, this.props.pageContext.site.id.toString());
      this.setState({
        charts,
        contentTypes,
        chartData,
        configuration,
        currentView,
        isLoading: false,
      });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public render(): React.ReactElement<IPortfolioInsightsProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.portfolioInsights}>
          <div className={styles.container}>
            <Spinner label={format(strings.LoadingText, 'porteføljeinnsikt')} size={SpinnerSize.large} />
          </div>
        </div>
      );
    }

    return (
      <div className={styles.portfolioInsights}>
        <div className={styles.container}>
          <PortfolioInsightsCommandBar
            contentTypes={this.state.contentTypes}
            currentView={this.state.currentView}
            configuration={this.state.configuration}
            onViewChanged={this.onViewChanged.bind(this)} />
          <div className={styles.header}>
            <div className={styles.title}>{this.props.title}</div>
          </div>
          <div className={`${styles.inner} ms-Grid`} dir='ltr'>
            {this.charts}
          </div>
        </div>
      </div>
    );
  }

  private get charts() {
    if (this.state.error) {
      return (
        <div className={styles.inner}>
          <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
        </div>
      );
    }
    if (this.state.chartData.isEmpty()) {
      return (
        <div className={styles.inner}>
          <MessageBar messageBarType={MessageBarType.info}>Ingen prosjekter funnet.</MessageBar>
        </div>
      );
    }
    return (
      <div className={`${styles.charts} ms-Grid-row`}>
        {this.state.charts.map((chart, idx) => (
          <Chart key={idx} chart={chart} data={this.state.chartData} />
        ))}
      </div>
    );
  }

  /**
   * On view changed
   *
* @param {PortfolioOverviewView} view View
    */
  private async onViewChanged(view: PortfolioOverviewView) {
    let data = await fetchDataForView(view, this.state.configuration, this.props.pageContext.site.id.toString());
    this.setState({
      currentView: view,
      chartData: new ChartData(data.items.map(item => new ChartDataItem(item.Title, item))),
    });
  }
}

export { IPortfolioInsightsProps };
