import { IPortfolioAggregationProps } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { IBaseProgramWebPartProps } from '../baseProgramWebPart'
import { MessageBarProps } from '@fluentui/react-components'

/** Aggregation error carrying the Fluent message intent to display. */
export class ProgramAggregationErrorMessage extends Error {
  constructor(
    public message: string,
    public type: MessageBarProps['intent']
  ) {
    super(message)
  }
}

/** Aggregation settings combined with the program host's common properties. */
export interface IProgramAggregationWebPartProps
  extends Omit<IBaseProgramWebPartProps, 'dataAdapter'>, IPortfolioAggregationProps {}
