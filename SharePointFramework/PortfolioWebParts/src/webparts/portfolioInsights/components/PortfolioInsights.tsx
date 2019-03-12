import * as React from 'react';
import * as strings from 'PortfolioInsightsWebPartStrings';
import styles from './PortfolioInsights.module.scss';
import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { IPortfolioInsightsProps } from './IPortfolioInsightsProps';
import { IPortfolioInsightsState } from './IPortfolioInsightsState';
import Chart from './Chart';
import { fetchData } from '../data';

export default class PortfolioInsights extends React.Component<IPortfolioInsightsProps, IPortfolioInsightsState> {
  public static displayName = 'Porteføljeinnsikt';
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
      const { charts } = await fetchData(this.props.context);
      this.setState({ charts, isLoading: false });
    } catch (error) {
      this.setState({ error, isLoading: false });
    }
  }

  public render(): React.ReactElement<IPortfolioInsightsProps> {
    if (this.state.isLoading) {
      return (
        <div className={styles.portfolioInsights}>
          <div className={styles.container}>
            <Spinner label={strings.LoadingText} size={SpinnerSize.large} />
          </div>
        </div>
      );
    }
    if (this.state.error) {
      return (
        <div className={styles.portfolioInsights}>
          <div className={styles.container}>
            <MessageBar messageBarType={MessageBarType.error}>{this.state.error}</MessageBar>
          </div>
        </div>
      );
    }
    return (
      <div className={styles.portfolioInsights}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar
              items={this.getCommandBarItems().left}
              farItems={this.getCommandBarItems().right} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>{PortfolioInsights.displayName}</div>
          </div>
          <div className={styles.inner}>
            {this.state.charts.map((chart, idx) => (
              <Chart key={idx} chart={chart} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /**
   * Get command bar items
   */
  private getCommandBarItems() {
    const left = [];
    const right = [{
      key: "EditDataSelection",
      name: 'Endre datautvalg',
      iconProps: { iconName: "ExploreData" },
    }];
    return { left, right };
  }
}
