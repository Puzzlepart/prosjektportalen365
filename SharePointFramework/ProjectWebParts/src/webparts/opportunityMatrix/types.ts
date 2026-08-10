import { IOpportunityMatrixProps } from 'components/OpportunityMatrix'
import {
  IBaseUncertaintyMatrixWebPartProps,
  IUncertaintyMatrixWebPartData
} from '../baseUncertaintyMatrixWebPart/types'

/**
 * Interface for the properties of the Opportunity Matrix web part.
 * Extends IBaseUncertaintyMatrixWebPartProps and IOpportunityMatrixProps interfaces.
 */
export interface IOpportunityMatrixWebPartProps
  extends IBaseUncertaintyMatrixWebPartProps,
    IOpportunityMatrixProps {}

export type IOpportunityMatrixWebPartData = IUncertaintyMatrixWebPartData
