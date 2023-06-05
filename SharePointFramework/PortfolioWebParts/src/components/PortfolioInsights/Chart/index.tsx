import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar'
import * as strings from 'PortfolioWebPartsStrings'
import { getBreakpoint } from 'pp365-shared-library/lib/helpers'
import React, { Component } from 'react'
import * as ReactHighcharts from 'react-highcharts'
import { IChartProps } from './IChartProps'
import { IChartState } from './IChartState'

export default class Chart extends Component<IChartProps, IChartState> {
  public static defaultProps: Partial<IChartProps> = {}
  protected _chartRef: ReactHighcharts

  /**
   * Constructor
   *
   * @param props Props
   */
  constructor(props: IChartProps) {
    super(props)
    this.state = { chart: props.chart, breakpoint: getBreakpoint() }
  }

  /**
   * Renders the <Chart /> component
   */
  public render(): React.ReactElement<IChartProps> {
    const { chart } = this.state

    let highChartConfig: any
    let error: string

    try {
      highChartConfig = chart.generateHighChartConfig(this.props.data)
    } catch (err) {
      error = strings.ChartErrorText
    }

    if (error) {
      return (
        <div className={`ms-Grid-col ${this._getClassName()}`} style={{ marginTop: 10 }}>
          <div className='ms-Grid' dir='ltr'>
            <div className='ms-Grid-row'>
              <div className='ms-Grid-col ms-sm12'>
                <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={`ms-Grid-col ${this._getClassName()}`} style={{ marginTop: 10 }}>
        <div className='ms-Grid' dir='ltr'>
          <div className='ms-Grid-row'>
            <div className='ms-Grid-col ms-sm12'>
              <ReactHighcharts
                ref={(ele: ReactHighcharts) => (this._chartRef = ele)}
                config={highChartConfig}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  /**
   * Get layout class names
   */
  protected _getClassName(): string {
    const chart = this.state.chart.clone()
    const classNames = Object.keys(chart.width)
      .map((key) => {
        const value = chart.width[key]
        return value ? `ms-${key}${value}` : null
      })
      .filter((c) => c)
    return classNames.join(' ')
  }
}

export { IChartProps, IChartState }
