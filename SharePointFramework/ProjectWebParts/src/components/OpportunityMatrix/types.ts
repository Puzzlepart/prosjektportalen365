import strings from 'ProjectWebPartsStrings'
import { HTMLProps } from 'react'
import { UncertaintyElementModel } from '../../models'
import { IDynamicMatrixProps } from '../DynamicMatrix'
import { IBaseWebPartComponentProps } from 'pp365-shared-library'

export interface IOpportunityMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
    IBaseWebPartComponentProps,
    Pick<IDynamicMatrixProps, 'fullWidth' | 'manualConfigurationPath' | 'calloutTemplate'> {
  /**
   * The items to render in the matrix
   */
  items?: UncertaintyElementModel[]
}

/**
 * Default header labels for consequence for the opportunity matrix (0-6). For the opportunity matrix,
 * these headers will be rendered on the x-axis.
 */
export const OPPORTUNITY_DEFAULT_MATRIX_CONSEQUENCE_HEADERS = [
  strings.MatrixHeader_VeryLow,
  strings.MatrixHeader_Low,
  strings.MatrixHeader_Medium,
  strings.MatrixHeader_High,
  strings.MatrixHeader_VeryHigh,
  strings.MatrixHeader_ExtremelyHigh
]

/**
 * Default header labels for probability for the opportunity matrix (0-6). For the opportunity matrix,
 * these headers will be rendered on the y-axis.
 */
export const OPPORTUNITY_DEFAULT_MATRIX_PROBABILITY_HEADERS = [
  strings.MatrixHeader_VerySmall,
  strings.MatrixHeader_Small,
  strings.MatrixHeader_Medium,
  strings.MatrixHeader_Large,
  strings.MatrixHeader_VeryLarge,
  strings.MatrixHeader_ExtremelyLarge
]
