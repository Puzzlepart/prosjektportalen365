import * as React from 'react'
import styles from './RiskOverview.module.scss'
import { IRiskOverviewProps } from './IRiskOverviewProps'
import { RISKOVERVIEW_COLUMNS } from './RiskOverviewColumns'
import { AggregatedSearchList } from '../AggregatedSearchList'

/**
 * @component RiskOverview
 * @extends React.Component
 */
export class RiskOverview extends React.Component<IRiskOverviewProps, {}> {
  public static defaultProps: Partial<IRiskOverviewProps> = { columns: RISKOVERVIEW_COLUMNS }

  /**
   * Constructor
   *
   * @param {IRiskOverviewProps} props Props
   */
  constructor(props: IRiskOverviewProps) {
    super(props)
  }

  public render(): React.ReactElement<IRiskOverviewProps> {
    return <AggregatedSearchList className={styles.riskOverview} {...this.props} />
  }
}

export { IRiskOverviewProps }
