import { PageContext } from '@microsoft/sp-page-context'
import strings from 'ProjectWebPartsStrings'
import { HTMLProps } from 'react'
import { UncertaintyElementModel } from '../../models'
import { IDynamicMatrixProps } from '../DynamicMatrix'

export interface IRiskMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
    Pick<IDynamicMatrixProps, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
  /**
   * Whether the matrix should be rendered in dynamic mode
   */
  useDynamicConfiguration?: boolean

  /**
   * Manual configuration URL. File must be a JSON file stored in SharePoint.
   */
  manualConfigurationPath?: string

  /**
   * The items to render in the matrix
   */
  items?: UncertaintyElementModel[]

  /**
   * Whether the matrix should be full width
   */
  fullWidth?: boolean

  /**
   * SPFx page context
   */
  pageContext?: PageContext

  /**
   * Overridden header labels for probability and consequence
   */
  overrideHeaderLabels?: Record<string, boolean>

  /**
   * Header labels for probability and consequence
   */
  headerLabels?: Record<string, string[]>
}

/**
 * Default header labels for consequence for the risk matrix (0-6). For the risk matrix,
 * these headers will be rendered on the y-axis.
 */
export const RISK_MATRIX_DEFAULT_CONSEQUENCE_HEADERS: string[] = [
  strings.MatrixHeader_Insignificant,
  strings.MatrixHeader_Small,
  strings.MatrixHeader_Moderate,
  strings.MatrixHeader_Serious,
  strings.MatrixHeader_Critical,
  strings.MatrixHeader_VeryCritical
]

/**
 * Default header labels for probability for the risk matrix (0-6). For the risk matrix,
 * these headers will be rendered on the x-axis.
 */
export const RISK_MATRIX_DEFAULT_PROBABILITY_HEADERS: string[] = [
  strings.MatrixHeader_ExtremelyLow,
  strings.MatrixHeader_VeryLow,
  strings.MatrixHeader_Low,
  strings.MatrixHeader_Medium,
  strings.MatrixHeader_High,
  strings.MatrixHeader_VeryHigh
]
