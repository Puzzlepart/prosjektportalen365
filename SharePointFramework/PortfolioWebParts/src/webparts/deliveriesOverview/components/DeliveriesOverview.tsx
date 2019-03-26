import * as React from 'react';
import styles from './DeliveriesOverview.module.scss';
import { IDeliveriesOverviewProps, DeliveriesOverviewDefaultProps } from './IDeliveriesOverviewProps';
import AggregatedSearchList from '../../../components/AggregatedSearchList';

export default class DeliveriesOverview extends React.Component<IDeliveriesOverviewProps, {}> {
  public static defaultProps = DeliveriesOverviewDefaultProps;

  /**
   * Constructor
   *
   * @param {IDeliveriesOverviewProps} props Props
   */
  constructor(props: IDeliveriesOverviewProps) {
    super(props);
  }

  public render(): React.ReactElement<IDeliveriesOverviewProps> {
    return (
      <div className={styles.deliveriesOverview}>
        <AggregatedSearchList {...this.props} />
      </div>
    );
  }
}
