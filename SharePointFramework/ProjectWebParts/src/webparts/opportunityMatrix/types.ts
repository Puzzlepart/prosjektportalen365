import { IOpportunityMatrixProps } from 'components/OpportunityMatrix'
import {
  IBaseUncertaintyMatrixWebPartProps,
  IUncertaintyMatrixWebPartData
} from '../baseUncertaintyMatrixWebPart/types'

/**
 * Source and presentation settings for the opportunity matrix web part.
 */
export interface IOpportunityMatrixWebPartProps
  extends IBaseUncertaintyMatrixWebPartProps, IOpportunityMatrixProps {}

/** Opportunity matrix items and property-pane metadata. */
export type IOpportunityMatrixWebPartData = IUncertaintyMatrixWebPartData
