import { MessageBarType } from '@fluentui/react'
import { IPortfolioAggregationProps } from 'pp365-portfoliowebparts/lib/components/PortfolioAggregation'
import { IBaseProgramWebPartProps } from 'webparts/baseProgramWebPart'

export class ProgramAggregationErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IProgramAggregationWebPartProps
  extends Omit<IBaseProgramWebPartProps, 'dataAdapter'>,
    IPortfolioAggregationProps {}
