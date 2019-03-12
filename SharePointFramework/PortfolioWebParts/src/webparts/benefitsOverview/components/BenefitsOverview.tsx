import * as React from 'react';
import styles from './BenefitsOverview.module.scss';
import { IBenefitsOverviewProps, BenefitsOverviewDefaultProps } from './IBenefitsOverviewProps';
import { IBenefitsOverviewState } from './IBenefitsOverviewState';
import { CommandBar } from "office-ui-fabric-react/lib/CommandBar";
import { DetailsList } from "office-ui-fabric-react/lib/DetailsList";
import { Spinner, SpinnerType } from "office-ui-fabric-react/lib/Spinner";

export default class BenefitsOverview extends React.Component<IBenefitsOverviewProps, IBenefitsOverviewState> {
  public static defaultProps = BenefitsOverviewDefaultProps;
  /**
   * Constructor
   *
   * @param {IBenefitsOverviewProps} props Props
   */
  constructor(props: IBenefitsOverviewProps) {
    super(props);
    this.state = { isLoading: true };
  }

  public async componentDidMount(): Promise<void> {
    try {
      const items = await this.fetchItems();
      this.setState({ items, isLoading: false });
    } catch (err) {
      this.setState({ items: [], isLoading: false });
    }
  }

  public render(): React.ReactElement<IBenefitsOverviewProps> {
    if (this.state.isLoading) {
      return <Spinner label='Laster gevinstoversikt...' type={SpinnerType.large} />;
    }

    return (
      <div className={styles.benefitsOverview}>
        <div className={styles.container}>
          <div className={styles.commandBar}>
            <CommandBar items={[]} />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>Gevinstoversikt</div>
          </div>
          <div className={styles.listContainer}>
            <DetailsList
              items={this.state.items}
              columns={this.props.columns} />
          </div>
        </div>
      </div>
    );
  }

  /**
   * Fetch items
   */
  private fetchItems() {
    return new Promise<any[]>((resolve) => {
      window.setTimeout(() => {
        resolve([]);
      }, 2000);
    });
  }
}
