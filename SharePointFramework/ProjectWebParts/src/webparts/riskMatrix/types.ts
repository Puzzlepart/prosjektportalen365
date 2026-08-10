import { IRiskMatrixProps } from '../../components/RiskMatrix'
import {
  IBaseUncertaintyMatrixWebPartProps,
  IUncertaintyMatrixWebPartData
} from '../baseUncertaintyMatrixWebPart/types'

/**
 * Interface for the properties of the Risk Matrix web part.
 * Extends IBaseUncertaintyMatrixWebPartProps and IRiskMatrixProps interfaces.
 */
export interface IRiskMatrixWebPartProps
  extends IBaseUncertaintyMatrixWebPartProps,
    IRiskMatrixProps {}

export type IRiskMatrixWebPartData = IUncertaintyMatrixWebPartData
