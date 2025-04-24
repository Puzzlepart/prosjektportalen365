import { ChartConfiguration, ChartData } from 'models'

export interface IChartProps {
  chart: ChartConfiguration
  data: ChartData
}

export interface IChartState {
  chart: ChartConfiguration
  breakpoint: string
}
