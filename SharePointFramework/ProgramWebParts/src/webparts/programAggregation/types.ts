import { IPortfolioAggregationProps } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { IBaseProgramWebPartProps } from '../baseProgramWebPart'
import { MessageBarProps } from '@fluentui/react-components'

export class ProgramAggregationErrorMessage extends Error {
  constructor(
    public message: string,
    public type: MessageBarProps['intent']
  ) {
    super(message)
  }
}

export interface IProgramAggregationWebPartProps
  extends Omit<IBaseProgramWebPartProps, 'dataAdapter'>, IPortfolioAggregationProps {}
