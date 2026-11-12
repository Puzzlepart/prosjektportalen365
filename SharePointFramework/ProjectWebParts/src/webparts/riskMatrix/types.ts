import { IRiskMatrixProps } from '../../components/RiskMatrix'
import {
  IBaseUncertaintyMatrixWebPartProps,
  IUncertaintyMatrixWebPartData
} from '../baseUncertaintyMatrixWebPart/types'

/**
 * Source and presentation settings for the risk matrix web part.
 */
export interface IRiskMatrixWebPartProps
  extends IBaseUncertaintyMatrixWebPartProps, IRiskMatrixProps {}

/** Risk matrix items and property-pane metadata. */
export type IRiskMatrixWebPartData = IUncertaintyMatrixWebPartData
