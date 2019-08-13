import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import * as PortfolioInsightsWebPartStrings from 'PortfolioInsightsWebPartStrings';
import * as React from 'react';
import { getConfig, PortfolioOverviewView } from '../../portfolioOverview/config';
import * as portfolioOverviewData from '../../portfolioOverview/data';
import { fetchData } from '../data';
import { ChartData, ChartDataItem } from '../models';
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
      const configuration = await getConfig();
      const currentView = configuration.views[0];
      const { charts, chartData, contentTypes } = await fetchData(this.props.pageContext.site.id.toString(), currentView, configuration);
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
            <Spinner label={PortfolioInsightsWebPartStrings.LoadingText} size={SpinnerSize.large} />
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
          {this.charts}
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
          <MessageBar messageBarType={MessageBarType.info}>{PortfolioInsightsWebPartStrings.EmptyText}</MessageBar>
        </div>
      );
    }
    return (
      <div className={styles.inner}>
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
    let data = await portfolioOverviewData.fetchData(view, this.state.configuration, this.props.pageContext.site.id.toString());
    this.setState({
      currentView: view,
      chartData: new ChartData(data.items.map(item => new ChartDataItem(item.Title, item))),
    });
  }
}
