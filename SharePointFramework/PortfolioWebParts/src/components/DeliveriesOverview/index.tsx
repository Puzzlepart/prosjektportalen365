import * as React from 'react'
import { AggregatedSearchList } from '../AggregatedSearchList'
import styles from './DeliveriesOverview.module.scss'
import { DELIVERIES_OVERVIEW_COLUMNS } from './DeliveriesOverviewColumns'
import { IDeliveriesOverviewProps } from './IDeliveriesOverviewProps'

/**
 * @component DeliveriesOverview
 * @extends React.Component
 */
export class DeliveriesOverview extends React.Component<IDeliveriesOverviewProps, {}> {
  public static defaultProps: Partial<IDeliveriesOverviewProps> = {
    columns: DELIVERIES_OVERVIEW_COLUMNS
  }

  /**
   * Constructor
   *
   * @param {IDeliveriesOverviewProps} props Props
   */
  constructor(props: IDeliveriesOverviewProps) {
    super(props)
  }

  public render() {
    return <AggregatedSearchList className={styles.deliveriesOverview} {...this.props} />
  }
}

export { IDeliveriesOverviewProps }
