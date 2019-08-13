import * as React from 'react';
import styles from './RiskOverview.module.scss';
import { IRiskOverviewProps, RiskOverviewDefaultProps } from './IRiskOverviewProps';
import { AggregatedSearchList } from '../';

export default class RiskOverview extends React.Component<IRiskOverviewProps, {}> {
  public static defaultProps = RiskOverviewDefaultProps;

  /**
   * Constructor
   *
   * @param {IRiskOverviewProps} props Props
   */
  constructor(props: IRiskOverviewProps) {
    super(props);
  }

  public render(): React.ReactElement<IRiskOverviewProps> {
    return (
      <div className={styles.riskOverview}>
        <AggregatedSearchList {...this.props} />
      </div>
    );
  }
}

export { IRiskOverviewProps };